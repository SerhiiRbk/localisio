-- ============================================================
-- Migration: Add price_list to provider_profiles
-- Stores an optional list of services with prices (JSONB array)
-- ============================================================

ALTER TABLE provider_profiles
ADD COLUMN IF NOT EXISTS price_list JSONB DEFAULT '[]'::jsonb;

COMMENT ON COLUMN provider_profiles.price_list IS 'Optional price list. Array of {service, price} objects. Max 5 items.';
