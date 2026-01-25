'use client';

import { useState, useEffect, useRef } from 'react';
import { useTranslations } from 'next-intl';
import Image from 'next/image';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { getStorageUrl } from '@/lib/utils';
import type { ProviderPhoto } from '@/types/database';

const MAX_PHOTOS = 5;
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

export default function ManagePhotosPage() {
  const t = useTranslations('profile.photos');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [photos, setPhotos] = useState<ProviderPhoto[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    loadPhotos();
  }, []);

  async function loadPhotos() {
    try {
      const response = await fetch('/api/photos');
      const data = await response.json();
      setPhotos(data.photos || []);
    } catch {
      setError('Failed to load photos');
    } finally {
      setIsLoading(false);
    }
  }

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setError('');

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      setError(t('maxSize'));
      return;
    }

    // Validate file type
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      setError(t('formats'));
      return;
    }

    // Check count
    if (photos.length >= MAX_PHOTOS) {
      setError(t('maxPhotos'));
      return;
    }

    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch('/api/photos', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Upload failed');
      }

      await loadPhotos();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed');
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  }

  async function handleDelete(photoId: string) {
    if (!confirm('Delete this photo?')) return;

    try {
      const response = await fetch(`/api/photos?id=${photoId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Delete failed');
      }

      await loadPhotos();
    } catch {
      setError('Failed to delete photo');
    }
  }

  async function handleSetPrimary(photoId: string) {
    try {
      const response = await fetch(`/api/photos/${photoId}/primary`, {
        method: 'PATCH',
      });

      if (!response.ok) {
        throw new Error('Failed to set primary');
      }

      await loadPhotos();
    } catch {
      setError('Failed to set primary photo');
    }
  }

  if (isLoading) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-8">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/3"></div>
          <div className="grid grid-cols-2 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="aspect-square bg-gray-200 rounded-lg"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="text-2xl font-bold text-gray-900 mb-2">{t('title')}</h1>
      <p className="text-gray-600 mb-6">{t('subtitle')}</p>

      {error && (
        <div className="mb-4 p-3 rounded-lg bg-red-50 text-red-700 text-sm">{error}</div>
      )}

      <Card className="mb-6">
        <CardHeader>
          <div className="flex justify-between items-center">
            <h2 className="font-semibold">
              Photos ({photos.length}/{MAX_PHOTOS})
            </h2>
            <div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                onChange={handleUpload}
                className="hidden"
                disabled={isUploading || photos.length >= MAX_PHOTOS}
              />
              <Button
                size="sm"
                onClick={() => fileInputRef.current?.click()}
                isLoading={isUploading}
                disabled={photos.length >= MAX_PHOTOS}
              >
                {t('uploadNew')}
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {photos.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <p>No photos yet. Upload your first photo!</p>
              <p className="text-sm mt-2">{t('maxSize')} | {t('formats')}</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {photos
                .sort((a, b) => a.sort_order - b.sort_order)
                .map((photo) => (
                  <div
                    key={photo.id}
                    className="relative aspect-square rounded-lg overflow-hidden bg-gray-100 group"
                  >
                    <Image
                      src={getStorageUrl(photo.storage_path)}
                      alt="Profile photo"
                      fill
                      className="object-cover"
                    />
                    {photo.is_primary && (
                      <div className="absolute top-2 left-2">
                        <Badge variant="success" size="sm">
                          {t('primary')}
                        </Badge>
                      </div>
                    )}
                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                      {!photo.is_primary && (
                        <Button
                          size="sm"
                          variant="secondary"
                          onClick={() => handleSetPrimary(photo.id)}
                        >
                          {t('setPrimary')}
                        </Button>
                      )}
                      <Button
                        size="sm"
                        variant="danger"
                        onClick={() => handleDelete(photo.id)}
                      >
                        Delete
                      </Button>
                    </div>
                  </div>
                ))}
            </div>
          )}
        </CardContent>
      </Card>

      <p className="text-sm text-gray-500">
        {t('maxSize')} | {t('formats')}
      </p>
    </div>
  );
}
