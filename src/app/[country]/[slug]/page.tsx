import { notFound, redirect } from 'next/navigation';
import { getTranslations, getLocale } from 'next-intl/server';
import Link from 'next/link';
import Image from 'next/image';
import type { Metadata } from 'next';
import { createClient } from '@/lib/supabase/server';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Card, CardContent } from '@/components/ui/Card';
import { Avatar } from '@/components/ui/Avatar';
import { StarRating } from '@/components/ui/StarRating';
import { getServiceLabel } from '@/config/services';
import { getLanguageLabel, languagesByCode } from '@/config/languages';
import { getCountryLabel, getCountryFlag, countryCodes } from '@/config/countries';
import { getStorageUrl, getYouTubeEmbedUrl } from '@/lib/utils';
import type { ProviderWithProfile, ReviewWithReviewer } from '@/types/database';
import { ReviewSection } from '@/components/reviews/ReviewSection';
import { FAQDisplay } from '@/components/ui/FAQDisplay';
import { MarkdownRenderer } from '@/components/ui/MarkdownRenderer';

interface Props {
  params: Promise<{ country: string; slug: string }>;
}

/**
 * Get user activity status based on last_seen_at
 */
function getActivityStatus(lastSeenAt: string | null): 'today' | 'this_week' | 'this_month' | null {
  if (!lastSeenAt) return null;
  
  const lastSeen = new Date(lastSeenAt);
  const now = new Date();
  const diffMs = now.getTime() - lastSeen.getTime();
  const diffDays = diffMs / (1000 * 60 * 60 * 24);
  
  if (diffDays < 1) return 'today';
  if (diffDays < 7) return 'this_week';
  if (diffDays < 30) return 'this_month';
  return null;
}

async function getProviderBySlug(countryCode: string, slug: string): Promise<ProviderWithProfile | null> {
  const supabase = await createClient();
  
  const { data, error } = await supabase
    .from('provider_profiles')
    .select(`
      *,
      profile:profiles!inner(*),
      photos:provider_photos(*)
    `)
    .eq('country_code', countryCode.toUpperCase())
    .eq('slug', slug.toLowerCase())
    .single();

  if (error || !data) return null;
  return data as ProviderWithProfile;
}

async function getApprovedReviews(providerId: string): Promise<ReviewWithReviewer[]> {
  const supabase = await createClient();
  
  const { data } = await supabase
    .from('reviews')
    .select(`
      *,
      reviewer:profiles!reviewer_user_id(id, display_name, avatar_url)
    `)
    .eq('provider_user_id', providerId)
    .eq('is_approved', true)
    .order('created_at', { ascending: false });

  return (data || []) as ReviewWithReviewer[];
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { country, slug } = await params;
  
  // Validate country code
  if (!countryCodes.includes(country.toUpperCase() as typeof countryCodes[number])) {
    return { title: 'Not Found' };
  }

  const provider = await getProviderBySlug(country, slug);
  
  if (!provider) {
    return { title: 'Provider Not Found' };
  }

  const primaryPhoto = provider.photos?.find((p) => p.is_primary) || provider.photos?.[0];
  const imageUrl = primaryPhoto ? getStorageUrl(primaryPhoto.storage_path) : null;
  const baseUrl = (process.env.NEXT_PUBLIC_APP_URL || 'https://localisio.com').replace(/\/$/, '');
  const canonicalUrl = `${baseUrl}/${country.toLowerCase()}/${slug}`;

  return {
    title: `${provider.profile.display_name} - ${provider.headline || 'Specialist'} | Localisio`,
    description: provider.bio?.slice(0, 160) || `Find ${provider.profile.display_name} on Localisio - verified specialist in ${getCountryLabel(provider.country_code, 'en')}`,
    alternates: {
      canonical: canonicalUrl,
    },
    openGraph: {
      title: `${provider.profile.display_name} - ${provider.headline || 'Specialist'}`,
      description: provider.bio?.slice(0, 160) || `Find ${provider.profile.display_name} on Localisio`,
      url: canonicalUrl,
      siteName: 'Localisio',
      images: imageUrl ? [{ url: imageUrl, width: 1200, height: 630 }] : [],
      type: 'profile',
      locale: 'en_US',
    },
    twitter: {
      card: 'summary_large_image',
      title: `${provider.profile.display_name} - ${provider.headline || 'Specialist'}`,
      description: provider.bio?.slice(0, 160) || `Find ${provider.profile.display_name} on Localisio`,
      images: imageUrl ? [imageUrl] : [],
    },
    robots: {
      index: true,
      follow: true,
    },
  };
}

