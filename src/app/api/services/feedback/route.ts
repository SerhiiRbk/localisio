// ============================================================
// Services Feedback API
// Send user feedback about missing services to Localisio System
// ============================================================

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createClient as createSupabaseClient } from '@supabase/supabase-js';
import { z } from 'zod';

// System user ID (reserved UUID)
const SYSTEM_USER_ID = '00000000-0000-0000-0000-000000000000';

const feedbackSchema = z.object({
  message: z.string().min(10, 'Message must be at least 10 characters').max(1000, 'Message too long'),
});

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

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Check authentication
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Parse and validate body
    const body = await request.json();
    const validated = feedbackSchema.parse(body);

    // Get user profile
    const { data: profile } = await supabase
      .from('profiles')
      .select('display_name')
      .eq('id', user.id)
      .single();

    const userName = profile?.display_name || user.email || 'User';
    const serviceClient = getServiceClient();

    // Get or create system conversation for feedback
    // Check if there's an existing conversation
    let conversationId: string | null = null;

    const { data: existingConversation } = await serviceClient
      .from('conversations')
      .select('id')
      .eq('seeker_id', user.id)
      .eq('provider_id', SYSTEM_USER_ID)
      .single();

    if (existingConversation) {
      conversationId = existingConversation.id;
    } else {
      // Create new conversation
      const { data: newConversation, error: convError } = await serviceClient
        .from('conversations')
        .insert({
          seeker_id: user.id,
          provider_id: SYSTEM_USER_ID,
        })
        .select('id')
        .single();

      if (convError || !newConversation) {
        console.error('Failed to create system conversation:', convError);
        return NextResponse.json({ error: 'Failed to create conversation' }, { status: 500 });
      }

      conversationId = newConversation.id;
    }

    // Create the feedback message
    const formattedMessage = `**📋 Service Feedback from ${userName}**

---

${validated.message}

---
_This feedback was sent from the Services page._`;

    const { error: msgError } = await serviceClient
      .from('messages')
      .insert({
        conversation_id: conversationId,
        sender_id: user.id,
        body: formattedMessage,
      });

    if (msgError) {
      console.error('Failed to send feedback message:', msgError);
      return NextResponse.json({ error: 'Failed to send message' }, { status: 500 });
    }

    // Update conversation last_message_at and status
    await serviceClient
      .from('conversations')
      .update({ 
        last_message_at: new Date().toISOString(),
        status: 'active',
      })
      .eq('id', conversationId);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Feedback error:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.issues[0].message },
        { status: 400 }
      );
    }

    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
