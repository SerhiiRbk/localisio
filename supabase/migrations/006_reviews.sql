-- ============================================================
-- Localisio MVP - Reviews & Ratings System
-- ============================================================

-- Create update_updated_at_column function if it doesn't exist
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create is_admin function if it doesn't exist (same as in 001_initial_schema.sql)
CREATE OR REPLACE FUNCTION is_admin(check_user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (SELECT 1 FROM admin_roles WHERE user_id = check_user_id);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Reviews table
CREATE TABLE reviews (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    provider_user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    reviewer_user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
    review_text TEXT CHECK (char_length(review_text) <= 600),
    is_approved BOOLEAN DEFAULT FALSE, -- Admin moderation
    approved_at TIMESTAMPTZ,
    approved_by UUID REFERENCES profiles(id),
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    
    -- One review per user per provider
    UNIQUE(provider_user_id, reviewer_user_id)
);

-- Add indexes
CREATE INDEX idx_reviews_provider ON reviews(provider_user_id);
CREATE INDEX idx_reviews_reviewer ON reviews(reviewer_user_id);
CREATE INDEX idx_reviews_approved ON reviews(is_approved) WHERE is_approved = TRUE;
CREATE INDEX idx_reviews_rating ON reviews(provider_user_id, rating);

-- Add rating columns to provider_profiles for caching
ALTER TABLE provider_profiles 
ADD COLUMN IF NOT EXISTS average_rating DECIMAL(3, 2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS review_count INTEGER DEFAULT 0;

-- Create index for sorting by rating
CREATE INDEX IF NOT EXISTS idx_provider_profiles_rating ON provider_profiles(average_rating DESC);

-- Function to check if user can leave review (had conversation with provider)
CREATE OR REPLACE FUNCTION can_leave_review(reviewer_id UUID, provider_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
    -- Check if there's a conversation where:
    -- 1. Reviewer is the seeker
    -- 2. Provider is the provider
    -- 3. Both have sent at least one message
    RETURN EXISTS (
        SELECT 1 FROM conversations c
        WHERE c.seeker_id = reviewer_id 
        AND c.provider_id = provider_id
        AND EXISTS (
            SELECT 1 FROM messages m 
            WHERE m.conversation_id = c.id 
            AND m.sender_id = reviewer_id
        )
        AND EXISTS (
            SELECT 1 FROM messages m 
            WHERE m.conversation_id = c.id 
            AND m.sender_id = provider_id
        )
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to update provider rating stats
CREATE OR REPLACE FUNCTION update_provider_rating_stats()
RETURNS TRIGGER AS $$
BEGIN
    -- Update rating stats for the provider
    UPDATE provider_profiles
    SET 
        average_rating = COALESCE((
            SELECT ROUND(AVG(rating)::numeric, 2)
            FROM reviews 
            WHERE provider_user_id = COALESCE(NEW.provider_user_id, OLD.provider_user_id)
            AND is_approved = TRUE
        ), 0),
        review_count = (
            SELECT COUNT(*)
            FROM reviews 
            WHERE provider_user_id = COALESCE(NEW.provider_user_id, OLD.provider_user_id)
            AND is_approved = TRUE
        )
    WHERE user_id = COALESCE(NEW.provider_user_id, OLD.provider_user_id);
    
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to update rating when review is created, updated, or deleted
CREATE TRIGGER trigger_update_provider_rating
AFTER INSERT OR UPDATE OR DELETE ON reviews
FOR EACH ROW EXECUTE FUNCTION update_provider_rating_stats();

-- Updated at trigger for reviews
CREATE TRIGGER trigger_reviews_updated_at
BEFORE UPDATE ON reviews
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================
-- RLS Policies for Reviews
-- ============================================================

ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;

-- Anyone can view approved reviews
CREATE POLICY "reviews_select_approved" ON reviews
    FOR SELECT USING (is_approved = TRUE);

-- Reviewers can view their own reviews (even unapproved)
CREATE POLICY "reviews_select_own" ON reviews
    FOR SELECT USING (auth.uid() = reviewer_user_id);

-- Providers can view reviews about them (even unapproved)
CREATE POLICY "reviews_select_provider" ON reviews
    FOR SELECT USING (auth.uid() = provider_user_id);

-- Users can insert review if they had conversation with provider
CREATE POLICY "reviews_insert_own" ON reviews
    FOR INSERT WITH CHECK (
        auth.uid() = reviewer_user_id
        AND can_leave_review(reviewer_user_id, provider_user_id)
    );

-- Users can update their own review
CREATE POLICY "reviews_update_own" ON reviews
    FOR UPDATE USING (auth.uid() = reviewer_user_id);

-- Users can delete their own review
CREATE POLICY "reviews_delete_own" ON reviews
    FOR DELETE USING (auth.uid() = reviewer_user_id);

-- Admins can do anything with reviews
CREATE POLICY "reviews_admin_all" ON reviews
    FOR ALL USING (is_admin(auth.uid()));
