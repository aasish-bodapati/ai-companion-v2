import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { SimpleRoutineTemplates } from '@/components/health/SimpleRoutineTemplates';

// Mock the API module
const mockSimpleRoutineApi = {
  getRoutines: jest.fn(),
  getRoutine: jest.fn(),
  startRoutine: jest.fn(),
  stopRoutine: jest.fn(),
  deleteRoutine: jest.fn(),
};

jest.mock('@/lib/simpleRoutineApi', () => ({
  simpleRoutineApi: mockSimpleRoutineApi,
}));

// Mock toast
const mockToast = {
  success: jest.fn(),
  error: jest.fn(),
};

jest.mock('sonner', () => ({
  toast: mockToast,
}));

// Mock data
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
        ]
      },
    ],
    total_workouts_per_week: 1
  }
];

describe('SimpleRoutineTemplates', () => {
  const mockOnRoutineSelected = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    mockSimpleRoutineApi.getRoutines.mockResolvedValue({
      routines: mockRoutines,
      total: 1,
      page: 1,
      size: 10
    });
    mockSimpleRoutineApi.getRoutine.mockResolvedValue(mockRoutines[0]);
  });

  it('renders routine templates correctly', async () => {
    render(<SimpleRoutineTemplates onRoutineSelected={mockOnRoutineSelected} />);
    
    await waitFor(() => {
      expect(screen.getByText('Beginner Full Body')).toBeInTheDocument();
      expect(screen.getByText('A beginner-friendly full body workout')).toBeInTheDocument();
    });
  });

  it('displays workout details when available', async () => {
    render(<SimpleRoutineTemplates onRoutineSelected={mockOnRoutineSelected} />);
    
    await waitFor(() => {
      expect(screen.getByText('Workout Details')).toBeInTheDocument();
      expect(screen.getByText('Monday: Upper Body')).toBeInTheDocument();
    });
  });

  it('handles start routine action', async () => {
    mockSimpleRoutineApi.startRoutine.mockResolvedValue({});
    
    render(<SimpleRoutineTemplates onRoutineSelected={mockOnRoutineSelected} />);
    
    await waitFor(() => {
      expect(screen.getByText('Beginner Full Body')).toBeInTheDocument();
    });

    const startButton = screen.getByText('Set as Active');
    fireEvent.click(startButton);

    await waitFor(() => {
      expect(mockSimpleRoutineApi.startRoutine).toHaveBeenCalledWith('1');
      expect(mockToast.success).toHaveBeenCalledWith('Routine set as active!');
    });
  });

  it('handles API errors gracefully', async () => {
    mockSimpleRoutineApi.getRoutines.mockRejectedValue(new Error('API Error'));
    
    render(<SimpleRoutineTemplates onRoutineSelected={mockOnRoutineSelected} />);
    
    await waitFor(() => {
      expect(screen.getByText('No routines found')).toBeInTheDocument();
    });
  });
});
