'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { RefreshCw, Bug, CheckCircle, AlertTriangle } from 'lucide-react';

interface DebugStatus {
  status: string;
  user: {
    id: string;
    email: string;
    memory_enabled: boolean;
    created_at: string;
  };
  llm: {
    provider: string;
    dev_mode: boolean;
    last_used_stub: boolean;
    last_error: string | null;
    status: string;
  };
  config: {
    memory_enabled: boolean;
    llm_provider: string;
    llm_dev_mode: boolean;
    llm_model_default: string;
  };
  timestamp: string;
}

interface LLMTestResult {
  status: string;
  test_query: string;
  response: string;
  llm_status: any;
  error?: string;
}

export default function DebugPage() {
  const [debugStatus, setDebugStatus] = useState<DebugStatus | null>(null);
  const [llmTestResult, setLlmTestResult] = useState<LLMTestResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchDebugStatus = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch('/api/v1/debug/status', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch debug status');
      }

      const data = await response.json();
      setDebugStatus(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  const testLLM = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch('/api/v1/debug/test-llm', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to test LLM');
      }

      const data = await response.json();
      setLlmTestResult(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDebugStatus();
  }, []);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'healthy':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'error':
        return <AlertTriangle className="h-5 w-5 text-red-500" />;
      default:
        return <Bug className="h-5 w-5 text-gray-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'healthy':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'error':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  if (loading && !debugStatus) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="h-8 w-8 animate-spin text-gray-500" />
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
          Debug Dashboard
        </h1>
        <p className="text-gray-600 dark:text-gray-400 mt-2">
          System status and debugging information
        </p>
      </div>

      {error && (
        <Alert className="mb-6">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            Error: {error}
            <Button 
              variant="outline" 
              size="sm" 
              className="ml-2"
              onClick={fetchDebugStatus}
            >
              Retry
            </Button>
          </AlertDescription>
        </Alert>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* System Status */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bug className="h-5 w-5" />
              System Status
            </CardTitle>
          </CardHeader>
          <CardContent>
            {debugStatus ? (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Overall Status</span>
                  <Badge className={getStatusColor(debugStatus.llm.status)}>
                    {getStatusIcon(debugStatus.llm.status)}
                    <span className="ml-1">{debugStatus.llm.status.toUpperCase()}</span>
                  </Badge>
                </div>
                
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm">LLM Provider:</span>
                    <span className="text-sm font-medium">{debugStatus.config.llm_provider}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm">Dev Mode:</span>
                    <Badge variant={debugStatus.config.llm_dev_mode ? "default" : "secondary"}>
                      {debugStatus.config.llm_dev_mode ? "ON" : "OFF"}
                    </Badge>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm">Memory Enabled:</span>
                    <Badge variant={debugStatus.config.memory_enabled ? "default" : "secondary"}>
                      {debugStatus.config.memory_enabled ? "ON" : "OFF"}
                    </Badge>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm">Last Used Stub:</span>
                    <Badge variant={debugStatus.llm.last_used_stub ? "default" : "secondary"}>
                      {debugStatus.llm.last_used_stub ? "YES" : "NO"}
                    </Badge>
                  </div>
                </div>

                {debugStatus.llm.last_error && (
                  <Alert>
                    <AlertTriangle className="h-4 w-4" />
                    <AlertDescription>
                      Last LLM Error: {debugStatus.llm.last_error}
                    </AlertDescription>
                  </Alert>
                )}
              </div>
            ) : (
              <p className="text-gray-500">No status data available</p>
            )}
          </CardContent>
        </Card>

        {/* User Info */}
        <Card>
          <CardHeader>
            <CardTitle>User Information</CardTitle>
          </CardHeader>
          <CardContent>
            {debugStatus ? (
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm">User ID:</span>
                  <span className="text-sm font-mono">{debugStatus.user.id}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm">Email:</span>
                  <span className="text-sm">{debugStatus.user.email}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm">Memory Enabled:</span>
                  <Badge variant={debugStatus.user.memory_enabled ? "default" : "secondary"}>
                    {debugStatus.user.memory_enabled ? "YES" : "NO"}
                  </Badge>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm">Created:</span>
                  <span className="text-sm">{new Date(debugStatus.user.created_at).toLocaleDateString()}</span>
                </div>
              </div>
            ) : (
              <p className="text-gray-500">No user data available</p>
            )}
          </CardContent>
        </Card>

        {/* LLM Test */}
        <Card>
          <CardHeader>
            <CardTitle>LLM Test</CardTitle>
          </CardHeader>
          <CardContent>
            <Button 
              onClick={testLLM} 
              disabled={loading}
              className="mb-4"
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              Test LLM Response
            </Button>

            {llmTestResult && (
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-sm">Test Status:</span>
                  <Badge variant={llmTestResult.status === 'ok' ? 'default' : 'destructive'}>
                    {llmTestResult.status.toUpperCase()}
                  </Badge>
                </div>
                
                <div>
                  <span className="text-sm font-medium">Test Query:</span>
                  <p className="text-sm text-gray-600 mt-1">{llmTestResult.test_query}</p>
                </div>
                
                <div>
                  <span className="text-sm font-medium">Response:</span>
                  <p className="text-sm text-gray-600 mt-1 bg-gray-50 p-2 rounded">
                    {llmTestResult.response}
                  </p>
                </div>

                {llmTestResult.error && (
                  <Alert>
                    <AlertTriangle className="h-4 w-4" />
                    <AlertDescription>
                      Test Error: {llmTestResult.error}
                    </AlertDescription>
                  </Alert>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Actions */}
        <Card>
          <CardHeader>
            <CardTitle>Actions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <Button 
                onClick={fetchDebugStatus} 
                disabled={loading}
                variant="outline"
                className="w-full"
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                Refresh Status
              </Button>
              
              <Button 
                onClick={testLLM} 
                disabled={loading}
                variant="outline"
                className="w-full"
              >
                <Bug className="h-4 w-4 mr-2" />
                Test LLM
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
