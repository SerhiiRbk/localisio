// ============================================================
// PATCH /api/admin/providers/[id] - Admin update provider
// ============================================================

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { adminUpdateProviderSchema } from '@/lib/validations/provider';

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

    // Check if user is admin
    const { data: adminRole } = await supabase
      .from('admin_roles')
      .select('role')
      .eq('user_id', user.id)
      .single();

    if (!adminRole) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const validated = adminUpdateProviderSchema.parse(body);

    const { data, error } = await supabase
      .from('provider_profiles')
      .update(validated)
      .eq('user_id', id)
      .select(`
        *,
        profile:profiles!inner(*)
      `)
      .single();

    if (error) {
      console.error('Admin update provider error:', error);
      return NextResponse.json({ error: 'Failed to update provider' }, { status: 500 });
    }

    return NextResponse.json({ provider: data });
  } catch (error) {
    console.error('Admin update provider error:', error);
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
  }
}
