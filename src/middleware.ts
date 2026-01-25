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
  const { supabaseResponse, user, supabase } = await updateSession(request);
  
  const pathname = request.nextUrl.pathname;
  
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
