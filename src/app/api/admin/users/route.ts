// ============================================================
// GET /api/admin/users - Get all users for admin management
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
    const filter = searchParams.get('filter'); // 'all' | 'seekers' | 'providers' | 'blocked'
    const search = searchParams.get('search');

    let query = supabase
      .from('profiles')
      .select('*')
      .order('created_at', { ascending: false });

    // Apply filters
    if (filter === 'seekers') {
      query = query.eq('role', 'seeker');
    } else if (filter === 'providers') {
      query = query.eq('role', 'provider');
    } else if (filter === 'blocked') {
      query = query.eq('is_blocked', true);
    }

    const { data, error } = await query.limit(200);

    if (error) {
      console.error('Admin get users error:', error);
      return NextResponse.json({ error: 'Failed to fetch users' }, { status: 500 });
    }

    // Filter by search term if provided
    let users = data || [];
    if (search) {
      const searchLower = search.toLowerCase();
      users = users.filter(u => 
        u.display_name?.toLowerCase().includes(searchLower) ||
        u.email?.toLowerCase().includes(searchLower)
      );
    }

    return NextResponse.json({ users });
  } catch (error) {
    console.error('Admin get users error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
