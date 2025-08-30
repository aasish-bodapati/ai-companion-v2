/**
 * Enhanced Memory Center - High ROI with actionable insights and analytics
 */

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import api from '@/lib/api';
import { consolidateMemories, getDeduplicationMetrics } from '@/features/conversations/api/deduplication';
import { listMyMemories, MemoryNode } from '@/features/memory/api';
import { getRetrievalSummary, RetrievalSummaryResponse } from '@/features/utils/api';
import { 
  TrashIcon, SparklesIcon, ChartBarIcon, PencilIcon, EyeIcon, ClockIcon,
  LightBulbIcon, UserIcon, HeartIcon, BriefcaseIcon, ExclamationTriangleIcon,
  ArrowTrendingUpIcon, CogIcon, MagnifyingGlassIcon, CalendarIcon
} from '@heroicons/react/24/outline';

interface DeduplicationMetrics {
  total_memories: number;
  duplicate_count: number;
  consolidation_opportunities: number;
  storage_efficiency: number;
}

type Memory = MemoryNode & {
  is_duplicate?: boolean;
  confidence?: number;
};

interface MemoryInsights {
  personality_traits: string[];
  preferences: string[];
  work_info: string[];
  relationships: string[];
  goals: string[];
  concerns: string[];
  patterns: string[];
}

interface MemoryAnalytics {
  total_memories: number;
  memory_growth_rate: number;
  most_common_topics: Array<{topic: string, count: number}>;
  memory_quality_score: number;
  recent_activity: number;
  top_insights: string[];
}

interface DailyLearning {
  date: string;
  memories_learned: number;
  key_insights: string[];
  categories: string[];
}

