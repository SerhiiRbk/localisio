'use client';

import { useState, useEffect, use } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Avatar } from '@/components/ui/Avatar';
import { formatRelativeTime, formatDate } from '@/lib/utils';

interface CampaignDetails {
  campaign: {
    id: string;
    admin_id: string;
    target_type: string;
    target_user_id: string | null;
    subject: string | null;
    message_text: string;
    recipients_count: number;
    delivered_count: number;
    status: string;
    created_at: string;
    sent_at: string | null;
    admin: {
      id: string;
      display_name: string;
      avatar_url: string | null;
    };
    target_user: {
      id: string;
      display_name: string;
      email: string;
    } | null;
  };
  deliveries: {
    id: string;
    user_id: string;
    conversation_id: string;
    delivered_at: string;
    read_at: string | null;
    replied_at: string | null;
    user: {
      id: string;
      display_name: string;
      email: string;
      avatar_url: string | null;
      role: string;
    };
  }[];
  replies: {
    id: string;
    conversation_id: string;
    sender_id: string;
    content: string;
    created_at: string;
    sender: {
      id: string;
      display_name: string;
      avatar_url: string | null;
    };
  }[];
  stats: {
    total_recipients: number;
    delivered: number;
    read: number;
    replied: number;
  };
}

const TARGET_TYPE_LABELS: Record<string, string> = {
  all_users: 'All Users',
  all_providers: 'All Providers',
  verified_providers: 'Verified Providers',
  unverified_providers: 'Unverified Providers',
  non_providers: 'Non-Providers (Seekers)',
  single_user: 'Single User',
};

