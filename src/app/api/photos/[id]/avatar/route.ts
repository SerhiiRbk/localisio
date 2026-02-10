// ============================================================
// PATCH /api/photos/[id]/avatar - Set photo as profile avatar
// DELETE /api/photos/[id]/avatar - Reset to default avatar
// ============================================================

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// Set a photo as the provider's avatar
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

    // Verify photo belongs to user
    const { data: photo, error: fetchError } = await supabase
      .from('provider_photos')
      .select('id')
      .eq('id', id)
      .eq('provider_user_id', user.id)
      .single();

    if (fetchError || !photo) {
      return NextResponse.json({ error: 'Photo not found' }, { status: 404 });
    }

    // Set avatar_photo_id on provider profile
    const { error: updateError } = await supabase
      .from('provider_profiles')
      .update({ avatar_photo_id: id })
      .eq('user_id', user.id);

    if (updateError) {
      console.error('Set avatar error:', updateError);
      return NextResponse.json({ error: 'Failed to set avatar' }, { status: 500 });
    }

    return NextResponse.json({ success: true, avatar_photo_id: id });
  } catch (error) {
    console.error('Set avatar error:', error);
    return NextResponse.json({ error: 'Failed to set avatar photo' }, { status: 500 });
  }
}

// Reset avatar to default (profiles.avatar_url)
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await params; // consume params
    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Clear avatar_photo_id
    const { error: updateError } = await supabase
      .from('provider_profiles')
      .update({ avatar_photo_id: null })
      .eq('user_id', user.id);

    if (updateError) {
      console.error('Reset avatar error:', updateError);
      return NextResponse.json({ error: 'Failed to reset avatar' }, { status: 500 });
    }

    return NextResponse.json({ success: true, avatar_photo_id: null });
  } catch (error) {
    console.error('Reset avatar error:', error);
    return NextResponse.json({ error: 'Failed to reset avatar' }, { status: 500 });
  }
}
