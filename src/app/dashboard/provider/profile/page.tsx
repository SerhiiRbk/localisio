'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations, useLocale } from 'next-intl';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import { Select } from '@/components/ui/Select';
import { MultiSelect } from '@/components/ui/MultiSelect';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader } from '@/components/ui/Card';
import { services, getServiceLabel } from '@/config/services';
import { languages, getLanguageLabel } from '@/config/languages';
import { countries, getCountryLabel } from '@/config/countries';
import { createClient } from '@/lib/supabase/client';
import type { ProviderProfile } from '@/types/database';

export default function EditProviderProfilePage() {
  const t = useTranslations('profile.edit');
  const locale = useLocale();
  const router = useRouter();

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const [profile, setProfile] = useState<Partial<ProviderProfile>>({
    headline: '',
    bio: '',
    experience_years: 0,
    country_code: '',
    city: '',
    languages: [],
    services: [],
    youtube_url: '',
  });

  useEffect(() => {
    async function loadProfile() {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        router.push('/auth/sign-in');
        return;
      }

      const { data } = await supabase
        .from('provider_profiles')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (data) {
        setProfile({
          headline: data.headline || '',
          bio: data.bio || '',
          experience_years: data.experience_years || 0,
          country_code: data.country_code || '',
          city: data.city || '',
          languages: data.languages || [],
          services: data.services || [],
          youtube_url: data.youtube_url || '',
        });
      }
      setIsLoading(false);
    }
    loadProfile();
  }, [router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess(false);
    setIsSaving(true);

    try {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        router.push('/auth/sign-in');
        return;
      }

      const response = await fetch(`/api/providers/${user.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(profile),
      });

      if (!response.ok) {
        throw new Error('Failed to update profile');
      }

      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch {
      setError('Failed to save profile. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const serviceOptions = services.map((s) => ({
    value: s.code,
    label: getServiceLabel(s.code, locale),
  }));

  const languageOptions = languages.map((l) => ({
    value: l.code,
    label: `${l.flag || ''} ${getLanguageLabel(l.code, locale)}`.trim(),
  }));

  const countryOptions = countries.map((c) => ({
    value: c.code,
    label: `${c.flag} ${getCountryLabel(c.code, locale)}`,
  }));

  if (isLoading) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-8">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/3"></div>
          <div className="h-32 bg-gray-200 rounded"></div>
          <div className="h-32 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">{t('title')}</h1>

      <form onSubmit={handleSubmit}>
        <Card className="mb-6">
          <CardHeader>
            <h2 className="font-semibold">Basic Information</h2>
          </CardHeader>
          <CardContent className="space-y-4">
            {error && (
              <div className="p-3 rounded-lg bg-red-50 text-red-700 text-sm">{error}</div>
            )}
            {success && (
              <div className="p-3 rounded-lg bg-green-50 text-green-700 text-sm">{t('saved')}</div>
            )}

            <Input
              label={t('headline')}
              placeholder={t('headlinePlaceholder')}
              value={profile.headline || ''}
              onChange={(e) => setProfile({ ...profile, headline: e.target.value })}
              maxLength={200}
            />

            <Textarea
              label={t('bio')}
              placeholder={t('bioPlaceholder')}
              value={profile.bio || ''}
              onChange={(e) => setProfile({ ...profile, bio: e.target.value })}
              rows={5}
              maxLength={2000}
            />

            <Input
              label={t('experience')}
              type="number"
              min={0}
              max={100}
              value={profile.experience_years || 0}
              onChange={(e) =>
                setProfile({ ...profile, experience_years: parseInt(e.target.value) || 0 })
              }
            />
          </CardContent>
        </Card>

        <Card className="mb-6">
          <CardHeader>
            <h2 className="font-semibold">Location</h2>
          </CardHeader>
          <CardContent className="space-y-4">
            <Select
              label={t('country')}
              options={[{ value: '', label: '-- Select --' }, ...countryOptions]}
              value={profile.country_code || ''}
              onChange={(e) => setProfile({ ...profile, country_code: e.target.value })}
            />

            <Input
              label={t('city')}
              placeholder={t('cityPlaceholder')}
              value={profile.city || ''}
              onChange={(e) => setProfile({ ...profile, city: e.target.value })}
              maxLength={100}
            />
          </CardContent>
        </Card>

        <Card className="mb-6">
          <CardHeader>
            <h2 className="font-semibold">Services & Languages</h2>
          </CardHeader>
          <CardContent className="space-y-4">
            <MultiSelect
              label={t('services')}
              options={serviceOptions}
              value={profile.services || []}
              onChange={(value) => setProfile({ ...profile, services: value })}
              maxItems={5}
              placeholder="Select services..."
            />

            <MultiSelect
              label={t('languages')}
              options={languageOptions}
              value={profile.languages || []}
              onChange={(value) => setProfile({ ...profile, languages: value })}
              maxItems={10}
              placeholder="Select languages..."
            />
          </CardContent>
        </Card>

        <Card className="mb-6">
          <CardHeader>
            <h2 className="font-semibold">Media</h2>
          </CardHeader>
          <CardContent>
            <Input
              label={t('youtube')}
              placeholder={t('youtubePlaceholder')}
              value={profile.youtube_url || ''}
              onChange={(e) => setProfile({ ...profile, youtube_url: e.target.value || null })}
            />
          </CardContent>
        </Card>

        <div className="flex gap-4">
          <Button type="submit" isLoading={isSaving}>
            {t('title').includes('Edit') ? 'Save Changes' : 'Save'}
          </Button>
          <Button type="button" variant="outline" onClick={() => router.back()}>
            Cancel
          </Button>
        </div>
      </form>
    </div>
  );
}
