// ============================================================
// Admin System Messages API
// POST - Send system message to users
// GET - List system message campaigns
// ============================================================

import { NextRequest, NextResponse } from 'next/server';
import { createClient, createServiceClient } from '@/lib/supabase/server';
import { z } from 'zod';

// System user ID (reserved UUID)
export const SYSTEM_USER_ID = '00000000-0000-0000-0000-000000000000';

const sendMessageSchema = z.object({
  target_type: z.enum([
    'all_users',
    'all_providers',
    'verified_providers',
    'unverified_providers',
    'non_providers',
    'single_user',
  ]),
  target_user_id: z.string().uuid().optional(),
  subject: z.string().max(200).optional(),
  message_text: z.string().min(1).max(5000),
});

// Helper to check if user is admin
async function isAdmin(supabase: Awaited<ReturnType<typeof createClient>>): Promise<{ isAdmin: boolean; userId: string | null }> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { isAdmin: false, userId: null };

  // Check if user has admin role in admin_roles table
  const { data: adminRole } = await supabase
    .from('admin_roles')
    .select('role')
    .eq('user_id', user.id)
    .single();

  return { isAdmin: !!adminRole, userId: user.id };
}

// Get target users based on target_type
async function getTargetUsers(
  supabase: Awaited<ReturnType<typeof createServiceClient>>,
  targetType: string,
  targetUserId?: string
): Promise<{ id: string }[]> {
  switch (targetType) {
    case 'all_users':
      const { data: allUsers } = await supabase
        .from('profiles')
        .select('id')
        .neq('id', SYSTEM_USER_ID);
      return allUsers || [];

    case 'all_providers':
      const { data: allProviders } = await supabase
        .from('profiles')
        .select('id')
        .eq('role', 'provider')
        .neq('id', SYSTEM_USER_ID);
      return allProviders || [];

    case 'verified_providers':
      const { data: verifiedProviders } = await supabase
        .from('provider_profiles')
        .select('user_id')
        .eq('is_verified', true);
      return (verifiedProviders || []).map(p => ({ id: p.user_id }));

    case 'unverified_providers':
      const { data: unverifiedProviders } = await supabase
        .from('provider_profiles')
        .select('user_id')
        .eq('is_verified', false);
      return (unverifiedProviders || []).map(p => ({ id: p.user_id }));

    case 'non_providers':
      const { data: nonProviders } = await supabase
        .from('profiles')
        .select('id')
        .eq('role', 'seeker')
        .neq('id', SYSTEM_USER_ID);
      return nonProviders || [];

    case 'single_user':
      if (!targetUserId) return [];
      return [{ id: targetUserId }];

    default:
      return [];
  }
}

