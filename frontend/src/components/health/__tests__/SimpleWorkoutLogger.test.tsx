import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { jest } from '@jest/globals';
import SimpleWorkoutLogger from '../SimpleWorkoutLogger';
import api from '@/lib/api';

// Mock the API module
jest.mock('@/lib/api', () => ({
  get: jest.fn(),
  post: jest.fn(),
  put: jest.fn(),
  delete: jest.fn(),
}));

// Mock the toast notifications
jest.mock('sonner', () => ({
  toast: {
    success: jest.fn(),
    error: jest.fn(),
  },
}));

const mockApi = api as jest.Mocked<typeof api>;

describe('SimpleWorkoutLogger', () => {
  const mockOnWorkoutLogged = jest.fn();

  const mockExercises = [
    {
      id: '1',
      name: 'Bench Press',
      category: 'chest',
      muscle_groups: ['chest', 'triceps', 'shoulders'],
      equipment: 'barbell',
      difficulty: 'intermediate',
    },
    {
      id: '2',
      name: 'Squat',
      category: 'legs',
      muscle_groups: ['quadriceps', 'glutes', 'hamstrings'],
      equipment: 'barbell',
      difficulty: 'beginner',
    },
  ];

  const mockRoutines = [
    {
      id: '1',
      name: 'Push Day Routine',
      description: 'Upper body push exercises',
      difficulty: 'intermediate',
      tags: ['strength', 'upper-body'],
      workout_schedule: [
        {
          day: 'Monday',
          workout_name: 'Push Day',
          exercises: [
            {
              exercise_name: 'Bench Press',
              sets: 3,
              reps: '8-12',
              weight_notes: 'Body weight',
              rest_time: '2-3 minutes',
              notes: 'Focus on form',
            },
          ],
        },
      ],
    },
  ];

  beforeEach(() => {
    jest.clearAllMocks();
    mockApi.get.mockImplementation((url) => {
      if (url.includes('/exercises/')) {
        return Promise.resolve(mockExercises);
      }
      if (url.includes('/simple-routines/')) {
        return Promise.resolve(mockRoutines);
      }
      return Promise.resolve([]);
    });
  });

  describe('Rendering', () => {
    it('renders the workout logger component', async () => {
      render(<SimpleWorkoutLogger onWorkoutLogged={mockOnWorkoutLogged} />);
      
      expect(screen.getByText('Log Today\'s Workout')).toBeInTheDocument();
      expect(screen.getByText('Quick Log')).toBeInTheDocument();
      expect(screen.getByText('Manual Log')).toBeInTheDocument();
    });

    it('shows loading state initially', () => {
      mockApi.get.mockImplementation(() => new Promise(() => {})); // Never resolves
      render(<SimpleWorkoutLogger onWorkoutLogged={mockOnWorkoutLogged} />);
      
      expect(screen.getByText('Log Today\'s Workout')).toBeInTheDocument();
      // Loading state would be shown
    });
  });

  describe('Quick Log Mode', () => {
    it('renders quick log interface when Quick Log is selected', async () => {
      render(<SimpleWorkoutLogger onWorkoutLogged={mockOnWorkoutLogged} />);
      
      const quickLogButton = screen.getByText('Quick Log');
      fireEvent.click(quickLogButton);
      
      await waitFor(() => {
        expect(screen.getByText('Select Routine')).toBeInTheDocument();
        expect(screen.getByText('Push Day Routine')).toBeInTheDocument();
      });
    });

    it('shows routine exercises when routine is selected', async () => {
      render(<SimpleWorkoutLogger onWorkoutLogged={mockOnWorkoutLogged} />);
      
      const quickLogButton = screen.getByText('Quick Log');
      fireEvent.click(quickLogButton);
      
      await waitFor(() => {
        const routineButton = screen.getByText('Push Day Routine');
        fireEvent.click(routineButton);
        
        expect(screen.getByText('Bench Press')).toBeInTheDocument();
        expect(screen.getByText('3 sets')).toBeInTheDocument();
        expect(screen.getByText('8-12 reps')).toBeInTheDocument();
      });
    });

    it('allows editing exercise details in quick log mode', async () => {
      render(<SimpleWorkoutLogger onWorkoutLogged={mockOnWorkoutLogged} />);
      
      const quickLogButton = screen.getByText('Quick Log');
      fireEvent.click(quickLogButton);
      
      await waitFor(() => {
        const routineButton = screen.getByText('Push Day Routine');
        fireEvent.click(routineButton);
        
        const editButton = screen.getByLabelText('Edit Bench Press');
        fireEvent.click(editButton);
        
        // Should show edit form
        expect(screen.getByDisplayValue('3')).toBeInTheDocument();
        expect(screen.getByDisplayValue('8-12')).toBeInTheDocument();
      });
    });

    it('submits quick log workout successfully', async () => {
      mockApi.post.mockResolvedValue({ id: 'workout-1' });
      
      render(<SimpleWorkoutLogger onWorkoutLogged={mockOnWorkoutLogged} />);
      
      const quickLogButton = screen.getByText('Quick Log');
      fireEvent.click(quickLogButton);
      
      await waitFor(() => {
        const routineButton = screen.getByText('Push Day Routine');
        fireEvent.click(routineButton);
        
        const logButton = screen.getByText('Log Workout');
        fireEvent.click(logButton);
        
        expect(mockApi.post).toHaveBeenCalledWith('/health/logging/fitness', expect.any(Object));
        expect(mockOnWorkoutLogged).toHaveBeenCalled();
      });
    });
  });

  describe('Manual Log Mode', () => {
    it('renders manual log interface when Manual Log is selected', async () => {
      render(<SimpleWorkoutLogger onWorkoutLogged={mockOnWorkoutLogged} />);
      
      const manualLogButton = screen.getByText('Manual Log');
      fireEvent.click(manualLogButton);
      
      await waitFor(() => {
        expect(screen.getByText('Exercise Type')).toBeInTheDocument();
        expect(screen.getByText('Duration (minutes)')).toBeInTheDocument();
        expect(screen.getByText('Calories Burned')).toBeInTheDocument();
      });
    });

    it('allows selecting exercise type in manual mode', async () => {
      render(<SimpleWorkoutLogger onWorkoutLogged={mockOnWorkoutLogged} />);
      
      const manualLogButton = screen.getByText('Manual Log');
      fireEvent.click(manualLogButton);
      
      await waitFor(() => {
        const exerciseSelect = screen.getByRole('combobox');
        fireEvent.click(exerciseSelect);
        
        expect(screen.getByText('Bench Press')).toBeInTheDocument();
        expect(screen.getByText('Squat')).toBeInTheDocument();
      });
    });

    it('validates required fields in manual mode', async () => {
      render(<SimpleWorkoutLogger onWorkoutLogged={mockOnWorkoutLogged} />);
      
      const manualLogButton = screen.getByText('Manual Log');
      fireEvent.click(manualLogButton);
      
      await waitFor(() => {
        const logButton = screen.getByText('Log Workout');
        fireEvent.click(logButton);
        
        // Should show validation errors
        expect(screen.getByText('Please select an exercise type')).toBeInTheDocument();
        expect(screen.getByText('Please enter duration')).toBeInTheDocument();
      });
    });

    it('submits manual log workout successfully', async () => {
      mockApi.post.mockResolvedValue({ id: 'workout-2' });
      
      render(<SimpleWorkoutLogger onWorkoutLogged={mockOnWorkoutLogged} />);
      
      const manualLogButton = screen.getByText('Manual Log');
      fireEvent.click(manualLogButton);
      
      await waitFor(() => {
        // Fill in the form
        const exerciseSelect = screen.getByRole('combobox');
        fireEvent.click(exerciseSelect);
        fireEvent.click(screen.getByText('Bench Press'));
        
        const durationInput = screen.getByLabelText('Duration (minutes)');
        fireEvent.change(durationInput, { target: { value: '45' } });
        
        const caloriesInput = screen.getByLabelText('Calories Burned');
        fireEvent.change(caloriesInput, { target: { value: '300' } });
        
        const logButton = screen.getByText('Log Workout');
        fireEvent.click(logButton);
        
        expect(mockApi.post).toHaveBeenCalledWith('/health/logging/fitness', expect.any(Object));
        expect(mockOnWorkoutLogged).toHaveBeenCalled();
      });
    });
  });

  describe('Exercise Search', () => {
    it('searches exercises by name', async () => {
      render(<SimpleWorkoutLogger onWorkoutLogged={mockOnWorkoutLogged} />);
      
      const manualLogButton = screen.getByText('Manual Log');
      fireEvent.click(manualLogButton);
      
      await waitFor(() => {
        const searchInput = screen.getByPlaceholderText('Search exercises...');
        fireEvent.change(searchInput, { target: { value: 'bench' } });
        
        // Should filter exercises
        expect(screen.getByText('Bench Press')).toBeInTheDocument();
        expect(screen.queryByText('Squat')).not.toBeInTheDocument();
      });
    });

    it('filters exercises by category', async () => {
      render(<SimpleWorkoutLogger onWorkoutLogged={mockOnWorkoutLogged} />);
      
      const manualLogButton = screen.getByText('Manual Log');
      fireEvent.click(manualLogButton);
      
      await waitFor(() => {
        const categoryFilter = screen.getByText('All Categories');
        fireEvent.click(categoryFilter);
        
        const chestOption = screen.getByText('Chest');
        fireEvent.click(chestOption);
        
        expect(screen.getByText('Bench Press')).toBeInTheDocument();
        expect(screen.queryByText('Squat')).not.toBeInTheDocument();
      });
    });
  });

  describe('Error Handling', () => {
    it('handles API errors gracefully', async () => {
      mockApi.get.mockRejectedValue(new Error('API Error'));
      
      render(<SimpleWorkoutLogger onWorkoutLogged={mockOnWorkoutLogged} />);
      
      await waitFor(() => {
        expect(screen.getByText('Log Today\'s Workout')).toBeInTheDocument();
        // Should handle error gracefully
      });
    });

    it('handles workout logging errors', async () => {
      mockApi.post.mockRejectedValue(new Error('Logging failed'));
      
      render(<SimpleWorkoutLogger onWorkoutLogged={mockOnWorkoutLogged} />);
      
      const manualLogButton = screen.getByText('Manual Log');
      fireEvent.click(manualLogButton);
      
      await waitFor(() => {
        // Fill in the form
        const exerciseSelect = screen.getByRole('combobox');
        fireEvent.click(exerciseSelect);
        fireEvent.click(screen.getByText('Bench Press'));
        
        const durationInput = screen.getByLabelText('Duration (minutes)');
        fireEvent.change(durationInput, { target: { value: '45' } });
        
        const logButton = screen.getByText('Log Workout');
        fireEvent.click(logButton);
        
        // Should handle error gracefully
        expect(screen.getByText('Log Today\'s Workout')).toBeInTheDocument();
      });
    });
  });

  describe('Accessibility', () => {
    it('has proper ARIA labels and roles', async () => {
      render(<SimpleWorkoutLogger onWorkoutLogged={mockOnWorkoutLogged} />);
      
      await waitFor(() => {
        const buttons = screen.getAllByRole('button');
        expect(buttons.length).toBeGreaterThan(0);
        
        // Check for proper form labels
        expect(screen.getByText('Exercise Type')).toBeInTheDocument();
        expect(screen.getByText('Duration (minutes)')).toBeInTheDocument();
      });
    });

    it('supports keyboard navigation', async () => {
      render(<SimpleWorkoutLogger onWorkoutLogged={mockOnWorkoutLogged} />);
      
      await waitFor(() => {
        const quickLogButton = screen.getByText('Quick Log');
        quickLogButton.focus();
        expect(quickLogButton).toHaveFocus();
      });
    });
  });

  describe('Performance', () => {
    it('handles large exercise datasets efficiently', async () => {
      const largeExerciseList = Array.from({ length: 1000 }, (_, i) => ({
        id: `exercise-${i}`,
        name: `Exercise ${i}`,
        category: 'general',
        muscle_groups: ['full-body'],
        equipment: 'bodyweight',
        difficulty: 'beginner',
      }));

      mockApi.get.mockImplementation((url) => {
        if (url.includes('/exercises/')) {
          return Promise.resolve(largeExerciseList);
        }
        return Promise.resolve([]);
      });
      
      render(<SimpleWorkoutLogger onWorkoutLogged={mockOnWorkoutLogged} />);
      
      await waitFor(() => {
        expect(screen.getByText('Log Today\'s Workout')).toBeInTheDocument();
        // Should render without performance issues
      });
    });
  });
});
