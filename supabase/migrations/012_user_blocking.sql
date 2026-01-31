-- ============================================================
-- Migration: User Blocking
-- Description: Add is_blocked field to profiles for user management
--              Blocked users cannot leave reviews or send messages
-- ============================================================

-- Add is_blocked column to profiles table
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS is_blocked BOOLEAN DEFAULT FALSE NOT NULL;

-- Add blocked_at timestamp
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS blocked_at TIMESTAMPTZ DEFAULT NULL;

-- Add blocked_reason for admin notes
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS blocked_reason TEXT DEFAULT NULL;

-- Create index for blocked users (for admin filtering)
CREATE INDEX IF NOT EXISTS idx_profiles_is_blocked ON profiles(is_blocked) WHERE is_blocked = TRUE;

-- Comment on columns
COMMENT ON COLUMN profiles.is_blocked IS 'If true, user cannot leave reviews or send messages to providers';
COMMENT ON COLUMN profiles.blocked_at IS 'Timestamp when user was blocked';
COMMENT ON COLUMN profiles.blocked_reason IS 'Admin note explaining why user was blocked';