export default function SimplifiedMemoryView() {
  const { user } = useAuth();
  const [memories, setMemories] = useState<Memory[]>([]);
  const [metrics, setMetrics] = useState<DeduplicationMetrics | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isConsolidating, setIsConsolidating] = useState(false);
  const [selectedMemory, setSelectedMemory] = useState<Memory | null>(null);
  const [editingMemory, setEditingMemory] = useState<Memory | null>(null);
  const [dailyLearnings, setDailyLearnings] = useState<DailyLearning[]>([]);
  const [showLearnings, setShowLearnings] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<string>('all');
  const [coreOnly, setCoreOnly] = useState<boolean>(false);
  const [retrieval, setRetrieval] = useState<RetrievalSummaryResponse | null>(null);

  useEffect(() => {
    if (user) {
      fetchData();
    }
  }, [user, coreOnly]);

  const fetchData = async () => {
    try {
      setIsLoading(true);
      const [memoriesRes, metricsRes, learningsRes, retrievalRes] = await Promise.all([
        listMyMemories({ limit: 100, ...(coreOnly ? { core: true } : {}) }),
        getDeduplicationMetrics(),
        fetchDailyLearnings(),
        getRetrievalSummary(1)
      ]);
      setMemories(memoriesRes || []);
      setMetrics(metricsRes);
      setDailyLearnings(learningsRes || []);
      setRetrieval(retrievalRes || null);
    } catch (error) {
      console.error('Failed to fetch memory data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchDailyLearnings = async (): Promise<DailyLearning[]> => {
    try {
      // Get memories from last 7 days and group by date
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      
      const recentMemories = await api.get('/memory/users/me/memories', {
        from_date: sevenDaysAgo.toISOString(),
        limit: 200
      });
      
      // Group by date and extract insights
      const learningsByDate: { [key: string]: DailyLearning } = {};
      
      (recentMemories || []).forEach((memory: Memory) => {
        const date = new Date(memory.timestamp).toDateString();
        if (!learningsByDate[date]) {
          learningsByDate[date] = {
            date,
            memories_learned: 0,
            key_insights: [],
            categories: []
          };
        }
        
        learningsByDate[date].memories_learned++;
        
        // Extract key insights (first 100 chars)
        // importance_score is 0..100 in typed API; consider high importance >= 70
        if (memory.content && (memory as any).importance_score >= 70) {
          const insight = memory.content.substring(0, 100) + (memory.content.length > 100 ? '...' : '');
          learningsByDate[date].key_insights.push(insight);
        }
        
        // Track categories
        if (memory.content_type && !learningsByDate[date].categories.includes(memory.content_type)) {
          learningsByDate[date].categories.push(memory.content_type);
        }
      });
      
      return Object.values(learningsByDate).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    } catch (error) {
      console.error('Failed to fetch daily learnings:', error);
      return [];
    }
  };

  const handleConsolidate = async () => {
    try {
      setIsConsolidating(true);
      const result = await consolidateMemories();
      
      // Refresh data after consolidation
      await fetchData();
      
      alert(`Consolidated ${result.consolidated} memory groups, removed ${result.removed} duplicates`);
    } catch (error) {
      console.error('Consolidation failed:', error);
      alert('Failed to consolidate memories');
    } finally {
      setIsConsolidating(false);
    }
  };

  const handleEditMemory = async (memory: Memory, newContent: string) => {
    try {
      await api.put(`/memory/users/me/memories/${memory.id}`, {
        content: newContent
      });
      await fetchData();
      setEditingMemory(null);
    } catch (error) {
      console.error('Failed to edit memory:', error);
      alert('Failed to edit memory');
    }
  };

  const handleDeleteMemory = async (memoryId: string) => {
    if (!confirm('Are you sure you want to delete this memory?')) return;
    
    try {
      await api.delete(`/memory/users/me/memories/${memoryId}`);
      await fetchData();
    } catch (error) {
      console.error('Failed to delete memory:', error);
      alert('Failed to delete memory');
    }
  };

  const getMemorySource = (memory: Memory): string => {
    const meta = memory.memory_metadata;
    if (!meta) return 'Chat';
    if (typeof meta === 'string') {
      try {
        const parsed = JSON.parse(meta);
        return parsed?.source || 'Chat';
      } catch {
        return 'Chat';
      }
    }
    return (meta as Record<string, any>).source || 'Chat';
  };

  const filteredMemories = memories.filter(memory => {
    const matchesSearch = !searchQuery || 
      memory.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
      memory.content_type.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesFilter = filterType === 'all' || memory.content_type === filterType;
    const matchesCore = !coreOnly || (memory as any).memory_metadata?.core === true || (memory as any).core === true;

    return matchesSearch && matchesFilter && matchesCore;
  });

  const uniqueTypes = Array.from(new Set(memories.map(m => m.content_type)));

  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Enhanced Header with better visual hierarchy */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-gray-800 dark:to-gray-900 rounded-xl p-8 border border-gray-200 dark:border-gray-700">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                <HeartIcon className="h-6 w-6 text-blue-600 dark:text-blue-400" />
              </div>
              <h2 className="text-3xl font-bold text-gray-900 dark:text-white">Memory Center</h2>
            </div>
            <p className="text-lg text-gray-600 dark:text-gray-300 max-w-2xl">
              Everything your AI companion knows about you, with full transparency and control
            </p>
            <div className="flex items-center gap-4 text-sm text-gray-500 dark:text-gray-400">
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                {filteredMemories.length} memories
              </span>
              {metrics && (
                <span className="flex items-center gap-1">
                  <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                  {Math.round(metrics.storage_efficiency * 100)}% efficient
                </span>
              )}
            </div>
          </div>
          <div className="flex flex-col sm:flex-row gap-3">
            <button
              onClick={() => setShowLearnings(!showLearnings)}
              className="flex items-center justify-center px-5 py-3 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700 border border-gray-200 dark:border-gray-600 transition-all duration-200 shadow-sm hover:shadow-md"
            >
              <ClockIcon className="h-5 w-5 mr-2" />
              {showLearnings ? 'Hide' : 'Show'} Daily Learnings
            </button>
            <button
              onClick={handleConsolidate}
              disabled={isConsolidating}
              className="flex items-center justify-center px-5 py-3 bg-gradient-to-r from-indigo-600 to-blue-600 text-white rounded-xl hover:from-indigo-700 hover:to-blue-700 disabled:opacity-50 transition-all duration-200 shadow-sm hover:shadow-md transform hover:scale-105 disabled:transform-none"
            >
              <SparklesIcon className="h-5 w-5 mr-2" />
              {isConsolidating ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Optimizing...
                </>
              ) : (
                'Optimize Memories'
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Enhanced Daily Learnings */}
      {showLearnings && (
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden">
          <div className="bg-gradient-to-r from-green-50 to-blue-50 dark:from-green-900/20 dark:to-blue-900/20 px-6 py-4 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
                <LightBulbIcon className="h-5 w-5 text-green-600 dark:text-green-400" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white">What I Learned About You</h3>
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">Recent insights and discoveries from our conversations</p>
          </div>
          
          <div className="p-6">
            {dailyLearnings.length > 0 ? (
              <div className="space-y-6">
                {dailyLearnings.map((learning, index) => (
                  <div key={index} className="relative">
                    <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/10 dark:to-indigo-900/10 rounded-lg p-5 border border-blue-200 dark:border-blue-800">
                      <div className="flex items-center justify-between mb-3">
                        <h4 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                          <CalendarIcon className="h-4 w-4 text-blue-600" />
                          {new Date(learning.date).toLocaleDateString('en-US', { 
                            weekday: 'long', 
                            year: 'numeric', 
                            month: 'long', 
                            day: 'numeric' 
                          })}
                        </h4>
                        <div className="flex items-center gap-2">
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-200">
                            {learning.memories_learned} new memories
                          </span>
                        </div>
                      </div>
                      
                      {learning.key_insights.length > 0 && (
                        <div className="mb-4">
                          <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 flex items-center gap-1">
                            <SparklesIcon className="h-4 w-4 text-yellow-500" />
                            Key insights:
                          </p>
                          <div className="space-y-2">
                            {learning.key_insights.slice(0, 3).map((insight, i) => (
                              <div key={i} className="flex items-start gap-2">
                                <div className="w-1.5 h-1.5 rounded-full bg-blue-500 mt-2 flex-shrink-0"></div>
                                <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">{insight}</p>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                      
                      {learning.categories.length > 0 && (
                        <div className="flex flex-wrap gap-2">
                          {learning.categories.map((category, i) => (
                            <span key={i} className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-600">
                              {category}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <div className="mx-auto w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mb-4">
                  <ClockIcon className="h-8 w-8 text-gray-400" />
                </div>
                <h4 className="text-lg font-medium text-gray-900 dark:text-white mb-2">No recent learning activity</h4>
                <p className="text-gray-500 dark:text-gray-400">Start chatting with your AI companion to see daily insights here</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Enhanced Memory Efficiency */}
      <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden">
        <div className="bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
              <ChartBarIcon className="h-5 w-5 text-purple-600 dark:text-purple-400" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white">Memory Efficiency</h3>
          </div>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">Performance metrics for your memory storage</p>
        </div>

        <div className="p-6">
          {metrics ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 p-6 rounded-xl border border-blue-200 dark:border-blue-800">
                <div className="flex items-center justify-between mb-2">
                  <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                    <UserIcon className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold text-blue-700 dark:text-blue-300">{metrics.total_memories}</div>
                    <div className="text-sm text-blue-600 dark:text-blue-400 font-medium">Total Memories</div>
                  </div>
                </div>
                <p className="text-xs text-blue-600 dark:text-blue-400">Everything I know about you</p>
              </div>
              
              <div className="bg-gradient-to-br from-red-50 to-red-100 dark:from-red-900/20 dark:to-red-800/20 p-6 rounded-xl border border-red-200 dark:border-red-800">
                <div className="flex items-center justify-between mb-2">
                  <div className="p-2 bg-red-100 dark:bg-red-900/30 rounded-lg">
                    <ExclamationTriangleIcon className="h-5 w-5 text-red-600 dark:text-red-400" />
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold text-red-700 dark:text-red-300">{metrics.duplicate_count}</div>
                    <div className="text-sm text-red-600 dark:text-red-400 font-medium">Duplicates</div>
                  </div>
                </div>
                <p className="text-xs text-red-600 dark:text-red-400">Redundant information</p>
              </div>
              
              <div className="bg-gradient-to-br from-yellow-50 to-yellow-100 dark:from-yellow-900/20 dark:to-yellow-800/20 p-6 rounded-xl border border-yellow-200 dark:border-yellow-800">
                <div className="flex items-center justify-between mb-2">
                  <div className="p-2 bg-yellow-100 dark:bg-yellow-900/30 rounded-lg">
                    <CogIcon className="h-5 w-5 text-yellow-600 dark:text-yellow-400" />
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold text-yellow-700 dark:text-yellow-300">{metrics.consolidation_opportunities}</div>
                    <div className="text-sm text-yellow-600 dark:text-yellow-400 font-medium">Can Optimize</div>
                  </div>
                </div>
                <p className="text-xs text-yellow-600 dark:text-yellow-400">Ready for consolidation</p>
              </div>
              
              <div className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 p-6 rounded-xl border border-green-200 dark:border-green-800">
                <div className="flex items-center justify-between mb-2">
                  <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
                    <ArrowTrendingUpIcon className="h-5 w-5 text-green-600 dark:text-green-400" />
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold text-green-700 dark:text-green-300">{Math.round(metrics.storage_efficiency * 100)}%</div>
                    <div className="text-sm text-green-600 dark:text-green-400 font-medium">Efficiency</div>
                  </div>
                </div>
                <p className="text-xs text-green-600 dark:text-green-400">Storage optimization</p>
              </div>
            </div>
          ) : (
            <div className="text-center py-8">
              <div className="mx-auto w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mb-4">
                <ChartBarIcon className="h-8 w-8 text-gray-400" />
              </div>
              <p className="text-gray-500 dark:text-gray-400">Loading efficiency metrics...</p>
            </div>
          )}
        </div>
      </div>

      {/* Retrieval Summary */}
      {retrieval && (
        <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
          <h3 className="text-lg font-semibold mb-2">Retrieval Health (last {retrieval.window_hours}h)</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div className="p-3 rounded bg-gray-50 dark:bg-gray-800">
              <div className="text-gray-500">Avg Retrieval</div>
              <div className="text-gray-900 dark:text-white font-semibold">{Math.round(retrieval.rollups.avg_retrieval_ms)} ms</div>
            </div>
            <div className="p-3 rounded bg-gray-50 dark:bg-gray-800">
              <div className="text-gray-500">Avg MMR</div>
              <div className="text-gray-900 dark:text-white font-semibold">{Math.round(retrieval.rollups.avg_mmr_ms)} ms</div>
            </div>
            <div className="p-3 rounded bg-gray-50 dark:bg-gray-800">
              <div className="text-gray-500">Avg Selected</div>
              <div className="text-gray-900 dark:text-white font-semibold">{Math.round(retrieval.rollups.avg_selected)}</div>
            </div>
            <div className="p-3 rounded bg-gray-50 dark:bg-gray-800">
              <div className="text-gray-500">Avg Diversity</div>
              <div className="text-gray-900 dark:text-white font-semibold">{retrieval.rollups.avg_diversity.toFixed(2)}</div>
            </div>
          </div>
        </div>
      )}

      {/* Enhanced Search and Filter */}
      <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden">
        <div className="bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-900/20 dark:to-purple-900/20 px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-indigo-100 dark:bg-indigo-900/30 rounded-lg">
              <MagnifyingGlassIcon className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white">Search & Filter</h3>
          </div>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">Find specific memories and information</p>
        </div>
        
        <div className="p-6">
          <div className="space-y-4">
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="text"
                placeholder="Search memories by content, type, or keywords..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-11 pr-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute inset-y-0 right-0 pr-4 flex items-center text-gray-400 hover:text-gray-600"
                >
                  <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              )}
            </div>
            
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Memory Type</label>
                <select
                  value={filterType}
                  onChange={(e) => setFilterType(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
                >
                  <option value="all">All Types ({memories.length})</option>
                  {uniqueTypes.map(type => {
                    const count = memories.filter(m => m.content_type === type).length;
                    return (
                      <option key={type} value={type}>{type} ({count})</option>
                    );
                  })}
                </select>
              </div>
              
              <div className="flex items-end">
                <label className="flex items-center gap-3 px-4 py-3 bg-gray-50 dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
                  <input
                    type="checkbox"
                    checked={coreOnly}
                    onChange={(e) => setCoreOnly(e.target.checked)}
                    className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                  />
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Core memories only</span>
                </label>
              </div>
            </div>
            
            {(searchQuery || filterType !== 'all' || coreOnly) && (
              <div className="flex items-center justify-between px-4 py-2 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                <span className="text-sm text-blue-700 dark:text-blue-300">
                  Showing {filteredMemories.length} of {memories.length} memories
                </span>
                <button
                  onClick={() => {
                    setSearchQuery('');
                    setFilterType('all');
                    setCoreOnly(false);
                  }}
                  className="text-sm text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-200 font-medium"
                >
                  Clear filters
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Enhanced Memory List */}
      <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden">
        <div className="bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-700 px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gray-100 dark:bg-gray-800 rounded-lg">
              <HeartIcon className="h-5 w-5 text-gray-600 dark:text-gray-400" />
            </div>
            <div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white">Your Memories ({filteredMemories.length})</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                Everything your AI companion knows about you, with full transparency
              </p>
            </div>
          </div>
        </div>
        
        <div className="p-6">
          {filteredMemories.length > 0 ? (
            <div className="space-y-4">
              {filteredMemories.map((memory) => (
                <div key={memory.id} className="bg-gradient-to-r from-gray-50 to-white dark:from-gray-800 dark:to-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 p-6 hover:shadow-md transition-all duration-200 hover:scale-[1.01]">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      {/* Memory Tags and Metadata */}
                      <div className="flex flex-wrap items-center gap-2 mb-3">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          memory.content_type === 'preference' ? 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-200' :
                          memory.content_type === 'fact' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-200' :
                          memory.content_type === 'experience' ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-200' :
                          'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200'
                        }`}>
                          {memory.content_type}
                        </span>
                        
                        {memory.is_duplicate && (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-200">
                            <ExclamationTriangleIcon className="h-3 w-3 mr-1" />
                            Duplicate
                          </span>
                        )}
                        
                        <div className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          (memory.importance_score ?? 0) >= 70 ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-200' :
                          (memory.importance_score ?? 0) >= 40 ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-200' :
                          'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200'
                        }`}>
                          <SparklesIcon className="h-3 w-3 mr-1" />
                          {Math.round((memory.importance_score ?? 0))}% importance
                        </div>
                        
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400">
                          <UserIcon className="h-3 w-3 mr-1" />
                          {getMemorySource(memory)}
                        </span>
                      </div>
                      
                      {/* Memory Content */}
                      {editingMemory?.id === memory.id ? (
                        <div className="space-y-3">
                          <textarea
                            value={editingMemory.content}
                            onChange={(e) => setEditingMemory({...editingMemory, content: e.target.value})}
                            className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 resize-none"
                            rows={4}
                            placeholder="Edit memory content..."
                          />
                          <div className="flex gap-3">
                            <button
                              onClick={() => handleEditMemory(memory, editingMemory.content)}
                              className="inline-flex items-center px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 transition-colors"
                            >
                              Save Changes
                            </button>
                            <button
                              onClick={() => setEditingMemory(null)}
                              className="inline-flex items-center px-4 py-2 bg-gray-600 text-white rounded-lg text-sm font-medium hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-500 transition-colors"
                            >
                              Cancel
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="space-y-2">
                          <p className="text-gray-900 dark:text-white leading-relaxed">
                            {selectedMemory?.id === memory.id ? memory.content : (
                              <>
                                {memory.content.substring(0, 300)}
                                {memory.content.length > 300 && (
                                  <>
                                    ...
                                    <button
                                      onClick={() => setSelectedMemory(memory)}
                                      className="ml-2 inline-flex items-center text-indigo-600 hover:text-indigo-800 dark:text-indigo-400 dark:hover:text-indigo-300 text-sm font-medium"
                                    >
                                      <EyeIcon className="h-4 w-4 mr-1" />
                                      Show more
                                    </button>
                                  </>
                                )}
                              </>
                            )}
                          </p>
                          {selectedMemory?.id === memory.id && memory.content.length > 300 && (
                            <button
                              onClick={() => setSelectedMemory(null)}
                              className="inline-flex items-center text-indigo-600 hover:text-indigo-800 dark:text-indigo-400 dark:hover:text-indigo-300 text-sm font-medium"
                            >
                              Show less
                            </button>
                          )}
                        </div>
                      )}
                      
                      {/* Memory Footer */}
                      <div className="flex items-center justify-between mt-4 pt-3 border-t border-gray-200 dark:border-gray-700">
                        <div className="flex items-center text-xs text-gray-500 dark:text-gray-400">
                          <ClockIcon className="h-4 w-4 mr-1" />
                          {new Date(memory.timestamp).toLocaleDateString('en-US', { 
                            year: 'numeric', 
                            month: 'short', 
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={() => setEditingMemory(memory)}
                            className="p-2 text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 rounded-lg hover:bg-indigo-50 dark:hover:bg-indigo-900/30 transition-colors"
                            title="Edit memory"
                          >
                            <PencilIcon className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteMemory(memory.id)}
                            className="p-2 text-gray-400 hover:text-red-600 dark:hover:text-red-400 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/30 transition-colors"
                            title="Delete memory"
                          >
                            <TrashIcon className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-16">
              <div className="mx-auto w-20 h-20 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mb-6">
                {searchQuery || filterType !== 'all' || coreOnly ? (
                  <MagnifyingGlassIcon className="h-10 w-10 text-gray-400" />
                ) : (
                  <HeartIcon className="h-10 w-10 text-gray-400" />
                )}
              </div>
              <h4 className="text-xl font-medium text-gray-900 dark:text-white mb-2">
                {searchQuery || filterType !== 'all' || coreOnly ? 'No memories found' : 'No memories yet'}
              </h4>
              <p className="text-gray-500 dark:text-gray-400 max-w-md mx-auto">
                {searchQuery || filterType !== 'all' || coreOnly ? 
                  'Try adjusting your search terms or filters to find what you\'re looking for.' :
                  'Start chatting with your AI companion to build your memory collection.'
                }
              </p>
              {(searchQuery || filterType !== 'all' || coreOnly) && (
                <button
                  onClick={() => {
                    setSearchQuery('');
                    setFilterType('all');
                    setCoreOnly(false);
                  }}
                  className="mt-4 inline-flex items-center px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-colors"
                >
                  Clear all filters
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
