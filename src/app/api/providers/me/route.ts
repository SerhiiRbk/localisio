// ============================================================
// GET /api/providers/me - Get current user's provider profile
// ============================================================

import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET() {
  try {
    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data, error } = await supabase
      .from('provider_profiles')
      .select('avatar_photo_id')
      .eq('user_id', user.id)
      .single();

    if (error || !data) {
      return NextResponse.json({ error: 'Provider profile not found' }, { status: 404 });
    }

    return NextResponse.json({ provider: data });
  } catch (error) {
    console.error('Get provider me error:', error);
    return NextResponse.json({ error: 'Failed to fetch provider profile' }, { status: 500 });
  }
}
