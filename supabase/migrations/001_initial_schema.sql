-- ============================================================
-- Localisio MVP - Initial Database Schema
-- ============================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================
-- ENUMS
-- ============================================================

CREATE TYPE user_role AS ENUM ('seeker', 'provider');

-- ============================================================
-- 1) PROFILES (base user profile)
-- ============================================================

CREATE TABLE profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    role user_role NOT NULL DEFAULT 'seeker',
    display_name TEXT NOT NULL,
    email TEXT,
    avatar_url TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index for role-based queries
CREATE INDEX idx_profiles_role ON profiles(role);

-- ============================================================
-- 2) PROVIDER_PROFILES (extended profile for providers)
-- ============================================================

CREATE TABLE provider_profiles (
    user_id UUID PRIMARY KEY REFERENCES profiles(id) ON DELETE CASCADE,
    headline TEXT NOT NULL DEFAULT '',
    bio TEXT NOT NULL DEFAULT '',
    experience_years INTEGER NOT NULL DEFAULT 0,
    country_code TEXT NOT NULL DEFAULT '',
    city TEXT NOT NULL DEFAULT '',
    languages TEXT[] NOT NULL DEFAULT '{}',
    services TEXT[] NOT NULL DEFAULT '{}',
    youtube_url TEXT,
    is_verified BOOLEAN NOT NULL DEFAULT FALSE,
    verification_badge_text TEXT,
    priority_score INTEGER NOT NULL DEFAULT 0,
    featured BOOLEAN NOT NULL DEFAULT FALSE,
    featured_country_code TEXT,
    featured_language TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for search and filtering
CREATE INDEX idx_provider_profiles_country ON provider_profiles(country_code);
CREATE INDEX idx_provider_profiles_city ON provider_profiles(city);
CREATE INDEX idx_provider_profiles_verified ON provider_profiles(is_verified);
CREATE INDEX idx_provider_profiles_priority ON provider_profiles(priority_score DESC);
CREATE INDEX idx_provider_profiles_featured ON provider_profiles(featured) WHERE featured = TRUE;
CREATE INDEX idx_provider_profiles_languages ON provider_profiles USING GIN(languages);
CREATE INDEX idx_provider_profiles_services ON provider_profiles USING GIN(services);

-- ============================================================
-- 3) PROVIDER_PHOTOS
-- ============================================================

CREATE TABLE provider_photos (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    provider_user_id UUID NOT NULL REFERENCES provider_profiles(user_id) ON DELETE CASCADE,
    storage_path TEXT NOT NULL,
    is_primary BOOLEAN NOT NULL DEFAULT FALSE,
    sort_order INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index for provider photos
CREATE INDEX idx_provider_photos_provider ON provider_photos(provider_user_id);
CREATE INDEX idx_provider_photos_primary ON provider_photos(provider_user_id, is_primary) WHERE is_primary = TRUE;

-- Constraint: max 5 photos per provider
CREATE OR REPLACE FUNCTION check_max_photos()
RETURNS TRIGGER AS $$
BEGIN
    IF (SELECT COUNT(*) FROM provider_photos WHERE provider_user_id = NEW.provider_user_id) >= 5 THEN
        RAISE EXCEPTION 'Maximum 5 photos allowed per provider';
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_check_max_photos
    BEFORE INSERT ON provider_photos
    FOR EACH ROW
    EXECUTE FUNCTION check_max_photos();

-- Function to ensure only one primary photo
CREATE OR REPLACE FUNCTION ensure_single_primary_photo()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.is_primary = TRUE THEN
        UPDATE provider_photos 
        SET is_primary = FALSE 
        WHERE provider_user_id = NEW.provider_user_id 
        AND id != NEW.id 
        AND is_primary = TRUE;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_ensure_single_primary
    BEFORE INSERT OR UPDATE ON provider_photos
    FOR EACH ROW
    WHEN (NEW.is_primary = TRUE)
    EXECUTE FUNCTION ensure_single_primary_photo();

-- ============================================================
-- 4) CONVERSATIONS
-- ============================================================

CREATE TABLE conversations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    seeker_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    provider_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT unique_conversation UNIQUE (seeker_id, provider_id),
    CONSTRAINT different_users CHECK (seeker_id != provider_id)
);

-- Indexes for conversation queries
CREATE INDEX idx_conversations_seeker ON conversations(seeker_id);
CREATE INDEX idx_conversations_provider ON conversations(provider_id);

-- ============================================================
-- 5) MESSAGES
-- ============================================================

CREATE TABLE messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
    sender_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    body TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    read_at TIMESTAMPTZ
);

-- Indexes for message queries
CREATE INDEX idx_messages_conversation ON messages(conversation_id, created_at DESC);
CREATE INDEX idx_messages_sender ON messages(sender_id);
CREATE INDEX idx_messages_unread ON messages(conversation_id, read_at) WHERE read_at IS NULL;

-- ============================================================
-- 6) NOTIFICATIONS
-- ============================================================

CREATE TABLE notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    type TEXT NOT NULL DEFAULT 'message',
    payload JSONB NOT NULL DEFAULT '{}',
    is_read BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for notification queries
CREATE INDEX idx_notifications_user ON notifications(user_id, created_at DESC);
CREATE INDEX idx_notifications_unread ON notifications(user_id, is_read) WHERE is_read = FALSE;

-- ============================================================
-- 7) ADMIN_ROLES
-- ============================================================

CREATE TABLE admin_roles (
    user_id UUID PRIMARY KEY REFERENCES profiles(id) ON DELETE CASCADE,
    role TEXT NOT NULL DEFAULT 'admin',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- TRIGGER: Create notification on new message
-- ============================================================

CREATE OR REPLACE FUNCTION create_message_notification()
RETURNS TRIGGER AS $$
DECLARE
    recipient_id UUID;
    conv RECORD;
BEGIN
    -- Get conversation details
    SELECT seeker_id, provider_id INTO conv FROM conversations WHERE id = NEW.conversation_id;
    
    -- Determine recipient (the one who didn't send the message)
    IF NEW.sender_id = conv.seeker_id THEN
        recipient_id := conv.provider_id;
    ELSE
        recipient_id := conv.seeker_id;
    END IF;
    
    -- Create notification
    INSERT INTO notifications (user_id, type, payload)
    VALUES (
        recipient_id,
        'message',
        jsonb_build_object(
            'conversation_id', NEW.conversation_id,
            'message_id', NEW.id,
            'sender_id', NEW.sender_id
        )
    );
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_create_message_notification
    AFTER INSERT ON messages
    FOR EACH ROW
    EXECUTE FUNCTION create_message_notification();

-- ============================================================
-- TRIGGER: Auto-update updated_at
-- ============================================================

CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_profiles_updated_at
    BEFORE UPDATE ON profiles
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trigger_provider_profiles_updated_at
    BEFORE UPDATE ON provider_profiles
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at();

-- ============================================================
-- FUNCTION: Check if user is admin
-- ============================================================

CREATE OR REPLACE FUNCTION is_admin(check_user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (SELECT 1 FROM admin_roles WHERE user_id = check_user_id);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
