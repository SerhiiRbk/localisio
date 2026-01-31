// ============================================================
// GET/PATCH /api/providers/[id] - Get or update provider profile
// ============================================================

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { updateProviderProfileSchema } from '@/lib/validations/provider';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createClient();

    const { data, error } = await supabase
      .from('provider_profiles')
      .select(`
        *,
        profile:profiles!inner(*),
        photos:provider_photos(*)
      `)
      .eq('user_id', id)
      .single();

    if (error || !data) {
      return NextResponse.json({ error: 'Provider not found' }, { status: 404 });
    }

    return NextResponse.json({ provider: data });
  } catch (error) {
    console.error('Get provider error:', error);
    return NextResponse.json({ error: 'Failed to fetch provider' }, { status: 500 });
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createClient();

    // Check authentication
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user owns this profile
    if (user.id !== id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const validated = updateProviderProfileSchema.parse(body);

    // Use upsert to handle both insert and update cases
    const { data, error } = await supabase
      .from('provider_profiles')
      .upsert(
        {
          user_id: id,
          headline: validated.headline || '',
          bio: validated.bio || '',
          services: validated.services || [],
          languages: validated.languages || [],
          experience_years: validated.experience_years || 0,
          country_code: validated.country_code || '',
          city: validated.city || '',
          // Geocoded location fields
          city_place_id: validated.city_place_id ?? null,
          city_display_name: validated.city_display_name ?? null,
          city_name_normalized: validated.city_name_normalized ?? null,
          lat: validated.lat ?? null,
          lon: validated.lon ?? null,
          // FAQ section
          faq: validated.faq || [],
          // Social links (private)
          social_links: validated.social_links || {},
          youtube_url: validated.youtube_url || null,
        },
        {
          onConflict: 'user_id',
        }
      )
      .select()
      .single();

    if (error) {
      console.error('Update provider error:', error);
      return NextResponse.json({ error: 'Failed to update profile', details: error.message }, { status: 500 });
    }

    return NextResponse.json({ provider: data });
  } catch (error) {
    console.error('Update provider error:', error);
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
  }
}
