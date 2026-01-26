-- ============================================================
-- Localisio MVP - Admin Features Extension
-- ============================================================

-- Add is_hidden field to provider_profiles for hiding from search
ALTER TABLE provider_profiles 
ADD COLUMN IF NOT EXISTS is_hidden BOOLEAN DEFAULT FALSE;

-- Add index for filtering hidden providers
CREATE INDEX IF NOT EXISTS idx_provider_profiles_hidden ON provider_profiles(is_hidden) WHERE is_hidden = FALSE;

-- Update RLS policy to allow admins to delete provider profiles
DROP POLICY IF EXISTS "provider_profiles_admin_delete" ON provider_profiles;
CREATE POLICY "provider_profiles_admin_delete" ON provider_profiles
    FOR DELETE USING (is_admin(auth.uid()));

-- Fix: Add INSERT policy for notifications (was missing)
DROP POLICY IF EXISTS "notifications_insert" ON notifications;
CREATE POLICY "notifications_insert" ON notifications
    FOR INSERT WITH CHECK (true);

-- ============================================================
-- Trigger to create notification on new message
-- ============================================================

CREATE OR REPLACE FUNCTION create_message_notification()
RETURNS TRIGGER AS $$
DECLARE
    conv RECORD;
    recipient_id UUID;
BEGIN
    -- Get conversation details
    SELECT * INTO conv FROM conversations WHERE id = NEW.conversation_id;
    
    -- Determine recipient (the user who is NOT the sender)
    IF NEW.sender_id = conv.seeker_id THEN
        recipient_id := conv.provider_id;
    ELSE
        recipient_id := conv.seeker_id;
    END IF;
    
    -- Create notification for recipient
    INSERT INTO notifications (user_id, type, payload)
    VALUES (
        recipient_id,
        'new_message',
        jsonb_build_object(
            'conversation_id', NEW.conversation_id,
            'message_id', NEW.id,
            'sender_id', NEW.sender_id
        )
    );
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for message notifications
DROP TRIGGER IF EXISTS trigger_message_notification ON messages;
CREATE TRIGGER trigger_message_notification
AFTER INSERT ON messages
FOR EACH ROW EXECUTE FUNCTION create_message_notification();

-- ============================================================
-- Enable Realtime for messages table
-- ============================================================
ALTER PUBLICATION supabase_realtime ADD TABLE messages;
