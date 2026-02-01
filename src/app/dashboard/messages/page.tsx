'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { Card } from '@/components/ui/Card';
import { ConversationList } from '@/components/messages/ConversationList';
import { createClient } from '@/lib/supabase/client';
import type { ConversationWithDetails } from '@/types/database';

function MessagesContent() {
  const t = useTranslations('messages');
  const searchParams = useSearchParams();
  const providerId = searchParams.get('provider');

  const [conversations, setConversations] = useState<ConversationWithDetails[]>([]);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [newMessage, setNewMessage] = useState('');
  const [isSending, setIsSending] = useState(false);

  useEffect(() => {
    async function load() {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (user) {
        setCurrentUserId(user.id);

        const response = await fetch('/api/conversations');
        const data = await response.json();
        setConversations(data.conversations || []);
      }
      setIsLoading(false);
    }
    load();
  }, []);

  const handleSendToProvider = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!providerId || !newMessage.trim() || isSending) return;

    setIsSending(true);
    try {
      const response = await fetch('/api/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          provider_id: providerId,
          body: newMessage.trim(),
        }),
      });

      if (response.ok) {
        const data = await response.json();
        // Navigate to the conversation
        window.location.href = `/dashboard/messages/${data.conversation.id}`;
      }
    } catch (error) {
      console.error('Send message error:', error);
    } finally {
      setIsSending(false);
    }
  };

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/3"></div>
          <div className="h-64 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">{t('title')}</h1>

      {/* New message to provider */}
      {providerId && (
        <Card className="mb-6 p-4">
          <h2 className="font-semibold mb-3">{t('newMessage')}</h2>
          <form onSubmit={handleSendToProvider} className="flex flex-col gap-2">
            <div className="relative">
              <textarea
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                onKeyDown={(e) => {
                  // Submit on Enter without Shift
                  // Shift+Enter creates a new line (default behavior)
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    if (newMessage.trim() && !isSending) {
                      handleSendToProvider(e);
                    }
                  }
                }}
                placeholder={t('typeMessage')}
                className="w-full rounded-xl border border-gray-300 px-4 py-3 pb-12 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none resize-none min-h-[120px]"
                maxLength={300}
                rows={4}
              />
              <div className="absolute right-3 bottom-3 flex items-center gap-2">
                <span className={`text-xs ${newMessage.length > 280 ? 'text-orange-500' : 'text-gray-400'} ${newMessage.length >= 300 ? 'text-red-500 font-medium' : ''}`}>
                  {newMessage.length}/300
                </span>
                <button
                  type="submit"
                  disabled={!newMessage.trim() || isSending || newMessage.length > 300}
                  className="px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 disabled:opacity-50"
                >
                  {t('send')}
                </button>
              </div>
              <p className="absolute left-4 bottom-3 text-xs text-gray-400">{t('shiftEnterHint')}</p>
            </div>
          </form>
        </Card>
      )}

      {/* Conversation list */}
      <Card>
        {currentUserId && (
          <ConversationList
            conversations={conversations}
            currentUserId={currentUserId}
          />
        )}
      </Card>
    </div>
  );
}

export default function MessagesPage() {
  return (
    <Suspense fallback={<div className="text-center py-12">Loading...</div>}>
      <MessagesContent />
    </Suspense>
  );
}
