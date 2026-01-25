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
      `, { count: 'exact' });

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

    if (params.city) {
      query = query.ilike('city', `%${params.city}%`);
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
