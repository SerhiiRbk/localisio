-- ============================================================
-- Migration: Provider Email Preferences
-- Adds preferred_locale and email digest tracking fields
-- ============================================================

-- Persist user's preferred locale for server-side emails
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS preferred_locale TEXT DEFAULT 'en';

-- Track when the last unread-messages digest email was sent
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS last_unread_digest_sent_at TIMESTAMPTZ DEFAULT NULL;

-- Track when the last inactivity reminder email was sent
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS last_inactive_reminder_sent_at TIMESTAMPTZ DEFAULT NULL;

-- Index for cron queries that find providers needing emails
CREATE INDEX IF NOT EXISTS idx_profiles_preferred_locale
  ON profiles(preferred_locale);

CREATE INDEX IF NOT EXISTS idx_profiles_digest_sent
  ON profiles(last_unread_digest_sent_at)
  WHERE last_unread_digest_sent_at IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_profiles_inactive_reminder
  ON profiles(last_inactive_reminder_sent_at)
  WHERE last_inactive_reminder_sent_at IS NOT NULL;

COMMENT ON COLUMN profiles.preferred_locale IS 'User preferred locale for emails (en, ru, uk, es). Updated when user changes language.';
COMMENT ON COLUMN profiles.last_unread_digest_sent_at IS 'When the last unread-messages digest email was sent. Used to throttle to once per day.';
COMMENT ON COLUMN profiles.last_inactive_reminder_sent_at IS 'When the last inactivity reminder email was sent. Used to throttle to once per 7 days.';
