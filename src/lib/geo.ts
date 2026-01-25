// ============================================================
// Geo Detection Utilities
// ============================================================

import { headers } from 'next/headers';

export interface GeoInfo {
  country: string | null;
  city: string | null;
}

export async function getGeoFromHeaders(): Promise<GeoInfo> {
  const headersList = await headers();
  
  // Vercel provides these headers
  const country = headersList.get('x-vercel-ip-country') || null;
  const city = headersList.get('x-vercel-ip-city') || null;
  
  return { country, city };
}

export function getCountryFromRequest(request: Request): string | null {
  // Try Vercel headers first
  const country = request.headers.get('x-vercel-ip-country');
  if (country) return country;
  
  // Cloudflare header
  const cfCountry = request.headers.get('cf-ipcountry');
  if (cfCountry) return cfCountry;
  
  return null;
}
