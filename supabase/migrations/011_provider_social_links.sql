-- ============================================================
-- Migration: Provider Social Links (Private)
-- Description: Add social profile links visible only to 
--              the provider and administrators
-- ============================================================

-- Add social_links column as JSONB object
-- Format: {"facebook_url": "...", "instagram_url": "...", "linkedin_url": "..."}
-- This field is PRIVATE - not exposed in public API responses
ALTER TABLE provider_profiles
ADD COLUMN IF NOT EXISTS social_links JSONB DEFAULT '{}'::jsonb;

-- Comment on column
COMMENT ON COLUMN provider_profiles.social_links IS 'Private social profile links (Facebook, Instagram, LinkedIn). Only visible to owner and admin. Format: {facebook_url?: string, instagram_url?: string, linkedin_url?: string}';
