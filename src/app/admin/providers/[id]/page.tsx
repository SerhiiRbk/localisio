'use client';

import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations, useLocale } from 'next-intl';
import Link from 'next/link';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Avatar } from '@/components/ui/Avatar';
import { getStorageUrl } from '@/lib/utils';
import { countries, getCountryLabel } from '@/config/countries';
import { languages, getLanguageLabel } from '@/config/languages';
import type { ProviderWithProfile } from '@/types/database';

interface Props {
  params: Promise<{ id: string }>;
}

export default function AdminEditProviderPage({ params }: Props) {
  const { id } = use(params);
  const t = useTranslations('admin.providers');
  const locale = useLocale();
  const router = useRouter();

  const [provider, setProvider] = useState<ProviderWithProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const [formData, setFormData] = useState({
    is_approved: false,
    is_verified: false,
    verification_badge_text: '',
    priority_score: 0,
    featured: false,
    featured_country_code: '',
    featured_language: '',
  });

  useEffect(() => {
    async function load() {
      try {
        const response = await fetch(`/api/providers/${id}`);
        if (!response.ok) {
          router.push('/admin/providers');
          return;
        }

        const data = await response.json();
        setProvider(data.provider);
        setFormData({
          is_approved: data.provider.is_approved || false,
          is_verified: data.provider.is_verified || false,
          verification_badge_text: data.provider.verification_badge_text || '',
          priority_score: data.provider.priority_score || 0,
          featured: data.provider.featured || false,
          featured_country_code: data.provider.featured_country_code || '',
          featured_language: data.provider.featured_language || '',
        });
      } catch {
        router.push('/admin/providers');
      } finally {
        setIsLoading(false);
      }
    }
    load();
  }, [id, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess(false);
    setIsSaving(true);

    try {
      const response = await fetch(`/api/admin/providers/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          is_approved: formData.is_approved,
          is_verified: formData.is_verified,
          verification_badge_text: formData.verification_badge_text || null,
          priority_score: formData.priority_score,
          featured: formData.featured,
          featured_country_code: formData.featured_country_code || null,
          featured_language: formData.featured_language || null,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to update');
      }

      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch {
      setError('Failed to update provider');
    } finally {
      setIsSaving(false);
    }
  };

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

  if (!provider) {
    return null;
  }

  // Avatar: use explicitly chosen avatar photo, otherwise fall back to user's profile avatar
  const avatarPhoto = provider.avatar_photo_id
    ? provider.photos?.find((p) => p.id === provider.avatar_photo_id)
    : null;
  const avatarUrl = avatarPhoto
    ? getStorageUrl(avatarPhoto.storage_path)
    : provider.profile.avatar_url;

  const countryOptions = [
    { value: '', label: '-- None --' },
    ...countries.map((c) => ({
      value: c.code,
      label: `${c.flag} ${getCountryLabel(c.code, locale)}`,
    })),
  ];

  const languageOptions = [
    { value: '', label: '-- None --' },
    ...languages.slice(0, 4).map((l) => ({
      value: l.code,
      label: getLanguageLabel(l.code, locale),
    })),
  ];

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Edit Provider</h1>
        <Link href="/admin/providers">
          <Button variant="outline" size="sm">
            Back
          </Button>
        </Link>
      </div>

      {/* Provider Info */}
      <Card className="mb-6">
        <CardContent className="py-4">
          <div className="flex items-center gap-4">
            <Avatar src={avatarUrl} alt={provider.profile.display_name} size="lg" />
            <div>
              <h2 className="font-semibold">{provider.profile.display_name}</h2>
              <p className="text-sm text-gray-600">{provider.headline}</p>
              <p className="text-sm text-gray-500">{provider.profile.email}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <form onSubmit={handleSubmit}>
        {error && (
          <div className="mb-4 p-3 rounded-lg bg-red-50 text-red-700 text-sm">{error}</div>
        )}
        {success && (
          <div className="mb-4 p-3 rounded-lg bg-green-50 text-green-700 text-sm">
            {t('saved')}
          </div>
        )}

        {/* Approval Status */}
        <Card className="mb-6">
          <CardHeader>
            <h3 className="font-semibold">Profile Approval</h3>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                id="is_approved"
                checked={formData.is_approved}
                onChange={(e) => setFormData({ ...formData, is_approved: e.target.checked })}
                className="w-4 h-4 rounded border-gray-300 text-green-600 focus:ring-green-500"
              />
              <label htmlFor="is_approved" className="text-sm font-medium">
                {formData.is_approved ? (
                  <Badge variant="success">Approved</Badge>
                ) : (
                  <Badge variant="warning">Pending Approval</Badge>
                )}
              </label>
            </div>
            <p className="text-sm text-gray-500">
              {formData.is_approved 
                ? 'This provider is visible in search and to all users.'
                : 'This provider is only visible to themselves and admins. Approve to make publicly visible.'}
            </p>
          </CardContent>
        </Card>

        {/* Verification */}
        <Card className="mb-6">
          <CardHeader>
            <h3 className="font-semibold">{t('verification')}</h3>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                id="is_verified"
                checked={formData.is_verified}
                onChange={(e) => setFormData({ ...formData, is_verified: e.target.checked })}
                className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <label htmlFor="is_verified" className="text-sm font-medium">
                {formData.is_verified ? (
                  <Badge variant="success">Verified</Badge>
                ) : (
                  'Not Verified'
                )}
              </label>
            </div>
            <Input
              label={t('badgeText')}
              placeholder="e.g., Top Rated"
              value={formData.verification_badge_text}
              onChange={(e) =>
                setFormData({ ...formData, verification_badge_text: e.target.value })
              }
              maxLength={100}
            />
          </CardContent>
        </Card>

        {/* Priority */}
        <Card className="mb-6">
          <CardHeader>
            <h3 className="font-semibold">{t('priority')}</h3>
          </CardHeader>
          <CardContent>
            <Input
              type="number"
              min={0}
              max={1000}
              value={formData.priority_score}
              onChange={(e) =>
                setFormData({ ...formData, priority_score: parseInt(e.target.value) || 0 })
              }
              helperText="Higher score = appears higher in search results (0-1000)"
            />
          </CardContent>
        </Card>

        {/* Featured */}
        <Card className="mb-6">
          <CardHeader>
            <h3 className="font-semibold">{t('featured')}</h3>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                id="featured"
                checked={formData.featured}
                onChange={(e) => setFormData({ ...formData, featured: e.target.checked })}
                className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <label htmlFor="featured" className="text-sm font-medium">
                {formData.featured ? (
                  <Badge variant="info">Featured</Badge>
                ) : (
                  'Not Featured'
                )}
              </label>
            </div>

            {formData.featured && (
              <>
                <Select
                  label={t('featuredCountry')}
                  options={countryOptions}
                  value={formData.featured_country_code}
                  onChange={(e) =>
                    setFormData({ ...formData, featured_country_code: e.target.value })
                  }
                />
                <Select
                  label={t('featuredLanguage')}
                  options={languageOptions}
                  value={formData.featured_language}
                  onChange={(e) =>
                    setFormData({ ...formData, featured_language: e.target.value })
                  }
                />
              </>
            )}
          </CardContent>
        </Card>

        <div className="flex gap-4">
          <Button type="submit" isLoading={isSaving}>
            Save Changes
          </Button>
          <Link href={`/p/${provider.user_id}`}>
            <Button type="button" variant="outline">
              View Profile
            </Button>
          </Link>
        </div>
      </form>
    </div>
  );
}
