'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Avatar } from '@/components/ui/Avatar';
import { StarRating } from '@/components/ui/StarRating';
import { formatDate } from '@/lib/utils';

interface Review {
  id: string;
  provider_user_id: string;
  reviewer_user_id: string;
  rating: number;
  review_text: string | null;
  is_approved: boolean;
  created_at: string;
  reviewer: {
    id: string;
    display_name: string;
    avatar_url: string | null;
  };
  provider?: {
    id: string;
    display_name: string;
  };
}

export default function AdminReviewsPage() {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState<'pending' | 'approved' | 'all'>('pending');
  const [processingId, setProcessingId] = useState<string | null>(null);

  useEffect(() => {
    loadReviews();
  }, [filter]);

  async function loadReviews() {
    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      if (filter !== 'all') {
        params.set('status', filter);
      }
      
      const response = await fetch(`/api/admin/reviews?${params}`);
      const data = await response.json();
      setReviews(data.reviews || []);
    } catch (error) {
      console.error('Error loading reviews:', error);
    } finally {
      setIsLoading(false);
    }
  }

  async function handleApprove(reviewId: string) {
    setProcessingId(reviewId);
    try {
      const response = await fetch(`/api/reviews/${reviewId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_approved: true }),
      });

      if (response.ok) {
        loadReviews();
      }
    } catch (error) {
      console.error('Error approving review:', error);
    } finally {
      setProcessingId(null);
    }
  }

  async function handleReject(reviewId: string) {
    if (!confirm('Delete this review?')) return;
    
    setProcessingId(reviewId);
    try {
      const response = await fetch(`/api/reviews/${reviewId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        loadReviews();
      }
    } catch (error) {
      console.error('Error deleting review:', error);
    } finally {
      setProcessingId(null);
    }
  }

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Review Moderation</h1>
          <p className="text-slate-600 mt-1">Approve or reject user reviews</p>
        </div>
        <Link href="/admin">
          <Button variant="outline">Back to Admin</Button>
        </Link>
      </div>

      {/* Filters */}
      <div className="flex gap-2 mb-6">
        <Button
          size="sm"
          variant={filter === 'pending' ? 'primary' : 'outline'}
          onClick={() => setFilter('pending')}
        >
          Pending
        </Button>
        <Button
          size="sm"
          variant={filter === 'approved' ? 'primary' : 'outline'}
          onClick={() => setFilter('approved')}
        >
          Approved
        </Button>
        <Button
          size="sm"
          variant={filter === 'all' ? 'primary' : 'outline'}
          onClick={() => setFilter('all')}
        >
          All
        </Button>
      </div>

      {isLoading ? (
        <div className="text-center py-12">
          <div className="animate-spin w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full mx-auto"></div>
        </div>
      ) : reviews.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-slate-500">No reviews found</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {reviews.map((review) => (
            <Card key={review.id}>
              <CardContent className="py-4">
                <div className="flex items-start gap-4">
                  <Avatar
                    src={review.reviewer?.avatar_url}
                    alt={review.reviewer?.display_name || 'User'}
                    size="md"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-slate-900">
                            {review.reviewer?.display_name || 'Unknown'}
                          </span>
                          <span className="text-slate-400">→</span>
                          <Link 
                            href={`/p/${review.provider_user_id}`}
                            className="text-blue-600 hover:underline"
                          >
                            View Provider
                          </Link>
                        </div>
                        <div className="mt-1">
                          <StarRating rating={review.rating} size="sm" />
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant={review.is_approved ? 'success' : 'warning'}>
                          {review.is_approved ? 'Approved' : 'Pending'}
                        </Badge>
                        <span className="text-sm text-slate-400">
                          {formatDate(review.created_at)}
                        </span>
                      </div>
                    </div>
                    
                    {review.review_text && (
                      <p className="mt-3 text-slate-700 bg-slate-50 p-3 rounded-lg">
                        {review.review_text}
                      </p>
                    )}

                    {!review.is_approved && (
                      <div className="mt-4 flex gap-2">
                        <Button
                          size="sm"
                          onClick={() => handleApprove(review.id)}
                          disabled={processingId === review.id}
                          isLoading={processingId === review.id}
                        >
                          Approve
                        </Button>
                        <Button
                          size="sm"
                          variant="danger"
                          onClick={() => handleReject(review.id)}
                          disabled={processingId === review.id}
                        >
                          Delete
                        </Button>
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
