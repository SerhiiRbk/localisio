'use client';

import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ChatWindow } from '@/components/messages/ChatWindow';
import { Button } from '@/components/ui/Button';
import { createClient } from '@/lib/supabase/client';
import type { ConversationWithDetails, MessageWithSender, Profile } from '@/types/database';

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

  useEffect(() => {
    async function load() {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        router.push('/auth/sign-in');
        return;
      }

      setCurrentUserId(user.id);

      const response = await fetch(`/api/messages/${conversationId}`);
      if (!response.ok) {
        router.push('/dashboard/messages');
        return;
      }

      const data = await response.json();
      setConversation(data.conversation);
      setMessages(data.messages || []);
      setIsLoading(false);

      // Set up realtime subscription
      const channel = supabase
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
            // Fetch the complete message with sender
            const { data: newMessage } = await supabase
              .from('messages')
              .select(`
                *,
                sender:profiles!messages_sender_id_fkey(*)
              `)
              .eq('id', payload.new.id)
              .single();

            if (newMessage) {
              setMessages((prev) => [...prev, newMessage as MessageWithSender]);
            }
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }

    load();
  }, [conversationId, router]);

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
        />
      </div>
    </div>
  );
}
