// ============================================================
// Cron Job: Conversation Lifecycle Management
// Handles: auto-close inactive conversations, send reminders
// Call this endpoint via cron (e.g., daily at midnight)
// ============================================================

import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/server';

// Verify cron secret to prevent unauthorized access
const CRON_SECRET = process.env.CRON_SECRET;

export async function POST(request: NextRequest) {
  try {
    // Verify authorization
    const authHeader = request.headers.get('authorization');
    if (CRON_SECRET && authHeader !== `Bearer ${CRON_SECRET}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabase = await createServiceClient();
    const results = {
      autoClosedCount: 0,
      reminder14Count: 0,
      reminder21Count: 0,
      errors: [] as string[],
    };

    // 1. Auto-close conversations inactive for 30+ days
    const { data: toAutoClose, error: autoCloseQueryError } = await supabase
      .from('conversations')
      .select('id, seeker_id, provider_id')
      .eq('status', 'active')
      .lt('last_message_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString());

    if (autoCloseQueryError) {
      results.errors.push(`Auto-close query error: ${autoCloseQueryError.message}`);
    } else if (toAutoClose && toAutoClose.length > 0) {
      for (const conv of toAutoClose) {
        const { error: closeError } = await supabase
          .from('conversations')
          .update({
            status: 'closed',
            closed_at: new Date().toISOString(),
            closed_by: null,
            closed_method: 'auto_inactive',
          })
          .eq('id', conv.id);

        if (closeError) {
          results.errors.push(`Failed to close ${conv.id}: ${closeError.message}`);
        } else {
          results.autoClosedCount++;
          
          // Create notification for seeker about auto-close
          await supabase.from('notifications').insert({
            user_id: conv.seeker_id,
            type: 'conversation_auto_closed',
            payload: {
              conversation_id: conv.id,
              provider_id: conv.provider_id,
            },
          });
        }
      }
    }

    // 2. Send 14-day reminders
    const fourteenDaysAgo = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString();
    const twentyOneDaysAgo = new Date(Date.now() - 21 * 24 * 60 * 60 * 1000).toISOString();

    const { data: for14DayReminder, error: reminder14Error } = await supabase
      .from('conversations')
      .select('id, seeker_id, provider_id')
      .eq('status', 'active')
      .lt('last_message_at', fourteenDaysAgo)
      .gte('last_message_at', twentyOneDaysAgo)
      .is('reminder_14_sent_at', null);

    if (reminder14Error) {
      results.errors.push(`14-day reminder query error: ${reminder14Error.message}`);
    } else if (for14DayReminder && for14DayReminder.length > 0) {
      for (const conv of for14DayReminder) {
        // Create notification
        const { error: notifError } = await supabase.from('notifications').insert({
          user_id: conv.seeker_id,
          type: 'conversation_reminder_14',
          payload: {
            conversation_id: conv.id,
            provider_id: conv.provider_id,
            message: 'Is your request resolved? You can close it or continue the conversation.',
          },
        });

        if (!notifError) {
          // Mark reminder as sent
          await supabase
            .from('conversations')
            .update({ reminder_14_sent_at: new Date().toISOString() })
            .eq('id', conv.id);
          results.reminder14Count++;
        }
      }
    }

    // 3. Send 21-day reminders
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();

    const { data: for21DayReminder, error: reminder21Error } = await supabase
      .from('conversations')
      .select('id, seeker_id, provider_id')
      .eq('status', 'active')
      .lt('last_message_at', twentyOneDaysAgo)
      .gte('last_message_at', thirtyDaysAgo)
      .is('reminder_21_sent_at', null);

    if (reminder21Error) {
      results.errors.push(`21-day reminder query error: ${reminder21Error.message}`);
    } else if (for21DayReminder && for21DayReminder.length > 0) {
      for (const conv of for21DayReminder) {
        // Create notification
        const { error: notifError } = await supabase.from('notifications').insert({
          user_id: conv.seeker_id,
          type: 'conversation_reminder_21',
          payload: {
            conversation_id: conv.id,
            provider_id: conv.provider_id,
            message: "We'll automatically close this request in 7 days if there's no activity.",
          },
        });

        if (!notifError) {
          // Mark reminder as sent
          await supabase
            .from('conversations')
            .update({ reminder_21_sent_at: new Date().toISOString() })
            .eq('id', conv.id);
          results.reminder21Count++;
        }
      }
    }

    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      results,
    });
  } catch (error) {
    console.error('Conversation lifecycle cron error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// Also support GET for easy testing (with auth)
export async function GET(request: NextRequest) {
  return POST(request);
}
