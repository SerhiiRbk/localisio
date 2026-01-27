// ============================================================
// GET /api/geocode - Geocoding proxy API
// Proxies requests to Nominatim with caching and rate limiting
// ============================================================

import { NextRequest, NextResponse } from 'next/server';
import { checkRateLimit } from '@/lib/rate-limit';
import { nominatimProvider } from '@/lib/geocoding';
import type { GeoSearchParams } from '@/lib/geocoding';

// Rate limit configuration for geocoding
// Nominatim allows max 1 request per second
// We're more conservative: 30 requests per minute per IP
const GEOCODE_RATE_LIMIT = {
  maxRequests: 30,
  windowMs: 60000, // 1 minute
};

// Get client identifier for rate limiting
function getClientIdentifier(request: NextRequest): string {
  // Try various headers for client IP
  const forwardedFor = request.headers.get('x-forwarded-for');
  const realIp = request.headers.get('x-real-ip');
  const cfConnectingIp = request.headers.get('cf-connecting-ip');
  
  // Use first IP from forwarded-for, or other headers, or fallback
  const ip = 
    (forwardedFor?.split(',')[0].trim()) ||
    realIp ||
    cfConnectingIp ||
    'anonymous';
  
  return `geocode:${ip}`;
}

export async function GET(request: NextRequest) {
  try {
    // Check rate limit
    const clientId = getClientIdentifier(request);
    const rateLimitResult = checkRateLimit(clientId, GEOCODE_RATE_LIMIT);
    
    if (!rateLimitResult.allowed) {
      return NextResponse.json(
        { 
          error: 'Rate limit exceeded',
          retryAfter: Math.ceil(rateLimitResult.resetIn / 1000),
        },
        { 
          status: 429,
          headers: {
            'Retry-After': Math.ceil(rateLimitResult.resetIn / 1000).toString(),
            'X-RateLimit-Remaining': '0',
          },
        }
      );
    }
    
    // Parse query parameters
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q') || '';
    const countryCode = searchParams.get('country') || undefined;
    const language = searchParams.get('lang') || 
                     request.headers.get('accept-language')?.split(',')[0] || 
                     'en';
    const limit = parseInt(searchParams.get('limit') || '10', 10);
    
    // Validate query
    if (!query || query.trim().length < 2) {
      return NextResponse.json(
        { error: 'Query must be at least 2 characters' },
        { status: 400 }
      );
    }
    
    // Build search params
    const geoParams: GeoSearchParams = {
      query: query.trim(),
      countryCode,
      language,
      limit: Math.min(limit, 15), // Cap at 15 results
    };
    
    // Search using Nominatim provider
    const results = await nominatimProvider.search(geoParams);
    
    // Return results with rate limit headers
    return NextResponse.json(
      { results },
      {
        headers: {
          'X-RateLimit-Remaining': rateLimitResult.remaining.toString(),
          'Cache-Control': 'public, max-age=3600', // Cache for 1 hour
        },
      }
    );
  } catch (error) {
    console.error('Geocode API error:', error);
    return NextResponse.json(
      { error: 'Geocoding service unavailable' },
      { status: 500 }
    );
  }
}

// ============================================================
// Nominatim Usage Policy Notes
// ============================================================
/*
IMPORTANT: Nominatim Usage Policy (https://operations.osmfoundation.org/policies/nominatim/)

1. Maximum 1 request per second (enforced via rate limiting)
2. No heavy uses (bulk geocoding)
3. Must include valid User-Agent header (done in nominatim.ts)
4. Results must be cached
5. Consider running own Nominatim instance for production

For production with higher load:
- Host own Nominatim: https://nominatim.org/release-docs/latest/admin/Installation/
- Use commercial alternatives: Mapbox, Google Maps, HERE, etc.
- The GeocodingProvider abstraction allows easy switching
*/
