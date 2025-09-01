/**
 * @jest-environment jsdom
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import TodayPage from '@/app/today/page';

// Mock the services
jest.mock('@/services/routineService', () => ({
  routineService: {
    getTodaysRoutine: jest.fn(() => [
      {
        id: 'wake_up',
        time: '04:30',
        activity: 'Wake up',
        icon: '🌅',
        status: 'completed',
        type: 'routine',
        isRecurring: true,
        estimatedDuration: 5
      },
      {
        id: 'workout',
        time: '05:00',
        activity: 'Workout',
        icon: '💪',
        status: 'in-progress',
        type: 'workout',
        isRecurring: true,
        estimatedDuration: 90
      },
      {
        id: 'breakfast',
        time: '08:00',
        activity: 'Breakfast',
        icon: '🥗',
        status: 'upcoming',
        type: 'meal',
        isRecurring: true,
        estimatedDuration: 30,
        nutritionInfo: {
          calories: 650,
          protein: 45,
          carbs: 35,
          fat: 25,
          fiber: 8
        }
      }
    ]),
    completeActivity: jest.fn(),
    skipActivity: jest.fn(),
    getTodayCompletionRate: jest.fn(() => 67),
    getStreakInfo: jest.fn(() => ({ current: 7, best: 12 })),
    getDailyNutritionTotals: jest.fn(() => ({
      calories: 650,
      protein: 45,
      carbs: 35,
      fat: 25,
      fiber: 8
    })),
    getPersonalizedInsights: jest.fn(() => [
      'Great consistency! You\'re building strong habits.',
      'Your 4:30 AM routine gives you a head start on the day.'
    ])
  }
}));

// Mock API calls
jest.mock('@/lib/api', () => ({
  default: {
    get: jest.fn(() => Promise.resolve([])),
    post: jest.fn(() => Promise.resolve({}))
  }
}));

// Mock Next.js router
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
    prefetch: jest.fn()
  }),
  useSearchParams: () => ({
    get: jest.fn()
  })
}));

const renderWithQueryClient = (component: React.ReactElement) => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  });

  return render(
    <QueryClientProvider client={queryClient}>
      {component}
    </QueryClientProvider>
  );
};

describe('TodayPage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('renders today page with main components', async () => {
    renderWithQueryClient(<TodayPage />);
    
    await waitFor(() => {
      expect(screen.getByText('Your Daily Companion')).toBeInTheDocument();
      expect(screen.getByText('Today\'s Routine')).toBeInTheDocument();
      expect(screen.getByText('Smart Suggestions')).toBeInTheDocument();
      expect(screen.getByText('Today\'s Life Habits')).toBeInTheDocument();
      expect(screen.getByText('Today\'s Progress')).toBeInTheDocument();
    });
  });

  test('displays routine activities with correct status', async () => {
    renderWithQueryClient(<TodayPage />);
    
    await waitFor(() => {
      expect(screen.getByText('Wake up')).toBeInTheDocument();
      expect(screen.getByText('Workout')).toBeInTheDocument();
      expect(screen.getByText('Breakfast')).toBeInTheDocument();
      
      expect(screen.getByText('✓ Done')).toBeInTheDocument(); // Wake up completed
      expect(screen.getByText('🔄 Now')).toBeInTheDocument(); // Workout in progress
      expect(screen.getByText('⏰ Upcoming')).toBeInTheDocument(); // Breakfast upcoming
    });
  });

  test('allows marking activities as completed', async () => {
    const { routineService } = require('@/services/routineService');
    renderWithQueryClient(<TodayPage />);
    
    await waitFor(() => {
      const completeButtons = screen.getAllByTitle('Mark as completed');
      expect(completeButtons.length).toBeGreaterThan(0);
    });
    
    const completeButton = screen.getAllByTitle('Mark as completed')[0];
    fireEvent.click(completeButton);
    
    expect(routineService.completeActivity).toHaveBeenCalled();
  });

  test('allows skipping activities', async () => {
    const { routineService } = require('@/services/routineService');
    renderWithQueryClient(<TodayPage />);
    
    await waitFor(() => {
      const skipButtons = screen.getAllByTitle('Skip this activity');
      expect(skipButtons.length).toBeGreaterThan(0);
    });
    
    const skipButton = screen.getAllByTitle('Skip this activity')[0];
    fireEvent.click(skipButton);
    
    expect(routineService.skipActivity).toHaveBeenCalled();
  });

  test('displays progress ring with completion percentage', async () => {
    renderWithQueryClient(<TodayPage />);
    
    await waitFor(() => {
      expect(screen.getByText('Daily Routine')).toBeInTheDocument();
      expect(screen.getByText('67% completed today')).toBeInTheDocument();
    });
  });

  test('shows streak information', async () => {
    renderWithQueryClient(<TodayPage />);
    
    await waitFor(() => {
      expect(screen.getByText('Streak: 7 days (Best: 12)')).toBeInTheDocument();
    });
  });

  test('displays smart suggestions with real data', async () => {
    renderWithQueryClient(<TodayPage />);
    
    await waitFor(() => {
      expect(screen.getByText('Smart Suggestions')).toBeInTheDocument();
      expect(screen.getByText(/You've completed 67% of today's routine/)).toBeInTheDocument();
      expect(screen.getByText(/Current: 650 kcal, 45g protein/)).toBeInTheDocument();
    });
  });

  test('provides navigation links to other dashboards', async () => {
    renderWithQueryClient(<TodayPage />);
    
    await waitFor(() => {
      const fitnessLinks = screen.getAllByText('Fitness');
      const nutritionLinks = screen.getAllByText('Nutrition');
      
      expect(fitnessLinks.length).toBeGreaterThan(0);
      expect(nutritionLinks.length).toBeGreaterThan(0);
    });
  });

  test('handles habit tracking with checkboxes', async () => {
    renderWithQueryClient(<TodayPage />);
    
    await waitFor(() => {
      expect(screen.getByText('Today\'s Life Habits')).toBeInTheDocument();
      
      const checkboxes = screen.getAllByRole('checkbox');
      expect(checkboxes.length).toBeGreaterThan(0);
    });
    
    // Test checking a habit
    const checkbox = screen.getAllByRole('checkbox')[0];
    fireEvent.click(checkbox);
    expect(checkbox).toBeChecked();
  });

  test('displays quick action buttons', async () => {
    renderWithQueryClient(<TodayPage />);
    
    await waitFor(() => {
      expect(screen.getByText('Quick Actions')).toBeInTheDocument();
      expect(screen.getByText('Log Water')).toBeInTheDocument();
      expect(screen.getByText('Log Mood')).toBeInTheDocument();
      expect(screen.getByText('Get Advice')).toBeInTheDocument();
    });
  });

  test('handles quick action clicks', async () => {
    const api = require('@/lib/api').default;
    renderWithQueryClient(<TodayPage />);
    
    await waitFor(() => {
      const logWaterButton = screen.getByText('Log Water');
      expect(logWaterButton).toBeInTheDocument();
    });
    
    const logWaterButton = screen.getByText('Log Water');
    fireEvent.click(logWaterButton);
    
    await waitFor(() => {
      expect(api.post).toHaveBeenCalledWith('/trackers/hydration', expect.any(Object));
    });
  });

  test('displays personalized insights', async () => {
    renderWithQueryClient(<TodayPage />);
    
    await waitFor(() => {
      expect(screen.getByText('Today\'s Insight')).toBeInTheDocument();
      expect(screen.getByText(/Your 4:30 AM wake-up routine is working/)).toBeInTheDocument();
    });
  });

  test('shows current time in routine section', async () => {
    renderWithQueryClient(<TodayPage />);
    
    await waitFor(() => {
      expect(screen.getByText(/Current time:/)).toBeInTheDocument();
    });
  });

  test('handles add habit functionality', async () => {
    renderWithQueryClient(<TodayPage />);
    
    await waitFor(() => {
      const addHabitButton = screen.getByText('+ Add Habit');
      expect(addHabitButton).toBeInTheDocument();
    });
    
    const addHabitButton = screen.getByText('+ Add Habit');
    fireEvent.click(addHabitButton);
    
    // Should add a new habit to the list
    await waitFor(() => {
      const newHabitInputs = screen.getAllByRole('checkbox');
      expect(newHabitInputs.length).toBeGreaterThan(4); // Default habits + new one
    });
  });

  test('handles remove habit functionality', async () => {
    renderWithQueryClient(<TodayPage />);
    
    await waitFor(() => {
      const removeButtons = screen.getAllByLabelText('Remove habit');
      expect(removeButtons.length).toBeGreaterThan(0);
    });
    
    const initialCheckboxCount = screen.getAllByRole('checkbox').length;
    const removeButton = screen.getAllByLabelText('Remove habit')[0];
    fireEvent.click(removeButton);
    
    await waitFor(() => {
      const newCheckboxCount = screen.getAllByRole('checkbox').length;
      expect(newCheckboxCount).toBe(initialCheckboxCount - 1);
    });
  });
});
