import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import FitnessPage from '@/app/fitness/page';

// Mock the API modules
const mockSimpleRoutineApi = {
  getRoutines: jest.fn(),
  getRoutine: jest.fn(),
};

const mockNutritionRoutineApi = {
  getRoutines: jest.fn(),
};

jest.mock('@/lib/simpleRoutineApi', () => ({
  simpleRoutineApi: mockSimpleRoutineApi,
}));

jest.mock('@/lib/nutritionRoutineApi', () => ({
  nutritionRoutineApi: mockNutritionRoutineApi,
}));

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
  }
];

describe('FitnessPage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockSimpleRoutineApi.getRoutines.mockResolvedValue({
      routines: mockFitnessRoutines,
      total: 1,
      page: 1,
      size: 10
    });
    mockSimpleRoutineApi.getRoutine.mockResolvedValue(mockFitnessRoutines[0]);
    mockNutritionRoutineApi.getRoutines.mockResolvedValue({
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
      expect(screen.getByText('Routine Workouts')).toBeInTheDocument();
    });
  });

  it('handles API errors gracefully', async () => {
    mockSimpleRoutineApi.getRoutines.mockRejectedValue(new Error('API Error'));

    render(<FitnessPage />);

    await waitFor(() => {
      expect(screen.getByText('Failed to load routines')).toBeInTheDocument();
    });
  });

  it('shows loading state initially', () => {
    render(<FitnessPage />);

    expect(screen.getByText('Loading routines...')).toBeInTheDocument();
  });
});
