'use client';

import { useState, useRef, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { Avatar } from '@/components/ui/Avatar';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { formatTime, formatDate } from '@/lib/utils';
import type { MessageWithSender, Profile } from '@/types/database';

// System user ID
const SYSTEM_USER_ID = '00000000-0000-0000-0000-000000000000';

interface ChatWindowProps {
  messages: MessageWithSender[];
  currentUserId: string;
  otherUser: Profile;
  conversationId: string;
  onSendMessage: (body: string) => Promise<void>;
}

// System avatar component
function SystemAvatar({ size = 'md' }: { size?: 'sm' | 'md' | 'lg' }) {
  const sizeClasses = {
    sm: 'w-8 h-8',
    md: 'w-10 h-10',
    lg: 'w-12 h-12',
  };
  return (
    <div className={`${sizeClasses[size]} rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center`}>
      <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
      </svg>
    </div>
  );
}

export function ChatWindow({
  messages,
  currentUserId,
  otherUser,
  onSendMessage,
}: ChatWindowProps) {
  const t = useTranslations('messages');
  const [newMessage, setNewMessage] = useState('');
  const [isSending, setIsSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  const isSystemConversation = otherUser?.id === SYSTEM_USER_ID;

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || isSending) return;

    setIsSending(true);
    try {
      await onSendMessage(newMessage.trim());
      setNewMessage('');
    } finally {
      setIsSending(false);
    }
  };

  // Group messages by date
  const messagesByDate = messages.reduce(
    (groups, message) => {
      const date = new Date(message.created_at).toDateString();
      if (!groups[date]) groups[date] = [];
      groups[date].push(message);
      return groups;
    },
    {} as Record<string, MessageWithSender[]>
  );

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className={`flex items-center gap-3 p-4 border-b border-gray-200 ${isSystemConversation ? 'bg-gradient-to-r from-blue-50 to-purple-50' : ''}`}>
        {isSystemConversation ? (
          <SystemAvatar size="md" />
        ) : (
          <Avatar src={otherUser?.avatar_url} alt={otherUser?.display_name || 'User'} size="md" />
        )}
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <h2 className="font-semibold">
              {isSystemConversation ? 'Localisio System' : otherUser?.display_name}
            </h2>
            {isSystemConversation && (
              <Badge variant="info" size="sm">System</Badge>
            )}
          </div>
          {isSystemConversation && (
            <p className="text-sm text-gray-500">Official announcements and notifications</p>
          )}
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {Object.entries(messagesByDate).map(([date, dateMessages]) => (
          <div key={date}>
            <div className="flex justify-center mb-4">
              <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
                {formatDate(date)}
              </span>
            </div>
            <div className="space-y-3">
              {dateMessages.map((message) => {
                const isOwn = message.sender_id === currentUserId;
                const isSystemMessage = message.sender_id === SYSTEM_USER_ID || (message as any).is_system_message;
                const messageContent = message.body || (message as any).content || '';
                
                return (
                  <div
                    key={message.id}
                    className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-[70%] rounded-2xl px-4 py-2 ${
                        isOwn
                          ? 'bg-blue-600 text-white rounded-br-md'
                          : isSystemMessage
                          ? 'bg-gradient-to-r from-blue-100 to-purple-100 text-gray-900 rounded-bl-md border border-blue-200'
                          : 'bg-gray-100 text-gray-900 rounded-bl-md'
                      }`}
                    >
                      {isSystemMessage && !isOwn && (
                        <div className="flex items-center gap-1 mb-1 text-xs text-blue-600 font-medium">
                          <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                          </svg>
                          System Message
                        </div>
                      )}
                      <p className="whitespace-pre-wrap break-words">{messageContent}</p>
                      <p
                        className={`text-xs mt-1 ${
                          isOwn ? 'text-blue-200' : 'text-gray-500'
                        }`}
                      >
                        {formatTime(message.created_at)}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <form onSubmit={handleSubmit} className="p-4 border-t border-gray-200">
        <div className="flex gap-2">
          <input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder={t('typeMessage')}
            className="flex-1 rounded-full border border-gray-300 px-4 py-2 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none"
            maxLength={5000}
          />
          <Button type="submit" isLoading={isSending} disabled={!newMessage.trim()}>
            {t('send')}
          </Button>
        </div>
      </form>
    </div>
  );
}
