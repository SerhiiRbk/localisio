// ============================================================
// GET/PATCH /api/providers/[id] - Get or update provider profile
// ============================================================

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { updateProviderProfileSchema, containsUrls } from '@/lib/validations/provider';

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
        photos:provider_photos!provider_photos_provider_user_id_fkey(*)
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
    
    // Check for URLs in restricted fields before validation
    const fieldsWithUrls: string[] = [];
    if (containsUrls(body.headline)) fieldsWithUrls.push('Headline');
    if (containsUrls(body.bio)) fieldsWithUrls.push('About You');
    if (body.faq && Array.isArray(body.faq)) {
      const faqHasUrls = body.faq.some((item: { question?: string; answer?: string }) => 
        containsUrls(item.question) || containsUrls(item.answer)
      );
      if (faqHasUrls) fieldsWithUrls.push('FAQ');
    }
    
    const validated = updateProviderProfileSchema.parse(body);

    // Check slug uniqueness if slug is provided
    if (validated.slug && validated.country_code) {
      const { data: existingWithSlug } = await supabase
        .from('provider_profiles')
        .select('user_id')
        .eq('country_code', validated.country_code)
        .eq('slug', validated.slug)
        .neq('user_id', id)
        .single();

      if (existingWithSlug) {
        return NextResponse.json(
          { error: 'This slug is already taken for this country. Please choose a different one.' },
          { status: 409 }
        );
      }
    }

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
          // SEO-friendly slug
          slug: validated.slug || null,
          // Geocoded location fields
          city_place_id: validated.city_place_id ?? null,
          city_display_name: validated.city_display_name ?? null,
          city_name_normalized: validated.city_name_normalized ?? null,
          lat: validated.lat ?? null,
          lon: validated.lon ?? null,
          // FAQ section
          faq: validated.faq || [],
          // Price list
          price_list: validated.price_list || [],
          // Social links (private)
          social_links: validated.social_links || {},
          youtube_url: validated.youtube_url || null,
          // Online consultation flag (always true for ONLINE country)
          consults_online: validated.country_code === 'ONLINE' ? true : (validated.consults_online ?? false),
        },
        {
          onConflict: 'user_id',
        }
      )
      .select()
      .single();

    if (error) {
      // Handle unique constraint violation
      if (error.code === '23505' && error.message.includes('slug')) {
        return NextResponse.json(
          { error: 'This slug is already taken for this country. Please choose a different one.' },
          { status: 409 }
        );
      }
      console.error('Update provider error:', error);
      return NextResponse.json({ error: 'Failed to update profile', details: error.message }, { status: 500 });
    }

    // Return response with warning if URLs were stripped
    const response: { provider: typeof data; warning?: string } = { provider: data };
    if (fieldsWithUrls.length > 0) {
      response.warning = `Links to external websites were removed from: ${fieldsWithUrls.join(', ')}. External links are not allowed in these fields.`;
    }
    
    return NextResponse.json(response);
  } catch (error) {
    console.error('Update provider error:', error);
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
  }
}
