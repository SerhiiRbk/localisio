// ============================================================
// Admin API for managing individual providers
// PATCH - Update provider (verify, hide, priority, featured)
// DELETE - Delete provider profile
// ============================================================

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { z } from 'zod';
import { sendAdminNotification } from '@/lib/admin-notifications';

const updateProviderSchema = z.object({
  is_verified: z.boolean().optional(),
  verification_badge_text: z.string().max(100).nullable().optional(),
  is_hidden: z.boolean().optional(),
  is_approved: z.boolean().optional(),
  priority_score: z.number().min(0).max(1000).optional(),
  featured: z.boolean().optional(),
  featured_country_code: z.string().max(2).nullable().optional(),
  featured_language: z.string().max(10).nullable().optional(),
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

// PATCH - Update provider admin fields
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

    const body = await request.json();
    const validated = updateProviderSchema.parse(body);

    // Get current provider state (to detect changes for notifications)
    const { data: provider } = await supabase
      .from('provider_profiles')
      .select('user_id, is_approved, is_verified')
      .eq('user_id', id)
      .single();

    if (!provider) {
      return NextResponse.json({ error: 'Provider not found' }, { status: 404 });
    }

    // Track original values for notification logic
    const wasApproved = provider.is_approved;
    const wasVerified = provider.is_verified;

    // Build update object
    const updateData: Record<string, unknown> = {};
    
    if (validated.is_verified !== undefined) updateData.is_verified = validated.is_verified;
    if (validated.verification_badge_text !== undefined) updateData.verification_badge_text = validated.verification_badge_text;
    if (validated.is_hidden !== undefined) updateData.is_hidden = validated.is_hidden;
    if (validated.is_approved !== undefined) {
      updateData.is_approved = validated.is_approved;
      // Set approved_at timestamp when approving
      updateData.approved_at = validated.is_approved ? new Date().toISOString() : null;
    }
    if (validated.priority_score !== undefined) updateData.priority_score = validated.priority_score;
    if (validated.featured !== undefined) updateData.featured = validated.featured;
    if (validated.featured_country_code !== undefined) updateData.featured_country_code = validated.featured_country_code;
    if (validated.featured_language !== undefined) updateData.featured_language = validated.featured_language;

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json({ error: 'No valid fields to update' }, { status: 400 });
    }

    const { data: updated, error } = await supabase
      .from('provider_profiles')
      .update(updateData)
      .eq('user_id', id)
      .select()
      .single();

    if (error) {
      console.error('Admin update provider error:', error);
      return NextResponse.json({ error: 'Failed to update provider' }, { status: 500 });
    }

    // Send notifications for status changes
    const notifications: Promise<{ success: boolean; error?: string }>[] = [];

    // Approval status changed
    if (validated.is_approved !== undefined && validated.is_approved !== wasApproved) {
      if (validated.is_approved) {
        notifications.push(sendAdminNotification(id, 'profile_approved'));
      } else {
        notifications.push(sendAdminNotification(id, 'profile_approval_revoked'));
      }
    }

    // Verification status changed (only notify when verified, not when removed)
    if (validated.is_verified !== undefined && validated.is_verified && !wasVerified) {
      notifications.push(sendAdminNotification(id, 'profile_verified'));
    }

    // Wait for all notifications to be sent (don't block response)
    if (notifications.length > 0) {
      Promise.all(notifications).then(results => {
        const failed = results.filter(r => !r.success);
        if (failed.length > 0) {
          console.error('Some admin notifications failed:', failed);
        }
      });
    }

    return NextResponse.json({ provider: updated });
  } catch (error) {
    console.error('Admin update provider error:', error);
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid request data' }, { status: 400 });
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE - Delete provider profile completely
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

    // Delete provider photos from storage first
    const { data: photos } = await supabase
      .from('provider_photos')
      .select('storage_path')
      .eq('provider_user_id', id);

    if (photos && photos.length > 0) {
      const paths = photos.map(p => p.storage_path);
      await supabase.storage.from('provider-photos').remove(paths);
    }

    // Delete provider profile (cascades to photos, reviews via FK)
    const { error } = await supabase
      .from('provider_profiles')
      .delete()
      .eq('user_id', id);

    if (error) {
      console.error('Admin delete provider error:', error);
      return NextResponse.json({ error: 'Failed to delete provider' }, { status: 500 });
    }

    // Update user role back to seeker
    await supabase
      .from('profiles')
      .update({ role: 'seeker' })
      .eq('id', id);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Admin delete provider error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
