// ============================================================
// Auth Callback - Handle email confirmation and OAuth
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
      // Check if this is an OAuth user (Google, etc.)
      const isOAuthUser = data.user.app_metadata?.provider !== 'email';
      
      // For OAuth users, get display name from user metadata (Google profile)
      // For email users, get from custom metadata set during sign-up
      let displayName: string;
      if (isOAuthUser) {
        displayName = data.user.user_metadata?.full_name || 
                     data.user.user_metadata?.name ||
                     data.user.email?.split('@')[0] || 
                     'User';
      } else {
        displayName = data.user.user_metadata?.display_name || 
                     data.user.email?.split('@')[0] || 
                     'User';
      }

      // Check if profile exists first
      const { data: existingProfile } = await supabase
        .from('profiles')
        .select('id, role')
        .eq('id', data.user.id)
        .single();

      // For new users, we need to determine role
      // Role is passed via query param for OAuth or from metadata for email
      let role = data.user.user_metadata?.role || 'seeker';
      
      // If user exists, keep their existing role
      if (existingProfile) {
        role = existingProfile.role;
      }

      // Create profile if it doesn't exist
      if (!existingProfile) {
        const { error: profileError } = await supabase
          .from('profiles')
          .insert({
            id: data.user.id,
            email: data.user.email!,
            display_name: displayName,
            role: role,
            // Store avatar URL from OAuth provider if available
            avatar_url: data.user.user_metadata?.avatar_url || 
                       data.user.user_metadata?.picture || null,
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
                avatar_url: data.user.user_metadata?.avatar_url || 
                           data.user.user_metadata?.picture || null,
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

      // For new OAuth users, redirect to role selection if needed
      // Use a special page that handles role selection
      if (!existingProfile && isOAuthUser) {
        return NextResponse.redirect(new URL('/auth/complete-profile', request.url));
      }

      return NextResponse.redirect(new URL(next, request.url));
    }
  }

  // Return to sign-in page with error
  return NextResponse.redirect(new URL('/auth/sign-in?error=auth', request.url));
}
