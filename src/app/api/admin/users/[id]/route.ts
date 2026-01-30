// ============================================================
// Admin API for managing individual users
// PATCH - Update user (block/unblock)
// DELETE - Delete user account completely
// ============================================================

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { z } from 'zod';

const updateUserSchema = z.object({
  is_blocked: z.boolean().optional(),
  blocked_reason: z.string().max(500).nullable().optional(),
});

async function checkAdmin(supabase: Awaited<ReturnType<typeof createClient>>) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: 'Unauthorized', status: 401 };

  const { data: adminRole } = await supabase
    .from('admin_roles')
    .select('role')
    .eq('user_id', user.id)
    .single();

  if (!adminRole) return { error: 'Forbidden', status: 403 };
  return { user, adminRole };
}

// PATCH - Update user (block/unblock)
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createClient();

    const authCheck = await checkAdmin(supabase);
    if ('error' in authCheck) {
      return NextResponse.json({ error: authCheck.error }, { status: authCheck.status });
    }

    // Prevent admin from blocking themselves
    if (id === authCheck.user.id) {
      return NextResponse.json({ error: 'Cannot modify your own account' }, { status: 400 });
    }

    const body = await request.json();
    const validated = updateUserSchema.parse(body);

    // Check user exists
    const { data: targetUser } = await supabase
      .from('profiles')
      .select('id')
      .eq('id', id)
      .single();

    if (!targetUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Build update object
    const updateData: Record<string, unknown> = {};
    
    if (validated.is_blocked !== undefined) {
      updateData.is_blocked = validated.is_blocked;
      updateData.blocked_at = validated.is_blocked ? new Date().toISOString() : null;
      
      // Only set/clear reason when blocking status changes
      if (validated.is_blocked) {
        updateData.blocked_reason = validated.blocked_reason || 'Blocked by administrator';
      } else {
        updateData.blocked_reason = null;
      }
    }

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json({ error: 'No valid fields to update' }, { status: 400 });
    }

    // Use service role client for admin operations to bypass RLS
    const { createClient: createServiceClient } = await import('@supabase/supabase-js');
    const serviceClient = createServiceClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const { data: updated, error } = await serviceClient
      .from('profiles')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Admin update user error:', error);
      return NextResponse.json({ error: 'Failed to update user' }, { status: 500 });
    }

    return NextResponse.json({ user: updated });
  } catch (error) {
    console.error('Admin update user error:', error);
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid request data' }, { status: 400 });
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE - Delete user account completely
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createClient();

    const authCheck = await checkAdmin(supabase);
    if ('error' in authCheck) {
      return NextResponse.json({ error: authCheck.error }, { status: authCheck.status });
    }

    // Prevent admin from deleting themselves
    if (id === authCheck.user.id) {
      return NextResponse.json({ error: 'Cannot delete your own account' }, { status: 400 });
    }

    // Use service role client for admin operations to bypass RLS
    const { createClient: createServiceClient } = await import('@supabase/supabase-js');
    const serviceClient = createServiceClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // Check if user is a provider - if so, delete provider profile first
    const { data: profile } = await serviceClient
      .from('profiles')
      .select('role')
      .eq('id', id)
      .single();

    if (!profile) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // If user is a provider, delete their provider profile and photos
    if (profile.role === 'provider') {
      // Delete provider photos from storage
      const { data: photos } = await serviceClient
        .from('provider_photos')
        .select('storage_path')
        .eq('provider_user_id', id);

      if (photos && photos.length > 0) {
        const paths = photos.map(p => p.storage_path);
        await serviceClient.storage.from('provider-photos').remove(paths);
      }

      // Delete provider profile
      await serviceClient
        .from('provider_profiles')
        .delete()
        .eq('user_id', id);
    }

    // Delete user's reviews
    await serviceClient
      .from('reviews')
      .delete()
      .eq('reviewer_user_id', id);

    // Delete user's messages and conversations
    // First get conversations where user is seeker or provider
    const { data: conversations } = await serviceClient
      .from('conversations')
      .select('id')
      .or(`seeker_id.eq.${id},provider_id.eq.${id}`);

    if (conversations && conversations.length > 0) {
      const conversationIds = conversations.map(c => c.id);
      
      // Delete messages in these conversations
      await serviceClient
        .from('messages')
        .delete()
        .in('conversation_id', conversationIds);

      // Delete conversations
      await serviceClient
        .from('conversations')
        .delete()
        .in('id', conversationIds);
    }

    // Delete notifications
    await serviceClient
      .from('notifications')
      .delete()
      .eq('user_id', id);

    // Finally, delete the profile
    const { error } = await serviceClient
      .from('profiles')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Admin delete user error:', error);
      return NextResponse.json({ error: 'Failed to delete user' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Admin delete user error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
