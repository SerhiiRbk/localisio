// ============================================================
// Robots.txt Generator
// ============================================================

import { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  // Remove trailing slash from base URL to avoid double slashes
  const baseUrl = (process.env.NEXT_PUBLIC_APP_URL || 'https://localisio.com').replace(/\/$/, '');

  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/dashboard/', '/admin/', '/api/'],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
