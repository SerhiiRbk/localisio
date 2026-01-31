'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { Card, CardContent, CardHeader } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import { Select } from '@/components/ui/Select';
import { Badge } from '@/components/ui/Badge';
import { Avatar } from '@/components/ui/Avatar';
import { formatRelativeTime } from '@/lib/utils';

interface Campaign {
  id: string;
  admin_id: string;
  target_type: string;
  target_user_id: string | null;
  subject: string | null;
  message_text: string;
  recipients_count: number;
  delivered_count: number;
  read_count: number;
  replies_count: number;
  status: string;
  created_at: string;
  sent_at: string | null;
  admin: {
    display_name: string;
    avatar_url: string | null;
  };
  target_user: {
    display_name: string;
    email: string;
  } | null;
}

interface User {
  id: string;
  display_name: string;
  email: string;
  role: string;
}

const TARGET_TYPE_LABELS: Record<string, string> = {
  all_users: 'All Users',
  all_providers: 'All Providers',
  verified_providers: 'Verified Providers',
  unverified_providers: 'Unverified Providers',
  non_providers: 'Non-Providers (Seekers)',
  single_user: 'Single User',
};

export default function SystemMessagesPage() {
  const t = useTranslations('admin.systemMessages');
  
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Form state
  const [targetType, setTargetType] = useState('all_users');
  const [targetUserId, setTargetUserId] = useState('');
  const [subject, setSubject] = useState('');
  const [messageText, setMessageText] = useState('');
  
  // User search for single user target
  const [userSearch, setUserSearch] = useState('');
  const [searchResults, setSearchResults] = useState<User[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);

  useEffect(() => {
    loadCampaigns();
  }, []);

  async function loadCampaigns() {
    try {
      const response = await fetch('/api/admin/system-messages');
      const data = await response.json();
      if (data.campaigns) {
        setCampaigns(data.campaigns);
      }
    } catch (err) {
      console.error('Failed to load campaigns:', err);
    } finally {
      setIsLoading(false);
    }
  }

  async function searchUsers(query: string) {
    if (!query || query.length < 2) {
      setSearchResults([]);
      return;
    }

    setIsSearching(true);
    try {
      const response = await fetch(`/api/admin/users?search=${encodeURIComponent(query)}&limit=10`);
      const data = await response.json();
      if (data.users) {
        setSearchResults(data.users);
      }
    } catch (err) {
      console.error('Failed to search users:', err);
    } finally {
      setIsSearching(false);
    }
  }

  async function handleSend(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!messageText.trim()) {
      setError('Message text is required');
      return;
    }

    if (targetType === 'single_user' && !targetUserId) {
      setError('Please select a user');
      return;
    }

    setIsSending(true);

    try {
      const response = await fetch('/api/admin/system-messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          target_type: targetType,
          target_user_id: targetType === 'single_user' ? targetUserId : undefined,
          subject: subject.trim() || undefined,
          message_text: messageText.trim(),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to send message');
      }

      setSuccess(`Message sent to ${data.delivered_count} user(s)`);
      setSubject('');
      setMessageText('');
      setTargetUserId('');
      setSelectedUser(null);
      loadCampaigns();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to send message');
    } finally {
      setIsSending(false);
    }
  }

  async function handleDelete(campaignId: string) {
    if (!confirm('Are you sure you want to delete this message? This will also delete the message from all recipients\' conversations.')) {
      return;
    }

    setDeletingId(campaignId);
    setError('');

    try {
      const response = await fetch(`/api/admin/system-messages/${campaignId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to delete');
      }

      setSuccess('Message deleted successfully');
      setCampaigns(campaigns.filter(c => c.id !== campaignId));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete message');
    } finally {
      setDeletingId(null);
    }
  }

  function getStatusBadge(status: string) {
    switch (status) {
      case 'sent':
        return <Badge variant="success">Sent</Badge>;
      case 'sending':
        return <Badge variant="warning">Sending</Badge>;
      case 'draft':
        return <Badge variant="default">Draft</Badge>;
      case 'failed':
        return <Badge variant="danger">Failed</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  }

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">System Messages</h1>
          <p className="text-slate-600 mt-1">
            Send announcements and notifications to users
          </p>
        </div>
        <Link href="/admin">
          <Button variant="outline">Back to Admin</Button>
        </Link>
      </div>

      {/* Compose Message */}
      <Card className="mb-8">
        <CardHeader>
          <h2 className="text-lg font-semibold">Compose Message</h2>
          <p className="text-sm text-slate-500">
            Send a message from &quot;Localisio System&quot; to users
          </p>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSend} className="space-y-4">
            {error && (
              <div className="p-3 rounded-lg bg-red-50 text-red-700 text-sm">
                {error}
              </div>
            )}
            {success && (
              <div className="p-3 rounded-lg bg-green-50 text-green-700 text-sm">
                {success}
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Select
                label="Target Audience"
                value={targetType}
                onChange={(e) => {
                  setTargetType(e.target.value);
                  setTargetUserId('');
                  setSelectedUser(null);
                }}
                options={Object.entries(TARGET_TYPE_LABELS).map(([value, label]) => ({
                  value,
                  label,
                }))}
              />

              {targetType === 'single_user' && (
                <div className="relative">
                  <Input
                    label="Search User"
                    placeholder="Search by name or email..."
                    value={selectedUser ? selectedUser.display_name : userSearch}
                    onChange={(e) => {
                      if (selectedUser) {
                        setSelectedUser(null);
                        setTargetUserId('');
                      }
                      setUserSearch(e.target.value);
                      searchUsers(e.target.value);
                    }}
                  />
                  {searchResults.length > 0 && !selectedUser && (
                    <div className="absolute z-10 w-full mt-1 bg-white border border-slate-200 rounded-lg shadow-lg max-h-60 overflow-auto">
                      {searchResults.map((user) => (
                        <button
                          key={user.id}
                          type="button"
                          className="w-full px-4 py-2 text-left hover:bg-slate-50 flex items-center gap-3"
                          onClick={() => {
                            setSelectedUser(user);
                            setTargetUserId(user.id);
                            setSearchResults([]);
                            setUserSearch('');
                          }}
                        >
                          <div>
                            <div className="font-medium">{user.display_name}</div>
                            <div className="text-sm text-slate-500">{user.email}</div>
                          </div>
                          <Badge size="sm" variant={user.role === 'provider' ? 'info' : 'default'}>
                            {user.role}
                          </Badge>
                        </button>
                      ))}
                    </div>
                  )}
                  {selectedUser && (
                    <div className="mt-2 p-2 bg-blue-50 rounded-lg flex items-center justify-between">
                      <span className="text-sm">
                        Selected: <strong>{selectedUser.display_name}</strong> ({selectedUser.email})
                      </span>
                      <button
                        type="button"
                        className="text-blue-600 hover:text-blue-800 text-sm"
                        onClick={() => {
                          setSelectedUser(null);
                          setTargetUserId('');
                        }}
                      >
                        Clear
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>

            <Input
              label="Subject (optional)"
              placeholder="e.g., New Feature Announcement"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              maxLength={200}
            />

            <Textarea
              label="Message"
              placeholder="Enter your message here..."
              value={messageText}
              onChange={(e) => setMessageText(e.target.value)}
              rows={5}
              maxLength={5000}
            />

            <div className="flex justify-end">
              <Button type="submit" disabled={isSending}>
                {isSending ? 'Sending...' : 'Send Message'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Sent Campaigns */}
      <Card>
        <CardHeader>
          <h2 className="text-lg font-semibold">Sent Messages</h2>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8 text-slate-500">Loading...</div>
          ) : campaigns.length === 0 ? (
            <div className="text-center py-8 text-slate-500">
              No messages sent yet
            </div>
          ) : (
            <div className="space-y-4">
              {campaigns.map((campaign) => (
                <div
                  key={campaign.id}
                  className="border border-slate-200 rounded-lg p-4 hover:bg-slate-50 transition-colors"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        {getStatusBadge(campaign.status)}
                        <Badge variant="default" size="sm">
                          {TARGET_TYPE_LABELS[campaign.target_type] || campaign.target_type}
                        </Badge>
                        {campaign.target_user && (
                          <span className="text-sm text-slate-500">
                            → {campaign.target_user.display_name}
                          </span>
                        )}
                      </div>
                      {campaign.subject && (
                        <h3 className="font-semibold text-slate-900 mb-1">
                          {campaign.subject}
                        </h3>
                      )}
                      <p className="text-slate-600 text-sm line-clamp-2">
                        {campaign.message_text}
                      </p>
                      <div className="mt-2 flex items-center gap-4 text-xs text-slate-500">
                        <span>Sent by: {campaign.admin?.display_name}</span>
                        <span>
                          {campaign.sent_at
                            ? formatRelativeTime(new Date(campaign.sent_at))
                            : formatRelativeTime(new Date(campaign.created_at))}
                        </span>
                      </div>
                    </div>
                    <div className="text-right text-sm">
                      <div className="text-slate-900 font-medium">
                        {campaign.delivered_count}/{campaign.recipients_count}
                      </div>
                      <div className="text-slate-500 text-xs">delivered</div>
                      {campaign.replies_count > 0 && (
                        <div className="mt-1">
                          <Badge variant="info" size="sm">
                            {campaign.replies_count} replies
                          </Badge>
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="mt-3 pt-3 border-t border-slate-100 flex items-center gap-2">
                    <Link href={`/admin/system-messages/${campaign.id}`}>
                      <Button size="sm" variant="outline">
                        View Details & Replies
                      </Button>
                    </Link>
                    <Button
                      size="sm"
                      variant="danger"
                      onClick={() => handleDelete(campaign.id)}
                      disabled={deletingId === campaign.id}
                    >
                      {deletingId === campaign.id ? 'Deleting...' : 'Delete'}
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
