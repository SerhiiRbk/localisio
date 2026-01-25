// ============================================================
// POST /api/avatar - Upload user avatar
// DELETE /api/avatar - Remove user avatar
// ============================================================

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Check authentication
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    // Validate file type
    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json(
        { error: 'Invalid file type. Allowed: JPEG, PNG, WebP' },
        { status: 400 }
      );
    }

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: 'File too large. Maximum size is 5MB' },
        { status: 400 }
      );
    }

    // Generate unique filename
    const fileExt = file.name.split('.').pop() || 'jpg';
    const fileName = `${user.id}/avatar.${fileExt}`;

    // Delete old avatar if exists
    await supabase.storage.from('avatars').remove([`${user.id}/avatar.jpg`, `${user.id}/avatar.png`, `${user.id}/avatar.webp`]);

    // Upload new avatar
    const { error: uploadError } = await supabase.storage
      .from('avatars')
      .upload(fileName, file, {
        cacheControl: '3600',
        upsert: true,
      });

    if (uploadError) {
      console.error('Upload error:', uploadError);
      return NextResponse.json({ error: 'Failed to upload avatar' }, { status: 500 });
    }

    // Get public URL
    const { data: urlData } = supabase.storage.from('avatars').getPublicUrl(fileName);

    // Update profile with avatar URL
    const { error: updateError } = await supabase
      .from('profiles')
      .update({ avatar_url: urlData.publicUrl })
      .eq('id', user.id);

    if (updateError) {
      console.error('Profile update error:', updateError);
      return NextResponse.json({ error: 'Failed to update profile' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      avatar_url: urlData.publicUrl,
    });
  } catch (error) {
    console.error('Avatar upload error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE() {
  try {
    const supabase = await createClient();

    // Check authentication
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Delete avatar files
    await supabase.storage.from('avatars').remove([
      `${user.id}/avatar.jpg`,
      `${user.id}/avatar.png`,
      `${user.id}/avatar.webp`,
    ]);

    // Update profile to remove avatar URL
    const { error: updateError } = await supabase
      .from('profiles')
      .update({ avatar_url: null })
      .eq('id', user.id);

    if (updateError) {
      console.error('Profile update error:', updateError);
      return NextResponse.json({ error: 'Failed to update profile' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Avatar delete error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
