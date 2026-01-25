-- ============================================================
-- Localisio MVP - Row Level Security Policies
-- ============================================================

-- Enable RLS on all tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE provider_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE provider_photos ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_roles ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- PROFILES POLICIES
-- ============================================================

-- Anyone can view profiles
CREATE POLICY "profiles_select_all" ON profiles
    FOR SELECT USING (true);

-- Users can update their own profile
CREATE POLICY "profiles_update_own" ON profiles
    FOR UPDATE USING (auth.uid() = id);

-- Users can insert their own profile (during registration)
CREATE POLICY "profiles_insert_own" ON profiles
    FOR INSERT WITH CHECK (auth.uid() = id);

-- ============================================================
-- PROVIDER_PROFILES POLICIES
-- ============================================================

-- Anyone can view provider profiles
CREATE POLICY "provider_profiles_select_all" ON provider_profiles
    FOR SELECT USING (true);

-- Providers can update their own profile (except admin-only fields)
CREATE POLICY "provider_profiles_update_own" ON provider_profiles
    FOR UPDATE USING (
        auth.uid() = user_id
    );

-- Providers can insert their own profile
CREATE POLICY "provider_profiles_insert_own" ON provider_profiles
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Admins can update any provider profile (for verification, featured, priority)
CREATE POLICY "provider_profiles_admin_update" ON provider_profiles
    FOR UPDATE USING (is_admin(auth.uid()));

-- ============================================================
-- PROVIDER_PHOTOS POLICIES
-- ============================================================

-- Anyone can view photos
CREATE POLICY "provider_photos_select_all" ON provider_photos
    FOR SELECT USING (true);

-- Providers can manage their own photos
CREATE POLICY "provider_photos_insert_own" ON provider_photos
    FOR INSERT WITH CHECK (auth.uid() = provider_user_id);

CREATE POLICY "provider_photos_update_own" ON provider_photos
    FOR UPDATE USING (auth.uid() = provider_user_id);

CREATE POLICY "provider_photos_delete_own" ON provider_photos
    FOR DELETE USING (auth.uid() = provider_user_id);

-- ============================================================
-- CONVERSATIONS POLICIES
-- ============================================================

-- Users can view their own conversations
CREATE POLICY "conversations_select_own" ON conversations
    FOR SELECT USING (
        auth.uid() = seeker_id OR auth.uid() = provider_id
    );

-- Users can create conversations where they are the seeker
CREATE POLICY "conversations_insert_seeker" ON conversations
    FOR INSERT WITH CHECK (auth.uid() = seeker_id);

-- ============================================================
-- MESSAGES POLICIES
-- ============================================================

-- Users can view messages in their conversations
CREATE POLICY "messages_select_own_conversations" ON messages
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM conversations c
            WHERE c.id = messages.conversation_id
            AND (c.seeker_id = auth.uid() OR c.provider_id = auth.uid())
        )
    );

-- Users can send messages in their conversations
CREATE POLICY "messages_insert_own_conversations" ON messages
    FOR INSERT WITH CHECK (
        auth.uid() = sender_id
        AND EXISTS (
            SELECT 1 FROM conversations c
            WHERE c.id = conversation_id
            AND (c.seeker_id = auth.uid() OR c.provider_id = auth.uid())
        )
    );

-- Users can update messages (mark as read) in their conversations
CREATE POLICY "messages_update_own_conversations" ON messages
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM conversations c
            WHERE c.id = messages.conversation_id
            AND (c.seeker_id = auth.uid() OR c.provider_id = auth.uid())
        )
    );

-- ============================================================
-- NOTIFICATIONS POLICIES
-- ============================================================

-- Users can view their own notifications
CREATE POLICY "notifications_select_own" ON notifications
    FOR SELECT USING (auth.uid() = user_id);

-- System creates notifications (via trigger/service role)
-- Users can update (mark as read) their own notifications
CREATE POLICY "notifications_update_own" ON notifications
    FOR UPDATE USING (auth.uid() = user_id);

-- ============================================================
-- ADMIN_ROLES POLICIES
-- ============================================================

-- Only admins can view admin roles
CREATE POLICY "admin_roles_select_admin" ON admin_roles
    FOR SELECT USING (is_admin(auth.uid()));

-- Only existing admins can manage admin roles
CREATE POLICY "admin_roles_all_admin" ON admin_roles
    FOR ALL USING (is_admin(auth.uid()));
