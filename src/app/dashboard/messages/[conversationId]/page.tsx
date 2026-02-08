'use client';

import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ChatWindow } from '@/components/messages/ChatWindow';
import { Button } from '@/components/ui/Button';
import { createClient } from '@/lib/supabase/client';
import type { ConversationWithDetails, MessageWithSender, Profile, ConversationCloseReason } from '@/types/database';

interface Props {
  params: Promise<{ conversationId: string }>;
}

export default function ConversationPage({ params }: Props) {
  const { conversationId } = use(params);
  const router = useRouter();

  const [conversation, setConversation] = useState<ConversationWithDetails | null>(null);
  const [messages, setMessages] = useState<MessageWithSender[]>([]);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null);
  const [isBlockedByProvider, setIsBlockedByProvider] = useState(false);
  const [isUserBlockedByMe, setIsUserBlockedByMe] = useState(false);

  useEffect(() => {
    let channel: ReturnType<typeof createClient>['channel'] extends (name: string) => infer R ? R : never;
    let pollInterval: NodeJS.Timeout;
    let cancelled = false;
    // Store the Supabase client reference so cleanup uses the same instance that created the channel
    const supabase = createClient();
    
    async function load() {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      // If component unmounted during auth check, bail out
      if (cancelled) return;

      if (!user) {
        router.push('/auth/sign-in');
        return;
      }

      setCurrentUserId(user.id);

      const response = await fetch(`/api/messages/${conversationId}`);
      
      // If component unmounted during fetch, bail out
      if (cancelled) return;
      
      if (!response.ok) {
        router.push('/dashboard/messages');
        return;
      }

      const data = await response.json();
      
      // If component unmounted while parsing response, bail out
      if (cancelled) return;
      
      setConversation(data.conversation);
      setMessages(data.messages || []);
      setIsLoading(false);

      // Set up realtime subscription
      channel = supabase
        .channel(`messages:${conversationId}`)
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'messages',
            filter: `conversation_id=eq.${conversationId}`,
          },
          async (payload) => {
            // Don't process realtime events if component is unmounted
            if (cancelled) return;
            
            console.log('Realtime message received:', payload);
            // Fetch the complete message with sender
            const { data: newMessage } = await supabase
              .from('messages')
              .select(`
                *,
                sender:profiles!messages_sender_id_fkey(*)
              `)
              .eq('id', payload.new.id)
              .single();

            if (newMessage && !cancelled) {
              setMessages((prev) => {
                // Avoid duplicates
                if (prev.some(m => m.id === newMessage.id)) {
                  return prev;
                }
                return [...prev, newMessage as MessageWithSender];
              });
            }
          }
        )
        .subscribe((status) => {
          console.log('Realtime subscription status:', status);
        });

      // Polling fallback - check for new messages every 5 seconds
      pollInterval = setInterval(async () => {
        // Don't poll if component is unmounted
        if (cancelled) return;
        
        const { data: latestMessages } = await supabase
          .from('messages')
          .select(`
            *,
            sender:profiles!messages_sender_id_fkey(*)
          `)
          .eq('conversation_id', conversationId)
          .order('created_at', { ascending: true });

        if (latestMessages && !cancelled) {
          setMessages((prev) => {
            // Only update if there are new messages
            if (latestMessages.length > prev.length) {
              return latestMessages as MessageWithSender[];
            }
            return prev;
          });
        }
      }, 5000);
    }

    load();
    
    return () => {
      cancelled = true;
      if (channel) {
        supabase.removeChannel(channel);
      }
      if (pollInterval) {
        clearInterval(pollInterval);
      }
    };
  }, [conversationId, router]);

  // Check for active conversation when viewing a closed one
  useEffect(() => {
    async function checkActiveConversation() {
      if (!conversation || conversation.status !== 'closed' || !currentUserId) {
        setActiveConversationId(null);
        return;
      }

      // Only seekers can see the "go to active" option
      if (conversation.seeker_id !== currentUserId) {
        setActiveConversationId(null);
        return;
      }

      const supabase = createClient();
      const { data: activeConvs } = await supabase
        .from('conversations')
        .select('id')
        .eq('seeker_id', currentUserId)
        .eq('provider_id', conversation.provider_id)
        .in('status', ['open', 'active'])
        .neq('id', conversationId)
        .limit(1);

      if (activeConvs && activeConvs.length > 0) {
        setActiveConversationId(activeConvs[0].id);
      } else {
        setActiveConversationId(null);
      }
    }

    checkActiveConversation();
  }, [conversation, currentUserId, conversationId]);

  // Check block status when conversation loads
  useEffect(() => {
    async function checkBlockStatus() {
      if (!conversation || !currentUserId) return;

      const isCurrentSeeker = conversation.seeker_id === currentUserId;
      const supabase = createClient();

      if (isCurrentSeeker) {
        // Check if I (seeker) am blocked by the provider
        const { data } = await supabase
          .from('provider_blocked_users')
          .select('id')
          .eq('provider_id', conversation.provider_id)
          .eq('blocked_user_id', currentUserId)
          .single();
        setIsBlockedByProvider(!!data);
      } else {
        // I'm the provider — check if I've blocked this seeker
        const { data } = await supabase
          .from('provider_blocked_users')
          .select('id')
          .eq('provider_id', currentUserId)
          .eq('blocked_user_id', conversation.seeker_id)
          .single();
        setIsUserBlockedByMe(!!data);
      }
    }

    checkBlockStatus();
  }, [conversation, currentUserId]);

  const handleBlockUser = async () => {
    if (!conversation || !currentUserId) return;
    const seekerId = conversation.seeker_id;

    const res = await fetch('/api/provider/blocked-users', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ blocked_user_id: seekerId }),
    });

    if (res.ok) {
      setIsUserBlockedByMe(true);
    }
  };

  const handleUnblockUser = async () => {
    if (!conversation || !currentUserId) return;
    const seekerId = conversation.seeker_id;

    const res = await fetch(`/api/provider/blocked-users?blocked_user_id=${seekerId}`, {
      method: 'DELETE',
    });

    if (res.ok) {
      setIsUserBlockedByMe(false);
    }
  };

  const handleSendMessage = async (body: string) => {
    const response = await fetch(`/api/messages/${conversationId}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ body }),
    });

    if (response.ok) {
      const data = await response.json();
      setMessages((prev) => [...prev, data.message]);
    }
  };

  const handleCloseConversation = async (reason?: ConversationCloseReason) => {
    const response = await fetch(`/api/conversations/${conversationId}/close`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ reason }),
    });

    if (response.ok) {
      const data = await response.json();
      setConversation((prev) => prev ? { ...prev, ...data.conversation } : null);
    }
  };

  const handleReopenConversation = async () => {
    const response = await fetch(`/api/conversations/${conversationId}/reopen`, {
      method: 'POST',
    });

    if (response.ok) {
      const data = await response.json();
      setConversation((prev) => prev ? { ...prev, ...data.conversation } : null);
      setActiveConversationId(null); // Clear since this is now the active one
    } else if (response.status === 409) {
      // Active conversation exists - update state and redirect
      const data = await response.json();
      if (data.active_conversation_id) {
        setActiveConversationId(data.active_conversation_id);
        router.push(`/dashboard/messages/${data.active_conversation_id}`);
      }
    }
  };

  if (isLoading) {
    return (
      <div className="h-[calc(100vh-200px)] flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full"></div>
      </div>
    );
  }

  if (!conversation || !currentUserId) {
    return null;
  }

  const otherUser: Profile =
    conversation.seeker_id === currentUserId ? conversation.provider : conversation.seeker;
  
  const isSeeker = conversation.seeker_id === currentUserId;

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
      <div className="mb-4">
        <Link href="/dashboard/messages">
          <Button variant="ghost" size="sm">
            &larr; Back to Messages
          </Button>
        </Link>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 h-[calc(100vh-250px)]">
        <ChatWindow
          messages={messages}
          currentUserId={currentUserId}
          otherUser={otherUser}
          conversationId={conversationId}
          onSendMessage={handleSendMessage}
          conversationStatus={conversation.status}
          closedAt={conversation.closed_at}
          isSeeker={isSeeker}
          providerId={conversation.provider_id}
          onClose={handleCloseConversation}
          onReopen={handleReopenConversation}
          activeConversationId={activeConversationId}
          isBlockedByProvider={isBlockedByProvider}
          isUserBlockedByMe={isUserBlockedByMe}
          onBlockUser={handleBlockUser}
          onUnblockUser={handleUnblockUser}
        />
      </div>
    </div>
  );
}
