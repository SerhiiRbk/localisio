// ============================================================
// GET/POST /api/messages/[conversationId] - Get messages or send to conversation
// ============================================================

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { sendMessageToConversationSchema } from '@/lib/validations/message';
import {
  checkRateLimit,
  MESSAGE_RATE_LIMIT,
  CONVERSATION_MESSAGE_RATE_LIMIT,
} from '@/lib/rate-limit';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ conversationId: string }> }
) {
  try {
    const { conversationId } = await params;
    const supabase = await createClient();

    // Check authentication
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Verify user is part of conversation
    const { data: conversation, error: convError } = await supabase
      .from('conversations')
      .select(`
        *,
        seeker:profiles!conversations_seeker_id_fkey(*),
        provider:profiles!conversations_provider_id_fkey(*)
      `)
      .eq('id', conversationId)
      .single();

    if (convError || !conversation) {
      return NextResponse.json({ error: 'Conversation not found' }, { status: 404 });
    }

    if (conversation.seeker_id !== user.id && conversation.provider_id !== user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Get messages
    const { data: messages, error: messagesError } = await supabase
      .from('messages')
      .select(`
        *,
        sender:profiles!messages_sender_id_fkey(*)
      `)
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: true });

    if (messagesError) {
      console.error('Get messages error:', messagesError);
      return NextResponse.json({ error: 'Failed to fetch messages' }, { status: 500 });
    }

    // Mark messages as read
    await supabase
      .from('messages')
      .update({ read_at: new Date().toISOString() })
      .eq('conversation_id', conversationId)
      .neq('sender_id', user.id)
      .is('read_at', null);

    return NextResponse.json({ conversation, messages: messages || [] });
  } catch (error) {
    console.error('Get messages error:', error);
    return NextResponse.json({ error: 'Failed to fetch messages' }, { status: 500 });
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ conversationId: string }> }
) {
  try {
    const { conversationId } = await params;
    const supabase = await createClient();

    // Check authentication
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user is blocked
    const { data: profile } = await supabase
      .from('profiles')
      .select('is_blocked')
      .eq('id', user.id)
      .single();

    if (profile?.is_blocked) {
      return NextResponse.json(
        { error: 'Your account has been blocked. You cannot send messages.' },
        { status: 403 }
      );
    }

    // Global rate limit (safety net)
    const globalLimit = checkRateLimit(`message:${user.id}`, MESSAGE_RATE_LIMIT);
    if (!globalLimit.allowed) {
      return NextResponse.json(
        { error: 'Too many messages. Please wait.' },
        { status: 429 }
      );
    }

    // Per-conversation rate limit (10 messages/min per conversation)
    const convLimit = checkRateLimit(
      `conv_msg:${user.id}:${conversationId}`,
      CONVERSATION_MESSAGE_RATE_LIMIT
    );
    if (!convLimit.allowed) {
      return NextResponse.json(
        { error: 'You are sending messages too fast in this conversation. Please slow down.' },
        { status: 429 }
      );
    }

    const body = await request.json();
    const validated = sendMessageToConversationSchema.parse({
      ...body,
      conversation_id: conversationId,
    });

    // Verify user is part of conversation
    const { data: conversation, error: convError } = await supabase
      .from('conversations')
      .select('*')
      .eq('id', conversationId)
      .single();

    if (convError || !conversation) {
      return NextResponse.json({ error: 'Conversation not found' }, { status: 404 });
    }

    if (conversation.seeker_id !== user.id && conversation.provider_id !== user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Check if seeker is blocked by the provider (only restricts the seeker, not the provider)
    if (conversation.seeker_id === user.id) {
      const { data: blockRecord } = await supabase
        .from('provider_blocked_users')
        .select('id')
        .eq('provider_id', conversation.provider_id)
        .eq('blocked_user_id', user.id)
        .single();

      if (blockRecord) {
        return NextResponse.json(
          { error: 'You have been blocked by this provider.' },
          { status: 403 }
        );
      }
    }

    // Create message
    const { data: message, error: messageError } = await supabase
      .from('messages')
      .insert({
        conversation_id: conversationId,
        sender_id: user.id,
        body: validated.body,
      })
      .select(`
        *,
        sender:profiles!messages_sender_id_fkey(*)
      `)
      .single();

    if (messageError) {
      console.error('Create message error:', messageError);
      return NextResponse.json({ error: 'Failed to send message' }, { status: 500 });
    }

    return NextResponse.json({ message });
  } catch (error) {
    console.error('Send message error:', error);
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
  }
}
