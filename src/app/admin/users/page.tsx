'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { Card, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Input } from '@/components/ui/Input';
import { Avatar } from '@/components/ui/Avatar';
import type { Profile } from '@/types/database';

type FilterType = 'all' | 'seekers' | 'providers' | 'blocked';

export default function AdminUsersPage() {
  const t = useTranslations('admin.users');
  const [users, setUsers] = useState<Profile[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState<FilterType>('all');
  const [search, setSearch] = useState('');
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [blockReason, setBlockReason] = useState('');
  const [showBlockModal, setShowBlockModal] = useState<string | null>(null);

  useEffect(() => {
    loadUsers();
  }, [filter]);

  async function loadUsers() {
    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      if (filter !== 'all') params.set('filter', filter);
      if (search) params.set('search', search);

      const response = await fetch(`/api/admin/users?${params}`);
      const data = await response.json();
      setUsers(data.users || []);
    } catch (error) {
      console.error('Error loading users:', error);
    } finally {
      setIsLoading(false);
    }
  }

  async function handleToggleBlock(user: Profile, reason?: string) {
    setProcessingId(user.id);
    try {
      const response = await fetch(`/api/admin/users/${user.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          is_blocked: !user.is_blocked,
          blocked_reason: !user.is_blocked ? (reason || 'Blocked by administrator') : null,
        }),
      });
      if (response.ok) {
        loadUsers();
        setShowBlockModal(null);
        setBlockReason('');
      }
    } catch (error) {
      console.error('Error updating user:', error);
    } finally {
      setProcessingId(null);
    }
  }

  async function handleDelete(user: Profile) {
    if (!confirm(t('deleteConfirm', { name: user.display_name }))) {
      return;
    }

    setProcessingId(user.id);
    try {
      const response = await fetch(`/api/admin/users/${user.id}`, {
        method: 'DELETE',
      });
      if (response.ok) loadUsers();
    } catch (error) {
      console.error('Error deleting user:', error);
    } finally {
      setProcessingId(null);
    }
  }

  const filters: { key: FilterType; label: string }[] = [
    { key: 'all', label: t('filterAll') },
    { key: 'seekers', label: t('filterSeekers') },
    { key: 'providers', label: t('filterProviders') },
    { key: 'blocked', label: t('filterBlocked') },
  ];

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">{t('title')}</h1>
          <p className="text-slate-600 mt-1">{t('subtitle')}</p>
        </div>
        <Link href="/admin">
          <Button variant="outline">{t('backToAdmin')}</Button>
        </Link>
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <div className="flex-1">
          <Input
            placeholder={t('searchPlaceholder')}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && loadUsers()}
          />
        </div>
        <div className="flex gap-2 flex-wrap">
          {filters.map((f) => (
            <Button
              key={f.key}
              size="sm"
              variant={filter === f.key ? 'primary' : 'outline'}
              onClick={() => setFilter(f.key)}
            >
              {f.label}
            </Button>
          ))}
        </div>
      </div>

      {isLoading ? (
        <div className="text-center py-12">
          <div className="animate-spin w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full mx-auto"></div>
        </div>
      ) : users.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-slate-500">{t('noUsers')}</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {users.map((user) => (
            <Card key={user.id} className={user.is_blocked ? 'border-red-200 bg-red-50' : ''}>
              <CardContent className="py-4">
                <div className="flex items-start gap-4">
                  <Avatar
                    src={user.avatar_url}
                    alt={user.display_name}
                    size="lg"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-semibold text-slate-900">
                            {user.display_name}
                          </span>
                          <Badge 
                            variant={user.role === 'provider' ? 'info' : 'default'} 
                            size="sm"
                          >
                            {user.role === 'provider' ? t('roleProvider') : t('roleSeeker')}
                          </Badge>
                          {user.is_blocked && (
                            <Badge variant="danger" size="sm">{t('blocked')}</Badge>
                          )}
                        </div>
                        <p className="text-sm text-slate-500 mt-1">
                          {user.email}
                        </p>
                        {user.is_blocked && user.blocked_reason && (
                          <p className="text-sm text-red-600 mt-1">
                            {t('blockReason')}: {user.blocked_reason}
                          </p>
                        )}
                        {user.is_blocked && user.blocked_at && (
                          <p className="text-xs text-slate-400 mt-0.5">
                            {t('blockedAt')}: {new Date(user.blocked_at).toLocaleDateString()}
                          </p>
                        )}
                      </div>
                      <div className="text-right text-sm text-slate-400">
                        <div>{t('joined')}</div>
                        <div>{new Date(user.created_at).toLocaleDateString()}</div>
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="mt-4 flex flex-wrap gap-2">
                      <Link href={`/admin/users/${user.id}/chat`}>
                        <Button size="sm" variant="outline">
                          💬 {t('openChat')}
                        </Button>
                      </Link>
                      {user.role === 'provider' && (
                        <Link href={`/p/${user.id}`}>
                          <Button size="sm" variant="outline">
                            {t('viewProfile')}
                          </Button>
                        </Link>
                      )}
                      <Button
                        size="sm"
                        variant={user.is_blocked ? 'primary' : 'warning'}
                        onClick={() => {
                          if (user.is_blocked) {
                            handleToggleBlock(user);
                          } else {
                            setShowBlockModal(user.id);
                          }
                        }}
                        disabled={processingId === user.id}
                      >
                        {user.is_blocked ? t('unblock') : t('block')}
                      </Button>
                      <Button
                        size="sm"
                        variant="danger"
                        onClick={() => handleDelete(user)}
                        disabled={processingId === user.id}
                      >
                        {t('delete')}
                      </Button>
                    </div>

                    {/* Block Modal */}
                    {showBlockModal === user.id && (
                      <div className="mt-4 p-4 bg-amber-50 rounded-lg border border-amber-200">
                        <p className="text-sm font-medium text-amber-800 mb-2">
                          {t('blockReasonLabel')}
                        </p>
                        <Input
                          placeholder={t('blockReasonPlaceholder')}
                          value={blockReason}
                          onChange={(e) => setBlockReason(e.target.value)}
                        />
                        <div className="flex gap-2 mt-3">
                          <Button
                            size="sm"
                            variant="warning"
                            onClick={() => handleToggleBlock(user, blockReason)}
                            disabled={processingId === user.id}
                          >
                            {t('confirmBlock')}
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setShowBlockModal(null);
                              setBlockReason('');
                            }}
                          >
                            {t('cancel')}
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
