'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Input } from '@/components/ui/Input';
import { Avatar } from '@/components/ui/Avatar';
import { StarRating } from '@/components/ui/StarRating';

interface Provider {
  user_id: string;
  headline: string | null;
  country_code: string | null;
  city: string | null;
  is_approved: boolean;
  is_verified: boolean;
  is_hidden: boolean;
  featured: boolean;
  priority_score: number;
  average_rating: number;
  review_count: number;
  created_at: string;
  profile: {
    id: string;
    display_name: string;
    email: string | null;
    avatar_url: string | null;
  };
}

type FilterType = 'all' | 'pending' | 'approved' | 'verified' | 'unverified' | 'hidden' | 'featured';

export default function AdminProvidersPage() {
  const [providers, setProviders] = useState<Provider[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState<FilterType>('all');
  const [search, setSearch] = useState('');
  const [processingId, setProcessingId] = useState<string | null>(null);

  useEffect(() => {
    loadProviders();
  }, [filter]);

  async function loadProviders() {
    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      if (filter !== 'all') params.set('filter', filter);
      if (search) params.set('search', search);

      const response = await fetch(`/api/admin/providers?${params}`);
      const data = await response.json();
      setProviders(data.providers || []);
    } catch (error) {
      console.error('Error loading providers:', error);
    } finally {
      setIsLoading(false);
    }
  }

  async function handleToggleApproved(provider: Provider) {
    setProcessingId(provider.user_id);
    try {
      const response = await fetch(`/api/admin/providers/${provider.user_id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_approved: !provider.is_approved }),
      });
      if (response.ok) loadProviders();
    } catch (error) {
      console.error('Error updating provider:', error);
    } finally {
      setProcessingId(null);
    }
  }

  async function handleToggleVerified(provider: Provider) {
    setProcessingId(provider.user_id);
    try {
      const response = await fetch(`/api/admin/providers/${provider.user_id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_verified: !provider.is_verified }),
      });
      if (response.ok) loadProviders();
    } catch (error) {
      console.error('Error updating provider:', error);
    } finally {
      setProcessingId(null);
    }
  }

  async function handleToggleHidden(provider: Provider) {
    setProcessingId(provider.user_id);
    try {
      const response = await fetch(`/api/admin/providers/${provider.user_id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_hidden: !provider.is_hidden }),
      });
      if (response.ok) loadProviders();
    } catch (error) {
      console.error('Error updating provider:', error);
    } finally {
      setProcessingId(null);
    }
  }

  async function handleToggleFeatured(provider: Provider) {
    setProcessingId(provider.user_id);
    try {
      const response = await fetch(`/api/admin/providers/${provider.user_id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ featured: !provider.featured }),
      });
      if (response.ok) loadProviders();
    } catch (error) {
      console.error('Error updating provider:', error);
    } finally {
      setProcessingId(null);
    }
  }

  async function handleDelete(provider: Provider) {
    if (!confirm(`Delete provider "${provider.profile.display_name}"? This action cannot be undone.`)) {
      return;
    }

    setProcessingId(provider.user_id);
    try {
      const response = await fetch(`/api/admin/providers/${provider.user_id}`, {
        method: 'DELETE',
      });
      if (response.ok) loadProviders();
    } catch (error) {
      console.error('Error deleting provider:', error);
    } finally {
      setProcessingId(null);
    }
  }

  const filters: { key: FilterType; label: string }[] = [
    { key: 'all', label: 'All' },
    { key: 'pending', label: '⏳ Pending' },
    { key: 'approved', label: 'Approved' },
    { key: 'verified', label: 'Verified' },
    { key: 'unverified', label: 'Unverified' },
    { key: 'hidden', label: 'Hidden' },
    { key: 'featured', label: 'Featured' },
  ];

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Manage Providers</h1>
          <p className="text-slate-600 mt-1">Verify, hide, or delete provider profiles</p>
        </div>
        <Link href="/admin">
          <Button variant="outline">Back to Admin</Button>
        </Link>
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <div className="flex-1">
          <Input
            placeholder="Search by name, email, or city..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && loadProviders()}
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
      ) : providers.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-slate-500">No providers found</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {providers.map((provider) => (
            <Card key={provider.user_id} className={provider.is_hidden ? 'opacity-60' : ''}>
              <CardContent className="py-4">
                <div className="flex items-start gap-4">
                  <Avatar
                    src={provider.profile.avatar_url}
                    alt={provider.profile.display_name}
                    size="lg"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <Link
                            href={`/p/${provider.user_id}`}
                            className="font-semibold text-slate-900 hover:text-blue-600"
                          >
                            {provider.profile.display_name}
                          </Link>
                          {!provider.is_approved && (
                            <Badge variant="warning" size="sm">⏳ Pending</Badge>
                          )}
                          {provider.is_verified && (
                            <Badge variant="success" size="sm">Verified</Badge>
                          )}
                          {provider.is_hidden && (
                            <Badge variant="secondary" size="sm">Hidden</Badge>
                          )}
                          {provider.featured && (
                            <Badge variant="info" size="sm">Featured</Badge>
                          )}
                        </div>
                        {provider.headline && (
                          <p className="text-sm text-slate-600 mt-0.5">{provider.headline}</p>
                        )}
                        <p className="text-sm text-slate-400 mt-1">
                          {provider.profile.email}
                          {provider.city && ` • ${provider.city}`}
                          {provider.country_code && `, ${provider.country_code}`}
                        </p>
                        {provider.average_rating > 0 && (
                          <div className="mt-1">
                            <StarRating
                              rating={provider.average_rating}
                              size="sm"
                              showCount
                              count={provider.review_count}
                            />
                          </div>
                        )}
                      </div>
                      <div className="text-right text-sm text-slate-400">
                        <div>Priority: {provider.priority_score}</div>
                        <div className="mt-1">
                          {new Date(provider.created_at).toLocaleDateString()}
                        </div>
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="mt-4 flex flex-wrap gap-2">
                      <Link href={`/admin/users/${provider.user_id}/chat`}>
                        <Button size="sm" variant="outline">
                          💬 Open Chat
                        </Button>
                      </Link>
                      <Link href={`/admin/providers/${provider.user_id}`}>
                        <Button size="sm" variant="outline">
                          ✏️ Edit
                        </Button>
                      </Link>
                      <Button
                        size="sm"
                        variant={provider.is_approved ? 'outline' : 'primary'}
                        onClick={() => handleToggleApproved(provider)}
                        disabled={processingId === provider.user_id}
                        className={!provider.is_approved ? 'bg-green-600 hover:bg-green-700' : ''}
                      >
                        {provider.is_approved ? 'Revoke Approval' : '✓ Approve'}
                      </Button>
                      <Button
                        size="sm"
                        variant={provider.is_verified ? 'outline' : 'secondary'}
                        onClick={() => handleToggleVerified(provider)}
                        disabled={processingId === provider.user_id}
                      >
                        {provider.is_verified ? 'Remove Verification' : 'Verify'}
                      </Button>
                      <Button
                        size="sm"
                        variant={provider.is_hidden ? 'primary' : 'outline'}
                        onClick={() => handleToggleHidden(provider)}
                        disabled={processingId === provider.user_id}
                      >
                        {provider.is_hidden ? 'Show in Search' : 'Hide from Search'}
                      </Button>
                      <Button
                        size="sm"
                        variant={provider.featured ? 'outline' : 'secondary'}
                        onClick={() => handleToggleFeatured(provider)}
                        disabled={processingId === provider.user_id}
                      >
                        {provider.featured ? 'Remove Featured' : 'Make Featured'}
                      </Button>
                      <Button
                        size="sm"
                        variant="danger"
                        onClick={() => handleDelete(provider)}
                        disabled={processingId === provider.user_id}
                      >
                        Delete
                      </Button>
                    </div>
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
