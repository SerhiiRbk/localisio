// ============================================================
// Dynamic Sitemap Generator
// ============================================================

import { MetadataRoute } from 'next';
import { createClient } from '@/lib/supabase/server';
import { services } from '@/config/services';
import { countryCodes } from '@/config/countries';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  // Remove trailing slash from base URL to avoid double slashes
  const baseUrl = (process.env.NEXT_PUBLIC_APP_URL || 'https://localisio.com').replace(/\/$/, '');

  // Static pages
  const staticPages: MetadataRoute.Sitemap = [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 1,
    },
    {
      url: `${baseUrl}/experts`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.9,
    },
    {
      url: `${baseUrl}/auth/sign-in`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.5,
    },
    {
      url: `${baseUrl}/auth/sign-up`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.5,
    },
  ];

  // Expert search pages by service (short URLs)
  const servicePages: MetadataRoute.Sitemap = services.slice(0, 30).map((service) => ({
    url: `${baseUrl}/experts/${service.code}`,
    lastModified: new Date(),
    changeFrequency: 'weekly',
    priority: 0.8,
  }));

  // Expert search pages by country
  const countryPages: MetadataRoute.Sitemap = countryCodes.map((country) => ({
    url: `${baseUrl}/experts/all/all/${country.toLowerCase()}`,
    lastModified: new Date(),
    changeFrequency: 'weekly',
    priority: 0.7,
  }));

  // Dynamic provider pages
  const supabase = await createClient();
  const { data: providers } = await supabase
    .from('provider_profiles')
    .select('user_id, slug, country_code, updated_at')
    .order('updated_at', { ascending: false })
    .limit(1000);

  const providerPages: MetadataRoute.Sitemap = (providers || []).map((provider) => ({
    url: provider.slug && provider.country_code
      ? `${baseUrl}/${provider.country_code.toLowerCase()}/${provider.slug}`
      : `${baseUrl}/p/${provider.user_id}`,
    lastModified: new Date(provider.updated_at),
    changeFrequency: 'weekly',
    priority: 0.8,
  }));

  return [...staticPages, ...servicePages, ...countryPages, ...providerPages];
}
