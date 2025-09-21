import { renderHook, act } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useFitnessLogs } from '@/hooks/useFitnessLogs';
import api from '@/lib/api';

// Mock the API
jest.mock('@/lib/api');
const mockApi = api as jest.Mocked<typeof api>;

// Mock the UI store
jest.mock('@/stores/uiStore', () => ({
  useUIStore: () => ({
    addToast: jest.fn()
  })
}));

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false }
    }
  });
  
  const TestWrapper = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );
  
  TestWrapper.displayName = 'TestWrapper';
  
  return TestWrapper;
};

describe('useFitnessLogs', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('loads fitness logs on mount', async () => {
    const mockLogs = [
      {
        id: '1',
        user_id: 'user1',
        workout_name: 'Push Day',
        duration_minutes: 45,
        calories_burned: 300,
        created_at: '2024-01-15T10:00:00Z'
      }
    ];

    mockApi.get.mockResolvedValue({
      logs: mockLogs,
      stats: {
        totalWorkouts: 1,
        totalDuration: 45,
        totalCalories: 300,
        averageDifficulty: 5,
        currentStreak: 1
      }
    });

    const { result } = renderHook(() => useFitnessLogs(), {
      wrapper: createWrapper()
    });

    expect(result.current.loading).toBe(true);

    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 0));
    });

    expect(result.current.logs).toEqual(mockLogs);
    expect(result.current.loading).toBe(false);
  });

  it('handles API errors gracefully', async () => {
    mockApi.get.mockRejectedValue(new Error('API Error'));

    const { result } = renderHook(() => useFitnessLogs(), {
      wrapper: createWrapper()
    });

    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 0));
    });

    expect(result.current.error).toBe('Failed to load workout logs. Please try again.');
    expect(result.current.loading).toBe(false);
  });

  it('creates a new fitness log', async () => {
    const newLog = {
      id: '2',
      user_id: 'user1',
      workout_name: 'Pull Day',
      duration_minutes: 50,
      calories_burned: 350,
      created_at: '2024-01-15T11:00:00Z'
    };

    mockApi.post.mockResolvedValue(newLog);

    const { result } = renderHook(() => useFitnessLogs(), {
      wrapper: createWrapper()
    });

    await act(async () => {
      await result.current.createLog({
        workout_name: 'Pull Day',
        duration_minutes: 50,
        calories_burned: 350
      });
    });

    expect(mockApi.post).toHaveBeenCalledWith('/health/logging/fitness', {
      workout_name: 'Pull Day',
      duration_minutes: 50,
      calories_burned: 350
    });
  });

  it('updates an existing fitness log', async () => {
    mockApi.put.mockResolvedValue({});

    const { result } = renderHook(() => useFitnessLogs(), {
      wrapper: createWrapper()
    });

    await act(async () => {
      await result.current.editLog('1', {
        workout_name: 'Updated Workout',
        duration_minutes: 60
      });
    });

    expect(mockApi.put).toHaveBeenCalledWith('/health/logging/fitness/1', {
      workout_name: 'Updated Workout',
      duration_minutes: 60
    });
  });

  it('deletes a fitness log', async () => {
    mockApi.delete.mockResolvedValue({});

    const { result } = renderHook(() => useFitnessLogs(), {
      wrapper: createWrapper()
    });

    await act(async () => {
      await result.current.removeLog('1');
    });

    expect(mockApi.delete).toHaveBeenCalledWith('/health/logging/fitness/1');
  });

  it('performs bulk delete', async () => {
    mockApi.delete.mockResolvedValue({});

    const { result } = renderHook(() => useFitnessLogs(), {
      wrapper: createWrapper()
    });

    await act(async () => {
      await result.current.bulkDeleteLogs(['1', '2', '3']);
    });

    expect(mockApi.delete).toHaveBeenCalledTimes(3);
    expect(mockApi.delete).toHaveBeenCalledWith('/health/logging/fitness/1');
    expect(mockApi.delete).toHaveBeenCalledWith('/health/logging/fitness/2');
    expect(mockApi.delete).toHaveBeenCalledWith('/health/logging/fitness/3');
  });
});
