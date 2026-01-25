-- ============================================================
-- Localisio MVP - Storage Bucket Setup
-- ============================================================

-- Create bucket for provider photos
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'provider-photos',
    'provider-photos',
    true,
    10485760, -- 10MB
    ARRAY['image/jpeg', 'image/png', 'image/webp']
) ON CONFLICT (id) DO UPDATE SET
    public = EXCLUDED.public,
    file_size_limit = EXCLUDED.file_size_limit,
    allowed_mime_types = EXCLUDED.allowed_mime_types;

-- ============================================================
-- Storage Policies
-- ============================================================

-- Anyone can view photos
CREATE POLICY "provider_photos_storage_select" ON storage.objects
    FOR SELECT USING (bucket_id = 'provider-photos');

-- Providers can upload their own photos
CREATE POLICY "provider_photos_storage_insert" ON storage.objects
    FOR INSERT WITH CHECK (
        bucket_id = 'provider-photos'
        AND (storage.foldername(name))[1] = 'provider'
        AND (storage.foldername(name))[2] = auth.uid()::text
    );

-- Providers can update their own photos
CREATE POLICY "provider_photos_storage_update" ON storage.objects
    FOR UPDATE USING (
        bucket_id = 'provider-photos'
        AND (storage.foldername(name))[1] = 'provider'
        AND (storage.foldername(name))[2] = auth.uid()::text
    );

-- Providers can delete their own photos
CREATE POLICY "provider_photos_storage_delete" ON storage.objects
    FOR DELETE USING (
        bucket_id = 'provider-photos'
        AND (storage.foldername(name))[1] = 'provider'
        AND (storage.foldername(name))[2] = auth.uid()::text
    );