// Create or get existing conversation with system user
async function getOrCreateSystemConversation(
  supabase: Awaited<ReturnType<typeof createServiceClient>>,
  userId: string
): Promise<string | null> {
  // First, check if there's an existing conversation where the system user is the provider
  // and the target user is the seeker (using the standard seeker/provider model)
  const { data: existingConversation } = await supabase
    .from('conversations')
    .select('id')
    .eq('seeker_id', userId)
    .eq('provider_id', SYSTEM_USER_ID)
    .single();

  if (existingConversation) {
    return existingConversation.id;
  }

  // Also check the reverse (in case user initiated)
  const { data: existingReverse } = await supabase
    .from('conversations')
    .select('id')
    .eq('seeker_id', SYSTEM_USER_ID)
    .eq('provider_id', userId)
    .single();

  if (existingReverse) {
    return existingReverse.id;
  }

  // Create new conversation with system user as "provider" and target user as "seeker"
  const { data: newConversation, error: convError } = await supabase
    .from('conversations')
    .insert({
      seeker_id: userId,
      provider_id: SYSTEM_USER_ID,
    })
    .select('id')
    .single();

  if (convError || !newConversation) {
    console.error('Failed to create conversation:', convError);
    return null;
  }

  // Also add to conversation_participants for alternative query patterns
  await supabase
    .from('conversation_participants')
    .insert([
      { conversation_id: newConversation.id, user_id: SYSTEM_USER_ID },
      { conversation_id: newConversation.id, user_id: userId },
    ]);

  return newConversation.id;
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { isAdmin: isAdminUser, userId: adminId } = await isAdmin(supabase);

    if (!isAdminUser || !adminId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const validated = sendMessageSchema.parse(body);

    if (validated.target_type === 'single_user' && !validated.target_user_id) {
      return NextResponse.json(
        { error: 'target_user_id is required for single_user target' },
        { status: 400 }
      );
    }

    // Use service client for admin operations
    const serviceClient = await createServiceClient();

    // Create campaign record
    const { data: campaign, error: campaignError } = await serviceClient
      .from('system_message_campaigns')
      .insert({
        admin_id: adminId,
        target_type: validated.target_type,
        target_user_id: validated.target_user_id || null,
        subject: validated.subject || null,
        message_text: validated.message_text,
        status: 'sending',
      })
      .select()
      .single();

    if (campaignError || !campaign) {
      console.error('Failed to create campaign:', campaignError);
      return NextResponse.json({ error: 'Failed to create campaign' }, { status: 500 });
    }

    // Get target users
    const targetUsers = await getTargetUsers(
      serviceClient,
      validated.target_type,
      validated.target_user_id
    );

    let deliveredCount = 0;
    const errors: string[] = [];

    // Send message to each user
    for (const user of targetUsers) {
      try {
        // Get or create conversation
        const conversationId = await getOrCreateSystemConversation(serviceClient, user.id);
        if (!conversationId) {
          errors.push(`Failed to get/create conversation for user ${user.id}`);
          continue;
        }

        // Format message with optional subject
        const fullMessage = validated.subject
          ? `**${validated.subject}**\n\n${validated.message_text}`
          : validated.message_text;

        // Create message (use 'body' column as per messages table schema)
        const { data: message, error: msgError } = await serviceClient
          .from('messages')
          .insert({
            conversation_id: conversationId,
            sender_id: SYSTEM_USER_ID,
            body: fullMessage,
            is_system_message: true,
            sent_by_admin_id: adminId,
          })
          .select()
          .single();

        if (msgError || !message) {
          errors.push(`Failed to send message to user ${user.id}: ${msgError?.message}`);
          continue;
        }

        // Update conversation last_message_at
        await serviceClient
          .from('conversations')
          .update({ last_message_at: new Date().toISOString() })
          .eq('id', conversationId);

        // Create delivery record
        await serviceClient
          .from('system_message_deliveries')
          .insert({
            campaign_id: campaign.id,
            user_id: user.id,
            conversation_id: conversationId,
            message_id: message.id,
          });

        // Create notification for the user
        await serviceClient
          .from('notifications')
          .insert({
            user_id: user.id,
            type: 'new_message',
            title: 'New message from Localisio System',
            message: validated.subject || validated.message_text.slice(0, 100),
            link: `/dashboard/messages/${conversationId}`,
          });

        deliveredCount++;
      } catch (err) {
        console.error(`Error sending to user ${user.id}:`, err);
        errors.push(`Error for user ${user.id}`);
      }
    }

    // Update campaign stats
    await serviceClient
      .from('system_message_campaigns')
      .update({
        status: 'sent',
        sent_at: new Date().toISOString(),
        recipients_count: targetUsers.length,
        delivered_count: deliveredCount,
      })
      .eq('id', campaign.id);

    return NextResponse.json({
      success: true,
      campaign_id: campaign.id,
      recipients_count: targetUsers.length,
      delivered_count: deliveredCount,
      errors: errors.length > 0 ? errors : undefined,
    });
  } catch (error) {
    console.error('System message error:', error);
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid request', details: error.errors }, { status: 400 });
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { isAdmin: isAdminUser } = await isAdmin(supabase);

    if (!isAdminUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '20');
    const offset = parseInt(searchParams.get('offset') || '0');

    const { data: campaigns, error } = await supabase
      .from('system_message_campaigns')
      .select(`
        *,
        admin:profiles!admin_id(display_name, avatar_url),
        target_user:profiles!target_user_id(display_name, email)
      `)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      console.error('Failed to fetch campaigns:', error);
      return NextResponse.json({ error: 'Failed to fetch campaigns' }, { status: 500 });
    }

    return NextResponse.json({ campaigns });
  } catch (error) {
    console.error('Get campaigns error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
