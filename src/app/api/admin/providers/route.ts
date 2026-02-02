// ============================================================
// GET /api/admin/providers - Get all providers for admin management
// ============================================================

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();

    const { data: { user } } = await supabase.auth.getUser();
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
    const filter = searchParams.get('filter'); // 'all' | 'pending' | 'approved' | 'verified' | 'unverified' | 'hidden' | 'featured'
    const search = searchParams.get('search');

    let query = supabase
      .from('provider_profiles')
      .select(`
        *,
        profile:profiles!inner(id, display_name, email, avatar_url)
      `)
      .order('created_at', { ascending: false });

    // Apply filters
    if (filter === 'pending') {
      query = query.eq('is_approved', false);
    } else if (filter === 'approved') {
      query = query.eq('is_approved', true);
    } else if (filter === 'verified') {
      query = query.eq('is_verified', true);
    } else if (filter === 'unverified') {
      query = query.eq('is_verified', false);
    } else if (filter === 'hidden') {
      query = query.eq('is_hidden', true);
    } else if (filter === 'featured') {
      query = query.eq('featured', true);
    }

    const { data, error } = await query.limit(200);

    if (error) {
      console.error('Admin get providers error:', error);
      return NextResponse.json({ error: 'Failed to fetch providers' }, { status: 500 });
    }

    // Filter by search term if provided
    let providers = data || [];
    if (search) {
      const searchLower = search.toLowerCase();
      providers = providers.filter(p => 
        p.profile?.display_name?.toLowerCase().includes(searchLower) ||
        p.profile?.email?.toLowerCase().includes(searchLower) ||
        p.headline?.toLowerCase().includes(searchLower) ||
        p.city?.toLowerCase().includes(searchLower)
      );
    }

    return NextResponse.json({ providers });
  } catch (error) {
    console.error('Admin get providers error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
