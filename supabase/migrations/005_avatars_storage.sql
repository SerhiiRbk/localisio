-- ============================================================
-- Localisio MVP - Avatar Storage Bucket Setup
-- ============================================================

-- Create bucket for user avatars
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'avatars',
    'avatars',
    true,
    5242880, -- 5MB
    ARRAY['image/jpeg', 'image/png', 'image/webp']
) ON CONFLICT (id) DO UPDATE SET
    public = EXCLUDED.public,
    file_size_limit = EXCLUDED.file_size_limit,
    allowed_mime_types = EXCLUDED.allowed_mime_types;

-- ============================================================
-- Avatar Storage Policies
-- ============================================================

-- Anyone can view avatars
CREATE POLICY "avatars_storage_select" ON storage.objects
    FOR SELECT USING (bucket_id = 'avatars');

-- Users can upload their own avatar
CREATE POLICY "avatars_storage_insert" ON storage.objects
    FOR INSERT WITH CHECK (
        bucket_id = 'avatars'
        AND (storage.foldername(name))[1] = auth.uid()::text
    );

-- Users can update their own avatar
CREATE POLICY "avatars_storage_update" ON storage.objects
    FOR UPDATE USING (
        bucket_id = 'avatars'
        AND (storage.foldername(name))[1] = auth.uid()::text
    );

-- Users can delete their own avatar
CREATE POLICY "avatars_storage_delete" ON storage.objects
    FOR DELETE USING (
        bucket_id = 'avatars'
        AND (storage.foldername(name))[1] = auth.uid()::text
    );
