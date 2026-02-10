-- ============================================================
-- Migration: Add avatar_photo_id to provider_profiles
-- Allows providers to explicitly choose a photo as their avatar.
-- When NULL, the default avatar from profiles.avatar_url is used.
-- ============================================================

ALTER TABLE provider_profiles
ADD COLUMN IF NOT EXISTS avatar_photo_id UUID DEFAULT NULL
  REFERENCES provider_photos(id) ON DELETE SET NULL;

COMMENT ON COLUMN provider_profiles.avatar_photo_id IS 'Optional reference to a provider_photos record to use as avatar. When NULL, profiles.avatar_url is used.';
