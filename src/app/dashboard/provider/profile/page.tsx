'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useTranslations, useLocale } from 'next-intl';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import { Select } from '@/components/ui/Select';
import { MultiSelect } from '@/components/ui/MultiSelect';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader } from '@/components/ui/Card';
import { CityAutocomplete, type CitySelection } from '@/components/ui/CityAutocomplete';
import { FAQEditor } from '@/components/ui/FAQEditor';
import { services, getServiceLabel } from '@/config/services';
import { languages, getLanguageLabel } from '@/config/languages';
import { countries, getCountryLabel } from '@/config/countries';
import { createClient } from '@/lib/supabase/client';
import { generateSlug } from '@/lib/utils';
import type { ProviderProfile, FAQItem, SocialLinks } from '@/types/database';

export default function EditProviderProfilePage() {
  const t = useTranslations('profile.edit');
  const locale = useLocale();
  const router = useRouter();

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');
  const [warning, setWarning] = useState('');
  const [success, setSuccess] = useState(false);
  const [photoCount, setPhotoCount] = useState(0);

  const [profile, setProfile] = useState<Partial<ProviderProfile>>({
    headline: '',
    bio: '',
    experience_years: 0,
    country_code: '',
    city: '',
    slug: null,
    city_place_id: null,
    city_display_name: null,
    city_name_normalized: null,
    lat: null,
    lon: null,
    faq: [],
    social_links: {},
    languages: [],
    services: [],
    youtube_url: '',
  });
  
  // Store display name for slug generation
  const [displayName, setDisplayName] = useState('');

  // City selection state (for CityAutocomplete)
  const [selectedCity, setSelectedCity] = useState<CitySelection | null>(null);

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

      // Get display name from profiles table
      const { data: profileData } = await supabase
        .from('profiles')
        .select('display_name')
        .eq('id', user.id)
        .single();
      
      if (profileData?.display_name) {
        setDisplayName(profileData.display_name);
      }

      if (data) {
        setProfile({
          headline: data.headline || '',
          bio: data.bio || '',
          experience_years: data.experience_years || 0,
          country_code: data.country_code || '',
          city: data.city || '',
          slug: data.slug || null,
          city_place_id: data.city_place_id || null,
          city_display_name: data.city_display_name || null,
          city_name_normalized: data.city_name_normalized || null,
          lat: data.lat || null,
          lon: data.lon || null,
          faq: data.faq || [],
          social_links: data.social_links || {},
          languages: data.languages || [],
          services: data.services || [],
          youtube_url: data.youtube_url || '',
        });

        // Reconstruct selectedCity from saved geocoded data
        if (data.city_place_id && data.city && data.country_code) {
          setSelectedCity({
            place_id: data.city_place_id,
            display_name: data.city_display_name || data.city,
            city_name: data.city,
            country_code: data.country_code,
            country_name: '', // Will be filled from countries config
            lat: data.lat || 0,
            lon: data.lon || 0,
          });
        }
      }

      // Get photo count
      const { count } = await supabase
        .from('provider_photos')
        .select('*', { count: 'exact', head: true })
        .eq('provider_user_id', user.id);
      
      setPhotoCount(count || 0);
      setIsLoading(false);
    }
    loadProfile();
  }, [router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setWarning('');
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

      const data = await response.json();

      if (!response.ok) {
        console.error('API Error:', data);
        throw new Error(data.details || data.error || 'Failed to update profile');
      }

      // Check if there was a warning about URLs being removed
      if (data.warning) {
        setWarning(data.warning);
        // Also update the local state with the cleaned data
        if (data.provider) {
          setProfile(prev => ({
            ...prev,
            headline: data.provider.headline || '',
            bio: data.provider.bio || '',
            faq: data.provider.faq || [],
          }));
        }
      }

      setSuccess(true);
      setTimeout(() => {
        setSuccess(false);
        // Don't clear warning automatically - let user see it
      }, 3000);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to save profile. Please try again.';
      setError(message);
      console.error('Save error:', err);
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
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-slate-200 rounded w-1/3"></div>
          <div className="h-12 bg-slate-200 rounded"></div>
          <div className="h-32 bg-slate-200 rounded"></div>
          <div className="h-32 bg-slate-200 rounded"></div>
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
          className="px-4 py-3 text-blue-600 font-medium border-b-2 border-blue-600"
        >
          Profile Info
        </Link>
        <Link
          href="/dashboard/provider/photos"
          className="px-4 py-3 text-slate-600 hover:text-slate-900 font-medium border-b-2 border-transparent hover:border-slate-300 transition-colors"
        >
          Photos ({photoCount}/5)
        </Link>
      </div>

      <form onSubmit={handleSubmit}>
        {error && (
          <div className="mb-6 p-4 rounded-xl bg-red-50 text-red-700 border border-red-200">
            {error}
          </div>
        )}
        {warning && (
          <div className="mb-6 p-4 rounded-xl bg-amber-50 text-amber-700 border border-amber-200 flex items-start gap-3">
            <svg className="w-5 h-5 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
            <div>
              <p className="font-medium">Profile saved with modifications</p>
              <p className="text-sm mt-1">{warning}</p>
            </div>
            <button
              type="button"
              onClick={() => setWarning('')}
              className="ml-auto text-amber-500 hover:text-amber-700"
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            </button>
          </div>
        )}
        {success && (
          <div className="mb-6 p-4 rounded-xl bg-green-50 text-green-700 border border-green-200">
            Profile saved successfully!
          </div>
        )}

        <Card className="mb-6">
          <CardHeader>
            <h2 className="text-lg font-semibold">Basic Information</h2>
          </CardHeader>
          <CardContent className="space-y-4">
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
            <h2 className="text-lg font-semibold">Location</h2>
          </CardHeader>
          <CardContent className="space-y-4">
            <Select
              label={t('country')}
              options={[{ value: '', label: '-- Select country --' }, ...countryOptions]}
              value={profile.country_code || ''}
              onChange={(e) => {
                const newCountryCode = e.target.value;
                // Clear city selection when country changes
                if (newCountryCode !== profile.country_code) {
                  setSelectedCity(null);
                  setProfile({ 
                    ...profile, 
                    country_code: newCountryCode,
                    city: '',
                    city_place_id: null,
                    city_display_name: null,
                    city_name_normalized: null,
                    lat: null,
                    lon: null,
                  });
                } else {
                  setProfile({ ...profile, country_code: newCountryCode });
                }
              }}
            />

            <CityAutocomplete
              label={t('city')}
              placeholder={t('cityPlaceholder') || 'Start typing city name...'}
              value={selectedCity}
              countryCode={profile.country_code || undefined}
              onChange={(city) => {
                setSelectedCity(city);
                if (city) {
                  setProfile({
                    ...profile,
                    city: city.city_name,
                    city_place_id: city.place_id,
                    city_display_name: city.display_name,
                    city_name_normalized: city.city_name.toLowerCase(),
                    lat: city.lat,
                    lon: city.lon,
                    // Also update country_code if it was empty or different
                    country_code: city.country_code || profile.country_code,
                  });
                } else {
                  setProfile({
                    ...profile,
                    city: '',
                    city_place_id: null,
                    city_display_name: null,
                    city_name_normalized: null,
                    lat: null,
                    lon: null,
                  });
                }
              }}
              helperText="Start typing to search for your city"
            />
          </CardContent>
        </Card>

        {/* SEO Slug */}
        <Card className="mb-6">
          <CardHeader>
            <h2 className="text-lg font-semibold">{t('slug.title') || 'Profile URL (SEO)'}</h2>
            <p className="text-sm text-slate-500 mt-1">
              {t('slug.description') || 'Create a custom URL for your profile. This helps with search engine visibility.'}
            </p>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-3 items-end">
              <div className="flex-1">
                <Input
                  label={t('slug.label') || 'Profile Slug'}
                  placeholder={t('slug.placeholder') || 'john_doe'}
                  value={profile.slug || ''}
                  onChange={(e) => setProfile({ ...profile, slug: e.target.value || null })}
                  maxLength={50}
                />
              </div>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  if (displayName) {
                    setProfile({ ...profile, slug: generateSlug(displayName) });
                  }
                }}
                disabled={!displayName}
              >
                {t('slug.generate') || 'Generate'}
              </Button>
            </div>
            {profile.slug && profile.country_code && (
              <p className="text-sm text-slate-500">
                {t('slug.preview') || 'Your profile URL'}:{' '}
                <span className="font-mono text-blue-600">
                  {`${process.env.NEXT_PUBLIC_APP_URL || ''}/${profile.country_code.toLowerCase()}/${profile.slug}`}
                </span>
              </p>
            )}
            <p className="text-xs text-slate-400">
              {t('slug.rules') || 'Only lowercase letters, numbers, underscores and hyphens allowed. Max 50 characters.'}
            </p>
          </CardContent>
        </Card>

        <Card className="mb-6">
          <CardHeader>
            <h2 className="text-lg font-semibold">Services & Languages</h2>
          </CardHeader>
          <CardContent className="space-y-4">
            <MultiSelect
              label={t('services')}
              options={serviceOptions}
              value={profile.services || []}
              onChange={(value) => setProfile({ ...profile, services: value })}
              maxItems={5}
              placeholder="Select up to 5 services..."
            />

            <MultiSelect
              label={t('languages')}
              options={languageOptions}
              value={profile.languages || []}
              onChange={(value) => setProfile({ ...profile, languages: value })}
              maxItems={10}
              placeholder="Select languages you speak..."
            />
          </CardContent>
        </Card>

        <Card className="mb-6">
          <CardHeader>
            <h2 className="text-lg font-semibold">{t('faq')}</h2>
          </CardHeader>
          <CardContent>
            <FAQEditor
              value={(profile.faq as FAQItem[]) || []}
              onChange={(faq) => setProfile({ ...profile, faq })}
            />
          </CardContent>
        </Card>

        <Card className="mb-6">
          <CardHeader>
            <h2 className="text-lg font-semibold">Media</h2>
          </CardHeader>
          <CardContent>
            <Input
              label={t('youtube')}
              placeholder={t('youtubePlaceholder')}
              value={profile.youtube_url || ''}
              onChange={(e) => setProfile({ ...profile, youtube_url: e.target.value || null })}
            />
            <p className="text-sm text-slate-500 mt-2">
              Add a YouTube video to introduce yourself to potential clients
            </p>
          </CardContent>
        </Card>

        <Card className="mb-6">
          <CardHeader>
            <h2 className="text-lg font-semibold">{t('socialLinks')}</h2>
            <p className="text-sm text-slate-500 mt-1">{t('socialLinksDescription')}</p>
          </CardHeader>
          <CardContent className="space-y-4">
            <Input
              label="Facebook"
              placeholder="https://facebook.com/yourprofile"
              value={(profile.social_links as SocialLinks)?.facebook_url || ''}
              onChange={(e) => setProfile({
                ...profile,
                social_links: {
                  ...(profile.social_links as SocialLinks),
                  facebook_url: e.target.value || null,
                },
              })}
            />
            <Input
              label="Instagram"
              placeholder="https://instagram.com/yourprofile"
              value={(profile.social_links as SocialLinks)?.instagram_url || ''}
              onChange={(e) => setProfile({
                ...profile,
                social_links: {
                  ...(profile.social_links as SocialLinks),
                  instagram_url: e.target.value || null,
                },
              })}
            />
            <Input
              label="LinkedIn"
              placeholder="https://linkedin.com/in/yourprofile"
              value={(profile.social_links as SocialLinks)?.linkedin_url || ''}
              onChange={(e) => setProfile({
                ...profile,
                social_links: {
                  ...(profile.social_links as SocialLinks),
                  linkedin_url: e.target.value || null,
                },
              })}
            />
            <div className="flex items-start gap-2 p-3 bg-amber-50 rounded-lg border border-amber-200">
              <svg className="w-5 h-5 text-amber-600 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m0 0v2m0-2h2m-2 0H9m3-10V7a4 4 0 00-8 0v4m0 0h12m-12 0a2 2 0 00-2 2v6a2 2 0 002 2h12a2 2 0 002-2v-6a2 2 0 00-2-2" />
              </svg>
              <p className="text-sm text-amber-800">
                {t('socialLinksPrivacyNote')}
              </p>
            </div>
          </CardContent>
        </Card>

        <div className="flex gap-4">
          <Button type="submit" isLoading={isSaving} className="px-8">
            Save Changes
          </Button>
          <Link href="/dashboard">
            <Button type="button" variant="outline">
              Back to Dashboard
            </Button>
          </Link>
        </div>
      </form>
    </div>
  );
}
