'use client';

import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { Avatar } from '@/components/ui/Avatar';
import { Badge } from '@/components/ui/Badge';
import { formatRelativeTime, truncate } from '@/lib/utils';
import type { ConversationWithDetails } from '@/types/database';

interface ConversationListProps {
  conversations: ConversationWithDetails[];
  currentUserId: string;
  activeConversationId?: string;
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

        return (
          <Link
            key={conv.id}
            href={`/dashboard/messages/${conv.id}`}
            className={`block p-4 hover:bg-gray-50 transition-colors ${
              isActive ? 'bg-blue-50' : ''
            }`}
          >
            <div className="flex items-start gap-3">
              <Avatar src={otherUser.avatar_url} alt={otherUser.display_name} size="md" />
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <span className={`font-medium truncate ${hasUnread ? 'text-gray-900' : 'text-gray-700'}`}>
                    {otherUser.display_name}
                  </span>
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
                    {truncate(conv.last_message.body, 50)}
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
