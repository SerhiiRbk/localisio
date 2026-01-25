// ============================================================
// POST /api/messages - Send a message (creates conversation if needed)
// ============================================================

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { sendMessageSchema } from '@/lib/validations/message';
import { checkRateLimit, MESSAGE_RATE_LIMIT } from '@/lib/rate-limit';

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Check authentication
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Rate limit check
    const rateLimit = checkRateLimit(`message:${user.id}`, MESSAGE_RATE_LIMIT);
    if (!rateLimit.allowed) {
      return NextResponse.json(
        { error: 'Too many messages. Please wait.' },
        { status: 429 }
      );
    }

    const body = await request.json();
    const validated = sendMessageSchema.parse(body);

    // Check that user is not messaging themselves
    if (user.id === validated.provider_id) {
      return NextResponse.json({ error: 'Cannot message yourself' }, { status: 400 });
    }

    // Check if provider exists
    const { data: provider, error: providerError } = await supabase
      .from('provider_profiles')
      .select('user_id')
      .eq('user_id', validated.provider_id)
      .single();

    if (providerError || !provider) {
      return NextResponse.json({ error: 'Provider not found' }, { status: 404 });
    }

    // Get or create conversation
    let conversation;
    const { data: existingConv } = await supabase
      .from('conversations')
      .select('*')
      .eq('seeker_id', user.id)
      .eq('provider_id', validated.provider_id)
      .single();

    if (existingConv) {
      conversation = existingConv;
    } else {
      // Create new conversation
      const { data: newConv, error: convError } = await supabase
        .from('conversations')
        .insert({
          seeker_id: user.id,
          provider_id: validated.provider_id,
        })
        .select()
        .single();

      if (convError) {
        console.error('Create conversation error:', convError);
        return NextResponse.json({ error: 'Failed to create conversation' }, { status: 500 });
      }
      conversation = newConv;
    }

    // Create message
    const { data: message, error: messageError } = await supabase
      .from('messages')
      .insert({
        conversation_id: conversation.id,
        sender_id: user.id,
        body: validated.body,
      })
      .select()
      .single();

    if (messageError) {
      console.error('Create message error:', messageError);
      return NextResponse.json({ error: 'Failed to send message' }, { status: 500 });
    }

    return NextResponse.json({ conversation, message });
  } catch (error) {
    console.error('Send message error:', error);
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
  }
}
