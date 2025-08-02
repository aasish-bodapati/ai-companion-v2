'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/auth-context';
import { supabase } from '@/lib/supabase/client';

export default function AuthTestPage() {
  const { user, session, isLoading } = useAuth();
  const [authState, setAuthState] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        setAuthState({
          hasSession: !!session,
          user: session?.user,
          session
        });
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error');
      }
    };

    checkAuth();
  }, []);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-lg font-medium mb-2">Loading auth state...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-8 max-w-3xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Auth Debug</h1>
      
      {error && (
        <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-6">
          <p className="text-red-700">Error: {error}</p>
        </div>
      )}

      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <h2 className="text-xl font-semibold mb-4">Auth Context State</h2>
        <pre className="bg-gray-50 p-4 rounded overflow-auto text-sm">
          {JSON.stringify({
            isLoading,
            user: user ? {
              id: user.id,
              email: user.email,
              emailConfirmed: user.email_confirmed_at ? true : false,
              lastSignIn: user.last_sign_in_at
            } : null,
            session: session ? {
              expiresAt: session.expires_at,
              expiresIn: session.expires_in,
              accessToken: session.access_token ? '***' : null
            } : null
          }, null, 2)}
        </pre>
      </div>

      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold mb-4">Direct Supabase Auth State</h2>
        <pre className="bg-gray-50 p-4 rounded overflow-auto text-sm">
          {JSON.stringify(authState, null, 2)}
        </pre>
      </div>
    </div>
  );
}
