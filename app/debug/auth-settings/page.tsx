'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase/client';

export default function AuthSettingsTest() {
  const [settings, setSettings] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const checkAuthSettings = async () => {
      try {
        // Get auth settings from local storage (set by Supabase)
        const authSettings = {
          authUrl: process.env.NEXT_PUBLIC_SUPABASE_URL,
          siteUrl: typeof window !== 'undefined' ? window.location.origin : '',
          localStorage: typeof window !== 'undefined' ? {
            authToken: localStorage.getItem('sb-auth-token'),
            refreshToken: localStorage.getItem('sb-refresh-token'),
          } : {},
        };

        // Try to get auth settings from API if possible
        try {
          const { data, error: settingsError } = await supabase
            .from('auth_settings')
            .select('*')
            .single();
          
          if (!settingsError && data) {
            setSettings({
              ...authSettings,
              ...data
            });
          } else {
            setSettings(authSettings);
          }
        } catch (e) {
          console.warn('Could not fetch auth settings from database', e);
          setSettings(authSettings);
        }
      } catch (err) {
        console.error('Error checking auth settings:', err);
        setError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        setIsLoading(false);
      }
    };

    checkAuthSettings();
  }, []);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading authentication settings...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-4xl mx-auto bg-white rounded-lg shadow-md p-6">
        <h1 className="text-2xl font-bold mb-6">Auth Settings Check</h1>
        
        {error ? (
          <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-6">
            <h2 className="text-red-800 font-semibold">Error</h2>
            <p className="text-red-700">{error}</p>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="border rounded-lg p-4">
              <h2 className="font-semibold mb-3">Environment Configuration</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <h3 className="text-sm font-medium text-gray-500">Supabase URL</h3>
                  <p className="mt-1 text-sm break-all">
                    {settings?.authUrl || 'Not set'}
                  </p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-gray-500">Site URL</h3>
                  <p className="mt-1 text-sm break-all">
                    {settings?.siteUrl || 'Not set'}
                  </p>
                </div>
              </div>
            </div>

            <div className="border rounded-lg p-4">
              <h2 className="font-semibold mb-3">Local Storage</h2>
              <div className="bg-gray-50 p-3 rounded text-sm overflow-x-auto">
                <pre>{JSON.stringify(settings?.localStorage || {}, null, 2)}</pre>
              </div>
            </div>

            <div className="bg-blue-50 border-l-4 border-blue-500 p-4">
              <h2 className="text-blue-800 font-semibold mb-2">Next Steps</h2>
              <ul className="list-disc list-inside space-y-2 text-sm text-blue-700">
                <li>Check that your Supabase URL is correct and accessible</li>
                <li>Verify that your site URL is in the allowed redirect URLs in Supabase Auth settings</li>
                <li>Make sure email provider is enabled in Supabase Authentication settings</li>
                <li>Check the browser console for any CORS or network errors</li>
                <li>Try clearing site data and logging in again</li>
              </ul>
            </div>

            <div className="mt-6 pt-6 border-t border-gray-200">
              <h3 className="font-medium mb-3">Troubleshooting</h3>
              <div className="space-y-2 text-sm text-gray-600">
                <p>If you're still having issues, try these steps:</p>
                <ol className="list-decimal list-inside space-y-1 pl  -2">
                  <li>Open browser developer tools (F12)</li>
                  <li>Go to the Application tab</li>
                  <li>Clear all site data (Storage → Clear site data)</li>
                  <li>Try logging in again</li>
                </ol>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
