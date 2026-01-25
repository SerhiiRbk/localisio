// ============================================================
// GET/POST/DELETE /api/photos - Manage provider photos
// ============================================================

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { v4 as uuidv4 } from 'uuid';
import { checkRateLimit, UPLOAD_RATE_LIMIT } from '@/lib/rate-limit';

const MAX_PHOTOS = 5;
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

export async function GET() {
  try {
    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: photos, error } = await supabase
      .from('provider_photos')
      .select('*')
      .eq('provider_user_id', user.id)
      .order('sort_order', { ascending: true });

    if (error) {
      return NextResponse.json({ error: 'Failed to fetch photos' }, { status: 500 });
    }

    return NextResponse.json({ photos: photos || [] });
  } catch (error) {
    console.error('Get photos error:', error);
    return NextResponse.json({ error: 'Failed to fetch photos' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Rate limit check
    const rateLimit = checkRateLimit(`upload:${user.id}`, UPLOAD_RATE_LIMIT);
    if (!rateLimit.allowed) {
      return NextResponse.json(
        { error: 'Too many uploads. Please wait.' },
        { status: 429 }
      );
    }

    // Check current photo count
    const { count } = await supabase
      .from('provider_photos')
      .select('*', { count: 'exact', head: true })
      .eq('provider_user_id', user.id);

    if ((count || 0) >= MAX_PHOTOS) {
      return NextResponse.json(
        { error: `Maximum ${MAX_PHOTOS} photos allowed` },
        { status: 400 }
      );
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
        { error: 'File too large. Maximum size: 10MB' },
        { status: 400 }
      );
    }

    // Generate file path
    const ext = file.name.split('.').pop() || 'jpg';
    const fileName = `${uuidv4()}.${ext}`;
    const storagePath = `provider/${user.id}/${fileName}`;

    // Upload to storage
    const { error: uploadError } = await supabase.storage
      .from('provider-photos')
      .upload(storagePath, file, {
        contentType: file.type,
        upsert: false,
      });

    if (uploadError) {
      console.error('Upload error:', uploadError);
      return NextResponse.json({ error: 'Failed to upload file' }, { status: 500 });
    }

    // Create photo record
    const isPrimary = (count || 0) === 0; // First photo is primary
    const { data: photo, error: dbError } = await supabase
      .from('provider_photos')
      .insert({
        provider_user_id: user.id,
        storage_path: storagePath,
        is_primary: isPrimary,
        sort_order: (count || 0),
      })
      .select()
      .single();

    if (dbError) {
      // Rollback: delete uploaded file
      await supabase.storage.from('provider-photos').remove([storagePath]);
      console.error('DB error:', dbError);
      return NextResponse.json({ error: 'Failed to save photo' }, { status: 500 });
    }

    return NextResponse.json({ photo });
  } catch (error) {
    console.error('Upload photo error:', error);
    return NextResponse.json({ error: 'Failed to upload photo' }, { status: 500 });
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
    const photoId = searchParams.get('id');

    if (!photoId) {
      return NextResponse.json({ error: 'Photo ID required' }, { status: 400 });
    }

    // Get photo
    const { data: photo, error: fetchError } = await supabase
      .from('provider_photos')
      .select('*')
      .eq('id', photoId)
      .eq('provider_user_id', user.id)
      .single();

    if (fetchError || !photo) {
      return NextResponse.json({ error: 'Photo not found' }, { status: 404 });
    }

    // Delete from storage
    await supabase.storage.from('provider-photos').remove([photo.storage_path]);

    // Delete from database
    await supabase.from('provider_photos').delete().eq('id', photoId);

    // If was primary, set next photo as primary
    if (photo.is_primary) {
      const { data: nextPhoto } = await supabase
        .from('provider_photos')
        .select('id')
        .eq('provider_user_id', user.id)
        .order('sort_order', { ascending: true })
        .limit(1)
        .single();

      if (nextPhoto) {
        await supabase
          .from('provider_photos')
          .update({ is_primary: true })
          .eq('id', nextPhoto.id);
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Delete photo error:', error);
    return NextResponse.json({ error: 'Failed to delete photo' }, { status: 500 });
  }
}
