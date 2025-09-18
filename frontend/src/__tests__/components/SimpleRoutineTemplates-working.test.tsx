import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';

// Mock the modules first with inline mocks
jest.mock('../../lib/simpleRoutineApi', () => ({
  simpleRoutineApi: {
    getRoutines: jest.fn(),
    getRoutine: jest.fn(),
    startRoutine: jest.fn(),
    stopRoutine: jest.fn(),
    deleteRoutine: jest.fn(),
  },
}));

jest.mock('sonner', () => ({
  toast: {
    success: jest.fn(),
    error: jest.fn(),
  },
}));

// Now import the component and dependencies after mocking
import { SimpleRoutineTemplates } from '../../components/health/SimpleRoutineTemplates';
import { simpleRoutineApi } from '../../lib/simpleRoutineApi';
import { toast } from 'sonner';

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
    (simpleRoutineApi.getRoutines as jest.Mock).mockResolvedValue({
      routines: mockRoutines,
      total: 1,
      page: 1,
      size: 10
    });
    (simpleRoutineApi.getRoutine as jest.Mock).mockResolvedValue(mockRoutines[0]);
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
    (simpleRoutineApi.startRoutine as jest.Mock).mockResolvedValue({});
    
    render(<SimpleRoutineTemplates onRoutineSelected={mockOnRoutineSelected} />);
    
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

  it('handles API errors gracefully', async () => {
    (simpleRoutineApi.getRoutines as jest.Mock).mockRejectedValue(new Error('API Error'));
    
    render(<SimpleRoutineTemplates onRoutineSelected={mockOnRoutineSelected} />);
    
    await waitFor(() => {
      expect(screen.getByText('No routines found')).toBeInTheDocument();
    });
  });
});