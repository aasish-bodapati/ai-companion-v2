/**
 * Companion Memory View - Simple, flowing view of what your AI companion remembers
 * 
 * This aligns with the "rich circle" vision: one continuous life story,
 * not a complex analytics dashboard.
 */

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { listMyMemories, MemoryNode } from '@/features/memory/api';
import { 
  SparklesIcon, HeartIcon, BriefcaseIcon, ClockIcon,
  MagnifyingGlassIcon, EyeIcon, PencilIcon
} from '@heroicons/react/24/outline';

type Memory = MemoryNode;

export default function SimplifiedMemoryView() {
  const { user } = useAuth();
  const [memories, setMemories] = useState<Memory[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedMemory, setSelectedMemory] = useState<Memory | null>(null);

  useEffect(() => {
    if (user) {
      fetchMemories();
    }
  }, [user]);

  const fetchMemories = async () => {
    try {
      setIsLoading(true);
      const memoriesRes = await listMyMemories({ limit: 50 });
      setMemories(memoriesRes || []);
    } catch (error) {
      console.error('Failed to fetch memories:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const filteredMemories = memories.filter(memory =>
    memory.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
    memory.category?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getMemoryIcon = (category: string) => {
    switch (category?.toLowerCase()) {
      case 'preference':
        return <HeartIcon className="h-5 w-5 text-pink-500" />;
      case 'work':
        return <BriefcaseIcon className="h-5 w-5 text-blue-500" />;
      case 'schedule':
        return <ClockIcon className="h-5 w-5 text-green-500" />;
      default:
        return <SparklesIcon className="h-5 w-5 text-purple-500" />;
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    return date.toLocaleDateString();
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 p-6">
        <div className="max-w-4xl mx-auto">
          <div className="animate-pulse space-y-6">
            <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/3"></div>
            <div className="h-64 bg-gray-200 dark:bg-gray-700 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center space-x-3 mb-4">
            <div className="w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center">
              <span className="text-2xl">🧠</span>
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                What I Remember About You
              </h1>
              <p className="text-gray-600 dark:text-gray-400">
                Your AI companion's memory of your life story
              </p>
            </div>
          </div>
        </div>

        {/* Search */}
        <div className="mb-6">
          <div className="relative">
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search your memories..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>

        {/* Memory Count */}
        <div className="mb-6 text-center">
          <p className="text-gray-600 dark:text-gray-400">
            I remember <span className="font-semibold text-blue-600 dark:text-blue-400">{memories.length}</span> things about you
          </p>
        </div>

        {/* Memories Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredMemories.map((memory) => (
            <div
              key={memory.id}
              className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-sm hover:shadow-md transition-shadow cursor-pointer border border-gray-200 dark:border-gray-700"
              onClick={() => setSelectedMemory(memory)}
            >
              <div className="flex items-start space-x-3">
                <div className="flex-shrink-0">
                  {getMemoryIcon(memory.category || 'general')}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                      {memory.category || 'Memory'}
                    </span>
                                         <span className="text-xs text-gray-400 dark:text-gray-500">
                       {formatDate(memory.timestamp)}
                     </span>
                  </div>
                  <p className="text-sm text-gray-900 dark:text-white line-clamp-3">
                    {memory.content}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {filteredMemories.length === 0 && (
          <div className="text-center py-12">
            <SparklesIcon className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
              {searchQuery ? 'No memories found' : 'No memories yet'}
            </h3>
            <p className="text-gray-600 dark:text-gray-400">
              {searchQuery 
                ? 'Try a different search term' 
                : 'Start chatting with your AI companion to build memories'
              }
            </p>
          </div>
        )}

        {/* Memory Detail Modal */}
        {selectedMemory && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white dark:bg-gray-800 rounded-lg max-w-2xl w-full max-h-[80vh] overflow-y-auto">
              <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    {getMemoryIcon(selectedMemory.category || 'general')}
                    <span className="text-sm font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                      {selectedMemory.category || 'Memory'}
                    </span>
                  </div>
                  <button
                    onClick={() => setSelectedMemory(null)}
                    className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                  >
                    <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
                
                <div className="mb-4">
                  <p className="text-gray-900 dark:text-white whitespace-pre-wrap">
                    {selectedMemory.content}
                  </p>
                </div>
                
                                 <div className="flex items-center justify-between text-sm text-gray-500 dark:text-gray-400">
                   <span>Remembered on {formatDate(selectedMemory.timestamp)}</span>
                   {selectedMemory.importance_score && (
                     <span className="flex items-center space-x-1">
                       <SparklesIcon className="h-4 w-4" />
                       <span>Importance: {selectedMemory.importance_score}</span>
                     </span>
                   )}
                 </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
