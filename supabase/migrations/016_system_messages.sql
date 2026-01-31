-- ============================================================
-- Migration: System Messages
-- Description: Add support for system-wide messaging from admins
--              to users (announcements, notifications, etc.)
-- ============================================================

-- Create a reserved system user for system messages
-- Using a fixed UUID to ensure consistency across environments
DO $$
BEGIN
  -- Insert system user if not exists
  INSERT INTO auth.users (
    id,
    instance_id,
    aud,
    role,
    email,
    encrypted_password,
    email_confirmed_at,
    created_at,
    updated_at,
    confirmation_token,
    recovery_token,
    email_change_token_new,
    email_change
  ) VALUES (
    '00000000-0000-0000-0000-000000000000'::uuid,
    '00000000-0000-0000-0000-000000000000'::uuid,
    'authenticated',
    'authenticated',
    'system@localisio.com',
    '', -- No password - cannot login
    NOW(),
    NOW(),
    NOW(),
    '',
    '',
    '',
    ''
  ) ON CONFLICT (id) DO NOTHING;
EXCEPTION
  WHEN others THEN
    -- Ignore errors if user already exists or auth schema issues
    NULL;
END $$;

-- Insert system profile
INSERT INTO profiles (
  id,
  role,
  display_name,
  email,
  avatar_url,
  is_blocked,
  created_at,
  updated_at
) VALUES (
  '00000000-0000-0000-0000-000000000000'::uuid,
  'seeker',
  'Localisio System',
  'system@localisio.com',
  NULL,
  FALSE,
  NOW(),
  NOW()
) ON CONFLICT (id) DO UPDATE SET
  display_name = 'Localisio System',
  email = 'system@localisio.com';

-- Add columns to messages table for system message tracking
ALTER TABLE messages
ADD COLUMN IF NOT EXISTS is_system_message BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS sent_by_admin_id UUID REFERENCES profiles(id) DEFAULT NULL;

-- Create system_message_campaigns table to track broadcast campaigns
CREATE TABLE IF NOT EXISTS system_message_campaigns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Admin who created the campaign
  admin_id UUID NOT NULL REFERENCES profiles(id),
  
  -- Target audience
  target_type TEXT NOT NULL CHECK (target_type IN (
    'all_users',
    'all_providers', 
    'verified_providers',
    'unverified_providers',
    'non_providers',
    'single_user'
  )),
  
  -- For single_user target
  target_user_id UUID REFERENCES profiles(id) DEFAULT NULL,
  
  -- Message content
  subject TEXT, -- Optional subject/title
  message_text TEXT NOT NULL,
  
  -- Stats
  recipients_count INTEGER DEFAULT 0,
  delivered_count INTEGER DEFAULT 0,
  read_count INTEGER DEFAULT 0,
  replies_count INTEGER DEFAULT 0,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  sent_at TIMESTAMPTZ DEFAULT NULL,
  
  -- Status
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'sending', 'sent', 'failed'))
);

-- Track which users received which campaign message
CREATE TABLE IF NOT EXISTS system_message_deliveries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id UUID NOT NULL REFERENCES system_message_campaigns(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  conversation_id UUID REFERENCES conversations(id) ON DELETE SET NULL,
  message_id UUID REFERENCES messages(id) ON DELETE SET NULL,
  
  -- Tracking
  delivered_at TIMESTAMPTZ DEFAULT NOW(),
  read_at TIMESTAMPTZ DEFAULT NULL,
  replied_at TIMESTAMPTZ DEFAULT NULL,
  
  UNIQUE(campaign_id, user_id)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_messages_is_system ON messages(is_system_message) WHERE is_system_message = TRUE;
CREATE INDEX IF NOT EXISTS idx_messages_sent_by_admin ON messages(sent_by_admin_id) WHERE sent_by_admin_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_system_campaigns_admin ON system_message_campaigns(admin_id);
CREATE INDEX IF NOT EXISTS idx_system_campaigns_status ON system_message_campaigns(status);
CREATE INDEX IF NOT EXISTS idx_system_deliveries_user ON system_message_deliveries(user_id);
CREATE INDEX IF NOT EXISTS idx_system_deliveries_campaign ON system_message_deliveries(campaign_id);

-- RLS Policies
ALTER TABLE system_message_campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE system_message_deliveries ENABLE ROW LEVEL SECURITY;

-- Only admins can see campaigns (admins are identified by admin_roles table)
CREATE POLICY "Admins can view all campaigns" ON system_message_campaigns
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admin_roles 
      WHERE admin_roles.user_id = auth.uid()
    )
  );

CREATE POLICY "Admins can insert campaigns" ON system_message_campaigns
  FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM admin_roles 
      WHERE admin_roles.user_id = auth.uid()
    )
  );

CREATE POLICY "Admins can update campaigns" ON system_message_campaigns
  FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admin_roles 
      WHERE admin_roles.user_id = auth.uid()
    )
  );

-- Delivery policies
CREATE POLICY "Admins can view all deliveries" ON system_message_deliveries
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admin_roles 
      WHERE admin_roles.user_id = auth.uid()
    )
  );

CREATE POLICY "Admins can insert deliveries" ON system_message_deliveries
  FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM admin_roles 
      WHERE admin_roles.user_id = auth.uid()
    )
  );

CREATE POLICY "Admins can update deliveries" ON system_message_deliveries
  FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admin_roles 
      WHERE admin_roles.user_id = auth.uid()
    )
  );

-- Comment on tables
COMMENT ON TABLE system_message_campaigns IS 'Tracks system message campaigns sent by admins to users';
COMMENT ON TABLE system_message_deliveries IS 'Tracks delivery status of system messages to individual users';
COMMENT ON COLUMN messages.is_system_message IS 'Whether this message is a system message from Localisio';
COMMENT ON COLUMN messages.sent_by_admin_id IS 'The admin who sent this system message (for reply routing)';
