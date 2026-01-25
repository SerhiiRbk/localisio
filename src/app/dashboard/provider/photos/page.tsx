'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { Button } from '@/components/ui/Button';
import { Card, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { getStorageUrl } from '@/lib/utils';
import type { ProviderPhoto } from '@/types/database';

const MAX_PHOTOS = 5;
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

export default function ManagePhotosPage() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [photos, setPhotos] = useState<ProviderPhoto[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

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
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setError('');
    setSuccess('');

    // Check if adding these files would exceed limit
    if (photos.length + files.length > MAX_PHOTOS) {
      setError(`You can only upload ${MAX_PHOTOS - photos.length} more photo(s)`);
      return;
    }

    setIsUploading(true);
    let uploadedCount = 0;

    try {
      for (const file of Array.from(files)) {
        // Validate file size
        if (file.size > MAX_FILE_SIZE) {
          setError(`${file.name} is too large. Maximum size is 10MB`);
          continue;
        }

        // Validate file type
        if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
          setError(`${file.name} is not a valid image. Use JPEG, PNG, or WebP`);
          continue;
        }

        const formData = new FormData();
        formData.append('file', file);

        const response = await fetch('/api/photos', {
          method: 'POST',
          body: formData,
        });

        if (response.ok) {
          uploadedCount++;
        } else {
          const data = await response.json();
          setError(data.error || 'Upload failed');
        }
      }

      if (uploadedCount > 0) {
        setSuccess(`${uploadedCount} photo(s) uploaded successfully!`);
        await loadPhotos();
      }
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

    setError('');
    setSuccess('');

    try {
      const response = await fetch(`/api/photos?id=${photoId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Delete failed');
      }

      setSuccess('Photo deleted');
      await loadPhotos();
    } catch {
      setError('Failed to delete photo');
    }
  }

  async function handleSetPrimary(photoId: string) {
    setError('');
    setSuccess('');

    try {
      const response = await fetch(`/api/photos/${photoId}/primary`, {
        method: 'PATCH',
      });

      if (!response.ok) {
        throw new Error('Failed to set primary');
      }

      setSuccess('Primary photo updated');
      await loadPhotos();
    } catch {
      setError('Failed to set primary photo');
    }
  }

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-slate-200 rounded w-1/3"></div>
          <div className="h-12 bg-slate-200 rounded"></div>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="aspect-square bg-slate-200 rounded-xl"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="text-3xl font-bold text-slate-900 mb-2">Provider Profile</h1>
      <p className="text-slate-600 mb-6">Manage your professional information and photos</p>

      {/* Tabs */}
      <div className="flex gap-2 mb-8 border-b border-slate-200">
        <Link
          href="/dashboard/provider/profile"
          className="px-4 py-3 text-slate-600 hover:text-slate-900 font-medium border-b-2 border-transparent hover:border-slate-300 transition-colors"
        >
          Profile Info
        </Link>
        <Link
          href="/dashboard/provider/photos"
          className="px-4 py-3 text-blue-600 font-medium border-b-2 border-blue-600"
        >
          Photos ({photos.length}/{MAX_PHOTOS})
        </Link>
      </div>

      {error && (
        <div className="mb-6 p-4 rounded-xl bg-red-50 text-red-700 border border-red-200">
          {error}
        </div>
      )}

      {success && (
        <div className="mb-6 p-4 rounded-xl bg-green-50 text-green-700 border border-green-200">
          {success}
        </div>
      )}

      {/* Upload Area */}
      <Card className="mb-8">
        <CardContent className="p-6">
          <div
            onClick={() => photos.length < MAX_PHOTOS && fileInputRef.current?.click()}
            className={`border-2 border-dashed rounded-xl p-8 text-center transition-colors ${
              photos.length >= MAX_PHOTOS
                ? 'border-slate-200 bg-slate-50 cursor-not-allowed'
                : 'border-slate-300 hover:border-blue-400 hover:bg-blue-50 cursor-pointer'
            }`}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              onChange={handleUpload}
              className="hidden"
              disabled={isUploading || photos.length >= MAX_PHOTOS}
              multiple
            />
            
            {isUploading ? (
              <div className="flex flex-col items-center">
                <svg className="animate-spin h-10 w-10 text-blue-600 mb-4" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                <p className="text-slate-600">Uploading...</p>
              </div>
            ) : photos.length >= MAX_PHOTOS ? (
              <div className="flex flex-col items-center">
                <div className="w-16 h-16 bg-slate-200 rounded-full flex items-center justify-center mb-4">
                  <svg className="w-8 h-8 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <p className="text-slate-600 font-medium">Maximum photos reached</p>
                <p className="text-sm text-slate-500 mt-1">Delete a photo to upload a new one</p>
              </div>
            ) : (
              <div className="flex flex-col items-center">
                <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-4">
                  <svg className="w-8 h-8 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
                <p className="text-slate-900 font-medium mb-1">Click to upload photos</p>
                <p className="text-sm text-slate-500">
                  JPEG, PNG or WebP • Max 10MB each • Up to {MAX_PHOTOS - photos.length} more
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Photos Grid */}
      {photos.length === 0 ? (
        <div className="text-center py-12 text-slate-500">
          <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-10 h-10 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
          <p className="font-medium text-slate-700">No photos yet</p>
          <p className="text-sm mt-1">Upload photos to showcase your work and build trust with clients</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {photos
            .sort((a, b) => a.sort_order - b.sort_order)
            .map((photo) => (
              <div
                key={photo.id}
                className="relative aspect-square rounded-xl overflow-hidden bg-slate-100 group shadow-sm border border-slate-200"
              >
                <Image
                  src={getStorageUrl(photo.storage_path)}
                  alt="Profile photo"
                  fill
                  className="object-cover"
                />
                
                {/* Primary Badge */}
                {photo.is_primary && (
                  <div className="absolute top-3 left-3">
                    <Badge variant="success" size="sm" className="shadow-lg">
                      <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                      Primary
                    </Badge>
                  </div>
                )}
                
                {/* Hover Actions */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-end p-4">
                  <div className="flex gap-2">
                    {!photo.is_primary && (
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() => handleSetPrimary(photo.id)}
                        className="flex-1"
                      >
                        Set as Primary
                      </Button>
                    )}
                    <Button
                      size="sm"
                      variant="danger"
                      onClick={() => handleDelete(photo.id)}
                      className={photo.is_primary ? 'flex-1' : ''}
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          
          {/* Empty slots */}
          {Array.from({ length: MAX_PHOTOS - photos.length }).map((_, i) => (
            <div
              key={`empty-${i}`}
              onClick={() => fileInputRef.current?.click()}
              className="aspect-square rounded-xl border-2 border-dashed border-slate-200 bg-slate-50 flex items-center justify-center cursor-pointer hover:border-blue-400 hover:bg-blue-50 transition-colors"
            >
              <div className="text-center">
                <svg className="w-8 h-8 text-slate-400 mx-auto mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                <span className="text-sm text-slate-500">Add photo</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Tips */}
      <div className="mt-8 p-4 bg-blue-50 rounded-xl border border-blue-100">
        <h3 className="font-medium text-blue-900 mb-2">Tips for great photos</h3>
        <ul className="text-sm text-blue-700 space-y-1">
          <li>• Use high-quality, well-lit images</li>
          <li>• Show yourself in a professional setting</li>
          <li>• Include photos of your work or workspace</li>
          <li>• The primary photo appears first in search results</li>
        </ul>
      </div>
    </div>
  );
}
