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
    // Logic: 
    // - If open/active conversation exists - use it
    // - If only closed conversations exist - create NEW conversation (don't reopen)
    // - Multiple closed conversations allowed, but only ONE active
    let conversation;
    
    // Check for ACTIVE conversation only (open or active status)
    const { data: activeConvs, error: convQueryError } = await supabase
      .from('conversations')
      .select('*')
      .eq('seeker_id', user.id)
      .eq('provider_id', validated.provider_id)
      .in('status', ['open', 'active'])
      .limit(1);

    if (convQueryError) {
      console.error('Query conversation error:', convQueryError);
    }

    const activeConv = activeConvs?.[0];

    if (activeConv) {
      // Use existing active conversation
      conversation = activeConv;
      console.log('Using existing active conversation:', activeConv.id);
    } else {
      // No active conversation - create NEW one
      // (closed conversations stay closed, user can have multiple closed conversations)
      const { data: newConv, error: convError } = await supabase
        .from('conversations')
        .insert({
          seeker_id: user.id,
          provider_id: validated.provider_id,
          status: 'open',
        })
        .select()
        .single();

      if (convError) {
        // Handle unique constraint violation - active conversation might have been created in race condition
        if (convError.code === '23505') {
          console.log('Race condition: active conversation was just created, fetching it...');
          const { data: raceConvs } = await supabase
            .from('conversations')
            .select('*')
            .eq('seeker_id', user.id)
            .eq('provider_id', validated.provider_id)
            .in('status', ['open', 'active'])
            .limit(1);
          
          conversation = raceConvs?.[0];
          if (!conversation) {
            return NextResponse.json({ error: 'Failed to create conversation' }, { status: 500 });
          }
        } else {
          console.error('Create conversation error:', convError);
          return NextResponse.json({ error: 'Failed to create conversation' }, { status: 500 });
        }
      } else {
        conversation = newConv;
        console.log('Created new conversation:', newConv?.id);
      }
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
