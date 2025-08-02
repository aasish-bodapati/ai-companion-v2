'use client';

import { useAuth } from '@/contexts/auth-context';
import { useEffect, useState } from 'react';

export default function DebugPage() {
  const { user, session, isLoading, signOut } = useAuth();
  const [localStorageContent, setLocalStorageContent] = useState<Record<string, any>>({});
  const [cookies, setCookies] = useState<Record<string, string>>({});

  useEffect(() => {
    // Get all items from localStorage
    const ls: Record<string, any> = {};
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key) {
        try {
          ls[key] = localStorage.getItem(key);
        } catch (e) {
          console.error(`Error reading ${key} from localStorage:`, e);
        }
      }
    }
    setLocalStorageContent(ls);

    // Get cookies
    const cookieList = document.cookie.split(';').reduce((acc, cookie) => {
      const [key, value] = cookie.split('=').map(c => c.trim());
      return { ...acc, [key]: value };
    }, {} as Record<string, string>);
    setCookies(cookieList);
  }, []);

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Debug Info</h1>
      
      <div className="mb-8 p-4 bg-gray-50 rounded-lg">
        <h2 className="text-xl font-semibold mb-4">Auth State</h2>
        <pre className="bg-white p-4 rounded border border-gray-200 overflow-x-auto">
          {JSON.stringify({
            isLoading,
            user: user ? {
              id: user.id,
              email: user.email,
              emailConfirmed: user.email_confirmed_at,
              lastSignIn: user.last_sign_in_at,
            } : null,
            session: session ? {
              expiresAt: session.expires_at,
              expiresIn: session.expires_in,
              accessToken: session.access_token ? '***' : null,
              refreshToken: session.refresh_token ? '***' : null,
            } : null,
          }, null, 2)}
        </pre>
      </div>

      <div className="mb-8 p-4 bg-gray-50 rounded-lg">
        <h2 className="text-xl font-semibold mb-4">Local Storage</h2>
        <pre className="bg-white p-4 rounded border border-gray-200 overflow-x-auto">
          {JSON.stringify(localStorageContent, null, 2)}
        </pre>
      </div>

      <div className="mb-8 p-4 bg-gray-50 rounded-lg">
        <h2 className="text-xl font-semibold mb-4">Cookies</h2>
        <pre className="bg-white p-4 rounded border border-gray-200 overflow-x-auto">
          {JSON.stringify(cookies, null, 2)}
        </pre>
      </div>

      <div className="p-4 bg-gray-50 rounded-lg">
        <h2 className="text-xl font-semibold mb-4">Actions</h2>
        <div className="space-y-4">
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            Refresh Page
          </button>
          <button
            onClick={async () => {
              localStorage.clear();
              window.location.reload();
            }}
            className="ml-4 px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
          >
            Clear Local Storage & Refresh
          </button>
        </div>
      </div>
    </div>
  );
}
