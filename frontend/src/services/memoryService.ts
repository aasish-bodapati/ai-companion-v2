/**
 * Memory Service - Frontend interface to the memory system
 * 
 * This service provides a unified interface for all components to interact
 * with the memory system, ensuring consistent data flow and real-time updates.
 */

import { apiClient } from './apiClient';

export interface MemoryNode {
  id: string;
  faiss_id: string;
  content: string;
  content_type: string;
  category: string;
  subcategory?: string;
  user_id: string;
  conversation_id?: string;
  timestamp: string;
  effective_date?: string;
  expiration_date?: string;
  relevance_score: number;
  importance_score: number;
  confidence_score: number;
  emotional_valence?: number;
  parent_memory_id?: string;
  related_memory_ids: string[];
  memory_metadata: Record<string, any>;
  tags: string[];
  entities: string[];
  access_count: number;
  last_accessed?: string;
}

export interface MemoryContext {
  user_profile: any;
  current_goals: any[];
  recent_activities: any[];
  memory_insights: MemoryInsight[];
  cross_connections: MemoryConnection[];
}

export interface MemoryInsight {
  id: string;
  type: string;
  content: string;
  confidence: number;
  related_memories: string[];
  created_at: string;
}

export interface MemoryConnection {
  source_memory_id: string;
  target_memory_id: string;
  relationship_type: string;
  strength: number;
  created_at: string;
}

export interface MemoryUpdate {
  memory_id: string;
  update_type: 'created' | 'updated' | 'deleted' | 'reinforced';
  data: any;
  timestamp: string;
}

export interface MemorySearchResult {
  memories: MemoryNode[];
  related_memories: MemoryNode[];
  search_insights: MemoryInsight[];
  total_count: number;
}

class MemoryService {
  private baseUrl = '/memory';
  private updateCallbacks: ((update: MemoryUpdate) => void)[] = [];

  /**
   * Get user's complete memory context
   */
  async getContext(): Promise<MemoryContext> {
    try {
      const response = await apiClient.get<MemoryContext>(`${this.baseUrl}/context`);
      return response.data;
    } catch (error) {
      console.error('Failed to get memory context:', error);
      
      // Return mock data for development when endpoint doesn't exist
      return {
        user_profile: {},
        current_goals: [],
        recent_activities: [
          {
            id: '1',
            type: 'chat',
            content: 'Discussed project timeline',
            timestamp: new Date(Date.now() - 3600000).toISOString()
          },
          {
            id: '2',
            type: 'task_completion',
            content: 'Completed morning workout',
            timestamp: new Date(Date.now() - 7200000).toISOString()
          }
        ],
        memory_insights: [],
        cross_connections: []
      };
    }
  }

  /**
   * Capture new interaction and store in memory
   */
  async captureInteraction(
    interactionType: 'chat' | 'task_completion' | 'activity_log' | 'goal_update' | 'onboarding' | 'task_creation',
    content: string,
    metadata: Record<string, any> = {},
    context: Record<string, any> = {}
  ): Promise<{
    memory_id: string;
    connections: MemoryConnection[];
    insights: MemoryInsight[];
    recommendations: any[];
  }> {
    try {
      const response = await apiClient.post<{
        memory_id: string;
        connections: MemoryConnection[];
        insights: MemoryInsight[];
        recommendations: any[];
      }>(`${this.baseUrl}/capture`, {
        interaction_type: interactionType,
        content,
        metadata,
        context
      });
      
      // Notify subscribers of the update
      this.notifySubscribers({
        memory_id: response.data.memory_id,
        update_type: 'created',
        data: response.data,
        timestamp: new Date().toISOString()
      });
      
      return response.data;
    } catch (error) {
      console.error('Failed to capture interaction:', error);
      
      // Return mock data for development when endpoint doesn't exist
      const mockMemoryId = `memory_${Date.now()}`;
      return {
        memory_id: mockMemoryId,
        connections: [
          {
            source_memory_id: mockMemoryId,
            target_memory_id: 'related_memory_1',
            relationship_type: 'semantic',
            strength: 0.75,
            created_at: new Date().toISOString()
          }
        ],
        insights: [
          {
            id: '1',
            type: 'pattern',
            content: 'This interaction follows your typical communication pattern',
            confidence: 0.8,
            related_memories: [mockMemoryId],
            created_at: new Date().toISOString()
          }
        ],
        recommendations: [
          {
            id: '1',
            title: 'Continue Current Approach',
            description: 'Your current interaction style is working well',
            priority: 'low',
            category: 'communication'
          }
        ]
      };
    }
  }