export default async function ProviderSlugPage({ params }: Props) {
  const { country, slug } = await params;
  
  // Validate country code
  if (!countryCodes.includes(country.toUpperCase() as typeof countryCodes[number])) {
    notFound();
  }

  const provider = await getProviderBySlug(country, slug);

  if (!provider) {
    notFound();
  }

  const t = await getTranslations('provider.profile');
  const locale = await getLocale();
  
  // Check if current user is viewing their own profile or is admin
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const isOwnProfile = user?.id === provider.user_id;
  
  // Check if user is admin
  let isAdmin = false;
  if (user) {
    const { data: adminRole } = await supabase
      .from('admin_roles')
      .select('role')
      .eq('user_id', user.id)
      .single();
    isAdmin = !!adminRole;
  }
  
  // If provider is not approved, only show to owner or admin
  if (!provider.is_approved && !isOwnProfile && !isAdmin) {
    notFound();
  }
  
  const reviews = await getApprovedReviews(provider.user_id);

  const primaryPhoto = provider.photos?.find((p) => p.is_primary) || provider.photos?.[0];
  const avatarUrl = primaryPhoto ? getStorageUrl(primaryPhoto.storage_path) : provider.profile.avatar_url;
  const youtubeEmbed = provider.youtube_url ? getYouTubeEmbedUrl(provider.youtube_url) : null;
  const baseUrl = (process.env.NEXT_PUBLIC_APP_URL || 'https://localisio.com').replace(/\/$/, '');
  const canonicalUrl = `${baseUrl}/${country.toLowerCase()}/${slug}`;

  // JSON-LD structured data with rating
  const structuredData = {
    '@context': 'https://schema.org',
    '@type': 'ProfessionalService',
    name: provider.profile.display_name,
    description: provider.bio,
    image: avatarUrl,
    url: canonicalUrl,
    address: {
      '@type': 'PostalAddress',
      addressCountry: provider.country_code,
      addressLocality: provider.city,
    },
    areaServed: {
      '@type': 'Country',
      name: getCountryLabel(provider.country_code, 'en'),
    },
    availableLanguage: provider.languages.map((lang) => ({
      '@type': 'Language',
      name: getLanguageLabel(lang, 'en'),
    })),
    ...(provider.average_rating > 0 && {
      aggregateRating: {
        '@type': 'AggregateRating',
        ratingValue: provider.average_rating,
        reviewCount: provider.review_count,
        bestRating: 5,
        worstRating: 1,
      },
    }),
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Approval Status Banner */}
        {!provider.is_approved && (isOwnProfile || isAdmin) && (
          <div className="mb-6 p-4 rounded-xl bg-amber-50 border border-amber-200">
            <div className="flex items-center gap-3">
              <div className="flex-shrink-0">
                <svg className="w-6 h-6 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-amber-800">{t('pendingApproval')}</h3>
                <p className="text-sm text-amber-700">{t('pendingApprovalDescription')}</p>
              </div>
              {isAdmin && (
                <Link href={`/admin/providers/${provider.user_id}`}>
                  <Button size="sm" variant="outline" className="border-amber-400 text-amber-700 hover:bg-amber-100">
                    {t('reviewProfile')}
                  </Button>
                </Link>
              )}
            </div>
          </div>
        )}

        {/* Header */}
        <Card className="mb-6">
          <CardContent className="pt-6">
            <div className="flex flex-col md:flex-row gap-6">
              <Avatar src={avatarUrl} alt={provider.profile.display_name} size="xl" className="w-24 h-24" />
              <div className="flex-1">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h1 className="text-2xl font-bold text-slate-900">
                      {provider.profile.display_name}
                    </h1>
                    {provider.headline && (
                      <p className="text-lg text-slate-600 mt-1">{provider.headline}</p>
                    )}
                  </div>
                  {provider.is_verified && (
                    <Badge variant="success" size="md">
                      <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                        <path
                          fillRule="evenodd"
                          d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                          clipRule="evenodd"
                        />
                      </svg>
                      {t('verified')}
                    </Badge>
                  )}
                </div>

                {/* Rating */}
                {(provider.average_rating > 0 || provider.review_count > 0) && (
                  <div className="mt-3">
                    <StarRating 
                      rating={provider.average_rating || 0} 
                      size="md" 
                      showCount 
                      count={provider.review_count || 0} 
                    />
                  </div>
                )}

                <div className="mt-4 flex flex-wrap gap-4 text-slate-600">
                  {provider.country_code && (
                    <div className="flex items-center gap-1">
                      <span>{getCountryFlag(provider.country_code)}</span>
                      <span>
                        {getCountryLabel(provider.country_code, locale)}
                        {provider.city && `, ${provider.city}`}
                      </span>
                    </div>
                  )}
                  {provider.experience_years > 0 && (
                    <div>
                      {t('yearsOfExperience', { years: provider.experience_years })}
                    </div>
                  )}
                  {(() => {
                    const activityStatus = getActivityStatus(provider.profile.last_seen_at);
                    if (!activityStatus) return null;
                    return (
                      <div className="flex items-center gap-1 text-green-600">
                        <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                        <span>{t(`activity.${activityStatus}`)}</span>
                      </div>
                    );
                  })()}
                </div>

                <div className="mt-4">
                  {isOwnProfile ? (
                    <Link href="/dashboard/messages">
                      <Button variant="outline">{t('myMessages')}</Button>
                    </Link>
                  ) : (
                    <Link href={`/dashboard/messages?provider=${provider.user_id}`}>
                      <Button>{t('sendMessage')}</Button>
                    </Link>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Photos */}
        {provider.photos && provider.photos.length > 1 && (
          <Card className="mb-6">
            <CardContent className="pt-6">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {provider.photos
                  .sort((a, b) => a.sort_order - b.sort_order)
                  .map((photo) => (
                    <div key={photo.id} className="relative aspect-square rounded-lg overflow-hidden">
                      <Image
                        src={getStorageUrl(photo.storage_path)}
                        alt={provider.profile.display_name}
                        fill
                        className="object-cover"
                      />
                    </div>
                  ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* About */}
        {provider.bio && (
          <Card className="mb-6">
            <CardContent className="pt-6">
              <h2 className="text-lg font-semibold mb-3">{t('about')}</h2>
              <MarkdownRenderer content={provider.bio} />
            </CardContent>
          </Card>
        )}

        {/* Services */}
        {provider.services && provider.services.length > 0 && (
          <Card className="mb-6">
            <CardContent className="pt-6">
              <h2 className="text-lg font-semibold mb-3">{t('services')}</h2>
              <div className="flex flex-wrap gap-2">
                {provider.services.map((service) => (
                  <Badge key={service} variant="info">
                    {getServiceLabel(service, locale)}
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Languages */}
        {provider.languages && provider.languages.length > 0 && (
          <Card className="mb-6">
            <CardContent className="pt-6">
              <h2 className="text-lg font-semibold mb-3">{t('languages')}</h2>
              <div className="flex flex-wrap gap-2">
                {provider.languages.map((lang) => {
                  const langData = languagesByCode[lang];
                  return (
                    <Badge key={lang} variant="default">
                      {langData?.flag} {getLanguageLabel(lang, locale)}
                    </Badge>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        )}

        {/* FAQ Section */}
        {provider.faq && provider.faq.length > 0 && (
          <Card className="mb-6">
            <CardContent className="pt-6">
              <FAQDisplay items={provider.faq} title={t('faq')} />
            </CardContent>
          </Card>
        )}

        {/* YouTube Video */}
        {youtubeEmbed && (
          <Card className="mb-6">
            <CardContent className="pt-6">
              <h2 className="text-lg font-semibold mb-3">{t('watchVideo')}</h2>
              <div className="aspect-video rounded-lg overflow-hidden">
                <iframe
                  src={youtubeEmbed}
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                  className="w-full h-full"
                />
              </div>
            </CardContent>
          </Card>
        )}

        {/* Reviews */}
        <ReviewSection 
          providerId={provider.user_id} 
          initialReviews={reviews}
          averageRating={provider.average_rating || 0}
          reviewCount={provider.review_count || 0}
        />
      </div>
    </>
  );
}
