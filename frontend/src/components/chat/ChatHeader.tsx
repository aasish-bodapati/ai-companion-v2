'use client';

import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { memoryContextService, type MemoryContextData } from '@/services/memoryContextService';

interface ChatHeaderProps {
  conversationId: string;
  title?: string;
}

// Memory context component to show what the AI remembers
function MemoryContext({ conversationId }: { conversationId: string }) {
  const [memoryData, setMemoryData] = useState<MemoryContextData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchMemoryContext = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await memoryContextService.getMemoryContext(conversationId);
        setMemoryData(data);
      } catch (err) {
        console.error('Failed to fetch memory context:', err);
        setError('Failed to load memory context');
      } finally {
        setLoading(false);
      }
    };

    fetchMemoryContext();
  }, [conversationId]);

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="grid grid-cols-3 gap-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="text-center p-3 bg-gray-100 dark:bg-gray-800 rounded-lg animate-pulse">
              <div className="h-8 bg-gray-300 dark:bg-gray-600 rounded mb-2"></div>
              <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded"></div>
            </div>
          ))}
        </div>
        <div className="bg-gray-100 dark:bg-gray-800 rounded-lg p-4 animate-pulse">
          <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded mb-3 w-1/3"></div>
          <div className="space-y-2">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-3 bg-gray-300 dark:bg-gray-600 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error || !memoryData) {
    return (
      <div className="space-y-4">
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
          <div className="text-sm text-red-800 dark:text-red-200">
            Unable to load memory context. Please try again later.
          </div>
        </div>
      </div>
    );
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "in-progress": return "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-200";
      case "completed": return "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-200";
      case "upcoming": return "bg-gray-100 text-gray-800 dark:bg-gray-800/50 dark:text-gray-200";
      default: return "bg-gray-100 text-gray-800 dark:bg-gray-800/50 dark:text-gray-200";
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case "in-progress": return "🔄 Now";
      case "completed": return "✓ Done";
      case "upcoming": return "⏰ Upcoming";
      default: return "⏰ Upcoming";
    }
  };

  return (
    <div className="space-y-4">
      {/* Quick Stats */}
      <div className="grid grid-cols-3 gap-3">
        <div className="text-center p-3 bg-gradient-to-br from-indigo-50 to-blue-50 dark:from-indigo-900/20 dark:to-blue-900/20 rounded-lg border border-indigo-200 dark:border-indigo-800">
          <div className="text-2xl font-bold text-indigo-600 dark:text-indigo-400">
            {memoryData.goals.protein.current}/{memoryData.goals.protein.target}
          </div>
          <div className="text-xs text-indigo-600 dark:text-indigo-400">Protein (g)</div>
        </div>
        <div className="text-center p-3 bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-lg border border-green-200 dark:border-green-800">
          <div className="text-2xl font-bold text-green-600 dark:text-green-400">
            {memoryData.goals.calories.current}/{memoryData.goals.calories.target}
          </div>
          <div className="text-xs text-green-600 dark:text-green-400">Calories</div>
        </div>
        <div className="text-center p-3 bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 rounded-lg border border-purple-200 dark:border-pink-800">
          <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
            {memoryData.goals.workout.current}/{memoryData.goals.workout.target}
          </div>
          <div className="text-xs text-purple-600 dark:text-purple-400">Workouts</div>
        </div>
      </div>

      {/* Today's Routine */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
        <h3 className="text-sm font-medium text-gray-800 dark:text-gray-200 mb-3">Today's Routine</h3>
        <div className="space-y-2 max-h-32 overflow-y-auto">
          {memoryData.routines.map((routine, index) => (
            <div key={index} className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2">
                <span className="text-gray-500 dark:text-gray-400">{routine.time}</span>
                <span className="text-gray-700 dark:text-gray-200">{routine.activity}</span>
              </div>
              <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(routine.status)}`}>
                {getStatusText(routine.status)}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Recent Insights */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-lg border border-blue-200 dark:border-blue-800 p-4">
        <h3 className="text-sm font-medium text-blue-800 dark:text-blue-200 mb-3">💡 Recent Insights</h3>
        <div className="space-y-2">
          {memoryData.insights.map((insight, index) => (
            <div key={index} className="text-xs text-blue-700 dark:text-blue-300">
              • {insight}
            </div>
          ))}
        </div>
      </div>

      {/* Recent Memories */}
      {memoryData.recentMemories.length > 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
          <h3 className="text-sm font-medium text-gray-800 dark:text-gray-200 mb-3">🧠 Recent Memories</h3>
          <div className="space-y-2 max-h-24 overflow-y-auto">
            {memoryData.recentMemories.slice(0, 3).map((memory, index) => (
              <div key={index} className="text-xs text-gray-600 dark:text-gray-400">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs text-gray-400">{memory.source}</span>
                  {memory.importance && (
                    <span className="text-xs text-gray-400">• {memory.importance}/100</span>
                  )}
                </div>
                <div className="text-gray-700 dark:text-gray-300 line-clamp-2">
                  {memory.content}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default function ChatHeader({ conversationId, title }: ChatHeaderProps) {
  const [showMemory, setShowMemory] = useState(false);

  return (
    <div className="border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900">
      <div className="px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="h-8 w-8 rounded-full bg-gradient-to-r from-indigo-500 to-blue-500 flex items-center justify-center text-white text-sm font-bold">
            AI
          </div>
          <div>
            <h1 className="text-lg font-semibold text-gray-900 dark:text-white">
              {title || 'Chat with your AI companion'}
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              I remember your routines, goals, and preferences
            </p>
          </div>
        </div>
        
        <button
          onClick={() => setShowMemory(!showMemory)}
          className="px-3 py-2 text-sm text-indigo-600 hover:text-indigo-700 font-medium hover:bg-indigo-50 dark:hover:bg-indigo-900/30 rounded-lg transition-colors"
        >
          {showMemory ? 'Hide Context' : 'Show Context'}
        </button>
      </div>

      {/* Memory Context Panel */}
      {showMemory && (
        <div className="px-4 py-4 bg-gray-50 dark:bg-gray-800/50 border-t border-gray-200 dark:border-gray-700">
          <div className="max-w-2xl">
            <MemoryContext conversationId={conversationId} />
          </div>
        </div>
      )}
    </div>
  );
}
