// ============================================================
// GET /api/geocode - Geocoding proxy API
// Proxies requests to Nominatim with database caching and rate limiting
// ============================================================

import { NextRequest, NextResponse } from 'next/server';
import { checkRateLimit } from '@/lib/rate-limit';
import { nominatimProvider, getCircuitBreakerStatus } from '@/lib/geocoding';
import type { GeoSearchParams, GeoSearchResult } from '@/lib/geocoding';
import { createServiceClient } from '@/lib/supabase/server';

// Rate limit configuration for geocoding
// Nominatim allows max 1 request per second
// We're more conservative: 30 requests per minute per IP
const GEOCODE_RATE_LIMIT = {
  maxRequests: 30,
  windowMs: 60000, // 1 minute
};

// Cache TTL in hours
const CACHE_TTL_HOURS = 24;

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

// Build cache key from search parameters
function buildCacheKey(query: string, countryCode?: string, language?: string): string {
  const parts = [
    query.toLowerCase().trim(),
    countryCode?.toLowerCase() || '',
    language?.toLowerCase() || 'en',
  ];
  return parts.join(':');
}

// Get cached results from database
async function getCachedResults(cacheKey: string): Promise<GeoSearchResult[] | null> {
  try {
    const supabase = await createServiceClient();
    
    const { data, error } = await supabase
      .from('geocoding_cache')
      .select('results')
      .eq('cache_key', cacheKey)
      .gt('expires_at', new Date().toISOString())
      .single();
    
    if (error || !data) {
      return null;
    }
    
    return data.results as GeoSearchResult[];
  } catch (error) {
    console.error('Error reading geocoding cache:', error);
    return null;
  }
}

// Save results to database cache
async function setCachedResults(
  cacheKey: string,
  query: string,
  countryCode: string | undefined,
  language: string,
  results: GeoSearchResult[]
): Promise<void> {
  try {
    const supabase = await createServiceClient();
    
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + CACHE_TTL_HOURS);
    
    await supabase
      .from('geocoding_cache')
      .upsert({
        cache_key: cacheKey,
        query: query.toLowerCase().trim(),
        country_code: countryCode?.toLowerCase() || null,
        language: language.toLowerCase(),
        results: results,
        expires_at: expiresAt.toISOString(),
      }, {
        onConflict: 'cache_key',
      });
  } catch (error) {
    // Don't fail the request if caching fails
    console.error('Error writing geocoding cache:', error);
  }
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
    
    // Build cache key
    const cacheKey = buildCacheKey(query, countryCode, language);
    
    // Check database cache first
    const cachedResults = await getCachedResults(cacheKey);
    if (cachedResults !== null) {
      // Return cached results
      return NextResponse.json(
        { results: cachedResults.slice(0, limit) },
        {
          headers: {
            'X-RateLimit-Remaining': rateLimitResult.remaining.toString(),
            'X-Geocoding-Status': 'cached',
            'X-Cache': 'HIT',
            'Cache-Control': 'public, max-age=3600',
          },
        }
      );
    }
    
    // Check circuit breaker status
    const circuitStatus = getCircuitBreakerStatus();
    if (circuitStatus.isOpen) {
      return NextResponse.json(
        { 
          results: [],
          warning: 'Geocoding service temporarily unavailable, please try again later',
        },
        {
          status: 200,
          headers: {
            'X-RateLimit-Remaining': rateLimitResult.remaining.toString(),
            'X-Geocoding-Status': 'degraded',
          },
        }
      );
    }
    
    // Build search params
    const geoParams: GeoSearchParams = {
      query: query.trim(),
      countryCode,
      language,
      limit: Math.min(limit, 15),
    };
    
    // Search using Nominatim provider
    const results = await nominatimProvider.search(geoParams);
    
    // Cache the results in database (async, don't wait)
    setCachedResults(cacheKey, query, countryCode, language, results);
    
    // Return results with rate limit headers
    return NextResponse.json(
      { results },
      {
        headers: {
          'X-RateLimit-Remaining': rateLimitResult.remaining.toString(),
          'X-Geocoding-Status': 'healthy',
          'X-Cache': 'MISS',
          'Cache-Control': 'public, max-age=3600',
        },
      }
    );
  } catch (error) {
    console.error('Geocode API error:', error);
    // Return empty results instead of error for graceful degradation
    return NextResponse.json(
      { 
        results: [],
        warning: 'Geocoding service error, please try again',
      },
      { 
        status: 200,
        headers: {
          'X-Geocoding-Status': 'error',
        },
      }
    );
  }
}

// ============================================================
// Caching Strategy
// ============================================================
/*
DATABASE CACHING (geocoding_cache table):

1. Cache key format: "query:country:language" (all lowercase)
2. TTL: 24 hours (configurable via CACHE_TTL_HOURS)
3. Flow:
   - Check database cache first
   - If HIT: return cached results (X-Cache: HIT header)
   - If MISS: call Nominatim API, cache results, return (X-Cache: MISS header)
4. Upsert on conflict to update existing cache entries

Benefits:
- Persists across server restarts (unlike in-memory cache)
- Shared across all server instances
- Reduces Nominatim API calls significantly
- Faster response for repeated queries

Cleanup:
- Run cleanup_expired_geocoding_cache() periodically (e.g., daily cron)
- Or set up pg_cron to auto-cleanup expired entries
*/

// ============================================================
// Nominatim Usage Policy Notes
// ============================================================
/*
IMPORTANT: Nominatim Usage Policy (https://operations.osmfoundation.org/policies/nominatim/)

1. Maximum 1 request per second (enforced via rate limiting)
2. No heavy uses (bulk geocoding)
3. Must include valid User-Agent header (done in nominatim.ts)
4. Results must be cached ✓ (database cache implemented)
5. Consider running own Nominatim instance for production

For production with higher load:
- Host own Nominatim: https://nominatim.org/release-docs/latest/admin/Installation/
- Use commercial alternatives: Mapbox, Google Maps, HERE, etc.
- The GeocodingProvider abstraction allows easy switching
*/
