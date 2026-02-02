'use client';

import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/Button';
import { Textarea } from '@/components/ui/Textarea';
import { StarRating } from '@/components/ui/StarRating';

interface ReviewModalProps {
  providerId: string;
  providerName?: string;
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export function ReviewModal({
  providerId,
  providerName,
  isOpen,
  onClose,
  onSuccess,
}: ReviewModalProps) {
  const t = useTranslations('reviews');
  const [rating, setRating] = useState(0);
  const [reviewText, setReviewText] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [canReview, setCanReview] = useState<boolean | null>(null);
  const [existingReview, setExistingReview] = useState<{
    id: string;
    rating: number;
    review_text: string | null;
  } | null>(null);

  useEffect(() => {
    if (isOpen) {
      checkCanReview();
    }
  }, [isOpen, providerId]);

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
      setCanReview(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (rating === 0) {
      setError(t('selectRating'));
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

      setSuccess(t('submitted'));
      onSuccess?.();
      
      // Close modal after showing success
      setTimeout(() => {
        onClose();
        setRating(0);
        setReviewText('');
        setSuccess('');
      }, 2000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to submit review');
    } finally {
      setIsSubmitting(false);
    }
  }

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl max-w-md w-full shadow-xl max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold">{t('leaveReview')}</h3>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {providerName && (
            <p className="text-gray-600 mb-4">
              {t('reviewFor', { name: providerName })}
            </p>
          )}

          {canReview === null && (
            <div className="flex justify-center py-8">
              <div className="animate-spin w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full"></div>
            </div>
          )}

          {canReview === false && !existingReview && (
            <div className="p-4 bg-yellow-50 text-yellow-800 rounded-lg">
              {t('cannotReview')}
            </div>
          )}

          {existingReview && !success && (
            <div className="p-4 bg-blue-50 text-blue-800 rounded-lg mb-4">
              <p className="font-medium">{t('alreadyReviewed')}</p>
              <div className="mt-2">
                <StarRating rating={existingReview.rating} size="sm" />
              </div>
              {existingReview.review_text && (
                <p className="mt-2 text-sm">{existingReview.review_text}</p>
              )}
            </div>
          )}

          {error && (
            <div className="mb-4 p-3 rounded-lg bg-red-50 text-red-700 text-sm">
              {error}
            </div>
          )}

          {success && (
            <div className="mb-4 p-3 rounded-lg bg-green-50 text-green-700 text-sm flex items-center gap-2">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              {success}
            </div>
          )}

          {canReview && !existingReview && !success && (
            <form onSubmit={handleSubmit}>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t('yourRating')} *
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
                  label={t('yourReview')}
                  value={reviewText}
                  onChange={(e) => setReviewText(e.target.value)}
                  placeholder={t('reviewPlaceholder')}
                  rows={4}
                  maxLength={600}
                />
                <p className="text-xs text-gray-500 mt-1">
                  {reviewText.length}/600
                </p>
              </div>

              <div className="flex gap-3">
                <Button type="submit" isLoading={isSubmitting} className="flex-1">
                  {t('submit')}
                </Button>
                <Button type="button" variant="outline" onClick={onClose}>
                  {t('cancel')}
                </Button>
              </div>
            </form>
          )}

          {(canReview === false || existingReview) && !success && (
            <div className="mt-4 flex justify-end">
              <Button variant="outline" onClick={onClose}>
                {t('close')}
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
