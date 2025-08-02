import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Routes that don't require authentication
const PUBLIC_ROUTES = [
  '/',
  '/login', 
  '/signup', 
  '/forgot-password', 
  '/reset-password', 
  '/test-connection',
  '/debug',
  '/auth/callback'
];

// Routes that should redirect to dashboard if user is already authenticated
const AUTH_ROUTES = ['/login', '/signup'];

// Routes that should bypass the middleware entirely
const BYPASS_MIDDLEWARE = [
  '/_next',
  '/favicon.ico',
  '/api',
  '/static',
  '/auth/callback',
  // Removed '/dashboard' to ensure it's protected by middleware
];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  // Skip middleware for static files and API routes
  if (BYPASS_MIDDLEWARE.some(route => pathname.startsWith(route))) {
    return NextResponse.next();
  }

  // Create a Supabase client configured to use cookies
  const response = NextResponse.next();
  const supabase = createMiddlewareClient({ req: request, res: response });
  
  try {
    // Get the session
    const { data: { session }, error } = await supabase.auth.getSession();
    
    if (error) {
      console.error('[Middleware] Error getting session:', error);
      // Clear any invalid session and let client handle it
      await supabase.auth.signOut();
      return response;
    }
    
    // If user is not authenticated and trying to access protected route
    const isPublicRoute = PUBLIC_ROUTES.some(route => 
      route === pathname || pathname.startsWith(`${route}/`)
    );
    
    if (!session && !isPublicRoute) {
      console.log(`[Middleware] Unauthorized access to ${pathname}, redirecting to login`);
      const redirectUrl = new URL('/login', request.url);
      redirectUrl.searchParams.set('redirectedFrom', pathname);
      return NextResponse.redirect(redirectUrl);
    }
    
    // If user is authenticated and trying to access auth route
    const isAuthRoute = AUTH_ROUTES.some(route => 
      route === pathname || pathname.startsWith(`${route}/`)
    );
    
    if (session && isAuthRoute) {
      console.log(`[Middleware] Authenticated user trying to access ${pathname}, redirecting to dashboard`);
      return NextResponse.redirect(new URL('/dashboard', request.url));
    }
    
    return response;
    
  } catch (error) {
    console.error('[Middleware] Error:', error);
    // In case of error, allow the request to continue
    return response;
  }
}

// Match all request paths except for the ones starting with:
// - _next/static (static files)
// - _next/image (image optimization files)
// - favicon.ico (favicon file)
// - public folder
// - api/auth (auth routes)
// - auth (auth pages)
// - 404 page
export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|api/auth|auth|404).*)',
  ],
};