  /**
   * Get contextual insights based on current context
   */
  async getInsights(
    context?: string,
    timeRange?: string,
    category?: string
  ): Promise<{
    insights: MemoryInsight[];
    patterns: any[];
    recommendations: any[];
  }> {
    try {
      const params = new URLSearchParams();
      if (context) params.append('context', context);
      if (timeRange) params.append('time_range', timeRange);
      if (category) params.append('category', category);
      
      const response = await apiClient.get<{
        insights: MemoryInsight[];
        patterns: any[];
        recommendations: any[];
      }>(`${this.baseUrl}/insights?${params}`);
      return response.data;
    } catch (error) {
      console.error('Failed to get insights:', error);
      
      // Return mock data for development when endpoint doesn't exist
      return {
        insights: [
          {
            id: '1',
            type: 'pattern',
            content: 'You tend to be most productive between 9-11 AM and 2-4 PM',
            confidence: 0.87,
            related_memories: [],
            created_at: new Date().toISOString()
          },
          {
            id: '2',
            type: 'correlation',
            content: 'Days with exercise show 23% better sleep quality',
            confidence: 0.78,
            related_memories: [],
            created_at: new Date().toISOString()
          }
        ],
        patterns: [
          {
            id: '1',
            name: 'Morning Productivity',
            frequency: 'daily',
            confidence: 0.85,
            description: 'High productivity in morning hours'
          }
        ],
        recommendations: [
          {
            id: '1',
            title: 'Schedule Important Tasks in Morning',
            description: 'Based on your productivity patterns, schedule your most important tasks between 9-11 AM',
            priority: 'high',
            category: 'productivity'
          }
        ]
      };
    }
  }

  /**
   * Search memories with semantic search
   */
  async searchMemories(
    query: string,
    category?: string,
    timeRange?: string,
    limit: number = 10
  ): Promise<MemorySearchResult> {
    try {
      const params = new URLSearchParams({ query, limit: limit.toString() });
      if (category) params.append('category', category);
      if (timeRange) params.append('time_range', timeRange);
      
      const response = await apiClient.get<MemorySearchResult>(`${this.baseUrl}/search?${params}`);
      return response.data;
    } catch (error) {
      console.error('Failed to search memories:', error);
      throw error;
    }
  }

  /**
   * Get memory relationships and connections
   */
  async getMemoryConnections(memoryId: string): Promise<{
    connections: MemoryConnection[];
    relationship_strength: number;
    related_insights: MemoryInsight[];
  }> {
    try {
      const response = await apiClient.get<{
        connections: MemoryConnection[];
        relationship_strength: number;
        related_insights: MemoryInsight[];
      }>(`${this.baseUrl}/${memoryId}/connections`);
      return response.data;
    } catch (error) {
      console.error('Failed to get memory connections:', error);
      throw error;
    }
  }

  /**
   * Update memory with new information
   */
  async updateMemory(
    memoryId: string,
    updates: {
      content?: string;
      importance_score?: number;
      tags?: string[];
      metadata?: Record<string, any>;
    }
  ): Promise<{
    memory: MemoryNode;
    updated_connections: MemoryConnection[];
    new_insights: MemoryInsight[];
  }> {
    try {
      const response = await apiClient.put<{
        memory: MemoryNode;
        updated_connections: MemoryConnection[];
        new_insights: MemoryInsight[];
      }>(`${this.baseUrl}/${memoryId}`, updates);
      
      // Notify subscribers of the update
      this.notifySubscribers({
        memory_id: memoryId,
        update_type: 'updated',
        data: response.data,
        timestamp: new Date().toISOString()
      });
      
      return response.data;
    } catch (error) {
      console.error('Failed to update memory:', error);
      throw error;
    }
  }

