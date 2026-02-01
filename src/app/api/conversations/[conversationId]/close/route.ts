// ============================================================
// Close Conversation API
// ============================================================

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { z } from 'zod';

const closeConversationSchema = z.object({
  reason: z.enum(['success', 'cancelled', 'not_actual', 'no_result', 'other']).optional(),
});

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ conversationId: string }> }
) {
  try {
    const { conversationId } = await params;
    const supabase = await createClient();

    // Get current user
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Parse request body
    const body = await request.json().catch(() => ({}));
    const { reason } = closeConversationSchema.parse(body);

    // Get conversation and verify ownership (only seeker can close)
    const { data: conversation, error: convError } = await supabase
      .from('conversations')
      .select('*')
      .eq('id', conversationId)
      .single();

    if (convError || !conversation) {
      return NextResponse.json({ error: 'Conversation not found' }, { status: 404 });
    }

    // Only the seeker (client) can close the conversation
    if (conversation.seeker_id !== user.id) {
      return NextResponse.json(
        { error: 'Only the client can close this conversation' },
        { status: 403 }
      );
    }

    // Check if already closed
    if (conversation.status === 'closed') {
      return NextResponse.json(
        { error: 'Conversation is already closed' },
        { status: 400 }
      );
    }

    // Close the conversation
    const { data: updatedRows, error: updateError } = await supabase
      .from('conversations')
      .update({
        status: 'closed',
        closed_at: new Date().toISOString(),
        closed_by: user.id,
        closed_method: 'manual',
        closed_reason: reason || null,
      })
      .eq('id', conversationId)
      .select();

    if (updateError) {
      console.error('Close conversation error:', updateError);
      return NextResponse.json(
        { error: 'Failed to close conversation', details: updateError.message },
        { status: 500 }
      );
    }

    const updatedConversation = updatedRows?.[0];
    if (!updatedConversation) {
      // Update didn't return any rows - likely RLS policy issue or migration not run
      console.error('Close conversation: no rows returned after update');
      return NextResponse.json(
        { error: 'Failed to update conversation. Please ensure the database migration has been run.' },
        { status: 500 }
      );
    }

    // Create notification for provider about closed conversation
    await supabase.from('notifications').insert({
      user_id: conversation.provider_id,
      type: 'conversation_closed',
      payload: {
        conversation_id: conversationId,
        closed_by: user.id,
        closed_reason: reason || null,
      },
    });

    return NextResponse.json({ conversation: updatedConversation });
  } catch (error) {
    console.error('Close conversation error:', error);
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid request', details: error.issues }, { status: 400 });
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
