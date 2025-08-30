'use client';

import { useState, useEffect } from 'react';
import { LightBulbIcon, InformationCircleIcon } from '@heroicons/react/24/outline';
import api from '@/lib/api';

interface MemoryStatusProps {
  className?: string;
}

export function MemoryStatus({ className = '' }: MemoryStatusProps) {
  const [isMemoryEnabled, setIsMemoryEnabled] = useState<boolean | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [memoryStats, setMemoryStats] = useState<{
    totalMemories: number;
    lastIndexed: string | null;
  } | null>(null);

  useEffect(() => {
    // Check memory status from environment or API
    const checkMemoryStatus = async () => {
      try {
        // Use shared API client to include base URL and Authorization header
        const data = await api.get<{ enabled: boolean; stats: { totalMemories: number; lastIndexed: string | null } }>(
          '/memory/status'
        );
        setIsMemoryEnabled(!!data?.enabled);
        setMemoryStats(data?.stats || null);
      } catch (error) {
        // If memory endpoint doesn't exist, memory is disabled
        setIsMemoryEnabled(false);
      } finally {
        setIsLoading(false);
      }
    };

    checkMemoryStatus();
  }, []);

  const toggleMemory = async () => {
    if (isMemoryEnabled === null) return;
    
    try {
      // Call API to toggle memory with Authorization
      const toggle = await api.post<{ enabled: boolean; message?: string }>(
        '/memory/toggle',
        { enabled: !isMemoryEnabled }
      );
      if (typeof toggle?.enabled === 'boolean') {
        setIsMemoryEnabled(toggle.enabled);
        // Refresh status and stats for consistency
        try {
          const st = await api.get<{ enabled: boolean; stats: { totalMemories: number; lastIndexed: string | null } }>(
            '/memory/status'
          );
          setIsMemoryEnabled(!!st?.enabled);
          setMemoryStats(st?.stats || null);
        } catch {}
      }
    } catch (error) {
      console.error('Failed to toggle memory:', error);
    }
  };

  if (isLoading) {
    return (
      <div className={`animate-pulse ${className}`}>
        <div className="h-20 bg-gray-200 dark:bg-gray-700 rounded-lg"></div>
      </div>
    );
  }

  return (
    <div className={`bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4 ${className}`}>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-2">
          <LightBulbIcon className="h-5 w-5 text-blue-600" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-white">
            Memory System
          </h3>
        </div>
        <button
          onClick={toggleMemory}
          disabled={isMemoryEnabled === null}
          className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
            isMemoryEnabled ? 'bg-blue-600' : 'bg-gray-200 dark:bg-gray-700'
          }`}
        >
          <span
            className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
              isMemoryEnabled ? 'translate-x-6' : 'translate-x-1'
            }`}
          />
        </button>
      </div>

      <div className="space-y-3">
        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-500 dark:text-gray-400">Status</span>
          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
            isMemoryEnabled 
              ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-400' 
              : 'bg-gray-100 dark:bg-gray-900/30 text-gray-800 dark:text-gray-400'
          }`}>
            {isMemoryEnabled ? 'Active' : 'Disabled'}
          </span>
        </div>

        {isMemoryEnabled && memoryStats && (
          <>
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-500 dark:text-gray-400">Total Memories</span>
              <span className="font-medium text-gray-900 dark:text-white">
                {memoryStats.totalMemories.toLocaleString()}
              </span>
            </div>
            
            {memoryStats.lastIndexed && (
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-500 dark:text-gray-400">Last Indexed</span>
                <span className="font-medium text-gray-900 dark:text-white">
                  {new Date(memoryStats.lastIndexed).toLocaleDateString()}
                </span>
              </div>
            )}
          </>
        )}

        <div className="pt-3 border-t border-gray-200 dark:border-gray-700">
          <div className="flex items-start space-x-2 text-xs text-gray-500 dark:text-gray-400">
            <InformationCircleIcon className="h-4 w-4 mt-0.5 flex-shrink-0" />
            <div>
              <p>
                {isMemoryEnabled 
                  ? 'Memory system is active and will remember your conversations and preferences to provide personalized responses.'
                  : 'Memory system is disabled. Enable it to get personalized responses based on your conversation history and preferences.'
                }
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