export default function CampaignDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [data, setData] = useState<CampaignDetails | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'deliveries' | 'replies'>('replies');

  useEffect(() => {
    async function loadData() {
      try {
        const response = await fetch(`/api/admin/system-messages/${id}`);
        const result = await response.json();
        if (result.campaign) {
          setData(result);
        }
      } catch (err) {
        console.error('Failed to load campaign details:', err);
      } finally {
        setIsLoading(false);
      }
    }
    loadData();
  }, [id]);

  if (isLoading) {
    return (
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-slate-200 rounded w-1/3"></div>
          <div className="h-32 bg-slate-200 rounded"></div>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center py-12">
          <h2 className="text-xl font-semibold text-slate-900">Campaign not found</h2>
          <Link href="/admin/system-messages" className="mt-4 inline-block">
            <Button variant="outline">Back to System Messages</Button>
          </Link>
        </div>
      </div>
    );
  }

  const { campaign, deliveries, replies, stats } = data;

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Campaign Details</h1>
          <p className="text-slate-600 mt-1">
            View message details and user replies
          </p>
        </div>
        <Link href="/admin/system-messages">
          <Button variant="outline">Back to Messages</Button>
        </Link>
      </div>

      {/* Campaign Info */}
      <Card className="mb-6">
        <CardHeader>
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">Message</h2>
            <div className="flex items-center gap-2">
              <Badge variant={campaign.status === 'sent' ? 'success' : 'warning'}>
                {campaign.status}
              </Badge>
              <Badge variant="default">
                {TARGET_TYPE_LABELS[campaign.target_type]}
              </Badge>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {campaign.subject && (
            <h3 className="text-xl font-semibold text-slate-900 mb-2">
              {campaign.subject}
            </h3>
          )}
          <p className="text-slate-700 whitespace-pre-wrap mb-4">
            {campaign.message_text}
          </p>
          <div className="flex items-center gap-4 text-sm text-slate-500 pt-4 border-t">
            <div className="flex items-center gap-2">
              <Avatar
                src={campaign.admin?.avatar_url}
                alt={campaign.admin?.display_name || 'Admin'}
                size="sm"
              />
              <span>Sent by {campaign.admin?.display_name}</span>
            </div>
            <span>
              {campaign.sent_at
                ? formatDate(campaign.sent_at, 'en')
                : formatDate(campaign.created_at, 'en')}
            </span>
          </div>
        </CardContent>
      </Card>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardContent className="pt-4 text-center">
            <div className="text-3xl font-bold text-slate-900">{stats.total_recipients}</div>
            <div className="text-sm text-slate-500">Recipients</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 text-center">
            <div className="text-3xl font-bold text-green-600">{stats.delivered}</div>
            <div className="text-sm text-slate-500">Delivered</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 text-center">
            <div className="text-3xl font-bold text-blue-600">{stats.read}</div>
            <div className="text-sm text-slate-500">Read</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 text-center">
            <div className="text-3xl font-bold text-purple-600">{stats.replied}</div>
            <div className="text-sm text-slate-500">Replied</div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-4 border-b border-slate-200">
        <button
          className={`px-4 py-3 font-medium border-b-2 transition-colors ${
            activeTab === 'replies'
              ? 'text-blue-600 border-blue-600'
              : 'text-slate-600 border-transparent hover:text-slate-900 hover:border-slate-300'
          }`}
          onClick={() => setActiveTab('replies')}
        >
          Replies ({replies.length})
        </button>
        <button
          className={`px-4 py-3 font-medium border-b-2 transition-colors ${
            activeTab === 'deliveries'
              ? 'text-blue-600 border-blue-600'
              : 'text-slate-600 border-transparent hover:text-slate-900 hover:border-slate-300'
          }`}
          onClick={() => setActiveTab('deliveries')}
        >
          Deliveries ({deliveries.length})
        </button>
      </div>

      {/* Replies Tab */}
      {activeTab === 'replies' && (
        <Card>
          <CardContent className="pt-4">
            {replies.length === 0 ? (
              <div className="text-center py-8 text-slate-500">
                No replies yet
              </div>
            ) : (
              <div className="space-y-4">
                {replies.map((reply) => (
                  <div
                    key={reply.id}
                    className="border border-slate-200 rounded-lg p-4"
                  >
                    <div className="flex items-start gap-3">
                      <Avatar
                        src={reply.sender?.avatar_url}
                        alt={reply.sender?.display_name || 'User'}
                        size="md"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <span className="font-medium text-slate-900">
                            {reply.sender?.display_name}
                          </span>
                          <span className="text-sm text-slate-500">
                            {formatRelativeTime(new Date(reply.created_at))}
                          </span>
                        </div>
                        <p className="text-slate-700 mt-1 whitespace-pre-wrap">
                          {reply.content}
                        </p>
                        <div className="mt-2">
                          <Link href={`/dashboard/messages/${reply.conversation_id}`}>
                            <Button size="sm" variant="outline">
                              View Conversation
                            </Button>
                          </Link>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Deliveries Tab */}
      {activeTab === 'deliveries' && (
        <Card>
          <CardContent className="pt-4">
            {deliveries.length === 0 ? (
              <div className="text-center py-8 text-slate-500">
                No deliveries
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-slate-200">
                      <th className="text-left py-3 px-4 font-medium text-slate-600">User</th>
                      <th className="text-left py-3 px-4 font-medium text-slate-600">Role</th>
                      <th className="text-left py-3 px-4 font-medium text-slate-600">Delivered</th>
                      <th className="text-left py-3 px-4 font-medium text-slate-600">Read</th>
                      <th className="text-left py-3 px-4 font-medium text-slate-600">Replied</th>
                      <th className="text-left py-3 px-4 font-medium text-slate-600">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {deliveries.map((delivery) => (
                      <tr key={delivery.id} className="border-b border-slate-100">
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-2">
                            <Avatar
                              src={delivery.user?.avatar_url}
                              alt={delivery.user?.display_name || 'User'}
                              size="sm"
                            />
                            <div>
                              <div className="font-medium text-slate-900">
                                {delivery.user?.display_name}
                              </div>
                              <div className="text-sm text-slate-500">
                                {delivery.user?.email}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <Badge
                            variant={delivery.user?.role === 'provider' ? 'info' : 'default'}
                            size="sm"
                          >
                            {delivery.user?.role}
                          </Badge>
                        </td>
                        <td className="py-3 px-4 text-sm text-slate-600">
                          {formatRelativeTime(new Date(delivery.delivered_at))}
                        </td>
                        <td className="py-3 px-4">
                          {delivery.read_at ? (
                            <Badge variant="success" size="sm">Yes</Badge>
                          ) : (
                            <Badge variant="default" size="sm">No</Badge>
                          )}
                        </td>
                        <td className="py-3 px-4">
                          {delivery.replied_at ? (
                            <Badge variant="info" size="sm">Yes</Badge>
                          ) : (
                            <Badge variant="default" size="sm">No</Badge>
                          )}
                        </td>
                        <td className="py-3 px-4">
                          <Link href={`/dashboard/messages/${delivery.conversation_id}`}>
                            <Button size="sm" variant="outline">
                              View Chat
                            </Button>
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
