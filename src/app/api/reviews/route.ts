// ============================================================
// GET/POST /api/reviews - Get reviews or create new review
// ============================================================

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { z } from 'zod';

const createReviewSchema = z.object({
  provider_user_id: z.string().uuid(),
  rating: z.number().int().min(1).max(5),
  review_text: z.string().max(600).optional().nullable(),
});

// GET - Get reviews for a provider
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const providerId = searchParams.get('provider_id');
    const onlyApproved = searchParams.get('approved') !== 'false';

    if (!providerId) {
      return NextResponse.json({ error: 'Provider ID required' }, { status: 400 });
    }

    const supabase = await createClient();

    let query = supabase
      .from('reviews')
      .select(`
        *,
        reviewer:profiles!reviewer_user_id(id, display_name, avatar_url)
      `)
      .eq('provider_user_id', providerId)
      .order('created_at', { ascending: false });

    if (onlyApproved) {
      query = query.eq('is_approved', true);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Get reviews error:', error);
      return NextResponse.json({ error: 'Failed to fetch reviews' }, { status: 500 });
    }

    return NextResponse.json({ reviews: data || [] });
  } catch (error) {
    console.error('Get reviews error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST - Create a new review
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const validated = createReviewSchema.parse(body);

    // Check if user can leave review (had conversation with provider)
    const { data: canReview } = await supabase.rpc('can_leave_review', {
      p_reviewer_id: user.id,
      p_provider_id: validated.provider_user_id,
    });

    if (!canReview) {
      return NextResponse.json(
        { error: 'You can only review providers you have communicated with' },
        { status: 403 }
      );
    }

    // Check if review already exists
    const { data: existingReview } = await supabase
      .from('reviews')
      .select('id')
      .eq('provider_user_id', validated.provider_user_id)
      .eq('reviewer_user_id', user.id)
      .single();

    if (existingReview) {
      return NextResponse.json(
        { error: 'You have already reviewed this provider. Delete your existing review first.' },
        { status: 409 }
      );
    }

    // Create review
    const { data: review, error } = await supabase
      .from('reviews')
      .insert({
        provider_user_id: validated.provider_user_id,
        reviewer_user_id: user.id,
        rating: validated.rating,
        review_text: validated.review_text || null,
        is_approved: false, // Requires admin approval
      })
      .select()
      .single();

    if (error) {
      console.error('Create review error:', error);
      return NextResponse.json({ error: 'Failed to create review' }, { status: 500 });
    }

    return NextResponse.json({ review, message: 'Review submitted for moderation' });
  } catch (error) {
    console.error('Create review error:', error);
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid request data' }, { status: 400 });
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