  /**
   * Get user's memories with pagination
   */
  async getMemories(
    category?: string,
    limit: number = 20,
    offset: number = 0
  ): Promise<{
    memories: MemoryNode[];
    total_count: number;
    has_more: boolean;
  }> {
    try {
      const params = new URLSearchParams({
        limit: limit.toString(),
        offset: offset.toString()
      });
      if (category) params.append('category', category);
      
      const response = await apiClient.get<{
        memories: MemoryNode[];
        total_count: number;
        has_more: boolean;
      }>(`${this.baseUrl}/users/me/memories?${params}`);
      return response.data;
    } catch (error) {
      console.error('Failed to get memories:', error);
      throw error;
    }
  }

  /**
   * Get daily memory digest
   */
  async getDailyDigest(): Promise<{
    today_memories: MemoryNode[];
    insights: MemoryInsight[];
    patterns: any[];
    recommendations: any[];
  }> {
    try {
      const response = await apiClient.get<{
        today_memories: MemoryNode[];
        insights: MemoryInsight[];
        patterns: any[];
        recommendations: any[];
      }>(`${this.baseUrl}/users/me/memories/digest`);
      return response.data;
    } catch (error) {
      console.error('Failed to get daily digest:', error);
      
      // Return mock data for development when endpoint doesn't exist
      return {
        today_memories: [
          {
            id: '1',
            faiss_id: 'faiss_1',
            content: 'Completed morning workout routine',
            content_type: 'activity_log',
            category: 'fitness',
            subcategory: 'workout',
            user_id: 'user_1',
            timestamp: new Date().toISOString(),
            relevance_score: 0.8,
            importance_score: 0.7,
            confidence_score: 0.9,
            related_memory_ids: [],
            memory_metadata: { duration: 45, type: 'cardio' },
            tags: ['workout', 'morning', 'fitness'],
            entities: ['gym', 'cardio'],
            access_count: 0
          }
        ],
        insights: [
          {
            id: '1',
            type: 'pattern',
            content: 'You\'ve maintained your morning workout routine for 5 consecutive days',
            confidence: 0.85,
            related_memories: [],
            created_at: new Date().toISOString()
          }
        ],
        patterns: [
          {
            id: '1',
            name: 'Morning Fitness',
            frequency: 'daily',
            confidence: 0.85,
            description: 'Consistent morning workout routine'
          }
        ],
        recommendations: [
          {
            id: '1',
            title: 'Maintain Morning Routine',
            description: 'Keep up the great work with your morning fitness routine!',
            priority: 'medium',
            category: 'fitness'
          }
        ]
      };
    }
  }

  /**
   * Subscribe to memory updates
   */
  subscribeToUpdates(callback: (update: MemoryUpdate) => void): () => void {
    this.updateCallbacks.push(callback);
    
    // Return unsubscribe function
    return () => {
      const index = this.updateCallbacks.indexOf(callback);
      if (index > -1) {
        this.updateCallbacks.splice(index, 1);
      }
    };
  }

  /**
   * Notify all subscribers of memory updates
   */
  private notifySubscribers(update: MemoryUpdate): void {
    this.updateCallbacks.forEach(callback => {
      try {
        callback(update);
      } catch (error) {
        console.error('Error in memory update callback:', error);
      }
    });
  }

  /**
   * Get memory status and statistics
   */
  async getMemoryStatus(): Promise<{
    enabled: boolean;
    stats: {
      total_memories: number;
      categories: Record<string, number>;
      recent_activity: any[];
    };
  }> {
    try {
      const response = await apiClient.get<{
        enabled: boolean;
        stats: {
          total_memories: number;
          categories: Record<string, number>;
          recent_activity: any[];
        };
      }>(`${this.baseUrl}/status`);
      return response.data;
    } catch (error) {
      console.error('Failed to get memory status:', error);
      throw error;
    }
  }
}

// Export singleton instance
export const memoryService = new MemoryService();
export default memoryService;
