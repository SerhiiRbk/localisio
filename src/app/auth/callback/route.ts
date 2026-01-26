// ============================================================
// Auth Callback - Handle email confirmation
// ============================================================

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get('code');
  const error = searchParams.get('error');
  const next = searchParams.get('next') ?? '/dashboard';

  // Handle error from Supabase (e.g., expired link)
  if (error) {
    const errorDescription = searchParams.get('error_description') || 'Authentication error';
    return NextResponse.redirect(
      new URL(`/auth/sign-in?error=${encodeURIComponent(errorDescription)}`, request.url)
    );
  }

  if (code) {
    const supabase = await createClient();
    const { data, error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);
    
    if (!exchangeError && data.user) {
      // Get role from user metadata (set during sign-up)
      const role = data.user.user_metadata?.role || 'seeker';
      const displayName = data.user.user_metadata?.display_name || 
                         data.user.email?.split('@')[0] || 
                         'User';

      // Check if profile exists first
      const { data: existingProfile } = await supabase
        .from('profiles')
        .select('id')
        .eq('id', data.user.id)
        .single();

      // Create profile if it doesn't exist
      if (!existingProfile) {
        const { error: profileError } = await supabase
          .from('profiles')
          .insert({
            id: data.user.id,
            email: data.user.email!,
            display_name: displayName,
            role: role,
          });

        if (profileError) {
          console.error('Error creating profile in callback:', profileError);
          // Try upsert as fallback
          await supabase
            .from('profiles')
            .upsert(
              {
                id: data.user.id,
                email: data.user.email!,
                display_name: displayName,
                role: role,
              },
              { onConflict: 'id' }
            );
        }
      }

      // If provider role, create empty provider profile
      if (role === 'provider') {
        await supabase
          .from('provider_profiles')
          .upsert(
            {
              user_id: data.user.id,
              headline: '',
              bio: '',
              services: [],
              languages: [],
              experience_years: 0,
              country_code: '',
              city: '',
            },
            {
              onConflict: 'user_id',
              ignoreDuplicates: true,
            }
          );
      }

      return NextResponse.redirect(new URL(next, request.url));
    }
  }

  // Return to sign-in page with error
  return NextResponse.redirect(new URL('/auth/sign-in?error=auth', request.url));
}
