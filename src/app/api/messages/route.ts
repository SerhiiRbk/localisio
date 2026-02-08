// ============================================================
// POST /api/messages - Send a message (creates conversation if needed)
// ============================================================

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { sendMessageSchema } from '@/lib/validations/message';
import {
  checkRateLimit,
  MESSAGE_RATE_LIMIT,
  NEW_CONVERSATION_COOLDOWN,
  getNewConversationLimits,
  isDuplicateSpam,
  trackFirstMessage,
} from '@/lib/rate-limit';

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

    // Check if user is blocked + get account age for rate limit tiers
    const { data: profile } = await supabase
      .from('profiles')
      .select('is_blocked, created_at')
      .eq('id', user.id)
      .single();

    if (profile?.is_blocked) {
      return NextResponse.json(
        { error: 'Your account has been blocked. You cannot send messages.' },
        { status: 403 }
      );
    }

    // Global rate limit (safety net)
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

    // Check if seeker is blocked by this provider
    const { data: blockRecord } = await supabase
      .from('provider_blocked_users')
      .select('id')
      .eq('provider_id', validated.provider_id)
      .eq('blocked_user_id', user.id)
      .single();

    if (blockRecord) {
      return NextResponse.json(
        { error: 'You have been blocked by this provider.' },
        { status: 403 }
      );
    }

    // Get or create conversation
    let conversation;
    let isNewConversation = false;
    
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
    } else {
      // --- Anti-spam checks for new conversations ---

      // 1. Cooldown between new conversations (30s)
      const cooldown = checkRateLimit(
        `new_conv_cooldown:${user.id}`,
        NEW_CONVERSATION_COOLDOWN
      );
      if (!cooldown.allowed) {
        const waitSeconds = Math.ceil(cooldown.resetIn / 1000);
        return NextResponse.json(
          { error: `Please wait ${waitSeconds} seconds before contacting another provider.` },
          { status: 429 }
        );
      }

      // 2. Hourly & daily new-conversation limits (based on account age)
      const limits = getNewConversationLimits(profile?.created_at || user.created_at);

      const oneHourAgo = new Date(Date.now() - 3600000).toISOString();
      const { count: hourlyCount } = await supabase
        .from('conversations')
        .select('*', { count: 'exact', head: true })
        .eq('seeker_id', user.id)
        .gte('created_at', oneHourAgo);

      if ((hourlyCount ?? 0) >= limits.perHour) {
        return NextResponse.json(
          { error: 'You have reached the hourly limit for new conversations. Please try again later.' },
          { status: 429 }
        );
      }

      const oneDayAgo = new Date(Date.now() - 86400000).toISOString();
      const { count: dailyCount } = await supabase
        .from('conversations')
        .select('*', { count: 'exact', head: true })
        .eq('seeker_id', user.id)
        .gte('created_at', oneDayAgo);

      if ((dailyCount ?? 0) >= limits.perDay) {
        return NextResponse.json(
          { error: 'You have reached the daily limit for new conversations. Please try again tomorrow.' },
          { status: 429 }
        );
      }

      // 3. Duplicate message detection (same text to 3+ providers in an hour)
      if (isDuplicateSpam(user.id, validated.body)) {
        return NextResponse.json(
          { error: 'You have sent similar messages to multiple providers. Please personalize your messages.' },
          { status: 429 }
        );
      }

      // --- All checks passed, create new conversation ---
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
        // Handle unique constraint violation - race condition
        if (convError.code === '23505') {
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
        isNewConversation = true;
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

    // Track first message for duplicate detection
    if (isNewConversation) {
      trackFirstMessage(user.id, validated.body);
    }

    return NextResponse.json({ conversation, message });
  } catch (error) {
    console.error('Send message error:', error);
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
  }
}
