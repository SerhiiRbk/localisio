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

    const { data, error } = await supabase
      .from('provider_profiles')
      .update(validated)
      .eq('user_id', id)
      .select()
      .single();

    if (error) {
      console.error('Update provider error:', error);
      return NextResponse.json({ error: 'Failed to update profile' }, { status: 500 });
    }

    return NextResponse.json({ provider: data });
  } catch (error) {
    console.error('Update provider error:', error);
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
  }
}
