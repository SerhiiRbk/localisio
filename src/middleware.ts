// ============================================================
// Middleware - Auth Protection & Session Management
// ============================================================

import { type NextRequest, NextResponse } from 'next/server';
import { updateSession } from '@/lib/supabase/middleware';

// Routes that require authentication
const protectedRoutes = ['/dashboard', '/admin'];

// Routes only accessible to specific roles
const providerRoutes = ['/dashboard/provider'];
const adminRoutes = ['/admin'];

export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;

  // Handle locale-prefixed URLs (e.g., /en, /ru, /uk, /es)
  // Rewrites to / while setting the locale cookie so next-intl picks it up
  const localeMatch = pathname.match(/^\/(en|ru|uk|es)\/?$/);
  if (localeMatch) {
    const locale = localeMatch[1];
    const url = request.nextUrl.clone();
    url.pathname = '/';

    // Set locale on request cookies so next-intl picks it up during SSR
    request.cookies.set('locale', locale);

    const response = NextResponse.rewrite(url, {
      request: { headers: request.headers },
    });

    // Persist cookie for future requests
    response.cookies.set('locale', locale, { path: '/', maxAge: 31536000 });

    return response;
  }

  const { supabaseResponse, user, supabase } = await updateSession(request);
  
  // Check if this is a protected route
  const isProtectedRoute = protectedRoutes.some((route) => pathname.startsWith(route));
  const isAdminRoute = adminRoutes.some((route) => pathname.startsWith(route));
  
  if (isProtectedRoute) {
    if (!user) {
      // Redirect to sign-in if not authenticated
      const redirectUrl = new URL('/auth/sign-in', request.url);
      redirectUrl.searchParams.set('redirect', pathname);
      return NextResponse.redirect(redirectUrl);
    }
    
    // Check for admin routes
    if (isAdminRoute) {
      // Check if user is admin
      const { data: adminRole } = await supabase
        .from('admin_roles')
        .select('role')
        .eq('user_id', user.id)
        .single();
      
      if (!adminRole) {
        return NextResponse.redirect(new URL('/dashboard', request.url));
      }
    }
  }
  
  // Redirect authenticated users away from auth pages
  if (user && pathname.startsWith('/auth/sign')) {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }
  
  return supabaseResponse;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
