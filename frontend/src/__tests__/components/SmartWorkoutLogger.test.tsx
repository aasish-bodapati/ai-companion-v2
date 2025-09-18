import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { SmartWorkoutLogger } from '@/components/health/SmartWorkoutLogger';

// Mock the API modules
const mockSimpleRoutineApi = {
  getRoutines: jest.fn(),
  getRoutine: jest.fn(),
};

const mockApi = {
  post: jest.fn(),
};

jest.mock('@/lib/simpleRoutineApi', () => ({
  simpleRoutineApi: mockSimpleRoutineApi,
}));

jest.mock('@/lib/api', () => ({
  __esModule: true,
  default: mockApi,
}));

// Mock toast
const mockToast = {
  success: jest.fn(),
  error: jest.fn(),
};

jest.mock('sonner', () => ({
  toast: mockToast,
}));

const mockActiveRoutine = {
  id: '1',
  name: 'Beginner Full Body',
  description: 'A beginner-friendly full body workout',
  difficulty: 'beginner',
  duration_weeks: 4,
  tags: ['weightlifting', 'beginner'],
  is_template: true,
  created_by: 'system',
  created_at: '2024-01-01T00:00:00Z',
  updated_at: '2024-01-01T00:00:00Z',
  user_progress: {
    id: 'progress-1',
    user_id: 'user-1',
    routine_id: '1',
    is_active: true,
    started_at: '2024-01-01T00:00:00Z',
    last_workout_at: null,
    total_workouts: 0,
    streak: 0,
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z'
  },
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
        },
      ]
    },
  ],
  total_workouts_per_week: 1
};

describe('SmartWorkoutLogger', () => {
  const mockOnClose = jest.fn();
  const mockOnSuccess = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    mockSimpleRoutineApi.getRoutines.mockResolvedValue({
      routines: [mockActiveRoutine],
      total: 1,
      page: 1,
      size: 10
    });
    mockSimpleRoutineApi.getRoutine.mockResolvedValue(mockActiveRoutine);
    mockApi.post.mockResolvedValue({});
    
    // Mock Date to always return Monday
    jest.spyOn(global, 'Date').mockImplementation(() => new Date('2024-01-01T10:00:00Z')); // Monday
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('renders smart workout logger dialog', () => {
    render(
      <SmartWorkoutLogger
        isOpen={true}
        onClose={mockOnClose}
        onSuccess={mockOnSuccess}
      />
    );

    expect(screen.getByText('Log Today\'s Workout')).toBeInTheDocument();
    expect(screen.getByText('Routine Workouts')).toBeInTheDocument();
    expect(screen.getByText('Manual Logging')).toBeInTheDocument();
  });

  it('loads today\'s workouts from active routine', async () => {
    render(
      <SmartWorkoutLogger
        isOpen={true}
        onClose={mockOnClose}
        onSuccess={mockOnSuccess}
      />
    );

    await waitFor(() => {
      expect(screen.getByText('Push-ups')).toBeInTheDocument();
    });
  });

  it('displays workout details correctly', async () => {
    render(
      <SmartWorkoutLogger
        isOpen={true}
        onClose={mockOnClose}
        onSuccess={mockOnSuccess}
      />
    );

    await waitFor(() => {
      expect(screen.getByText('Push-ups')).toBeInTheDocument();
      expect(screen.getByText('3 sets')).toBeInTheDocument();
      expect(screen.getByText('10-15 reps')).toBeInTheDocument();
    });
  });

  it('handles no active routine', async () => {
    mockSimpleRoutineApi.getRoutines.mockResolvedValue({
      routines: [],
      total: 0,
      page: 1,
      size: 10
    });

    render(
      <SmartWorkoutLogger
        isOpen={true}
        onClose={mockOnClose}
        onSuccess={mockOnSuccess}
      />
    );

    await waitFor(() => {
      expect(screen.getByText('No active routine found')).toBeInTheDocument();
    });
  });

  it('handles API errors gracefully', async () => {
    mockSimpleRoutineApi.getRoutines.mockRejectedValue(new Error('API Error'));

    render(
      <SmartWorkoutLogger
        isOpen={true}
        onClose={mockOnClose}
        onSuccess={mockOnSuccess}
      />
    );

    await waitFor(() => {
      expect(screen.getByText('Failed to load workouts')).toBeInTheDocument();
    });
  });

  it('closes dialog when close button is clicked', () => {
    render(
      <SmartWorkoutLogger
        isOpen={true}
        onClose={mockOnClose}
        onSuccess={mockOnSuccess}
      />
    );

    const closeButton = screen.getByLabelText('Close');
    fireEvent.click(closeButton);

    expect(mockOnClose).toHaveBeenCalled();
  });
});
