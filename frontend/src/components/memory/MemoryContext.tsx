'use client';

import { useState, useEffect } from 'react';
import { EyeIcon, EyeSlashIcon, LightBulbIcon } from '@heroicons/react/24/outline';
import { getConversationMemoryContext, type MemoryContextItem, sendMessageFeedback } from '@/features/memory/api';

interface MemoryContextProps {
  conversationId: string;
  className?: string;
  variant?: 'panel' | 'plain';
  messageId?: string; // optional assistant message id for feedback
}

type MemoryItem = MemoryContextItem;

export function MemoryContext({ conversationId, className = '', variant = 'panel', messageId }: MemoryContextProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [memoryContext, setMemoryContext] = useState<MemoryItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [sending, setSending] = useState<'up' | 'down' | null>(null);

  const fetchMemoryContext = async () => {
    if (!conversationId) return;
    
    setIsLoading(true);
    try {
      const data = await getConversationMemoryContext(conversationId);
      setMemoryContext(data.context || []);
    } catch (error) {
      console.error('Failed to fetch memory context:', error);
      setMemoryContext([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isVisible && conversationId) {
      fetchMemoryContext();
    }
  }, [isVisible, conversationId]);

  const toggleVisibility = () => {
    setIsVisible(!isVisible);
  };

  const sendFeedback = async (signal: 'up' | 'down') => {
    if (!messageId) return;
    try {
      setSending(signal);
      await sendMessageFeedback(messageId, { signal });
    } catch (e) {
      console.error('Failed to send feedback', e);
      alert('Failed to record feedback');
    } finally {
      setSending(null);
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'conversation':
        return '💬';
      case 'profile':
        return '👤';
      case 'preference':
        return '⚙️';
      default:
        return '🧠';
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'conversation':
        return 'Conversation';
      case 'profile':
        return 'Profile';
      case 'preference':
        return 'Preference';
      default:
        return 'Memory';
    }
  };

  if (!conversationId) return null;

  return (
    <div className={`${
      variant === 'plain'
        ? 'bg-transparent border-0'
        : 'bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700'
    } rounded-lg ${className}`}>
      <div className="p-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <LightBulbIcon className="h-5 w-5 text-blue-600" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-white">
              Memory Context
            </h3>
          </div>
          <button
            onClick={toggleVisibility}
            className="flex items-center space-x-2 text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition-colors"
          >
            {isVisible ? (
              <>
                <EyeSlashIcon className="h-4 w-4" />
                <span>Hide</span>
              </>
            ) : (
              <>
                <EyeIcon className="h-4 w-4" />
                <span>Show</span>
              </>
            )}
          </button>
          {/* Feedback buttons removed - memory system is now fully automatic */}
        </div>
        
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          {isVisible 
            ? 'Showing memories that influence AI responses in this conversation'
            : 'Click to see what memories are being used by the AI'
          }
        </p>
      </div>

      {isVisible && (
        <div className="p-4">
          {isLoading ? (
            <div className="animate-pulse space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-16 bg-gray-200 dark:bg-gray-700 rounded"></div>
              ))}
            </div>
          ) : memoryContext.length > 0 ? (
            <div className="space-y-3">
              {memoryContext.map((memory) => (
                <div
                  key={memory.id}
                  className="p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg border border-gray-200 dark:border-gray-600"
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center space-x-2">
                      <span className="text-lg">{getTypeIcon(memory.type)}</span>
                      <span className="text-xs font-medium text-gray-600 dark:text-gray-400 bg-gray-100 dark:bg-gray-600 px-2 py-1 rounded">
                        {getTypeLabel(memory.type)}
                      </span>
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        {new Date(memory.timestamp).toLocaleDateString()}
                      </span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <span className="text-xs text-gray-500 dark:text-gray-400">Relevance:</span>
                      <span className="text-xs font-medium text-blue-600">
                        {Math.round(memory.relevance * 100)}%
                      </span>
                    </div>
                  </div>
                  <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
                    {memory.content}
                  </p>
                  {memory.reason && (
                    <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                      Why included: {memory.reason}
                    </p>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <LightBulbIcon className="h-12 w-12 text-gray-400 mx-auto mb-3" />
              <p className="text-gray-500 dark:text-gray-400 text-sm">
                No memory context available for this conversation yet.
              </p>
              <p className="text-gray-400 dark:text-gray-500 text-xs mt-1">
                Start chatting to build up your memory profile.
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
