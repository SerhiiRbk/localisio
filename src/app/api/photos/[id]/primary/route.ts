// ============================================================
// PATCH /api/photos/[id]/primary - Set photo as primary
// ============================================================

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

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
      .select('*')
      .eq('id', id)
      .eq('provider_user_id', user.id)
      .single();

    if (fetchError || !photo) {
      return NextResponse.json({ error: 'Photo not found' }, { status: 404 });
    }

    // Update: trigger will handle unsetting other primary photos
    const { data: updated, error: updateError } = await supabase
      .from('provider_photos')
      .update({ is_primary: true })
      .eq('id', id)
      .select()
      .single();

    if (updateError) {
      console.error('Update error:', updateError);
      return NextResponse.json({ error: 'Failed to set primary' }, { status: 500 });
    }

    return NextResponse.json({ photo: updated });
  } catch (error) {
    console.error('Set primary error:', error);
    return NextResponse.json({ error: 'Failed to set primary photo' }, { status: 500 });
  }
}
