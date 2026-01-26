// ============================================================
// GET /api/admin/reviews - Get all reviews for moderation (admin only)
// ============================================================

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if admin
    const { data: adminRole } = await supabase
      .from('admin_roles')
      .select('role')
      .eq('user_id', user.id)
      .single();

    if (!adminRole) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');

    let query = supabase
      .from('reviews')
      .select(`
        *,
        reviewer:profiles!reviewer_user_id(id, display_name, avatar_url)
      `)
      .order('created_at', { ascending: false });

    if (status === 'pending') {
      query = query.eq('is_approved', false);
    } else if (status === 'approved') {
      query = query.eq('is_approved', true);
    }

    const { data, error } = await query.limit(100);

    if (error) {
      console.error('Get admin reviews error:', error);
      return NextResponse.json({ error: 'Failed to fetch reviews' }, { status: 500 });
    }

    return NextResponse.json({ reviews: data || [] });
  } catch (error) {
    console.error('Get admin reviews error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
