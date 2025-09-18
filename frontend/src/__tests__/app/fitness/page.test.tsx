import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import FitnessPage from '@/app/fitness/page';
import { simpleRoutineApi } from '@/lib/simpleRoutineApi';
import { nutritionRoutineApi } from '@/lib/nutritionRoutineApi';

// Mock the APIs
jest.mock('@/lib/simpleRoutineApi');
jest.mock('@/lib/nutritionRoutineApi');

// Mock Next.js navigation
jest.mock('next/navigation', () => ({
  useRouter() {
    return {
      push: jest.fn(),
      replace: jest.fn(),
      prefetch: jest.fn(),
    }
  },
}));

const mockFitnessRoutines = [
  {
    id: '1',
    name: 'Beginner Full Body',
    description: 'A beginner-friendly workout',
    difficulty: 'beginner',
    tags: ['weightlifting'],
    is_template: true,
    user_progress: null,
    workout_schedule: [
      {
        day: 'Monday',
        workout_name: 'Upper Body',
        exercises: [
          {
            exercise_name: 'Push-ups',
            sets: 3,
            reps: '10-15',
            weight_notes: 'bodyweight',
            rest_time: '60-90 seconds',
            notes: 'Keep core tight'
          }
        ]
      }
    ],
    total_workouts_per_week: 1
  }
];

const mockNutritionRoutines = [
  {
    id: '1',
    name: 'Balanced Diet',
    description: 'A balanced nutrition plan',
    target_calories: 2000,
    tags: ['balanced'],
    is_template: true,
    user_progress: null,
    meal_plans: [
      {
        day_name: 'monday',
        plan_name: 'Daily Plan',
        daily_calories: 2000,
        meals: [
          {
            meal_name: 'Breakfast',
            meal_type: 'breakfast',
            calories: 400,
            food_items: [
              {
                food_name: 'Oatmeal',
                quantity: '1 cup',
                calories: 300
              }
            ]
          }
        ]
      }
    ]
  }
];

describe('FitnessPage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (simpleRoutineApi.getRoutines as jest.Mock).mockResolvedValue({
      routines: mockFitnessRoutines,
      total: 1,
      page: 1,
      size: 10
    });
    (nutritionRoutineApi.getRoutines as jest.Mock).mockResolvedValue({
      routines: mockNutritionRoutines,
      total: 1,
      page: 1,
      size: 10
    });
  });

  it('renders fitness page correctly', async () => {
    render(<FitnessPage />);

    await waitFor(() => {
      expect(screen.getByText('Fitness & Routines')).toBeInTheDocument();
      expect(screen.getByText('Log Today\'s Workout')).toBeInTheDocument();
      expect(screen.getByText('View Routines')).toBeInTheDocument();
    });
  });

  it('displays fitness routines', async () => {
    render(<FitnessPage />);

    await waitFor(() => {
      expect(screen.getByText('Beginner Full Body')).toBeInTheDocument();
      expect(screen.getByText('A beginner-friendly workout')).toBeInTheDocument();
    });
  });

  it('opens smart workout logger when log workout button is clicked', async () => {
    render(<FitnessPage />);

    await waitFor(() => {
      expect(screen.getByText('Log Today\'s Workout')).toBeInTheDocument();
    });

    const logButton = screen.getByText('Log Today\'s Workout');
    fireEvent.click(logButton);

    await waitFor(() => {
      expect(screen.getByText('Log Today\'s Workout')).toBeInTheDocument(); // Dialog title
      expect(screen.getByText('Routine Workouts')).toBeInTheDocument();
    });
  });

  it('closes smart workout logger when close button is clicked', async () => {
    render(<FitnessPage />);

    // Open the logger
    const logButton = screen.getByText('Log Today\'s Workout');
    fireEvent.click(logButton);

    await waitFor(() => {
      expect(screen.getByText('Log Today\'s Workout')).toBeInTheDocument();
    });

    // Close the logger
    const closeButton = screen.getByLabelText('Close');
    fireEvent.click(closeButton);

    // Logger should be closed
    expect(screen.queryByText('Routine Workouts')).not.toBeInTheDocument();
  });

  it('handles routine selection', async () => {
    render(<FitnessPage />);

    await waitFor(() => {
      expect(screen.getByText('Beginner Full Body')).toBeInTheDocument();
    });

    // This would test the routine selection if there's a select button
    // The actual implementation depends on how routine selection works
  });

  it('displays nutrition routines section', async () => {
    render(<FitnessPage />);

    await waitFor(() => {
      expect(screen.getByText('Nutrition Routines')).toBeInTheDocument();
      expect(screen.getByText('Balanced Diet')).toBeInTheDocument();
    });
  });

  it('handles API errors gracefully', async () => {
    (simpleRoutineApi.getRoutines as jest.Mock).mockRejectedValue(new Error('API Error'));

    render(<FitnessPage />);

    await waitFor(() => {
      expect(screen.getByText('Failed to load routines')).toBeInTheDocument();
    });
  });

  it('shows loading state initially', () => {
    render(<FitnessPage />);

    expect(screen.getByText('Loading routines...')).toBeInTheDocument();
  });

  it('displays empty state when no routines', async () => {
    (simpleRoutineApi.getRoutines as jest.Mock).mockResolvedValue({
      routines: [],
      total: 0,
      page: 1,
      size: 10
    });
    (nutritionRoutineApi.getRoutines as jest.Mock).mockResolvedValue({
      routines: [],
      total: 0,
      page: 1,
      size: 10
    });

    render(<FitnessPage />);

    await waitFor(() => {
      expect(screen.getByText('No routines found')).toBeInTheDocument();
    });
  });

  it('handles smart workout logger success callback', async () => {
    render(<FitnessPage />);

    // Open the logger
    const logButton = screen.getByText('Log Today\'s Workout');
    fireEvent.click(logButton);

    await waitFor(() => {
      expect(screen.getByText('Log Today\'s Workout')).toBeInTheDocument();
    });

    // Simulate successful logging (this would trigger the onSuccess callback)
    // The actual implementation depends on how the success callback is handled
  });
});
