-- ============================================================
-- Provider-level user blocking
-- Allows providers to block specific seekers from messaging them
-- ============================================================

-- Table to track blocked users per provider
CREATE TABLE IF NOT EXISTS provider_blocked_users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  provider_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  blocked_user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  reason TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(provider_id, blocked_user_id)
);

-- Indexes for fast lookups
CREATE INDEX idx_provider_blocked_provider ON provider_blocked_users(provider_id);
CREATE INDEX idx_provider_blocked_user ON provider_blocked_users(blocked_user_id);
CREATE INDEX idx_provider_blocked_pair ON provider_blocked_users(provider_id, blocked_user_id);

-- RLS
ALTER TABLE provider_blocked_users ENABLE ROW LEVEL SECURITY;

-- Providers can view their own blocked users
CREATE POLICY "Providers can view own blocked users"
  ON provider_blocked_users FOR SELECT
  USING (auth.uid() = provider_id);

-- Blocked users can see their own block status
CREATE POLICY "Blocked users can view own block status"
  ON provider_blocked_users FOR SELECT
  USING (auth.uid() = blocked_user_id);

-- Providers can block users
CREATE POLICY "Providers can block users"
  ON provider_blocked_users FOR INSERT
  WITH CHECK (auth.uid() = provider_id);

-- Providers can unblock users
CREATE POLICY "Providers can unblock users"
  ON provider_blocked_users FOR DELETE
  USING (auth.uid() = provider_id);

-- Helper function to check if a user is blocked by a provider
CREATE OR REPLACE FUNCTION is_blocked_by_provider(p_provider_id UUID, p_user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM provider_blocked_users
    WHERE provider_id = p_provider_id
      AND blocked_user_id = p_user_id
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
