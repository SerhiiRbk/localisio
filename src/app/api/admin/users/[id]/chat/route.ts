// ============================================================
// Admin User Chat API
// GET - Get system conversation messages with a user
// POST - Send a message to user from admin (via system user)
// ============================================================

import { NextRequest, NextResponse } from 'next/server';
import { createClient, createServiceClient } from '@/lib/supabase/server';
import { z } from 'zod';

// System user ID (reserved UUID)
const SYSTEM_USER_ID = '00000000-0000-0000-0000-000000000000';

async function checkAdmin(supabase: Awaited<ReturnType<typeof createClient>>) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: 'Unauthorized', status: 401 };

  const { data: adminRole } = await supabase
    .from('admin_roles')
    .select('role')
    .eq('user_id', user.id)
    .single();

  if (!adminRole) return { error: 'Forbidden', status: 403 };
  return { user, adminRole };
}

// Get or create system conversation with user
async function getOrCreateSystemConversation(
  serviceClient: Awaited<ReturnType<typeof createServiceClient>>,
  userId: string
): Promise<string | null> {
  // Check for existing conversation
  const { data: existingConversation } = await serviceClient
    .from('conversations')
    .select('id')
    .eq('seeker_id', userId)
    .eq('provider_id', SYSTEM_USER_ID)
    .single();

  if (existingConversation) {
    return existingConversation.id;
  }

  // Check reverse
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

// GET - Get messages from system conversation
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: userId } = await params;
    const supabase = await createClient();

    const authCheck = await checkAdmin(supabase);
    if ('error' in authCheck) {
      return NextResponse.json({ error: authCheck.error }, { status: authCheck.status });
    }

    const serviceClient = await createServiceClient();

    // Get or create system conversation
    const conversationId = await getOrCreateSystemConversation(serviceClient, userId);
    if (!conversationId) {
      return NextResponse.json({ 
        conversation_id: null,
        messages: [],
        user: null,
      });
    }

    // Get user profile
    const { data: userProfile } = await serviceClient
      .from('profiles')
      .select('id, display_name, email, avatar_url, role')
      .eq('id', userId)
      .single();

    // Get all messages in the conversation
    const { data: messages, error: msgError } = await serviceClient
      .from('messages')
      .select(`
        id,
        conversation_id,
        sender_id,
        body,
        read_at,
        is_system_message,
        sent_by_admin_id,
        created_at
      `)
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: true });

    if (msgError) {
      console.error('Error fetching messages:', msgError);
      return NextResponse.json({ error: 'Failed to fetch messages' }, { status: 500 });
    }

    // Get admin profiles for messages sent by admins
    const adminIds = [...new Set(
      (messages || [])
        .filter(m => m.sent_by_admin_id)
        .map(m => m.sent_by_admin_id)
    )];

    let adminProfiles: Record<string, { display_name: string }> = {};
    if (adminIds.length > 0) {
      const { data: admins } = await serviceClient
        .from('profiles')
        .select('id, display_name')
        .in('id', adminIds);
      
      adminProfiles = (admins || []).reduce((acc, admin) => {
        acc[admin.id] = { display_name: admin.display_name };
        return acc;
      }, {} as Record<string, { display_name: string }>);
    }

    // Enrich messages with admin info
    const enrichedMessages = (messages || []).map(msg => ({
      ...msg,
      admin_name: msg.sent_by_admin_id ? adminProfiles[msg.sent_by_admin_id]?.display_name : null,
      is_from_user: msg.sender_id === userId,
      is_from_system: msg.sender_id === SYSTEM_USER_ID,
    }));

    return NextResponse.json({
      conversation_id: conversationId,
      messages: enrichedMessages,
      user: userProfile,
    });
  } catch (error) {
    console.error('Admin chat GET error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

const sendMessageSchema = z.object({
  message: z.string().min(1).max(5000),
});

// POST - Send message to user from admin
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: userId } = await params;
    const supabase = await createClient();

    const authCheck = await checkAdmin(supabase);
    if ('error' in authCheck) {
      return NextResponse.json({ error: authCheck.error }, { status: authCheck.status });
    }

    const body = await request.json();
    const validated = sendMessageSchema.parse(body);

    const serviceClient = await createServiceClient();

    // Get or create system conversation
    const conversationId = await getOrCreateSystemConversation(serviceClient, userId);
    if (!conversationId) {
      return NextResponse.json({ error: 'Failed to get conversation' }, { status: 500 });
    }

    // Create message from system user
    const { data: message, error: msgError } = await serviceClient
      .from('messages')
      .insert({
        conversation_id: conversationId,
        sender_id: SYSTEM_USER_ID,
        body: validated.message,
        is_system_message: true,
        sent_by_admin_id: authCheck.user.id,
      })
      .select()
      .single();

    if (msgError) {
      console.error('Error sending message:', msgError);
      return NextResponse.json({ error: 'Failed to send message' }, { status: 500 });
    }

    // Update conversation last_message_at
    await serviceClient
      .from('conversations')
      .update({ last_message_at: new Date().toISOString() })
      .eq('id', conversationId);

    // Create notification for the user
    await serviceClient
      .from('notifications')
      .insert({
        user_id: userId,
        type: 'new_message',
        title: 'New message from Localisio Support',
        message: validated.message.slice(0, 100),
        link: `/dashboard/messages/${conversationId}`,
      });

    return NextResponse.json({ 
      success: true,
      message: {
        ...message,
        is_from_user: false,
        is_from_system: true,
        admin_name: authCheck.user.email,
      },
    });
  } catch (error) {
    console.error('Admin chat POST error:', error);
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid message' }, { status: 400 });
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
