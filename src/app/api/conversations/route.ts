// ============================================================
// GET /api/conversations - Get user's conversations
// ============================================================

import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// System user ID (reserved UUID for system messages)
const SYSTEM_USER_ID = '00000000-0000-0000-0000-000000000000';

export async function GET() {
  try {
    const supabase = await createClient();

    // Check authentication
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get all conversations where user is seeker or provider
    // This includes system conversations (where provider_id = SYSTEM_USER_ID)
    const { data: conversations, error } = await supabase
      .from('conversations')
      .select(`
        *,
        seeker:profiles!conversations_seeker_id_fkey(*),
        provider:profiles!conversations_provider_id_fkey(*)
      `)
      .or(`seeker_id.eq.${user.id},provider_id.eq.${user.id}`)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Get conversations error:', error);
      return NextResponse.json({ error: 'Failed to fetch conversations' }, { status: 500 });
    }

    // Get last message and unread count for each conversation
    const conversationsWithDetails = await Promise.all(
      (conversations || []).map(async (conv) => {
        // Check if this is a system conversation
        const isSystemConversation = conv.seeker_id === SYSTEM_USER_ID || conv.provider_id === SYSTEM_USER_ID;

        // Get last message
        const { data: lastMessage } = await supabase
          .from('messages')
          .select('*')
          .eq('conversation_id', conv.id)
          .order('created_at', { ascending: false })
          .limit(1)
          .single();

        // Get unread count
        const { count: unreadCount } = await supabase
          .from('messages')
          .select('*', { count: 'exact', head: true })
          .eq('conversation_id', conv.id)
          .neq('sender_id', user.id)
          .is('read_at', null);

        return {
          ...conv,
          is_system_conversation: isSystemConversation,
          last_message: lastMessage || undefined,
          unread_count: unreadCount || 0,
        };
      })
    );

    // Sort by last message time
    conversationsWithDetails.sort((a, b) => {
      const aTime = a.last_message?.created_at || a.created_at;
      const bTime = b.last_message?.created_at || b.created_at;
      return new Date(bTime).getTime() - new Date(aTime).getTime();
    });

    return NextResponse.json({ conversations: conversationsWithDetails });
  } catch (error) {
    console.error('Get conversations error:', error);
    return NextResponse.json({ error: 'Failed to fetch conversations' }, { status: 500 });
  }
}
