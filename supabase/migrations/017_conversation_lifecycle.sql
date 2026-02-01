-- ============================================================
-- Migration: Conversation Lifecycle
-- Description: Add lifecycle management for conversations
--              including status, close/reopen, auto-close
-- ============================================================

-- Create enum for conversation status
DO $$ BEGIN
    CREATE TYPE conversation_status AS ENUM ('open', 'active', 'closed');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Create enum for close method
DO $$ BEGIN
    CREATE TYPE conversation_close_method AS ENUM ('manual', 'auto_inactive');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Create enum for close reason
DO $$ BEGIN
    CREATE TYPE conversation_close_reason AS ENUM ('success', 'cancelled', 'not_actual', 'no_result', 'other');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Add lifecycle columns to conversations table
ALTER TABLE conversations
ADD COLUMN IF NOT EXISTS status conversation_status DEFAULT 'open',
ADD COLUMN IF NOT EXISTS closed_at TIMESTAMPTZ DEFAULT NULL,
ADD COLUMN IF NOT EXISTS closed_by UUID REFERENCES profiles(id) DEFAULT NULL,
ADD COLUMN IF NOT EXISTS closed_method conversation_close_method DEFAULT NULL,
ADD COLUMN IF NOT EXISTS closed_reason conversation_close_reason DEFAULT NULL,
ADD COLUMN IF NOT EXISTS reopened_at TIMESTAMPTZ DEFAULT NULL,
ADD COLUMN IF NOT EXISTS last_message_at TIMESTAMPTZ DEFAULT NULL,
ADD COLUMN IF NOT EXISTS reminder_14_sent_at TIMESTAMPTZ DEFAULT NULL,
ADD COLUMN IF NOT EXISTS reminder_21_sent_at TIMESTAMPTZ DEFAULT NULL;

-- Create index for finding inactive conversations (for auto-close cron)
CREATE INDEX IF NOT EXISTS idx_conversations_status_last_message 
ON conversations(status, last_message_at) 
WHERE status = 'active';

-- Create index for finding conversations to remind
CREATE INDEX IF NOT EXISTS idx_conversations_reminders 
ON conversations(status, last_message_at, reminder_14_sent_at, reminder_21_sent_at) 
WHERE status = 'active';

-- Update existing conversations: set last_message_at from latest message
UPDATE conversations c
SET last_message_at = (
    SELECT MAX(m.created_at) 
    FROM messages m 
    WHERE m.conversation_id = c.id
)
WHERE c.last_message_at IS NULL;

-- Update existing conversations: set status based on message existence
UPDATE conversations c
SET status = CASE 
    WHEN EXISTS (SELECT 1 FROM messages m WHERE m.conversation_id = c.id) THEN 'active'::conversation_status
    ELSE 'open'::conversation_status
END
WHERE c.status IS NULL OR c.status = 'open';

-- Function to update last_message_at when a message is inserted
CREATE OR REPLACE FUNCTION update_conversation_last_message()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE conversations 
    SET 
        last_message_at = NEW.created_at,
        status = 'active'::conversation_status
    WHERE id = NEW.conversation_id;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to automatically update last_message_at
DROP TRIGGER IF EXISTS trigger_update_conversation_last_message ON messages;
CREATE TRIGGER trigger_update_conversation_last_message
    AFTER INSERT ON messages
    FOR EACH ROW
    EXECUTE FUNCTION update_conversation_last_message();

-- Function to close a conversation
CREATE OR REPLACE FUNCTION close_conversation(
    p_conversation_id UUID,
    p_user_id UUID,
    p_method conversation_close_method,
    p_reason conversation_close_reason DEFAULT NULL
)
RETURNS conversations AS $$
DECLARE
    v_conversation conversations;
BEGIN
    UPDATE conversations
    SET 
        status = 'closed',
        closed_at = NOW(),
        closed_by = CASE WHEN p_method = 'manual' THEN p_user_id ELSE NULL END,
        closed_method = p_method,
        closed_reason = p_reason
    WHERE id = p_conversation_id
    RETURNING * INTO v_conversation;
    
    RETURN v_conversation;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to reopen a conversation
CREATE OR REPLACE FUNCTION reopen_conversation(
    p_conversation_id UUID,
    p_user_id UUID
)
RETURNS conversations AS $$
DECLARE
    v_conversation conversations;
BEGIN
    -- Only allow reopen within 14 days of closing
    UPDATE conversations
    SET 
        status = 'active',
        reopened_at = NOW()
    WHERE id = p_conversation_id
    AND status = 'closed'
    AND closed_at > NOW() - INTERVAL '14 days'
    AND seeker_id = p_user_id
    RETURNING * INTO v_conversation;
    
    RETURN v_conversation;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to auto-close inactive conversations (called by cron)
CREATE OR REPLACE FUNCTION auto_close_inactive_conversations()
RETURNS INTEGER AS $$
DECLARE
    v_count INTEGER;
