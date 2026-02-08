// ============================================================
// Provider Blocked Users API
// POST - Block a user
// DELETE - Unblock a user
// GET - Check if a specific user is blocked
// ============================================================

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Verify the user is a provider
    const { data: providerProfile } = await supabase
      .from('provider_profiles')
      .select('user_id')
      .eq('user_id', user.id)
      .single();

    if (!providerProfile) {
      return NextResponse.json({ error: 'Only providers can block users' }, { status: 403 });
    }

    const body = await request.json();
    const { blocked_user_id, reason } = body;

    if (!blocked_user_id) {
      return NextResponse.json({ error: 'blocked_user_id is required' }, { status: 400 });
    }

    // Cannot block yourself
    if (blocked_user_id === user.id) {
      return NextResponse.json({ error: 'Cannot block yourself' }, { status: 400 });
    }

    // Block the user
    const { data, error } = await supabase
      .from('provider_blocked_users')
      .insert({
        provider_id: user.id,
        blocked_user_id,
        reason: reason || null,
      })
      .select()
      .single();

    if (error) {
      if (error.code === '23505') {
        return NextResponse.json({ error: 'User is already blocked' }, { status: 409 });
      }
      console.error('Block user error:', error);
      return NextResponse.json({ error: 'Failed to block user' }, { status: 500 });
    }

    return NextResponse.json({ blocked: true, data });
  } catch (error) {
    console.error('Block user error:', error);
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const blockedUserId = searchParams.get('blocked_user_id');

    if (!blockedUserId) {
      return NextResponse.json({ error: 'blocked_user_id is required' }, { status: 400 });
    }

    const { error } = await supabase
      .from('provider_blocked_users')
      .delete()
      .eq('provider_id', user.id)
      .eq('blocked_user_id', blockedUserId);

    if (error) {
      console.error('Unblock user error:', error);
      return NextResponse.json({ error: 'Failed to unblock user' }, { status: 500 });
    }

    return NextResponse.json({ blocked: false });
  } catch (error) {
    console.error('Unblock user error:', error);
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
  }
}

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const blockedUserId = searchParams.get('blocked_user_id');

    if (!blockedUserId) {
      // Return all blocked users for this provider
      const { data, error } = await supabase
        .from('provider_blocked_users')
        .select('*, blocked_user:profiles!provider_blocked_users_blocked_user_id_fkey(id, display_name, avatar_url)')
        .eq('provider_id', user.id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Get blocked users error:', error);
        return NextResponse.json({ error: 'Failed to get blocked users' }, { status: 500 });
      }

      return NextResponse.json({ blocked_users: data || [] });
    }

    // Check if specific user is blocked
    const { data } = await supabase
      .from('provider_blocked_users')
      .select('id')
      .eq('provider_id', user.id)
      .eq('blocked_user_id', blockedUserId)
      .single();

    return NextResponse.json({ is_blocked: !!data });
  } catch (error) {
    console.error('Get blocked users error:', error);
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
  }
}
