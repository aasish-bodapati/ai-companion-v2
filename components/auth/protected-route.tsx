'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import { useAuth } from '@/contexts/auth-context';
import { Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

// List of public routes that don't require authentication
const PUBLIC_ROUTES = ['/login', '/signup', '/auth/callback', '/debug'];

export default function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, isLoading, session } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isClient, setIsClient] = useState(false);
  const [isRedirecting, setIsRedirecting] = useState(false);
  const [authChecked, setAuthChecked] = useState(false);

  // Set client-side flag
  useEffect(() => {
    setIsClient(true);
  }, []);

  // Handle redirection when auth state changes
  useEffect(() => {
    // Only run on client side after initial render
    if (!isClient) return;
    
    // Skip if we're on a public route
    const isPublicRoute = PUBLIC_ROUTES.some(route => pathname.startsWith(route));
    
    console.log('[ProtectedRoute] Auth state changed', {
      isLoading,
      isRedirecting,
      hasUser: !!user,
      currentPath: pathname,
      isPublicPath: isPublicRoute,
      hasSession: !!session
    });

    // If we're still loading, don't do anything
    if (isLoading) {
      console.log('[ProtectedRoute] Still loading auth state');
      return;
    }

    // If we're already redirecting, don't do anything
    if (isRedirecting) {
      console.log('[ProtectedRoute] Already redirecting');
      return;
    }
    
    // Mark that we've checked the auth state
    setAuthChecked(true);

    // If we're on a public route, let the middleware handle it
    if (isPublicRoute) {
      console.log('[ProtectedRoute] Public route, allowing access');
      return;
    }

    // If there's no user and we're not on a public page, redirect to login
    if (!user && !PUBLIC_ROUTES.some(route => pathname.startsWith(route))) {
      console.log('[ProtectedRoute] No user found, redirecting to login');
      setIsRedirecting(true);
      
      // Store the current path to redirect back after login
      const redirectPath = pathname === '/' ? '/dashboard' : pathname;
      const redirectUrl = new URL('/login', window.location.origin);
      redirectUrl.searchParams.set('redirect', redirectPath);
      
      console.log('[ProtectedRoute] Redirecting to:', redirectUrl.toString());
      window.location.href = redirectUrl.toString();
      return;
    }
    
    // If we have a user and we're on a public page, redirect to dashboard or the redirect URL
    if (user && PUBLIC_ROUTES.some(route => pathname.startsWith(route))) {
      const redirectTo = searchParams.get('redirect') || '/dashboard';
      console.log('[ProtectedRoute] Authenticated user on public page, redirecting to:', redirectTo);
      setIsRedirecting(true);
      window.location.href = redirectTo;
      return;
    }
    
    // Mark that we've checked the auth state at least once
    setAuthChecked(true);
  }, [user, isLoading, router, isClient, isRedirecting, pathname, searchParams]);

  // Show loading state while auth is being checked
  if (isLoading || !isClient || !authChecked) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center space-y-4">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-muted-foreground">Checking authentication...</p>
      </div>
    );
  }

  // If we're in the middle of redirecting, show a loading message
  if (isRedirecting) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center space-y-4 p-4">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-muted-foreground">Redirecting...</p>
      </div>
    );
  }

  // If there's no user after loading and auth check, show access denied
  if (!user && !PUBLIC_ROUTES.some(route => pathname.startsWith(route))) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center space-y-4 p-4">
        <div className="text-center space-y-2">
          <h1 className="text-2xl font-bold">Access Denied</h1>
          <p className="text-muted-foreground">
            You need to be logged in to access this page.
          </p>
        </div>
        <Button 
          onClick={() => {
            const redirectPath = pathname === '/' ? '/dashboard' : pathname;
            window.location.href = `/login?redirect=${encodeURIComponent(redirectPath)}`;
          }}
          className="mt-4"
        >
          Go to Login
        </Button>
      </div>
    );
  }

  // If we have a user or we're on a public page, render the children
  return <>{children}</>;
}
