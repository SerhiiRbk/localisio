// ============================================================
// GET /api/providers/featured - Get featured/top providers
// ============================================================

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const countryCode = searchParams.get('country') || null;
    const language = searchParams.get('language') || null;
    const limit = Math.min(parseInt(searchParams.get('limit') || '10'), 20);

    const supabase = await createClient();

    // Build query for featured providers (exclude hidden)
    let query = supabase
      .from('provider_profiles')
      .select(`
        *,
        profile:profiles!inner(*),
        photos:provider_photos!provider_photos_provider_user_id_fkey(*)
      `)
      .eq('featured', true)
      .eq('is_hidden', false);

    // Filter by country if available
    if (countryCode) {
      query = query.or(`featured_country_code.eq.${countryCode},featured_country_code.is.null`);
    }

    // Filter by language if available
    if (language) {
      query = query.or(`featured_language.eq.${language},featured_language.is.null`);
    }

    query = query
      .order('is_verified', { ascending: false })
      .order('priority_score', { ascending: false })
      .limit(limit);

    const { data: featured, error: featuredError } = await query;

    if (featuredError) {
      console.error('Featured query error:', featuredError);
    }

    // If not enough featured, get top providers
    const featuredCount = featured?.length || 0;
    let topProviders: typeof featured = [];

    if (featuredCount < limit) {
      const excludeIds = featured?.map((p) => p.user_id) || [];
      
      let topQuery = supabase
        .from('provider_profiles')
        .select(`
          *,
          profile:profiles!inner(*),
          photos:provider_photos!provider_photos_provider_user_id_fkey(*)
        `)
        .eq('is_hidden', false);

      if (excludeIds.length > 0) {
        topQuery = topQuery.not('user_id', 'in', `(${excludeIds.join(',')})`);
      }

      // Prefer providers from the same country (include consults_online for ONLINE)
      if (countryCode) {
        if (countryCode === 'ONLINE') {
          topQuery = topQuery.or('country_code.eq.ONLINE,consults_online.eq.true');
        } else {
          topQuery = topQuery.eq('country_code', countryCode);
        }
      }

      topQuery = topQuery
        .order('is_verified', { ascending: false })
        .order('priority_score', { ascending: false })
        .order('updated_at', { ascending: false })
        .limit(limit - featuredCount);

      const { data: top } = await topQuery;
      topProviders = top || [];

      // If still not enough and we filtered by country, get global top
      if ((featured?.length || 0) + (topProviders?.length || 0) < limit && countryCode) {
        const allIds = [...excludeIds, ...(topProviders?.map((p) => p.user_id) || [])];
        
        let globalQuery = supabase
          .from('provider_profiles')
          .select(`
            *,
            profile:profiles!inner(*),
            photos:provider_photos!provider_photos_provider_user_id_fkey(*)
          `)
          .eq('is_hidden', false);

        if (allIds.length > 0) {
          globalQuery = globalQuery.not('user_id', 'in', `(${allIds.join(',')})`);
        }

        globalQuery = globalQuery
          .order('is_verified', { ascending: false })
          .order('priority_score', { ascending: false })
          .limit(limit - (featured?.length || 0) - (topProviders?.length || 0));

        const { data: global } = await globalQuery;
        topProviders = [...(topProviders || []), ...(global || [])];
      }
    }

    const providers = [...(featured || []), ...(topProviders || [])].slice(0, limit);

    return NextResponse.json({ providers });
  } catch (error) {
    console.error('Featured providers error:', error);
    return NextResponse.json({ error: 'Failed to fetch providers' }, { status: 500 });
  }
}
