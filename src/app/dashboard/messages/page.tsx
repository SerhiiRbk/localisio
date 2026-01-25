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
          <form onSubmit={handleSendToProvider} className="flex gap-2">
            <input
              type="text"
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder={t('typeMessage')}
              className="flex-1 rounded-lg border border-gray-300 px-3 py-2 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none"
              maxLength={5000}
            />
            <button
              type="submit"
              disabled={!newMessage.trim() || isSending}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              {t('send')}
            </button>
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
