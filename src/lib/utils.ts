// ============================================================
// Utility Functions
// ============================================================

import { type ClassValue, clsx } from 'clsx';

export function cn(...inputs: ClassValue[]) {
  return clsx(inputs);
}

export function getInitials(name: string): string {
  return name
    .split(' ')
    .map((part) => part[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

export function formatDate(date: string | Date, locale: string = 'en'): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleDateString(locale, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

export function formatTime(date: string | Date, locale: string = 'en'): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleTimeString(locale, {
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function formatRelativeTime(date: string | Date, locale: string = 'en'): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);
  
  if (diffMins < 1) return locale === 'ru' ? 'только что' : locale === 'uk' ? 'щойно' : locale === 'es' ? 'ahora' : 'just now';
  if (diffMins < 60) return `${diffMins}m`;
  if (diffHours < 24) return `${diffHours}h`;
  if (diffDays < 7) return `${diffDays}d`;
  
  return formatDate(d, locale);
}

export function getStorageUrl(path: string): string {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  return `${supabaseUrl}/storage/v1/object/public/provider-photos/${path}`;
}

export function extractYouTubeId(url: string): string | null {
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\n?#]+)/,
  ];
  
  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match) return match[1];
  }
  
  return null;
}

export function getYouTubeEmbedUrl(url: string): string | null {
  const videoId = extractYouTubeId(url);
  if (!videoId) return null;
  return `https://www.youtube.com/embed/${videoId}`;
}

export function truncate(str: string, length: number): string {
  if (str.length <= length) return str;
  return str.slice(0, length) + '...';
}

export function slugify(str: string): string {
  return str
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

/**
 * Generate a URL-safe slug from display name
 * Uses underscores instead of hyphens, max 50 chars
 */
export function generateSlug(displayName: string): string {
  return displayName
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '_')           // Replace spaces with underscore
    .replace(/[^a-z0-9_-]/g, '')    // Remove invalid URL chars
    .replace(/_+/g, '_')            // Remove duplicate underscores
    .replace(/^_|_$/g, '')          // Remove leading/trailing underscores
    .slice(0, 50);                   // Max 50 chars
}

/**
 * Get provider profile URL - uses SEO-friendly format if slug is available
 */
export function getProviderProfileUrl(provider: {
  user_id: string;
  slug?: string | null;
  country_code?: string;
}): string {
  if (provider.slug && provider.country_code) {
    return `/${provider.country_code.toLowerCase()}/${provider.slug}`;
  }
  return `/p/${provider.user_id}`;
}

/**
 * Expert search URL parameters
 */
export interface ExpertSearchParams {
  service?: string | null;
  language?: string | null;
  country?: string | null;
  city_place_id?: string | null;
  city_name?: string | null;
  sort?: string;
}

/**
 * Build SEO-friendly experts URL with minimal segments
 * Omits trailing 'all' values but keeps 'all' in middle when needed
 * 
 * Examples:
 * - {} → /experts
 * - {service: 'lawyer'} → /experts/lawyer
 * - {service: 'lawyer', language: 'en'} → /experts/lawyer/en
 * - {service: 'lawyer', language: 'en', country: 'es'} → /experts/lawyer/en/es
 * - {language: 'ru'} → /experts/all/ru
 * - {country: 'es'} → /experts/all/all/es
 * - {language: 'ru', country: 'es'} → /experts/all/ru/es
 */
export function buildExpertsUrl(params: ExpertSearchParams): string {
  const service = params.service || 'all';
  const language = params.language || 'all';
  const country = params.country?.toLowerCase() || 'all';
  
  // Build path segments, trimming trailing 'all' values
  const segments: string[] = ['experts'];
  
  // Determine how many segments we need (based on rightmost non-'all' value)
  if (country !== 'all') {
    // Need all 3 segments
    segments.push(service, language, country);
  } else if (language !== 'all') {
    // Need 2 segments
    segments.push(service, language);
  } else if (service !== 'all') {
    // Need 1 segment
    segments.push(service);
  }
  // If all are 'all', just /experts
  
  let url = '/' + segments.join('/');
  
  const queryParams = new URLSearchParams();
  if (params.city_place_id) queryParams.set('city_place_id', params.city_place_id);
  if (params.city_name) queryParams.set('city_name', params.city_name);
  if (params.sort && params.sort !== 'relevance') queryParams.set('sort', params.sort);
  
  const queryString = queryParams.toString();
  if (queryString) {
    url += `?${queryString}`;
  }
  
  return url;
}

/**
 * Parse experts URL parameters from route segments
 */
export function parseExpertsUrlParams(
  service: string,
  language: string,
  country: string
): { service: string | null; language: string | null; country: string | null } {
  return {
    service: service === 'all' ? null : service,
    language: language === 'all' ? null : language,
    country: country === 'all' ? null : country.toUpperCase(),
  };
}
