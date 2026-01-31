// ============================================================
// Admin System Message Campaign Details API
// GET - Get campaign details with deliveries and replies
// DELETE - Delete a campaign and its messages
// ============================================================

import { NextRequest, NextResponse } from 'next/server';
import { createClient, createServiceClient } from '@/lib/supabase/server';
import { SYSTEM_USER_ID } from '../route';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createClient();

    // Check if admin
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user has admin role in admin_roles table
    const { data: adminRole } = await supabase
      .from('admin_roles')
      .select('role')
      .eq('user_id', user.id)
      .single();

    if (!adminRole) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get campaign details
    const { data: campaign, error: campaignError } = await supabase
      .from('system_message_campaigns')
      .select(`
        *,
        admin:profiles!admin_id(id, display_name, avatar_url),
        target_user:profiles!target_user_id(id, display_name, email)
      `)
      .eq('id', id)
      .single();

    if (campaignError || !campaign) {
      return NextResponse.json({ error: 'Campaign not found' }, { status: 404 });
    }

    // Get deliveries with user info and reply status
    const { data: deliveries } = await supabase
      .from('system_message_deliveries')
      .select(`
        *,
        user:profiles!user_id(id, display_name, email, avatar_url, role),
        conversation:conversations(id)
      `)
      .eq('campaign_id', id)
      .order('delivered_at', { ascending: false });

    // Get replies for this campaign
    // Replies are messages in the same conversations where sender is not the system user
    const conversationIds = (deliveries || [])
      .map(d => d.conversation_id)
      .filter(Boolean);

    let replies: any[] = [];
    if (conversationIds.length > 0) {
      const { data: replyMessages } = await supabase
        .from('messages')
        .select(`
          *,
          sender:profiles!sender_id(id, display_name, avatar_url)
        `)
        .in('conversation_id', conversationIds)
        .neq('sender_id', SYSTEM_USER_ID)
        .gt('created_at', campaign.sent_at || campaign.created_at)
        .order('created_at', { ascending: false });

      replies = replyMessages || [];
    }

    return NextResponse.json({
      campaign,
      deliveries: deliveries || [],
      replies,
      stats: {
        total_recipients: campaign.recipients_count,
        delivered: campaign.delivered_count,
        read: (deliveries || []).filter(d => d.read_at).length,
        replied: replies.length,
      },
    });
  } catch (error) {
    console.error('Get campaign details error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createClient();

    // Check if admin
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user has admin role in admin_roles table
    const { data: adminRole } = await supabase
      .from('admin_roles')
      .select('role')
      .eq('user_id', user.id)
      .single();

    if (!adminRole) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Use service client to bypass RLS
    const serviceClient = await createServiceClient();

    // Get campaign deliveries to find message IDs
    const { data: deliveries } = await serviceClient
      .from('system_message_deliveries')
      .select('message_id, conversation_id')
      .eq('campaign_id', id);

    if (deliveries && deliveries.length > 0) {
      // Delete the messages from the messages table
      const messageIds = deliveries.map(d => d.message_id).filter(Boolean);
      if (messageIds.length > 0) {
        await serviceClient
          .from('messages')
          .delete()
          .in('id', messageIds);
      }
    }

    // Delete system_message_deliveries
    await serviceClient
      .from('system_message_deliveries')
      .delete()
      .eq('campaign_id', id);

    // Delete the campaign
    const { error: deleteError } = await serviceClient
      .from('system_message_campaigns')
      .delete()
      .eq('id', id);

    if (deleteError) {
      console.error('Failed to delete campaign:', deleteError);
      return NextResponse.json({ error: 'Failed to delete campaign' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Delete campaign error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
