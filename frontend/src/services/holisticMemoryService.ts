const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

export interface HolisticContext {
  user_id: string;
  user_message: string;
  context: {
    data_sources: {
      logs: any;
      journals: any;
      chats: any;
      memories: any;
    };
    holistic_summary: {
      user_state: string;
      recent_activity: string[];
      emotional_trends: string[];
      health_patterns: string[];
      conversation_themes: string[];
    };
    cross_connections: Array<{
      type: string;
      description: string;
      insight: string;
    }>;
  };
  timestamp: string;
  intent: any;
  summary: any;
}

export interface HolisticResponse {
  user_message: string;
  ai_response: string;
  context_used: HolisticContext;
  timestamp: string;
}

export interface IntentAnalysis {
  detected_intent: string;
  confidence: number;
  keywords: string[];
  suggested_mode: 'action' | 'conversation';
}

export class HolisticMemoryService {
  private static async makeRequest(endpoint: string, options: RequestInit = {}): Promise<Response> {
    const url = `${API_BASE_URL}/api/v1${endpoint}`;
    
    const defaultOptions: RequestInit = {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      credentials: 'include', // Include cookies for authentication
      ...options,
    };

    return fetch(url, defaultOptions);
  }

  static async getHolisticContext(
    userMessage: string,
    conversationId?: string,
    timeWindowHours: number = 168
  ): Promise<HolisticContext> {
    try {
      const params = new URLSearchParams({
        user_message: userMessage,
        time_window_hours: timeWindowHours.toString(),
      });
      
      if (conversationId) {
        params.append('conversation_id', conversationId);
      }

      const response = await this.makeRequest(`/holistic-memory/context?${params.toString()}`);
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.detail || `HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error getting holistic context:', error);
      throw error;
    }
  }

  static async generateHolisticResponse(
    userMessage: string,
    conversationId?: string
  ): Promise<HolisticResponse> {
    try {
      const response = await this.makeRequest('/holistic-memory/response', {
        method: 'POST',
        body: JSON.stringify({
          user_message: userMessage,
          conversation_id: conversationId,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.detail || `HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error generating holistic response:', error);
      throw error;
    }
  }

  static async analyzeIntent(userMessage: string): Promise<IntentAnalysis> {
    try {
      const response = await this.makeRequest('/holistic-memory/intent', {
        method: 'POST',
        body: JSON.stringify({
          user_message: userMessage,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.detail || `HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error analyzing intent:', error);
      throw error;
    }
  }

  static async getMemoryTimeline(
    startDate?: string,
    endDate?: string,
    types?: string[]
  ): Promise<any> {
    try {
      const params = new URLSearchParams();
      if (startDate) params.append('start_date', startDate);
      if (endDate) params.append('end_date', endDate);
      if (types) params.append('types', types.join(','));

      const response = await this.makeRequest(`/holistic-memory/timeline?${params.toString()}`);
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.detail || `HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error getting memory timeline:', error);
      throw error;
    }
  }

  static async getDashboard(
    userMessage?: string,
    conversationId?: string
  ): Promise<{
    context: HolisticContext;
    timeline: any;
    insights: any;
  }> {
    try {
      const params = new URLSearchParams();
      if (userMessage) params.append('user_message', userMessage);
      if (conversationId) params.append('conversation_id', conversationId);

      const response = await this.makeRequest(`/holistic-memory/dashboard?${params.toString()}`);
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.detail || `HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error getting dashboard:', error);
      throw error;
    }
  }

  static async streamHolisticContext(
    userMessage: string,
    onChunk: (chunk: any) => void,
    onComplete: (context: HolisticContext) => void,
    onError: (error: Error) => void,
    conversationId?: string,
    timeWindowHours: number = 168
  ): Promise<void> {
    try {
      const params = new URLSearchParams({
        user_message: userMessage,
        time_window_hours: timeWindowHours.toString(),
      });
      
      if (conversationId) {
        params.append('conversation_id', conversationId);
      }

      const response = await this.makeRequest(`/holistic-memory/context/stream?${params.toString()}`);
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.detail || `HTTP error! status: ${response.status}`);
      }

      const reader = response.body?.getReader();
      if (!reader) {
        throw new Error('No response body reader available');
      }

      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        
        if (done) break;
        
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const data = JSON.parse(line.slice(6));
              onChunk(data);
              
              if (data.type === 'complete' && data.context) {
                onComplete(data.context);
                return;
              }
            } catch (e) {
              console.warn('Failed to parse stream data:', line);
            }
          }
        }
      }
    } catch (error) {
      console.error('Error streaming holistic context:', error);
      onError(error instanceof Error ? error : new Error('Unknown error'));
    }
  }
}
