'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase/client';

export default function TestConnection() {
  const [connectionStatus, setConnectionStatus] = useState('Testing connection...');
  const [tables, setTables] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [debugInfo, setDebugInfo] = useState<any>({});

  useEffect(() => {
    const testConnection = async () => {
      const debug: any = {
        env: {
          NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL ? '✅ Set' : '❌ Missing',
          NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY 
            ? '✅ Set' + (process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY.length > 20 
                ? ' (length: ' + process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY.length + ')' 
                : ' (key too short)') 
            : '❌ Missing',
        },
        supabase: {
          initialized: !!supabase ? '✅ Yes' : '❌ No',
          auth: {},
          db: {}
        }
      };

      try {
        // Test authentication connection
        debug.supabase.auth.started = 'Testing...';
        const { data: authData, error: authError } = await supabase.auth.getSession();
        debug.supabase.auth.status = authError ? '❌ Failed' : '✅ Connected';
        debug.supabase.auth.session = authData?.session ? '✅ Active session' : '⚠️ No active session';
        
        if (authError) throw authError;
        
        // Test database connection by checking if we can query a table
        debug.supabase.db.started = 'Testing database connection...';
        try {
          // Get the list of tables from the information_schema
          const { data: tablesData, error } = await supabase
            .from('information_schema.tables')
            .select('table_name')
            .eq('table_schema', 'public');
          
          if (error) throw error;
          
          debug.supabase.db.status = '✅ Connected';
          
          // Extract table names from the query result
          if (tablesData && tablesData.length > 0) {
            const tableNames = tablesData.map(t => t.table_name);
            setTables(tableNames);
          } else {
            // Fallback to known table names if the query returns empty
            setTables([
              'profiles',
              'journal_entries',
              'fitness_activities',
              'water_intake',
              'mood_entries'
            ]);
          }
        } catch (err) {
          debug.supabase.db.status = '⚠️ Limited access (cannot query tables)';
          debug.supabase.db.error = err instanceof Error ? err.message : 'Unknown error';
        }
        
        setConnectionStatus('✅ Connected to Supabase successfully!');
      } catch (err) {
        console.error('Connection test failed:', err);
        setConnectionStatus('❌ Connection failed');
        setError(err instanceof Error ? err.message : 'Unknown error occurred');
      } finally {
        setDebugInfo(debug);
      }
    };

    testConnection();
  }, []);

  return (
    <div className="container mx-auto p-8">
      <h1 className="text-2xl font-bold mb-6">Supabase Connection Test</h1>
      
      <div className="mb-6 p-4 border rounded-lg space-y-4">
        <div>
          <h2 className="text-lg font-semibold mb-2">Connection Status:</h2>
          <p className={connectionStatus.includes('✅') ? 'text-green-600' : 'text-red-600'}>
            {connectionStatus}
          </p>
        </div>
        
        <div>
          <h3 className="font-semibold mb-2">Environment Variables:</h3>
          <pre className="text-xs bg-gray-100 p-2 rounded overflow-auto">
            {JSON.stringify(debugInfo.env || {}, null, 2)}
          </pre>
        </div>
        
        <div>
          <h3 className="font-semibold mb-2">Supabase Client:</h3>
          <pre className="text-xs bg-gray-100 p-2 rounded overflow-auto">
            {JSON.stringify(debugInfo.supabase || {}, (key, value) => 
              typeof value === 'function' ? '[function]' : value, 2)}
          </pre>
        </div>
        
        {error && (
          <div className="mt-2 p-2 bg-red-100 text-red-800 rounded">
            <p className="font-semibold">Error Details:</p>
            <pre className="text-xs mt-1 overflow-auto">{error}</pre>
          </div>
        )}
      </div>
      
      {tables.length > 0 && (
        <div className="border rounded-lg p-4">
          <h2 className="text-lg font-semibold mb-2">Available Tables:</h2>
          <ul className="list-disc pl-5">
            {tables.map((table) => (
              <li key={table} className="font-mono">{table}</li>
            ))}
          </ul>
        </div>
      )}
      
      <div className="mt-8 p-4 bg-blue-50 rounded-lg">
        <h2 className="text-lg font-semibold mb-2">Next Steps:</h2>
        <ul className="list-disc pl-5 space-y-1">
          <li>If you see tables listed above, your connection is working correctly.</li>
          <li>If you see an error, please check your Supabase URL and anon key in <code>.env.local</code>.</li>
          <li>Make sure you've run the database migrations in your Supabase dashboard.</li>
        </ul>
      </div>
    </div>
  );
}
