'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Textarea } from '@/components/ui/Textarea';
import { Avatar } from '@/components/ui/Avatar';
import { StarRating } from '@/components/ui/StarRating';
import { formatDate } from '@/lib/utils';
import type { ReviewWithReviewer } from '@/types/database';

interface ReviewSectionProps {
  providerId: string;
  initialReviews: ReviewWithReviewer[];
  averageRating: number;
  reviewCount: number;
}

export function ReviewSection({
  providerId,
  initialReviews,
  averageRating,
  reviewCount,
}: ReviewSectionProps) {
  const [reviews, setReviews] = useState(initialReviews);
  const [canReview, setCanReview] = useState(false);
  const [existingReview, setExistingReview] = useState<{
    id: string;
    rating: number;
    review_text: string | null;
    is_approved: boolean;
  } | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [rating, setRating] = useState(0);
  const [reviewText, setReviewText] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    checkCanReview();
  }, [providerId]);

  async function checkCanReview() {
    try {
      const response = await fetch(`/api/reviews/can-review?provider_id=${providerId}`);
      const data = await response.json();
      setCanReview(data.can_review);
      setExistingReview(data.existing_review);
      if (data.existing_review) {
        setRating(data.existing_review.rating);
        setReviewText(data.existing_review.review_text || '');
      }
    } catch (error) {
      console.error('Error checking review status:', error);
    } finally {
      setIsLoading(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (rating === 0) {
      setError('Please select a rating');
      return;
    }

    setIsSubmitting(true);
    setError('');
    setSuccess('');

    try {
      const response = await fetch('/api/reviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          provider_user_id: providerId,
          rating,
          review_text: reviewText || null,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to submit review');
      }

      setSuccess('Review submitted! It will appear after moderation.');
      setShowForm(false);
      checkCanReview();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to submit review');
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleDelete() {
    if (!existingReview || !confirm('Delete your review?')) return;

    setIsSubmitting(true);
    setError('');

    try {
      const response = await fetch(`/api/reviews/${existingReview.id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete review');
      }

      setExistingReview(null);
      setCanReview(true);
      setRating(0);
      setReviewText('');
      setSuccess('Review deleted');
      
      // Remove from displayed reviews if it was approved
      setReviews(reviews.filter(r => r.id !== existingReview.id));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete review');
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Card>
      <CardContent className="pt-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-lg font-semibold">Reviews</h2>
            {reviewCount > 0 && (
              <div className="flex items-center gap-2 mt-1">
                <StarRating rating={averageRating} size="sm" />
                <span className="text-sm text-slate-500">
                  {averageRating.toFixed(1)} ({reviewCount} review{reviewCount !== 1 ? 's' : ''})
                </span>
              </div>
            )}
          </div>
          
          {!isLoading && canReview && !showForm && (
            <Button size="sm" onClick={() => setShowForm(true)}>
              Write a Review
            </Button>
          )}
        </div>

        {error && (
          <div className="mb-4 p-3 rounded-lg bg-red-50 text-red-700 text-sm">{error}</div>
        )}
        {success && (
          <div className="mb-4 p-3 rounded-lg bg-green-50 text-green-700 text-sm">{success}</div>
        )}

        {/* Existing review notice */}
        {existingReview && !showForm && (
          <div className="mb-6 p-4 bg-blue-50 rounded-xl border border-blue-100">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-medium text-blue-900">Your review</p>
                <div className="mt-1">
                  <StarRating rating={existingReview.rating} size="sm" />
                </div>
                {existingReview.review_text && (
                  <p className="mt-2 text-sm text-blue-800">{existingReview.review_text}</p>
                )}
                <p className="mt-2 text-xs text-blue-600">
                  {existingReview.is_approved ? 'Approved' : 'Pending moderation'}
                </p>
              </div>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={handleDelete}
                disabled={isSubmitting}
                className="text-red-600 hover:text-red-700 hover:bg-red-50"
              >
                Delete
              </Button>
            </div>
          </div>
        )}

        {/* Review form */}
        {showForm && (
          <form onSubmit={handleSubmit} className="mb-6 p-4 bg-slate-50 rounded-xl">
            <div className="mb-4">
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Your Rating *
              </label>
              <StarRating
                rating={rating}
                size="lg"
                interactive
                onChange={setRating}
              />
            </div>
            
            <div className="mb-4">
              <Textarea
                label="Your Review (optional)"
                value={reviewText}
                onChange={(e) => setReviewText(e.target.value)}
                placeholder="Share your experience with this provider..."
                rows={4}
                maxLength={600}
              />
              <p className="text-xs text-slate-500 mt-1">
                {reviewText.length}/600 characters
              </p>
            </div>

            <div className="flex gap-3">
              <Button type="submit" isLoading={isSubmitting}>
                Submit Review
              </Button>
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => {
                  setShowForm(false);
                  setRating(existingReview?.rating || 0);
                  setReviewText(existingReview?.review_text || '');
                }}
              >
                Cancel
              </Button>
            </div>
          </form>
        )}

        {/* Reviews list */}
        {reviews.length === 0 ? (
          <p className="text-slate-500 text-center py-8">
            No reviews yet. Be the first to review!
          </p>
        ) : (
          <div className="space-y-6">
            {reviews.map((review) => (
              <div key={review.id} className="border-b border-slate-100 last:border-0 pb-6 last:pb-0">
                <div className="flex items-start gap-4">
                  <Avatar 
                    src={review.reviewer?.avatar_url} 
                    alt={review.reviewer?.display_name || 'User'} 
                    size="md" 
                  />
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <h4 className="font-medium text-slate-900">
                        {review.reviewer?.display_name || 'Anonymous'}
                      </h4>
                      <span className="text-sm text-slate-400">
                        {formatDate(review.created_at)}
                      </span>
                    </div>
                    <div className="mt-1">
                      <StarRating rating={review.rating} size="sm" />
                    </div>
                    {review.review_text && (
                      <p className="mt-2 text-slate-700">{review.review_text}</p>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
