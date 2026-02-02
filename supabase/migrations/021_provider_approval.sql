-- ============================================================
-- Migration: Provider Approval System
-- Description: Add is_approved field to control provider visibility
--              New providers must be approved by admin before being
--              visible in search and to other users
-- ============================================================

-- Add is_approved column to provider_profiles (default FALSE for new providers)
ALTER TABLE provider_profiles
ADD COLUMN IF NOT EXISTS is_approved BOOLEAN DEFAULT FALSE;

-- Add approved_at timestamp
ALTER TABLE provider_profiles
ADD COLUMN IF NOT EXISTS approved_at TIMESTAMPTZ DEFAULT NULL;

-- Add index for filtering approved providers
CREATE INDEX IF NOT EXISTS idx_provider_profiles_approved 
ON provider_profiles(is_approved) 
WHERE is_approved = TRUE;

-- Update existing providers to be approved (they were already visible before this change)
UPDATE provider_profiles SET is_approved = TRUE, approved_at = NOW() WHERE is_approved IS NULL OR is_approved = FALSE;

-- Comment on columns
COMMENT ON COLUMN provider_profiles.is_approved IS 'Whether the provider profile has been approved by admin. Unapproved profiles are only visible to the provider and admins.';
COMMENT ON COLUMN provider_profiles.approved_at IS 'Timestamp when the provider was approved by admin.';
