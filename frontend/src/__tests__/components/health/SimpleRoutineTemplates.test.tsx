import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { SimpleRoutineTemplates } from '@/components/health/SimpleRoutineTemplates';
import { simpleRoutineApi } from '@/lib/simpleRoutineApi';
import { toast } from 'sonner';

// Mock the API
jest.mock('@/lib/simpleRoutineApi');
jest.mock('sonner', () => ({
  toast: {
    success: jest.fn(),
    error: jest.fn(),
  },
}));

// Mock the API response
const mockRoutines = [
  {
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
  }
];

const mockDetailedRoutine = {
  ...mockRoutines[0],
  workout_schedule: mockRoutines[0].workout_schedule,
  total_workouts_per_week: 2
};

describe('SimpleRoutineTemplates', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (simpleRoutineApi.getRoutines as jest.Mock).mockResolvedValue({
      routines: mockRoutines,
      total: 1,
      page: 1,
      size: 10
    });
    (simpleRoutineApi.getRoutine as jest.Mock).mockResolvedValue(mockDetailedRoutine);
  });

  it('renders routine templates correctly', async () => {
    render(<SimpleRoutineTemplates onRoutineSelected={jest.fn()} />);
    
    await waitFor(() => {
      expect(screen.getByText('Beginner Full Body')).toBeInTheDocument();
      expect(screen.getByText('A beginner-friendly full body workout')).toBeInTheDocument();
      expect(screen.getByText('beginner')).toBeInTheDocument();
    });
  });

  it('displays workout details when available', async () => {
    render(<SimpleRoutineTemplates onRoutineSelected={jest.fn()} />);
    
    await waitFor(() => {
      expect(screen.getByText('Workout Details')).toBeInTheDocument();
      expect(screen.getByText('Monday: Upper Body')).toBeInTheDocument();
      expect(screen.getByText('Wednesday: Lower Body')).toBeInTheDocument();
    });
  });

  it('handles start routine action', async () => {
    (simpleRoutineApi.startRoutine as jest.Mock).mockResolvedValue({});
    
    render(<SimpleRoutineTemplates onRoutineSelected={jest.fn()} />);
    
    await waitFor(() => {
      expect(screen.getByText('Beginner Full Body')).toBeInTheDocument();
    });

    const startButton = screen.getByText('Set as Active');
    fireEvent.click(startButton);

    await waitFor(() => {
      expect(simpleRoutineApi.startRoutine).toHaveBeenCalledWith('1');
      expect(toast.success).toHaveBeenCalledWith('Routine set as active!');
    });
  });

  it('handles stop routine action', async () => {
    const routineWithProgress = {
      ...mockRoutines[0],
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
      }
    };

    (simpleRoutineApi.getRoutines as jest.Mock).mockResolvedValue({
      routines: [routineWithProgress],
      total: 1,
      page: 1,
      size: 10
    });
    (simpleRoutineApi.stopRoutine as jest.Mock).mockResolvedValue({});

    render(<SimpleRoutineTemplates onRoutineSelected={jest.fn()} />);
    
    await waitFor(() => {
      expect(screen.getByText('Set as Inactive')).toBeInTheDocument();
    });

    const stopButton = screen.getByText('Set as Inactive');
    fireEvent.click(stopButton);

    await waitFor(() => {
      expect(simpleRoutineApi.stopRoutine).toHaveBeenCalledWith('1');
      expect(toast.success).toHaveBeenCalledWith('Routine set to inactive');
    });
  });

  it('handles edit routine action', async () => {
    render(<SimpleRoutineTemplates onRoutineSelected={jest.fn()} />);
    
    await waitFor(() => {
      expect(screen.getByText('Beginner Full Body')).toBeInTheDocument();
    });

    const editButton = screen.getByLabelText('Edit routine');
    fireEvent.click(editButton);

    await waitFor(() => {
      expect(screen.getByText('Edit Routine: Beginner Full Body')).toBeInTheDocument();
    });
  });

  it('handles delete routine action', async () => {
    (simpleRoutineApi.deleteRoutine as jest.Mock).mockResolvedValue({});
    
    render(<SimpleRoutineTemplates onRoutineSelected={jest.fn()} />);
    
    await waitFor(() => {
      expect(screen.getByText('Beginner Full Body')).toBeInTheDocument();
    });

    const deleteButton = screen.getByLabelText('Delete routine');
    fireEvent.click(deleteButton);

    // Confirm deletion
    const confirmButton = screen.getByText('Delete');
    fireEvent.click(confirmButton);

    await waitFor(() => {
      expect(simpleRoutineApi.deleteRoutine).toHaveBeenCalledWith('1');
      expect(toast.success).toHaveBeenCalledWith('Routine deleted successfully!');
    });
  });

  it('handles API errors gracefully', async () => {
    (simpleRoutineApi.getRoutines as jest.Mock).mockRejectedValue(new Error('API Error'));
    
    render(<SimpleRoutineTemplates onRoutineSelected={jest.fn()} />);
    
    await waitFor(() => {
      expect(screen.getByText('No routines found')).toBeInTheDocument();
    });
  });

  it('handles start routine error', async () => {
    (simpleRoutineApi.startRoutine as jest.Mock).mockRejectedValue(new Error('Start failed'));
    
    render(<SimpleRoutineTemplates onRoutineSelected={jest.fn()} />);
    
    await waitFor(() => {
      expect(screen.getByText('Beginner Full Body')).toBeInTheDocument();
    });

    const startButton = screen.getByText('Set as Active');
    fireEvent.click(startButton);

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith('Failed to set routine as active');
    });
  });

  it('calls onRoutineSelected when routine is selected', async () => {
    const mockOnRoutineSelected = jest.fn();
    
    render(<SimpleRoutineTemplates onRoutineSelected={mockOnRoutineSelected} />);
    
    await waitFor(() => {
      expect(screen.getByText('Beginner Full Body')).toBeInTheDocument();
    });

    const selectButton = screen.getByText('Select Routine');
    fireEvent.click(selectButton);

    expect(mockOnRoutineSelected).toHaveBeenCalledWith(mockRoutines[0]);
  });
});
