import { Suspense } from 'react';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { getTranslations, getLocale } from 'next-intl/server';
import { ExpertsContent } from './ExpertsContent';
import { getServiceLabel, services as servicesList } from '@/config/services';
import { getLanguageLabel, languages as languagesList } from '@/config/languages';
import { getCountryLabel, countryCodes } from '@/config/countries';
import { parseExpertsUrlParams } from '@/lib/utils';

interface Props {
  params: Promise<{
    params?: string[];
  }>;
  searchParams: Promise<{
    city_place_id?: string;
    city_name?: string;
    sort?: string;
  }>;
}

/**
 * Parse URL segments into service, language, country
 * Supports:
 * - /experts → all/all/all
 * - /experts/lawyer → lawyer/all/all
 * - /experts/lawyer/en → lawyer/en/all
 * - /experts/lawyer/en/es → lawyer/en/es
 */
function parseUrlSegments(segments?: string[]): { service: string; language: string; country: string } {
  if (!segments || segments.length === 0) {
    return { service: 'all', language: 'all', country: 'all' };
  }
  
  const [service = 'all', language = 'all', country = 'all'] = segments;
  
  return {
    service: service || 'all',
    language: language || 'all',
    country: country || 'all',
  };
}

// Generate static paths for popular combinations
export async function generateStaticParams() {
  const params: { params: string[] }[] = [];
  
  // Root /experts
  params.push({ params: [] });
  
  // All combinations
  params.push({ params: ['all'] });
  params.push({ params: ['all', 'all'] });
  params.push({ params: ['all', 'all', 'all'] });
  
  // Popular services
  const popularServices = ['lawyer', 'accountant', 'doctor', 'translator', 'realtor'];
  popularServices.forEach(service => {
    params.push({ params: [service] });
    params.push({ params: [service, 'all'] });
    params.push({ params: [service, 'all', 'all'] });
  });
  
  // Countries
  countryCodes.forEach(country => {
    params.push({ params: ['all', 'all', country.toLowerCase()] });
  });
  
  return params;
}

// Generate metadata for SEO
export async function generateMetadata({ params, searchParams }: Props): Promise<Metadata> {
  const { params: segments } = await params;
  const query = await searchParams;
  const locale = await getLocale();
  const t = await getTranslations('experts');
  
  const { service, language, country } = parseUrlSegments(segments);
  const parsedParams = parseExpertsUrlParams(service, language, country);
  
  // Build title
  let titleParts: string[] = [];
  
  if (parsedParams.service) {
    const serviceLabel = getServiceLabel(parsedParams.service, locale);
    titleParts.push(serviceLabel);
  }
  
  if (parsedParams.language) {
    const langLabel = getLanguageLabel(parsedParams.language, locale);
    titleParts.push(langLabel);
  }
  
  if (parsedParams.country) {
    const countryLabel = getCountryLabel(parsedParams.country, locale);
    titleParts.push(countryLabel);
  }
  
  if (query.city_name) {
    titleParts.push(query.city_name);
  }
  
  const baseTitle = t('pageTitle');
  const title = titleParts.length > 0 
    ? `${titleParts.join(' - ')} | ${baseTitle}`
    : baseTitle;
  
  // Build description
  let description = t('pageDescription');
  if (parsedParams.service) {
    description = t('pageDescriptionWithService', { 
      service: getServiceLabel(parsedParams.service, locale) 
    });
  }
  if (parsedParams.country) {
    description = t('pageDescriptionWithCountry', { 
      country: getCountryLabel(parsedParams.country, locale),
      service: parsedParams.service ? getServiceLabel(parsedParams.service, locale) : t('experts')
    });
  }
  
  // Build canonical URL - always use full format for canonical
  const baseUrl = (process.env.NEXT_PUBLIC_APP_URL || 'https://localisio.com').replace(/\/$/, '');
  const canonicalUrl = `${baseUrl}/experts/${service}/${language}/${country}`;
  
  return {
    title,
    description,
    alternates: {
      canonical: canonicalUrl,
    },
    openGraph: {
      title,
      description,
      url: canonicalUrl,
      type: 'website',
      siteName: 'Localisio',
    },
    twitter: {
      card: 'summary',
      title,
      description,
    },
    robots: {
      index: true,
      follow: true,
    },
  };
}

// Validate route parameters
function validateParams(service: string, language: string, country: string): boolean {
  // 'all' is always valid
  if (service !== 'all') {
    const validService = servicesList.some(s => s.code === service);
    if (!validService) return false;
  }
  
  if (language !== 'all') {
    const validLanguage = languagesList.some(l => l.code === language);
    if (!validLanguage) return false;
  }
  
  if (country !== 'all') {
    const validCountry = countryCodes.includes(country.toUpperCase());
    if (!validCountry) return false;
  }
  
  return true;
}

export default async function ExpertsPage({ params, searchParams }: Props) {
  const { params: segments } = await params;
  const query = await searchParams;
  
  // Parse URL segments
  const { service, language, country } = parseUrlSegments(segments);
  
  // Validate parameters
  if (!validateParams(service, language, country)) {
    notFound();
  }
  
  const parsedParams = parseExpertsUrlParams(service, language, country);
  
  return (
    <Suspense fallback={
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="animate-pulse space-y-4">
          <div className="h-10 bg-slate-200 rounded w-1/4"></div>
          <div className="h-16 bg-slate-200 rounded"></div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="h-40 bg-slate-200 rounded-xl"></div>
            ))}
          </div>
        </div>
      </div>
    }>
      <ExpertsContent
        initialService={parsedParams.service}
        initialLanguage={parsedParams.language}
        initialCountry={parsedParams.country}
        initialCityPlaceId={query.city_place_id}
        initialCityName={query.city_name}
        initialSort={query.sort || 'relevance'}
      />
    </Suspense>
  );
}
