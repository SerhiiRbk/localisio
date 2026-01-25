'use client';

import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import Link from 'next/link';
import { Card, CardContent, CardHeader } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { formatRelativeTime } from '@/lib/utils';
import type { Notification } from '@/types/database';

export default function NotificationsPage() {
  const t = useTranslations('notifications');

  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadNotifications();
  }, []);

  async function loadNotifications() {
    try {
      const response = await fetch('/api/notifications');
      const data = await response.json();
      setNotifications(data.notifications || []);
      setUnreadCount(data.unread_count || 0);
    } catch (error) {
      console.error('Failed to load notifications:', error);
    } finally {
      setIsLoading(false);
    }
  }

  async function handleMarkAllRead() {
    try {
      await fetch('/api/notifications', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mark_all_read: true }),
      });

      setNotifications((prev) =>
        prev.map((n) => ({ ...n, is_read: true }))
      );
      setUnreadCount(0);
    } catch (error) {
      console.error('Failed to mark as read:', error);
    }
  }

  if (isLoading) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-8">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/3"></div>
          <div className="h-32 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900">{t('title')}</h1>
        {unreadCount > 0 && (
          <Button variant="ghost" size="sm" onClick={handleMarkAllRead}>
            {t('markAllRead')}
          </Button>
        )}
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <span className="font-semibold">All Notifications</span>
            {unreadCount > 0 && (
              <Badge variant="info" size="sm">
                {unreadCount} new
              </Badge>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {notifications.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <p>{t('empty')}</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-200 -mx-6">
              {notifications.map((notification) => (
                <NotificationItem key={notification.id} notification={notification} />
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function NotificationItem({ notification }: { notification: Notification }) {
  const t = useTranslations('notifications');

  const getMessage = () => {
    if (notification.type === 'message') {
      return t('newMessage', { sender: 'Someone' });
    }
    return 'New notification';
  };

  const getLink = () => {
    if (notification.type === 'message' && notification.payload.conversation_id) {
      return `/dashboard/messages/${notification.payload.conversation_id}`;
    }
    return '/dashboard/notifications';
  };

  return (
    <Link
      href={getLink()}
      className={`block px-6 py-4 hover:bg-gray-50 transition-colors ${
        !notification.is_read ? 'bg-blue-50' : ''
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1">
          <p className={`text-sm ${!notification.is_read ? 'font-medium' : ''}`}>
            {getMessage()}
          </p>
        </div>
        <span className="text-xs text-gray-500 flex-shrink-0">
          {formatRelativeTime(notification.created_at)}
        </span>
      </div>
    </Link>
  );
}
