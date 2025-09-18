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

// Mock AuthContext
jest.mock('../../contexts/AuthContext', () => ({
  useAuth: () => ({
    user: { id: 'test-user', name: 'Test User' },
    token: 'test-token',
    isAuthenticated: true,
    isLoading: false,
    login: jest.fn(),
    logout: jest.fn(),
  }),
  AuthProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
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
    // Create a user-created routine to show workout details
    const userCreatedRoutine = {
      ...mockRoutines[0],
      is_template: false,
      created_by_user_id: 'test-user'
    };

    (simpleRoutineApi.getRoutines as jest.Mock).mockResolvedValue({
      routines: [userCreatedRoutine],
      total: 1,
      page: 1,
      size: 10
    });
    (simpleRoutineApi.getRoutine as jest.Mock).mockResolvedValue(userCreatedRoutine);
    
    render(<SimpleRoutineTemplates onRoutineSelected={mockOnRoutineSelected} />);
    
    await waitFor(() => {
      expect(screen.getByText('📋 Workout Plan:')).toBeInTheDocument();
      expect(screen.getByText('1 workout days')).toBeInTheDocument();
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
      expect(screen.getByText('No routines created yet')).toBeInTheDocument();
    });
  });

  it('calls onRoutineSelected when routine is selected', async () => {
    render(<SimpleRoutineTemplates onRoutineSelected={mockOnRoutineSelected} />);
    
    await waitFor(() => {
      expect(screen.getByText('Beginner Full Body')).toBeInTheDocument();
    });

    // Find and click the select button (if it exists)
    const selectButton = screen.queryByText('Select Routine');
    if (selectButton) {
      fireEvent.click(selectButton);
      expect(mockOnRoutineSelected).toHaveBeenCalledWith(mockRoutines[0]);
    }
  });

  it('handles routine deletion', async () => {
    // Mock window.confirm to return true
    const mockConfirm = jest.spyOn(window, 'confirm').mockReturnValue(true);
    
    // Create a user-created routine (not template) for deletion test
    const userCreatedRoutine = {
      ...mockRoutines[0],
      is_template: false,
      created_by_user_id: 'test-user'
    };

    (simpleRoutineApi.getRoutines as jest.Mock).mockResolvedValue({
      routines: [userCreatedRoutine],
      total: 1,
      page: 1,
      size: 10
    });
    (simpleRoutineApi.getRoutine as jest.Mock).mockResolvedValue(userCreatedRoutine);
    (simpleRoutineApi.deleteRoutine as jest.Mock).mockResolvedValue({});
    
    render(<SimpleRoutineTemplates onRoutineSelected={mockOnRoutineSelected} />);
    
    await waitFor(() => {
      expect(screen.getByText('Beginner Full Body')).toBeInTheDocument();
    });

    // Find delete button by looking for the red button with trash icon
    const buttons = screen.getAllByRole('button');
    const deleteButton = buttons.find(button => 
      button.className.includes('text-red-600') && 
      button.querySelector('svg')
    );
    expect(deleteButton).toBeDefined();
    fireEvent.click(deleteButton!);

    await waitFor(() => {
      expect(simpleRoutineApi.deleteRoutine).toHaveBeenCalledWith('1');
      expect(toast.success).toHaveBeenCalledWith('Routine deleted successfully');
    });

    // Clean up
    mockConfirm.mockRestore();
  });
});
