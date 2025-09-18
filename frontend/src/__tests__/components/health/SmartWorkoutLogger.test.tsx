import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { SmartWorkoutLogger } from '@/components/health/SmartWorkoutLogger';
import { simpleRoutineApi } from '@/lib/simpleRoutineApi';
import api from '@/lib/api';
import { toast } from 'sonner';

// Mock the APIs
jest.mock('@/lib/simpleRoutineApi');
jest.mock('@/lib/api');
jest.mock('sonner', () => ({
  toast: {
    success: jest.fn(),
    error: jest.fn(),
  },
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
        {
          exercise_name: 'Dumbbell Rows',
          sets: 3,
          reps: '10-12',
          weight_notes: 'light weight',
          rest_time: '60-90 seconds',
          notes: 'Control the weight'
        }
      ]
    },
    {
      day: 'Wednesday',
      workout_name: 'Lower Body',
      exercises: [
        {
          exercise_name: 'Bodyweight Squats',
          sets: 3,
          reps: '12-15',
          weight_notes: 'bodyweight',
          rest_time: '60-90 seconds',
          notes: 'Keep knees behind toes'
        }
      ]
    }
  ],
  total_workouts_per_week: 2
};

describe('SmartWorkoutLogger', () => {
  const mockOnClose = jest.fn();
  const mockOnSuccess = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    (simpleRoutineApi.getRoutines as jest.Mock).mockResolvedValue({
      routines: [mockActiveRoutine],
      total: 1,
      page: 1,
      size: 10
    });
    (simpleRoutineApi.getRoutine as jest.Mock).mockResolvedValue(mockActiveRoutine);
    (api.post as jest.Mock).mockResolvedValue({});
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
    // Mock current day as Monday
    const mockDate = new Date('2024-01-01T10:00:00Z'); // Monday
    jest.spyOn(global, 'Date').mockImplementation(() => mockDate);

    render(
      <SmartWorkoutLogger
        isOpen={true}
        onClose={mockOnClose}
        onSuccess={mockOnSuccess}
      />
    );

    await waitFor(() => {
      expect(screen.getByText('Push-ups')).toBeInTheDocument();
      expect(screen.getByText('Dumbbell Rows')).toBeInTheDocument();
    });
  });

  it('displays workout details correctly', async () => {
    const mockDate = new Date('2024-01-01T10:00:00Z'); // Monday
    jest.spyOn(global, 'Date').mockImplementation(() => mockDate);

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
      expect(screen.getByText('bodyweight')).toBeInTheDocument();
    });
  });

  it('allows editing workout values', async () => {
    const mockDate = new Date('2024-01-01T10:00:00Z'); // Monday
    jest.spyOn(global, 'Date').mockImplementation(() => mockDate);

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

    const editButton = screen.getByLabelText('Edit Push-ups');
    fireEvent.click(editButton);

    // Check if edit form appears
    expect(screen.getByDisplayValue('3')).toBeInTheDocument(); // Sets
    expect(screen.getByDisplayValue('10-15')).toBeInTheDocument(); // Reps
  });

  it('handles workout completion', async () => {
    const mockDate = new Date('2024-01-01T10:00:00Z'); // Monday
    jest.spyOn(global, 'Date').mockImplementation(() => mockDate);

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

    const completeButton = screen.getByLabelText('Complete Push-ups');
    fireEvent.click(completeButton);

    await waitFor(() => {
      expect(screen.getByText('Log Workouts')).toBeInTheDocument();
    });
  });

  it('logs completed workouts successfully', async () => {
    const mockDate = new Date('2024-01-01T10:00:00Z'); // Monday
    jest.spyOn(global, 'Date').mockImplementation(() => mockDate);

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

    // Complete a workout
    const completeButton = screen.getByLabelText('Complete Push-ups');
    fireEvent.click(completeButton);

    // Log the workout
    const logButton = screen.getByText('Log Workouts');
    fireEvent.click(logButton);

    await waitFor(() => {
      expect(api.post).toHaveBeenCalledWith('/health/contextual-logging/log-workout', expect.any(Object));
      expect(toast.success).toHaveBeenCalledWith('Workout logged successfully!');
      expect(mockOnSuccess).toHaveBeenCalled();
    });
  });

  it('handles manual workout logging', async () => {
    render(
      <SmartWorkoutLogger
        isOpen={true}
        onClose={mockOnClose}
        onSuccess={mockOnSuccess}
      />
    );

    // Switch to manual logging tab
    const manualTab = screen.getByText('Manual Logging');
    fireEvent.click(manualTab);

    // Add a new exercise
    const addButton = screen.getByText('Add Exercise');
    fireEvent.click(addButton);

    // Fill in exercise details
    const exerciseNameInput = screen.getByPlaceholderText('Exercise name');
    fireEvent.change(exerciseNameInput, { target: { value: 'Custom Exercise' } });

    const setsInput = screen.getByDisplayValue('3');
    fireEvent.change(setsInput, { target: { value: '4' } });

    const repsInput = screen.getByDisplayValue('10');
    fireEvent.change(repsInput, { target: { value: '12' } });

    // Log the workout
    const logButton = screen.getByText('Log Workout');
    fireEvent.click(logButton);

    await waitFor(() => {
      expect(api.post).toHaveBeenCalledWith('/health/contextual-logging/log-workout', expect.any(Object));
      expect(toast.success).toHaveBeenCalledWith('Workout logged successfully!');
    });
  });

  it('handles no active routine', async () => {
    (simpleRoutineApi.getRoutines as jest.Mock).mockResolvedValue({
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
      expect(screen.getByText('Please activate a routine first')).toBeInTheDocument();
    });
  });

  it('handles no workouts for today', async () => {
    const routineWithNoMondayWorkouts = {
      ...mockActiveRoutine,
      workout_schedule: [
        {
          day: 'Wednesday',
          workout_name: 'Lower Body',
          exercises: []
        }
      ]
    };

    (simpleRoutineApi.getRoutine as jest.Mock).mockResolvedValue(routineWithNoMondayWorkouts);

    const mockDate = new Date('2024-01-01T10:00:00Z'); // Monday
    jest.spyOn(global, 'Date').mockImplementation(() => mockDate);

    render(
      <SmartWorkoutLogger
        isOpen={true}
        onClose={mockOnClose}
        onSuccess={mockOnSuccess}
      />
    );

    await waitFor(() => {
      expect(screen.getByText('No workouts scheduled for today')).toBeInTheDocument();
    });
  });

  it('handles API errors gracefully', async () => {
    (simpleRoutineApi.getRoutines as jest.Mock).mockRejectedValue(new Error('API Error'));

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
