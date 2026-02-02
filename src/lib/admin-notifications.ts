// ============================================================
// Admin Notification Helper
// Send system messages to users for admin actions
// ============================================================

import { createClient as createSupabaseClient } from '@supabase/supabase-js';

// System user ID (reserved UUID)
export const SYSTEM_USER_ID = '00000000-0000-0000-0000-000000000000';

// Create service client for admin operations
function getServiceClient() {
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    }
  );
}

// Get or create system conversation with user
async function getOrCreateSystemConversation(
  serviceClient: ReturnType<typeof getServiceClient>,
  userId: string
): Promise<string | null> {
  // Check if there's an existing conversation
  const { data: existingConversation } = await serviceClient
    .from('conversations')
    .select('id')
    .eq('seeker_id', userId)
    .eq('provider_id', SYSTEM_USER_ID)
    .single();

  if (existingConversation) {
    return existingConversation.id;
  }

  // Also check the reverse
  const { data: existingReverse } = await serviceClient
    .from('conversations')
    .select('id')
    .eq('seeker_id', SYSTEM_USER_ID)
    .eq('provider_id', userId)
    .single();

  if (existingReverse) {
    return existingReverse.id;
  }

  // Create new conversation
  const { data: newConversation, error: convError } = await serviceClient
    .from('conversations')
    .insert({
      seeker_id: userId,
      provider_id: SYSTEM_USER_ID,
    })
    .select('id')
    .single();

  if (convError || !newConversation) {
    console.error('Failed to create system conversation:', convError);
    return null;
  }

  return newConversation.id;
}

export type AdminNotificationType = 
  | 'profile_approved'
  | 'profile_approval_revoked'
  | 'profile_verified'
  | 'account_blocked'
  | 'account_unblocked';

interface NotificationMessages {
  subject: string;
  body: string;
}

const notificationMessages: Record<AdminNotificationType, NotificationMessages> = {
  profile_approved: {
    subject: '🎉 Your profile has been approved!',
    body: `Great news! Your profile has been reviewed and approved by our team.

Your profile is now visible to potential clients in search results. Here are some tips to get started:

- **Complete your profile** - Add more details about your services and experience
- **Add photos** - Profiles with photos get more engagement
- **Set your availability** - Let clients know when you're available

Good luck! We're here to help if you have any questions.`,
  },
  profile_approval_revoked: {
    subject: '⚠️ Your profile approval has been revoked',
    body: `Your profile has been temporarily hidden from search results.

This may happen for various reasons:
- Profile information needs to be updated
- Compliance with our community guidelines
- Incomplete or inaccurate information

Please review your profile and make any necessary updates. If you believe this was done in error, please contact our support team.`,
  },
  profile_verified: {
    subject: '✅ Your profile is now verified!',
    body: `Congratulations! Your profile has been verified by our team.

A verification badge will now appear on your profile, showing potential clients that you've been reviewed and approved by Localisio.

Verified profiles typically receive:
- **More visibility** in search results
- **Higher trust** from potential clients
- **Better conversion rates**

Keep up the great work!`,
  },
  account_blocked: {
    subject: '🚫 Your account has been suspended',
    body: `Your account has been suspended due to a violation of our Terms of Service or Community Guidelines.

During this suspension:
- You cannot access most features of the platform
- Your profile is hidden from other users
- Your conversations are preserved but you cannot send new messages

If you believe this was done in error or would like to appeal this decision, please contact our support team.`,
  },
  account_unblocked: {
    subject: '✅ Your account has been restored',
    body: `Good news! Your account has been restored and you now have full access to the platform again.

All your previous data, including:
- Your profile
- Your conversations
- Your reviews

...have been preserved and are available.

Please review our Community Guidelines to ensure continued access to the platform. We're glad to have you back!`,
  },
};

/**
 * Send an admin notification to a user
 */
export async function sendAdminNotification(
  userId: string,
  type: AdminNotificationType,
  customMessage?: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const serviceClient = getServiceClient();
    
    // Get or create conversation
    const conversationId = await getOrCreateSystemConversation(serviceClient, userId);
    if (!conversationId) {
      return { success: false, error: 'Failed to get/create conversation' };
    }

    // Get message content
    const { subject, body } = notificationMessages[type];
    const fullMessage = customMessage 
      ? `**${subject}**\n\n${customMessage}`
      : `**${subject}**\n\n${body}`;

    // Create message
    const { error: msgError } = await serviceClient
      .from('messages')
      .insert({
        conversation_id: conversationId,
        sender_id: SYSTEM_USER_ID,
        body: fullMessage,
        is_system_message: true,
      });

    if (msgError) {
      console.error('Failed to send admin notification:', msgError);
      return { success: false, error: msgError.message };
    }

    // Update conversation last_message_at
    await serviceClient
      .from('conversations')
      .update({ last_message_at: new Date().toISOString() })
      .eq('id', conversationId);

    // Create notification
    await serviceClient
      .from('notifications')
      .insert({
        user_id: userId,
        type: 'new_message',
        title: subject,
        message: body.slice(0, 100) + '...',
        link: `/dashboard/messages/${conversationId}`,
      });

    return { success: true };
  } catch (error) {
    console.error('Error sending admin notification:', error);
    return { success: false, error: 'Internal error' };
  }
}
