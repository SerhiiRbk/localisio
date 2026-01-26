// ============================================================
// GET /api/reviews/can-review?provider_id=xxx - Check if user can leave review
// ============================================================

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const providerId = searchParams.get('provider_id');

    if (!providerId) {
      return NextResponse.json({ error: 'Provider ID required' }, { status: 400 });
    }

    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ can_review: false, reason: 'not_authenticated' });
    }

    // Check if user can leave review
    const { data: canReview, error: rpcError } = await supabase.rpc('can_leave_review', {
      p_reviewer_id: user.id,
      p_provider_id: providerId,
    });
    
    if (rpcError) {
      console.error('RPC error:', rpcError);
    }

    // Check if already reviewed
    const { data: existingReview } = await supabase
      .from('reviews')
      .select('id, rating, review_text, is_approved')
      .eq('provider_user_id', providerId)
      .eq('reviewer_user_id', user.id)
      .single();

    return NextResponse.json({
      can_review: canReview && !existingReview,
      has_existing_review: !!existingReview,
      existing_review: existingReview || null,
      reason: !canReview ? 'no_conversation' : existingReview ? 'already_reviewed' : null,
    });
  } catch (error) {
    console.error('Can review check error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
