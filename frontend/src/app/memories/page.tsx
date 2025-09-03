'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Search, Trash2, Star, Calendar, Tag, Brain, Database } from 'lucide-react';
import api from '@/lib/api';

interface Memory {
  id: string;
  content: string;
  content_type: string;
  importance_score: number;
  created_at: string;
  updated_at: string;
  metadata?: {
    source?: string;
    reinforced_count?: number;
    deleted?: boolean;
  };
}

interface MemoryDigest {
  total_count: number;
  core_count: number;
  reinforced_sum: number;
  level: number;
  candidate_ids: string[];
}

export default function MemoriesPage() {
  const { user, isAuthenticated, isLoading } = useAuth();
  const [memories, setMemories] = useState<Memory[]>([]);
  const [digest, setDigest] = useState<MemoryDigest | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [contentTypeFilter, setContentTypeFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<string>('recent');

  // Early return if not authenticated
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600 dark:text-gray-400">Please log in to view your memories.</p>
        </div>
      </div>
    );
  }

  // Load memories automatically when authenticated
  useEffect(() => {
    if (!isAuthenticated) return;

    const loadMemories = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const params = new URLSearchParams();
        if (contentTypeFilter !== 'all') {
          params.append('content_type', contentTypeFilter);
        }
        params.append('limit', '100');
        
        console.log('Loading memories with params:', params.toString());
        const response = await api.get(`/memory/users/me/memories?${params}`);
        console.log('Memories response:', response);
        setMemories(response || []);
      } catch (err: any) {
        console.error('Failed to load memories:', err);
        setError(`Failed to load memories: ${err.message || 'Unknown error'}`);
      } finally {
        setLoading(false);
      }
    };

    loadMemories();
    loadDigest();
  }, [isAuthenticated, contentTypeFilter]);

  const loadDigest = async () => {
    try {
      console.log('Loading memory digest...');
      const response = await api.get('/memory/users/me/memories/digest');
      console.log('Digest response:', response);
      setDigest(response);
    } catch (err: any) {
      console.error('Failed to load memory digest:', err);
      // Don't set error state for digest failure, just log it
    }
  };

  const searchMemories = async () => {
    if (!searchQuery.trim()) {
      // Reload all memories
      if (!isAuthenticated) return;
      
      try {
        setLoading(true);
        setError(null);
        
        const params = new URLSearchParams();
        if (contentTypeFilter !== 'all') {
          params.append('content_type', contentTypeFilter);
        }
        params.append('limit', '100');
        
        const response = await api.get(`/memory/users/me/memories?${params}`);
        setMemories(response || []);
      } catch (err: any) {
        console.error('Failed to load memories:', err);
        setError(`Failed to load memories: ${err.message || 'Unknown error'}`);
      } finally {
        setLoading(false);
      }
      return;
    }

    try {
      setLoading(true);
      setError(null);
      
      const params = new URLSearchParams();
      params.append('query', searchQuery);
      if (contentTypeFilter !== 'all') {
        params.append('content_type', contentTypeFilter);
      }
      params.append('limit', '50');
      
      const response = await api.get(`/memory/users/me/memories/search?${params}`);
      setMemories(response || []);
    } catch (err: any) {
      console.error('Failed to search memories:', err);
      setError('Failed to search memories. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const deleteMemory = async (memoryId: string) => {
    if (!confirm('Are you sure you want to delete this memory?')) {
      return;
    }

    try {
      await api.delete(`/memory/users/me/memories/${memoryId}`);
      setMemories(prev => prev.filter(m => m.id !== memoryId));
      loadDigest(); // Refresh digest
    } catch (err: any) {
      console.error('Failed to delete memory:', err);
      setError('Failed to delete memory. Please try again.');
    }
  };

  const reinforceMemory = async (memoryId: string) => {
    try {
      await api.post(`/memory/memories/${memoryId}/reinforce`, { amount: 1 });
      // Refresh memories to show updated reinforced count
      if (isAuthenticated) {
        try {
          const params = new URLSearchParams();
          if (contentTypeFilter !== 'all') {
            params.append('content_type', contentTypeFilter);
          }
          params.append('limit', '100');
          
          const response = await api.get(`/memory/users/me/memories?${params}`);
          setMemories(response || []);
        } catch (err) {
          console.error('Failed to refresh memories:', err);
        }
      }
      loadDigest(); // Refresh digest
    } catch (err: any) {
      console.error('Failed to reinforce memory:', err);
      setError('Failed to reinforce memory. Please try again.');
    }
  };

  const getContentTypeColor = (type: string) => {
    const colors: Record<string, string> = {
      'onboarding_briefing': 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
      'onboarding_summary': 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200',
      'conversation': 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
      'preference': 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
      'goal': 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
      'fact': 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200',
    };
    return colors[type] || 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
  };

  const getContentTypeIcon = (type: string) => {
    const icons: Record<string, string> = {
      'onboarding_briefing': '📝',
      'onboarding_summary': '📋',
      'conversation': '💬',
      'preference': '⭐',
      'goal': '🎯',
      'fact': '📚',
    };
    return icons[type] || '📄';
  };

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) {
        return 'Date not available';
      }
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (error) {
      return 'Date not available';
    }
  };

  const filteredMemories = memories.filter(memory => {
    if (searchQuery && !memory.content.toLowerCase().includes(searchQuery.toLowerCase())) {
      return false;
    }
    return true;
  });

  const sortedMemories = [...filteredMemories].sort((a, b) => {
    switch (sortBy) {
      case 'recent':
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      case 'importance':
        return b.importance_score - a.importance_score;
      case 'type':
        return a.content_type.localeCompare(b.content_type);
      default:
        return 0;
    }
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-700">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-full flex items-center justify-center">
              <Brain className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">My Memories</h1>
              <p className="text-gray-600 dark:text-gray-400">Explore what I remember about you</p>
            </div>
          </div>

          {/* Memory Stats */}
          {digest && (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
              <Card className="p-4">
                <div className="flex items-center gap-2">
                  <Database className="w-5 h-5 text-blue-600" />
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Total Memories</p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">{digest.total_count}</p>
                  </div>
                </div>
              </Card>
              <Card className="p-4">
                <div className="flex items-center gap-2">
                  <Star className="w-5 h-5 text-yellow-600" />
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Core Memories</p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">{digest.core_count}</p>
                  </div>
                </div>
              </Card>
              <Card className="p-4">
                <div className="flex items-center gap-2">
                  <Tag className="w-5 h-5 text-green-600" />
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Reinforced</p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">{digest.reinforced_sum}</p>
                  </div>
                </div>
              </Card>
              <Card className="p-4">
                <div className="flex items-center gap-2">
                  <Brain className="w-5 h-5 text-purple-600" />
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Memory Level</p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">L{digest.level}</p>
                  </div>
                </div>
              </Card>
            </div>
          )}
        </div>

        {/* Search and Filters */}
        <Card className="p-6 mb-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  placeholder="Search memories..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                  onKeyPress={(e) => e.key === 'Enter' && searchMemories()}
                />
              </div>
            </div>
            <Select value={contentTypeFilter} onValueChange={setContentTypeFilter}>
              <SelectTrigger className="w-full md:w-48">
                <SelectValue placeholder="Filter by type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="onboarding_briefing">Onboarding</SelectItem>
                <SelectItem value="conversation">Conversations</SelectItem>
                <SelectItem value="preference">Preferences</SelectItem>
                <SelectItem value="goal">Goals</SelectItem>
                <SelectItem value="fact">Facts</SelectItem>
              </SelectContent>
            </Select>
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-full md:w-48">
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="recent">Most Recent</SelectItem>
                <SelectItem value="importance">Importance</SelectItem>
                <SelectItem value="type">Type</SelectItem>
              </SelectContent>
            </Select>
            <Button onClick={searchMemories} className="w-full md:w-auto">
              <Search className="w-4 h-4 mr-2" />
              Search
            </Button>
          </div>
        </Card>

        {/* Error Message */}
        {error && (
          <Card className="p-4 mb-6 border-red-200 bg-red-50 dark:bg-red-900/20">
            <p className="text-red-800 dark:text-red-200">{error}</p>
          </Card>
        )}

        {/* Memories List */}
        <div className="space-y-4">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="flex flex-col items-center gap-4">
                <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
                <p className="text-gray-600 dark:text-gray-400">Loading memories...</p>
              </div>
            </div>
          ) : sortedMemories.length === 0 ? (
            <Card className="p-12 text-center">
              <Brain className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">No memories found</h3>
              <p className="text-gray-600 dark:text-gray-400">
                {searchQuery ? 'Try adjusting your search terms.' : 'Start chatting to build your memory profile!'}
              </p>
            </Card>
          ) : (
            sortedMemories.map((memory) => (
              <Card key={memory.id} className="p-6 hover:shadow-lg transition-shadow">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{getContentTypeIcon(memory.content_type)}</span>
                    <div>
                      <Badge className={getContentTypeColor(memory.content_type)}>
                        {memory.content_type.replace('_', ' ')}
                      </Badge>
                      <div className="flex items-center gap-2 mt-1">
                        <Calendar className="w-4 h-4 text-gray-400" />
                        <span className="text-sm text-gray-500 dark:text-gray-400">
                          {formatDate(memory.created_at)}
                        </span>
                        {memory.metadata?.reinforced_count && memory.metadata.reinforced_count > 0 && (
                          <>
                            <Star className="w-4 h-4 text-yellow-500" />
                            <span className="text-sm text-yellow-600 dark:text-yellow-400">
                              {memory.metadata.reinforced_count} reinforced
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="text-right">
                      <div className="text-sm text-gray-500 dark:text-gray-400">Importance</div>
                      <div className="text-lg font-semibold text-gray-900 dark:text-white">
                        {memory.importance_score}/100
                      </div>
                    </div>
                    <div className="flex gap-1">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => reinforceMemory(memory.id)}
                        className="p-2"
                      >
                        <Star className="w-4 h-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => deleteMemory(memory.id)}
                        className="p-2 text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </div>
                <div className="prose dark:prose-invert max-w-none">
                  <p className="text-gray-800 dark:text-gray-200 leading-relaxed">
                    {memory.content}
                  </p>
                </div>
              </Card>
            ))
          )}
        </div>
      </div>
    </div>
  );
}