BEGIN
    WITH closed AS (
        UPDATE conversations
        SET 
            status = 'closed',
            closed_at = NOW(),
            closed_by = NULL,
            closed_method = 'auto_inactive',
            closed_reason = NULL
        WHERE status = 'active'
        AND last_message_at < NOW() - INTERVAL '30 days'
        RETURNING id
    )
    SELECT COUNT(*) INTO v_count FROM closed;
    
    RETURN v_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get conversations needing 14-day reminder
CREATE OR REPLACE FUNCTION get_conversations_for_14_day_reminder()
RETURNS TABLE (
    conversation_id UUID,
    seeker_id UUID,
    provider_id UUID,
    last_message_at TIMESTAMPTZ
) AS $$
BEGIN
    RETURN QUERY
    SELECT c.id, c.seeker_id, c.provider_id, c.last_message_at
    FROM conversations c
    WHERE c.status = 'active'
    AND c.last_message_at < NOW() - INTERVAL '14 days'
    AND c.last_message_at >= NOW() - INTERVAL '21 days'
    AND c.reminder_14_sent_at IS NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get conversations needing 21-day reminder
CREATE OR REPLACE FUNCTION get_conversations_for_21_day_reminder()
RETURNS TABLE (
    conversation_id UUID,
    seeker_id UUID,
    provider_id UUID,
    last_message_at TIMESTAMPTZ
) AS $$
BEGIN
    RETURN QUERY
    SELECT c.id, c.seeker_id, c.provider_id, c.last_message_at
    FROM conversations c
    WHERE c.status = 'active'
    AND c.last_message_at < NOW() - INTERVAL '21 days'
    AND c.last_message_at >= NOW() - INTERVAL '30 days'
    AND c.reminder_21_sent_at IS NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to mark reminder as sent
CREATE OR REPLACE FUNCTION mark_reminder_sent(
    p_conversation_id UUID,
    p_reminder_type TEXT -- '14' or '21'
)
RETURNS VOID AS $$
BEGIN
    IF p_reminder_type = '14' THEN
        UPDATE conversations SET reminder_14_sent_at = NOW() WHERE id = p_conversation_id;
    ELSIF p_reminder_type = '21' THEN
        UPDATE conversations SET reminder_21_sent_at = NOW() WHERE id = p_conversation_id;
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Add comment on columns
COMMENT ON COLUMN conversations.status IS 'Conversation lifecycle status: open (no messages), active (has messages), closed';
COMMENT ON COLUMN conversations.closed_at IS 'Timestamp when conversation was closed';
COMMENT ON COLUMN conversations.closed_by IS 'User who closed the conversation (NULL for auto-close)';
COMMENT ON COLUMN conversations.closed_method IS 'How the conversation was closed: manual or auto_inactive';
COMMENT ON COLUMN conversations.closed_reason IS 'Reason for closing: success, cancelled, not_actual, no_result, other';
COMMENT ON COLUMN conversations.reopened_at IS 'Timestamp when conversation was reopened (if applicable)';
COMMENT ON COLUMN conversations.last_message_at IS 'Timestamp of the last message in this conversation';

-- RLS Policy: Allow seeker to update their own conversations (for close/reopen)
DROP POLICY IF EXISTS "conversations_update_seeker" ON conversations;
CREATE POLICY "conversations_update_seeker" ON conversations
    FOR UPDATE USING (auth.uid() = seeker_id);

-- ============================================================
-- IMPORTANT: Multiple conversations support
-- Allow multiple closed conversations but only ONE active per seeker+provider
-- ============================================================

-- Drop old unique constraint if exists (allows only one conversation per pair)
-- Must drop constraint first, then index (constraint depends on index)
ALTER TABLE conversations DROP CONSTRAINT IF EXISTS unique_conversation;
DROP INDEX IF EXISTS unique_conversation;

-- Create partial unique index: only ONE active conversation per seeker+provider
-- This allows multiple closed conversations but only one active
CREATE UNIQUE INDEX IF NOT EXISTS idx_unique_active_conversation
ON conversations(seeker_id, provider_id)
WHERE status IN ('open', 'active');

-- Update can_leave_review function to require closed conversation
CREATE OR REPLACE FUNCTION can_leave_review(p_reviewer_id UUID, p_provider_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
    -- Check if there's a CLOSED conversation where:
    -- 1. Reviewer is the seeker
    -- 2. Provider is the provider  
    -- 3. Conversation was closed (either manually or auto)
    -- 4. Reviewer has sent at least one message
    RETURN EXISTS (
        SELECT 1 FROM conversations c
        WHERE c.seeker_id = p_reviewer_id 
        AND c.provider_id = p_provider_id
        AND c.status = 'closed'
        AND EXISTS (
            SELECT 1 FROM messages m 
            WHERE m.conversation_id = c.id 
            AND m.sender_id = p_reviewer_id
        )
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
