// ============================================================
// DELETE /api/reviews/[id] - Delete user's own review
// PATCH /api/reviews/[id] - Update review or admin moderation
// ============================================================

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { z } from 'zod';

const updateReviewSchema = z.object({
  rating: z.number().int().min(1).max(5).optional(),
  review_text: z.string().max(600).optional().nullable(),
  // Admin only fields
  is_approved: z.boolean().optional(),
});

// DELETE - Delete own review
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user owns this review
    const { data: review } = await supabase
      .from('reviews')
      .select('reviewer_user_id')
      .eq('id', id)
      .single();

    if (!review) {
      return NextResponse.json({ error: 'Review not found' }, { status: 404 });
    }

    if (review.reviewer_user_id !== user.id) {
      // Check if admin
      const { data: adminRole } = await supabase
        .from('admin_roles')
        .select('role')
        .eq('user_id', user.id)
        .single();

      if (!adminRole) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
      }
    }

    const { error } = await supabase.from('reviews').delete().eq('id', id);

    if (error) {
      console.error('Delete review error:', error);
      return NextResponse.json({ error: 'Failed to delete review' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Delete review error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// PATCH - Update review or admin moderation
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const validated = updateReviewSchema.parse(body);

    // Check if user owns this review
    const { data: review } = await supabase
      .from('reviews')
      .select('reviewer_user_id')
      .eq('id', id)
      .single();

    if (!review) {
      return NextResponse.json({ error: 'Review not found' }, { status: 404 });
    }

    const isOwner = review.reviewer_user_id === user.id;

    // Check if admin
    const { data: adminRole } = await supabase
      .from('admin_roles')
      .select('role')
      .eq('user_id', user.id)
      .single();

    const isAdmin = !!adminRole;

    if (!isOwner && !isAdmin) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Build update object
    const updateData: Record<string, unknown> = {};

    // User can update rating and review_text
    if (isOwner) {
      if (validated.rating !== undefined) updateData.rating = validated.rating;
      if (validated.review_text !== undefined) updateData.review_text = validated.review_text;
      // Reset approval status when user edits
      if (validated.rating !== undefined || validated.review_text !== undefined) {
        updateData.is_approved = false;
      }
    }

    // Only admin can approve
    if (isAdmin && validated.is_approved !== undefined) {
      updateData.is_approved = validated.is_approved;
      if (validated.is_approved) {
        updateData.approved_at = new Date().toISOString();
        updateData.approved_by = user.id;
      } else {
        updateData.approved_at = null;
        updateData.approved_by = null;
      }
    }

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json({ error: 'No valid fields to update' }, { status: 400 });
    }

    const { data: updatedReview, error } = await supabase
      .from('reviews')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Update review error:', error);
      return NextResponse.json({ error: 'Failed to update review' }, { status: 500 });
    }

    return NextResponse.json({ review: updatedReview });
  } catch (error) {
    console.error('Update review error:', error);
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid request data' }, { status: 400 });
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
