'use client';

import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { Avatar } from '@/components/ui/Avatar';
import { Badge } from '@/components/ui/Badge';
import { formatRelativeTime, truncate } from '@/lib/utils';
import type { ConversationWithDetails } from '@/types/database';

// System user ID
const SYSTEM_USER_ID = '00000000-0000-0000-0000-000000000000';

interface ConversationListProps {
  conversations: ConversationWithDetails[];
  currentUserId: string;
  activeConversationId?: string;
}

// System avatar component
function SystemAvatar() {
  return (
    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
      <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
      </svg>
    </div>
  );
}

export function ConversationList({
  conversations,
  currentUserId,
  activeConversationId,
}: ConversationListProps) {
  const t = useTranslations('messages');

  if (conversations.length === 0) {
    return (
      <div className="p-4 text-center text-gray-500">
        <p>{t('noConversations')}</p>
        <p className="text-sm mt-2">{t('startConversation')}</p>
      </div>
    );
  }

  return (
    <div className="divide-y divide-gray-200">
      {conversations.map((conv) => {
        const otherUser = conv.seeker_id === currentUserId ? conv.provider : conv.seeker;
        const isActive = conv.id === activeConversationId;
        const hasUnread = (conv.unread_count || 0) > 0;
        const isSystemConversation = otherUser?.id === SYSTEM_USER_ID || (conv as any).is_system_conversation;

        return (
          <Link
            key={conv.id}
            href={`/dashboard/messages/${conv.id}`}
            className={`block p-4 hover:bg-gray-50 transition-colors ${
              isActive ? 'bg-blue-50' : ''
            } ${isSystemConversation ? 'bg-gradient-to-r from-blue-50/50 to-purple-50/50' : ''}`}
          >
            <div className="flex items-start gap-3">
              {isSystemConversation ? (
                <SystemAvatar />
              ) : (
                <Avatar src={otherUser?.avatar_url} alt={otherUser?.display_name || 'User'} size="md" />
              )}
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className={`font-medium truncate ${hasUnread ? 'text-gray-900' : 'text-gray-700'}`}>
                      {isSystemConversation ? 'Localisio System' : otherUser?.display_name}
                    </span>
                    {isSystemConversation && (
                      <Badge variant="info" size="sm">System</Badge>
                    )}
                  </div>
                  {conv.last_message && (
                    <span className="text-xs text-gray-500 flex-shrink-0">
                      {formatRelativeTime(conv.last_message.created_at)}
                    </span>
                  )}
                </div>
                {conv.last_message && (
                  <p className={`text-sm truncate ${hasUnread ? 'text-gray-900 font-medium' : 'text-gray-500'}`}>
                    {conv.last_message.sender_id === currentUserId && (
                      <span className="text-gray-400">{t('you')}: </span>
                    )}
                    {truncate(conv.last_message.body || '', 50)}
                  </p>
                )}
              </div>
              {hasUnread && (
                <Badge variant="info" size="sm">
                  {conv.unread_count}
                </Badge>
              )}
            </div>
          </Link>
        );
      })}
    </div>
  );
}
