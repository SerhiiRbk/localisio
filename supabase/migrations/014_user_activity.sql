-- ============================================================
-- Migration: User Activity Tracking
-- Description: Add last_seen_at field to track user activity
-- ============================================================

-- Add last_seen_at column to profiles table
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS last_seen_at TIMESTAMPTZ DEFAULT NULL;

-- Create index for activity queries
CREATE INDEX IF NOT EXISTS idx_profiles_last_seen_at ON profiles(last_seen_at) WHERE last_seen_at IS NOT NULL;

-- Comment on column
COMMENT ON COLUMN profiles.last_seen_at IS 'Last time user was active on the site. Updated on page views and API calls.';

-- Function to update last_seen_at (can be called from triggers or API)
CREATE OR REPLACE FUNCTION update_user_last_seen(p_user_id UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE profiles
  SET last_seen_at = NOW()
  WHERE id = p_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION update_user_last_seen(UUID) TO authenticated;
