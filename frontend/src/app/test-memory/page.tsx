'use client';

import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { apiClient } from '@/services/apiClient';

export default function TestMemoryPage() {
  const [message, setMessage] = useState('');
  const [response, setResponse] = useState<{reply: string, used_memory: boolean} | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [memories, setMemories] = useState<any[]>([]);
  const { user } = useAuth();

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim()) return;

    setIsLoading(true);
    try {
      const response = await apiClient.post('/onboarding-chat/chat', {
        message: message.trim()
      });

      setResponse(response.data as any);
    } catch (error) {
      console.error('Error sending message:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleTestMemory = async () => {
    try {
      const response = await apiClient.get('/onboarding-chat/test-memory');
      setMemories((response.data as any).memories);
    } catch (error) {
      console.error('Error testing memory:', error);
    }
  };

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-blue-50 dark:from-gray-900 dark:to-gray-800 p-4">
        <div className="max-w-4xl mx-auto space-y-6">
          <div className="text-center">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
              Milestone 1: Living Onboarding + Memory Test
            </h1>
            <p className="text-lg text-gray-600 dark:text-gray-300">
              Test that the assistant remembers what you told it during onboarding
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Chat Interface */}
            <Card className="p-6">
              <h2 className="text-xl font-semibold mb-4">Chat with Memory</h2>
              
              <form onSubmit={handleSendMessage} className="space-y-4">
                <Textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Try: 'Plan my morning' or 'What do I like to eat?'"
                  className="min-h-[100px]"
                />
                <Button
                  type="submit"
                  disabled={!message.trim() || isLoading}
                  className="w-full"
                >
                  {isLoading ? 'Sending...' : 'Send Message'}
                </Button>
              </form>

              {response && (
                <div className="mt-6 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-sm font-medium">Assistant Response:</span>
                    {response.used_memory && (
                      <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">
                        Used Memory ✓
                      </span>
                    )}
                  </div>
                  <p className="text-gray-700 dark:text-gray-300">{response.reply}</p>
                </div>
              )}
            </Card>

            {/* Memory Test */}
            <Card className="p-6">
              <h2 className="text-xl font-semibold mb-4">Memory Test</h2>
              
              <Button
                onClick={handleTestMemory}
                className="w-full mb-4"
              >
                Test Memory Retrieval
              </Button>

              {memories.length > 0 && (
                <div className="space-y-3">
                  <h3 className="font-medium">Stored Memories ({memories.length}):</h3>
                  {memories.map((memory, index) => (
                    <div key={index} className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                      <div className="text-sm font-medium text-blue-900 dark:text-blue-100 mb-1">
                        {memory.content_type}
                      </div>
                      <div className="text-sm text-blue-800 dark:text-blue-200">
                        {memory.content}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          </div>

          {/* Example Test Cases */}
          <Card className="p-6">
            <h2 className="text-xl font-semibold mb-4">Example Test Cases</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <h3 className="font-medium mb-2">Morning Routine:</h3>
                <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
                  <li>• &ldquo;Plan my morning&rdquo;</li>
                  <li>• &ldquo;What time do I wake up?&rdquo;</li>
                  <li>• &ldquo;What should I do first thing?&rdquo;</li>
                </ul>
              </div>
              <div>
                <h3 className="font-medium mb-2">Preferences:</h3>
                <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
                  <li>• &ldquo;What do I like to eat?&rdquo;</li>
                  <li>• &ldquo;What are my food restrictions?&rdquo;</li>
                  <li>• &ldquo;What are my goals?&rdquo;</li>
                </ul>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </ProtectedRoute>
  );
}