// ============================================================
// Reopen Conversation API
// ============================================================

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

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

    // Get conversation and verify ownership
    const { data: conversation, error: convError } = await supabase
      .from('conversations')
      .select('*')
      .eq('id', conversationId)
      .single();

    if (convError || !conversation) {
      return NextResponse.json({ error: 'Conversation not found' }, { status: 404 });
    }

    // Only the seeker (client) can reopen the conversation
    if (conversation.seeker_id !== user.id) {
      return NextResponse.json(
        { error: 'Only the client can reopen this conversation' },
        { status: 403 }
      );
    }

    // Check if conversation is closed
    if (conversation.status !== 'closed') {
      return NextResponse.json(
        { error: 'Conversation is not closed' },
        { status: 400 }
      );
    }

    // Check if within 14 days of closing
    const closedAt = new Date(conversation.closed_at);
    const fourteenDaysAgo = new Date();
    fourteenDaysAgo.setDate(fourteenDaysAgo.getDate() - 14);

    if (closedAt < fourteenDaysAgo) {
      return NextResponse.json(
        { error: 'Cannot reopen conversation after 14 days. Please start a new conversation.' },
        { status: 400 }
      );
    }

    // Check if there's already an active conversation with this provider
    const { data: activeConvs } = await supabase
      .from('conversations')
      .select('id')
      .eq('seeker_id', user.id)
      .eq('provider_id', conversation.provider_id)
      .in('status', ['open', 'active'])
      .neq('id', conversationId)
      .limit(1);

    if (activeConvs && activeConvs.length > 0) {
      // Active conversation exists - can't reopen this one
      return NextResponse.json(
        { 
          error: 'You already have an active conversation with this provider',
          active_conversation_id: activeConvs[0].id,
        },
        { status: 409 }
      );
    }

    // Reopen the conversation
    const { data: updatedRows, error: updateError } = await supabase
      .from('conversations')
      .update({
        status: 'active',
        reopened_at: new Date().toISOString(),
      })
      .eq('id', conversationId)
      .select();

    if (updateError) {
      console.error('Reopen conversation error:', updateError);
      return NextResponse.json(
        { error: 'Failed to reopen conversation', details: updateError.message },
        { status: 500 }
      );
    }

    const updatedConversation = updatedRows?.[0];
    if (!updatedConversation) {
      console.error('Reopen conversation: no rows returned after update');
      return NextResponse.json(
        { error: 'Failed to update conversation' },
        { status: 500 }
      );
    }

    // Create notification for provider about reopened conversation
    await supabase.from('notifications').insert({
      user_id: conversation.provider_id,
      type: 'conversation_reopened',
      payload: {
        conversation_id: conversationId,
        reopened_by: user.id,
      },
    });

    return NextResponse.json({ conversation: updatedConversation });
  } catch (error) {
    console.error('Reopen conversation error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
