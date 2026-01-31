-- ============================================================
-- Migration: Provider Slug
-- Description: Add optional slug field for SEO-friendly URLs
--              Format: /{country_code}/{slug} (e.g., /es/john_doe)
-- ============================================================

-- Add slug column to provider_profiles table
ALTER TABLE provider_profiles
ADD COLUMN IF NOT EXISTS slug VARCHAR(50) DEFAULT NULL;

-- Create unique index on (country_code, slug) where slug is not null
-- This ensures uniqueness only when slug has a value
CREATE UNIQUE INDEX IF NOT EXISTS idx_provider_profiles_country_slug 
ON provider_profiles(country_code, slug) 
WHERE slug IS NOT NULL AND slug != '';

-- Create index for fast lookups by slug
CREATE INDEX IF NOT EXISTS idx_provider_profiles_slug 
ON provider_profiles(slug) 
WHERE slug IS NOT NULL AND slug != '';

-- Comment on column
COMMENT ON COLUMN provider_profiles.slug IS 'SEO-friendly URL slug. Combined with country_code forms unique URL: /{country_code}/{slug}. Max 50 chars, URL-safe characters only.';
