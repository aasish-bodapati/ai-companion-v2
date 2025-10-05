import { API_BASE_URL } from '../config/api';

export interface ActiveRoutineResponse {
  active_routine_id: string | null;
  message: string;
}

export interface ActiveRoutineRequest {
  routine_id: string;
}

class ActiveRoutineService {
  private baseUrl = `${API_BASE_URL}/health`;

  private async getAuthHeaders(): Promise<HeadersInit> {
    // Get token from AsyncStorage or your auth context
    const token = await this.getAuthToken();
    return {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    };
  }

  private async getAuthToken(): Promise<string> {
    // This should get the token from your auth storage
    // For now, return empty string - you'll need to implement this
    try {
      const AsyncStorage = require('@react-native-async-storage/async-storage').default;
      const token = await AsyncStorage.getItem('token');
      return token || '';
    } catch (error) {
      console.error('Error getting auth token:', error);
      return '';
    }
  }

  async getActiveRoutine(): Promise<ActiveRoutineResponse> {
    try {
      const response = await fetch(`${this.baseUrl}/active-routine`, {
        method: 'GET',
        headers: await this.getAuthHeaders(),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching active routine:', error);
      throw error;
    }
  }

  async setActiveRoutine(routineId: string): Promise<ActiveRoutineResponse> {
    try {
      const response = await fetch(`${this.baseUrl}/active-routine`, {
        method: 'POST',
        headers: await this.getAuthHeaders(),
        body: JSON.stringify({ routine_id: routineId }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error setting active routine:', error);
      throw error;
    }
  }

  async clearActiveRoutine(): Promise<ActiveRoutineResponse> {
    try {
      const response = await fetch(`${this.baseUrl}/active-routine`, {
        method: 'DELETE',
        headers: await this.getAuthHeaders(),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error clearing active routine:', error);
      throw error;
    }
  }
}

const activeRoutineService = new ActiveRoutineService();
export default activeRoutineService;

