// ============================================================
// Cron Job: Provider Email Notifications
// Handles:
//   A) Daily unread-message digest
//   B) Weekly inactivity reminder
// Call this endpoint via cron (e.g., daily at 09:00 UTC)
// ============================================================

import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/server';
import { sendProviderEmail } from '@/lib/email';

const CRON_SECRET = process.env.CRON_SECRET;

export async function POST(request: NextRequest) {
  try {
    // Verify authorization
    const authHeader = request.headers.get('authorization');
    if (CRON_SECRET && authHeader !== `Bearer ${CRON_SECRET}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabase = await createServiceClient();
    const now = new Date();
    const results = {
      unreadDigestSent: 0,
      inactiveReminderSent: 0,
      errors: [] as string[],
    };

    // ============================================================
    // Task A: Unread Message Digest
    // Find providers with unread messages who haven't received
    // a digest email in the last 24 hours
    // ============================================================
    const twentyFourHoursAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString();

    // Step 1: Get all providers who have unread messages (messages they received but didn't read)
    const { data: providersWithUnread, error: unreadError } = await supabase
      .from('conversations')
      .select(`
        provider_id,
        messages!inner(id, read_at, sender_id)
      `)
      .eq('status', 'active')
      .is('messages.read_at', null);

    if (unreadError) {
      results.errors.push(`Unread query error: ${unreadError.message}`);
    } else if (providersWithUnread && providersWithUnread.length > 0) {
      // Collect unique provider IDs who have unread messages from seekers
      const providerIdsWithUnread = new Set<string>();

      for (const conv of providersWithUnread) {
        const messages = Array.isArray(conv.messages) ? conv.messages : [conv.messages];
        const hasUnreadFromSeeker = messages.some(
          (m: { read_at: string | null; sender_id: string }) =>
            m.read_at === null && m.sender_id !== conv.provider_id
        );
        if (hasUnreadFromSeeker) {
          providerIdsWithUnread.add(conv.provider_id);
        }
      }

      if (providerIdsWithUnread.size > 0) {
        // Step 2: Get provider profiles — filter out those who received digest recently
        const { data: providers, error: profileError } = await supabase
          .from('profiles')
          .select('id, email, preferred_locale, last_unread_digest_sent_at')
          .in('id', Array.from(providerIdsWithUnread))
          .eq('role', 'provider');

        if (profileError) {
          results.errors.push(`Provider profile query error: ${profileError.message}`);
        } else if (providers) {
          for (const provider of providers) {
            // Skip if we already sent a digest in the last 24 hours
            if (
              provider.last_unread_digest_sent_at &&
              new Date(provider.last_unread_digest_sent_at).getTime() > new Date(twentyFourHoursAgo).getTime()
            ) {
              continue;
            }

            if (!provider.email) continue;

            const locale = provider.preferred_locale || 'en';

            const emailResult = await sendProviderEmail(
              provider.email,
              'unread_digest',
              locale,
              '/dashboard/messages'
            );

            if (emailResult.success) {
              // Update last_unread_digest_sent_at
              await supabase
                .from('profiles')
                .update({ last_unread_digest_sent_at: now.toISOString() })
                .eq('id', provider.id);
              results.unreadDigestSent++;
            } else {
              results.errors.push(
                `Digest email failed for ${provider.id}: ${emailResult.error}`
              );
            }
          }
        }
      }
    }

    // ============================================================
    // Task B: Inactivity Reminder
    // Find providers who haven't visited in 7+ days and
    // haven't received a reminder in the last 7 days
    // ============================================================
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();

    const { data: inactiveProviders, error: inactiveError } = await supabase
      .from('profiles')
      .select('id, email, preferred_locale, last_seen_at, last_inactive_reminder_sent_at')
      .eq('role', 'provider')
      .lt('last_seen_at', sevenDaysAgo);

    if (inactiveError) {
      results.errors.push(`Inactive query error: ${inactiveError.message}`);
    } else if (inactiveProviders && inactiveProviders.length > 0) {
      for (const provider of inactiveProviders) {
        // Skip if we already sent a reminder in the last 7 days
        if (
          provider.last_inactive_reminder_sent_at &&
          new Date(provider.last_inactive_reminder_sent_at).getTime() > new Date(sevenDaysAgo).getTime()
        ) {
          continue;
        }

        if (!provider.email) continue;

        const locale = provider.preferred_locale || 'en';

        const emailResult = await sendProviderEmail(
          provider.email,
          'inactive_reminder',
          locale,
          '/dashboard'
        );

        if (emailResult.success) {
          // Update last_inactive_reminder_sent_at
          await supabase
            .from('profiles')
            .update({ last_inactive_reminder_sent_at: now.toISOString() })
            .eq('id', provider.id);
          results.inactiveReminderSent++;
        } else {
          results.errors.push(
            `Inactivity email failed for ${provider.id}: ${emailResult.error}`
          );
        }
      }
    }

    return NextResponse.json({
      success: true,
      timestamp: now.toISOString(),
      results,
    });
  } catch (error) {
    console.error('Provider emails cron error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// Also support GET for easy testing (with auth)
export async function GET(request: NextRequest) {
  return POST(request);
}
