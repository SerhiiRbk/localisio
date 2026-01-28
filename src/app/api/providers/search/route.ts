// ============================================================
// GET /api/providers/search - Search providers
// ============================================================

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { searchProvidersSchema } from '@/lib/validations/provider';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    
    const params = searchProvidersSchema.parse({
      service: searchParams.get('service') || undefined,
      language: searchParams.get('language') || undefined,
      country_code: searchParams.get('country_code') || undefined,
      city: searchParams.get('city') || undefined,
      city_place_id: searchParams.get('city_place_id') || undefined,
      lat: searchParams.get('lat') ? parseFloat(searchParams.get('lat')!) : undefined,
      lon: searchParams.get('lon') ? parseFloat(searchParams.get('lon')!) : undefined,
      radius_km: searchParams.get('radius_km') ? parseInt(searchParams.get('radius_km')!) : 50,
      sort: searchParams.get('sort') || 'relevance',
      limit: searchParams.get('limit') ? parseInt(searchParams.get('limit')!) : 20,
      offset: searchParams.get('offset') ? parseInt(searchParams.get('offset')!) : 0,
    });

    const supabase = await createClient();

    // Build query
    let query = supabase
      .from('provider_profiles')
      .select(`
        *,
        profile:profiles!inner(*),
        photos:provider_photos(*)
      `, { count: 'exact' })
      .eq('is_hidden', false); // Exclude hidden providers from public search

    // Apply filters
    if (params.service) {
      const services = Array.isArray(params.service) ? params.service : [params.service];
      query = query.overlaps('services', services);
    }

    if (params.language) {
      const languages = Array.isArray(params.language) ? params.language : [params.language];
      query = query.overlaps('languages', languages);
    }

    if (params.country_code) {
      query = query.eq('country_code', params.country_code);
    }

    // City filter strategy:
    // 1. If city_place_id is provided, use exact match (preferred - language-independent)
    // 2. Fall back to ILIKE on city or city_name_normalized for backward compatibility
    if (params.city_place_id) {
      // Validate place_id format: "R435514" (R/W/N + osm_id) or legacy numeric
      // This prevents SQL injection and ensures valid lookup
      if (/^([RWN]\d+|\d+)$/i.test(params.city_place_id)) {
        // Exact match on canonical place_id - "Prague" = "Praha" = "Прага"
        // Format: R435514 (relation), N12345 (node), W67890 (way)
        query = query.eq('city_place_id', params.city_place_id.toUpperCase());
      } else {
        console.warn('Invalid city_place_id format, ignoring:', params.city_place_id);
        // Don't filter by city if place_id is invalid - show all results
      }
    } else if (params.city) {
      // Fallback: text search on city name (for backward compatibility)
      // Sanitize input by removing special characters that could affect ILIKE
      const sanitizedCity = params.city.replace(/[%_\\]/g, '');
      if (sanitizedCity.length >= 2) {
        // Search both city (display name) and city_name_normalized
        query = query.or(`city.ilike.%${sanitizedCity}%,city_name_normalized.ilike.%${sanitizedCity.toLowerCase()}%`);
      }
    }

    // Apply sorting
    if (params.sort === 'top') {
      query = query
        .order('is_verified', { ascending: false })
        .order('priority_score', { ascending: false })
        .order('created_at', { ascending: false });
    } else {
      // Relevance sorting - verified first, then priority, then recency
      query = query
        .order('is_verified', { ascending: false })
        .order('priority_score', { ascending: false })
        .order('updated_at', { ascending: false });
    }

    // Apply pagination
    query = query.range(params.offset, params.offset + params.limit - 1);

    const { data, error, count } = await query;

    if (error) {
      console.error('Search error:', error);
      return NextResponse.json({ error: 'Search failed' }, { status: 500 });
    }

    return NextResponse.json({
      providers: data || [],
      total: count || 0,
      has_more: (count || 0) > params.offset + params.limit,
    });
  } catch (error) {
    console.error('Search error:', error);
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
  }
}

// ============================================================
// Search Strategy Notes
// ============================================================
/*
CITY SEARCH STRATEGY:

1. Preferred: city_place_id (exact match)
   - User selects city from autocomplete
   - city_place_id uses stable OSM identifier format: "R435514" (R=relation, W=way, N=node)
   - This is NOT the Nominatim internal place_id (which is unstable)
   - "Prague" = "Praha" = "Прага" all resolve to same osm_id (e.g., R435514)
   - Language-independent search
   - Relations (R) are preferred as they represent administrative boundaries

2. Fallback: text search on city/city_name_normalized
   - For backward compatibility with existing data
   - Uses ILIKE for case-insensitive partial match
   - May return false positives (e.g., "Paris" matches "Paris, TX" and "Paris, France")

3. Country-only filter:
   - If only country_code is provided (no city), search entire country
   - Useful for browsing all providers in a country

4. Future: Nearby search (radius)
   - If lat/lon/radius_km provided, use geographic distance
   - Requires the search_providers_near_location() function from migration
   - Enables "Find providers within 50km of my location"
*/
