-- ============================================================
-- Migration: Add consults_online flag to provider_profiles
-- Allows providers in a specific country to also appear
-- in "World - Online" search results.
-- ============================================================

ALTER TABLE provider_profiles
ADD COLUMN IF NOT EXISTS consults_online BOOLEAN NOT NULL DEFAULT false;

-- Providers with country_code = 'ONLINE' are always online
UPDATE provider_profiles SET consults_online = true WHERE country_code = 'ONLINE';

-- Index for search queries filtering by consults_online
CREATE INDEX IF NOT EXISTS idx_provider_profiles_consults_online
  ON provider_profiles (consults_online) WHERE consults_online = true;

COMMENT ON COLUMN provider_profiles.consults_online IS 'When true, provider also appears in World-Online search results even if they have a specific country.';

-- Reload PostgREST schema cache so the new column is recognized
NOTIFY pgrst, 'reload schema';
