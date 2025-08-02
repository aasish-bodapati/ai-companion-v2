'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase/client';

export default function SupabaseTestPage() {
  const [testResult, setTestResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const testSupabaseConnection = async () => {
      try {
        setIsLoading(true);
        
        // Test 1: Check if Supabase is initialized
        if (!supabase) {
          throw new Error('Supabase client is not initialized');
        }

        // Test 2: Get the current session
        const { data: session, error: sessionError } = await supabase.auth.getSession();
        
        if (sessionError) {
          throw sessionError;
        }

        // Test 3: Make a simple query (list tables if possible)
        let tables = [];
        try {
          const { data, error: tablesError } = await supabase
            .from('pg_tables')
            .select('*')
            .eq('schemaname', 'public');
          
          if (!tablesError) {
            tables = data || [];
          }
        } catch (e) {
          console.warn('Could not fetch tables (this might be expected)', e);
        }

        setTestResult({
          supabaseInitialized: true,
          hasSession: !!session.session,
          session: session.session ? {
            user: {
              id: session.session.user?.id,
              email: session.session.user?.email,
            },
            expiresAt: session.session.expires_at,
          } : null,
          tables: tables.map((t: any) => t.tablename),
          env: {
            NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL 
              ? 'Set (hidden for security)' 
              : 'Not set',
            NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY 
              ? 'Set (hidden for security)' 
              : 'Not set',
          },
        });
      } catch (err) {
        console.error('Supabase test failed:', err);
        setError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        setIsLoading(false);
      }
    };

    testSupabaseConnection();
  }, []);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Testing Supabase connection...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-4xl mx-auto bg-white rounded-lg shadow-md p-6">
        <h1 className="text-2xl font-bold mb-6">Supabase Connection Test</h1>
        
        {error ? (
          <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-6">
            <h2 className="text-red-800 font-semibold">Error</h2>
            <p className="text-red-700">{error}</p>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="bg-green-50 border-l-4 border-green-500 p-4">
              <h2 className="text-green-800 font-semibold">Connection Successful</h2>
              <p className="text-green-700">Supabase client is properly initialized and connected.</p>
            </div>

            <div className="border rounded-lg p-4">
              <h2 className="font-semibold mb-2">Environment Variables</h2>
              <pre className="bg-gray-50 p-3 rounded text-sm overflow-x-auto">
                {JSON.stringify(testResult?.env, null, 2)}
              </pre>
              <p className="text-xs text-gray-500 mt-1">
                Note: API keys are hidden for security. Just checking if they're set.
              </p>
            </div>

            <div className="border rounded-lg p-4">
              <h2 className="font-semibold mb-2">Session Status</h2>
              <pre className="bg-gray-50 p-3 rounded text-sm overflow-x-auto">
                {JSON.stringify({
                  hasSession: testResult?.hasSession,
                  user: testResult?.session?.user || null
                }, null, 2)}
              </pre>
            </div>

            {testResult?.tables && testResult.tables.length > 0 && (
              <div className="border rounded-lg p-4">
                <h2 className="font-semibold mb-2">Database Tables</h2>
                <div className="bg-gray-50 p-3 rounded">
                  {testResult.tables.length === 0 ? (
                    <p className="text-sm text-gray-500">No tables found or insufficient permissions</p>
                  ) : (
                    <ul className="list-disc list-inside text-sm space-y-1">
                      {testResult.tables.map((table: string, index: number) => (
                        <li key={index} className="font-mono">{table}</li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        <div className="mt-8 pt-6 border-t border-gray-200">
          <h2 className="text-lg font-semibold mb-3">Next Steps</h2>
          <ul className="list-disc list-inside space-y-2 text-sm text-gray-700">
            <li>Check your browser's developer console for any errors (F12 or right-click → Inspect → Console)</li>
            <li>Verify your Supabase project is running and the URL is correct</li>
            <li>Ensure your CORS settings in Supabase include your development URL (usually http://localhost:3000)</li>
            <li>Check the Network tab in developer tools for failed requests to Supabase</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
