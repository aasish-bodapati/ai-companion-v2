import { ActionInput } from '@/components/chat/ActionModeInput';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

export interface ActionLogResponse {
  success: boolean;
  message: string;
  action_id?: string;
  timestamp: string;
}

export class ActionService {
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

  static async logAction(action: ActionInput): Promise<ActionLogResponse> {
    try {
      const response = await this.makeRequest('/actions/log', {
        method: 'POST',
        body: JSON.stringify({
          type: action.type,
          details: action.details,
          notes: action.notes,
          timestamp: new Date().toISOString(),
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.detail || `HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return {
        success: true,
        message: `${action.type} logged successfully`,
        action_id: data.action_id,
        timestamp: data.timestamp || new Date().toISOString(),
      };
    } catch (error) {
      console.error('Error logging action:', error);
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Failed to log action',
        timestamp: new Date().toISOString(),
      };
    }
  }

  static async getRecentActions(limit: number = 10): Promise<ActionInput[]> {
    try {
      const response = await this.makeRequest(`/actions/recent?limit=${limit}`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data.actions || [];
    } catch (error) {
      console.error('Error fetching recent actions:', error);
      return [];
    }
  }

  static async getActionHistory(
    type?: ActionInput['type'],
    startDate?: string,
    endDate?: string
  ): Promise<ActionInput[]> {
    try {
      const params = new URLSearchParams();
      if (type) params.append('type', type);
      if (startDate) params.append('start_date', startDate);
      if (endDate) params.append('end_date', endDate);

      const response = await this.makeRequest(`/actions/history?${params.toString()}`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data.actions || [];
    } catch (error) {
      console.error('Error fetching action history:', error);
      return [];
    }
  }

  static async deleteAction(actionId: string): Promise<boolean> {
    try {
      const response = await this.makeRequest(`/actions/${actionId}`, {
        method: 'DELETE',
      });

      return response.ok;
    } catch (error) {
      console.error('Error deleting action:', error);
      return false;
    }
  }

  static async updateAction(
    actionId: string,
    updates: Partial<ActionInput>
  ): Promise<ActionLogResponse> {
    try {
      const response = await this.makeRequest(`/actions/${actionId}`, {
        method: 'PATCH',
        body: JSON.stringify(updates),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.detail || `HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return {
        success: true,
        message: 'Action updated successfully',
        action_id: data.action_id,
        timestamp: data.timestamp || new Date().toISOString(),
      };
    } catch (error) {
      console.error('Error updating action:', error);
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Failed to update action',
        timestamp: new Date().toISOString(),
      };
    }
  }
}
