import { api } from './api';


import { DebugUtils } from '../utils/debugUtils';

export interface ActiveRoutineResponse {
  active_routine_id: string | null;
  message: string;
}

export interface ActiveRoutineRequest {
  routine_id: string;
}

class ActiveRoutineService {
  async getActiveRoutine(): Promise<ActiveRoutineResponse> {
    try {
      const response = await api.get('/api/v1/health/active-routine');
      return response;
    } catch (error) {
      DebugUtils.error('Error fetching active routine:', error);
      throw error;
    }
  }

  async setActiveRoutine(routineId: string): Promise<ActiveRoutineResponse> {
    try {
      const response = await api.post('/api/v1/health/active-routine', { routine_id: routineId });
      return response;
    } catch (error) {
      DebugUtils.error('Error setting active routine:', error);
      throw error;
    }
  }

  async clearActiveRoutine(): Promise<ActiveRoutineResponse> {
    try {
      const response = await api.delete('/api/v1/health/active-routine');
      return response;
    } catch (error) {
      DebugUtils.error('Error clearing active routine:', error);
      throw error;
    }
  }
}

const activeRoutineService = new ActiveRoutineService();
export default activeRoutineService;

