// ============================================================
// Dynamic Sitemap Generator
// ============================================================

import { MetadataRoute } from 'next';
import { createClient } from '@/lib/supabase/server';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://localisio.com';

  // Static pages
  const staticPages: MetadataRoute.Sitemap = [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 1,
    },
    {
      url: `${baseUrl}/search`,
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

  // Dynamic provider pages
  const supabase = await createClient();
  const { data: providers } = await supabase
    .from('provider_profiles')
    .select('user_id, updated_at')
    .order('updated_at', { ascending: false })
    .limit(1000);

  const providerPages: MetadataRoute.Sitemap = (providers || []).map((provider) => ({
    url: `${baseUrl}/p/${provider.user_id}`,
    lastModified: new Date(provider.updated_at),
    changeFrequency: 'weekly',
    priority: 0.8,
  }));

  return [...staticPages, ...providerPages];
}
