// ============================================================
// POST /api/user/locale - Persist user's preferred locale to DB
// ============================================================

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { isValidLocale } from '@/i18n/config';

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      // Not logged in — silently succeed (cookie is primary)
      return NextResponse.json({ success: true });
    }

    const body = await request.json();
    const { locale } = body;

    if (!locale || !isValidLocale(locale)) {
      return NextResponse.json({ error: 'Invalid locale' }, { status: 400 });
    }

    const { error } = await supabase
      .from('profiles')
      .update({ preferred_locale: locale })
      .eq('id', user.id);

    if (error) {
      console.error('Error updating preferred_locale:', error);
      return NextResponse.json({ error: 'Failed to update locale' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Locale update error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
