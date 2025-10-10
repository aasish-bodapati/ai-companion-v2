import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import WorkoutLoggingModal from '../fitness/WorkoutLoggingModal';
import { fitnessService } from '../../services/fitnessService';

// Mock the fitness service with the exact data from the logs
jest.mock('../../services/fitnessService', () => ({
  fitnessService: {
    searchExercises: jest.fn(),
    getLatestExerciseData: jest.fn(),
    logWorkout: jest.fn(),
  },
}));

// Mock the toast context
jest.mock('../../contexts/ToastContext', () => ({
  useToast: () => ({
    showToast: jest.fn(),
  }),
}));

// Mock haptics
jest.mock('../../utils/haptics', () => ({
  hapticFeedback: {
    light: jest.fn(),
    medium: jest.fn(),
    heavy: jest.fn(),
    success: jest.fn(),
    warning: jest.fn(),
    error: jest.fn(),
    selection: jest.fn(),
  },
}));

describe('WorkoutLoggingReproduction - Exact Error Scenario', () => {
  const mockOnClose = jest.fn();
  const mockOnWorkoutLogged = jest.fn();
  let consoleErrorSpy: jest.SpyInstance;

  beforeEach(() => {
    jest.clearAllMocks();
    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    
    // Mock the exact API response from the logs
    (fitnessService.searchExercises as jest.Mock).mockResolvedValue([
      {
        id: 1,
        name: 'Run',
        category: 'distance_based',
        muscle_group: 'general',
        equipment: null,
        instructions: null,
        difficulty: 'intermediate',
      },
    ]);

    // Mock the exact previous data response from the logs
    (fitnessService.getLatestExerciseData as jest.Mock).mockResolvedValue({
      distance: 10,
      duration_minutes: 30,
      exercise_name: 'Run',
      notes: '',
      reps: '',
      rest_time: '',
      sets: null,
      weight_kg: null,
      weight_used: null,
      workout_date: '2025-10-09T16:37:27.899000+00:00',
    });

    (fitnessService.logWorkout as jest.Mock).mockResolvedValue({ success: true });
  });

  afterEach(() => {
    consoleErrorSpy.mockRestore();
  });

  it('should reproduce the exact error scenario from logs', async () => {
    const { getByText, getByPlaceholderText } = render(
      <WorkoutLoggingModal
        visible={true}
        onClose={mockOnClose}
        onWorkoutLogged={mockOnWorkoutLogged}
      />
    );
    
    // Step 1: Search for "Run" exercise
    const searchInput = getByPlaceholderText('Search for exercises...');
    fireEvent.changeText(searchInput, 'run');
    
    // Wait for search results
    await waitFor(() => {
      expect(fitnessService.searchExercises).toHaveBeenCalledWith('run');
    });
    
    // Step 2: Click on the "Run" exercise result
    const runExerciseButton = getByText('Run');
    fireEvent.press(runExerciseButton);
    
    // Wait for the exercise to be added and previous data to be fetched
    await waitFor(() => {
      expect(fitnessService.getLatestExerciseData).toHaveBeenCalledWith('Run');
    });
    
    // Step 3: Verify the exercise is rendered without text rendering errors
    await waitFor(() => {
      expect(getByText('Run')).toBeTruthy();
      expect(getByText('distance_based')).toBeTruthy();
    });
    
    // Step 4: Check that no text rendering errors occurred
    expect(consoleErrorSpy).not.toHaveBeenCalledWith(
      expect.stringContaining('Text strings must be rendered within a <Text> component')
    );
  });

  it('should handle the exact problematic data from API response', async () => {
    // This test specifically targets the data that was causing issues
    const problematicApiResponse = {
      distance: 10,
      duration_minutes: 30,
      exercise_name: 'Run',
      notes: '',
      reps: '',
      rest_time: '',
      sets: null, // This null value was potentially causing issues
      weight_kg: null, // This null value was potentially causing issues
      weight_used: null, // This null value was potentially causing issues
      workout_date: '2025-10-09T16:37:27.899000+00:00',
    };

    (fitnessService.getLatestExerciseData as jest.Mock).mockResolvedValue(problematicApiResponse);

    const { getByText, getByPlaceholderText } = render(
      <WorkoutLoggingModal
        visible={true}
        onClose={mockOnClose}
        onWorkoutLogged={mockOnWorkoutLogged}
      />
    );
    
    // Search and select exercise
    const searchInput = getByPlaceholderText('Search for exercises...');
    fireEvent.changeText(searchInput, 'run');
    
    await waitFor(() => {
      expect(fitnessService.searchExercises).toHaveBeenCalledWith('run');
    });
    
    const runExerciseButton = getByText('Run');
    fireEvent.press(runExerciseButton);
    
    // Wait for the problematic data to be processed
    await waitFor(() => {
      expect(fitnessService.getLatestExerciseData).toHaveBeenCalledWith('Run');
    });
    
    // Verify no text rendering errors occurred
    expect(consoleErrorSpy).not.toHaveBeenCalledWith(
      expect.stringContaining('Text strings must be rendered within a <Text> component')
    );
  });

  it('should handle rapid state changes during exercise selection', async () => {
    const { getByText, getByPlaceholderText, rerender } = render(
      <WorkoutLoggingModal
        visible={true}
        onClose={mockOnClose}
        onWorkoutLogged={mockOnWorkoutLogged}
      />
    );
    
    // Start search
    const searchInput = getByPlaceholderText('Search for exercises...');
    fireEvent.changeText(searchInput, 'run');
    
    // Rapidly change visibility (simulating modal state changes)
    rerender(
      <WorkoutLoggingModal
        visible={false}
        onClose={mockOnClose}
        onWorkoutLogged={mockOnWorkoutLogged}
      />
    );
    
    rerender(
      <WorkoutLoggingModal
        visible={true}
        onClose={mockOnClose}
        onWorkoutLogged={mockOnWorkoutLogged}
      />
    );
    
    // Complete the exercise selection
    await waitFor(() => {
      expect(fitnessService.searchExercises).toHaveBeenCalledWith('run');
    });
    
    const runExerciseButton = getByText('Run');
    fireEvent.press(runExerciseButton);
    
    // Verify no text rendering errors occurred during rapid state changes
    expect(consoleErrorSpy).not.toHaveBeenCalledWith(
      expect.stringContaining('Text strings must be rendered within a <Text> component')
    );
  });

  it('should handle concurrent API calls without text rendering errors', async () => {
    // Mock multiple concurrent API calls
    (fitnessService.searchExercises as jest.Mock).mockImplementation((query) => {
      return new Promise(resolve => {
        setTimeout(() => {
          resolve([
            {
              id: 1,
              name: 'Run',
              category: 'distance_based',
              muscle_group: 'general',
              equipment: null,
              instructions: null,
              difficulty: 'intermediate',
            },
          ]);
        }, 100);
      });
    });

    (fitnessService.getLatestExerciseData as jest.Mock).mockImplementation((name) => {
      return new Promise(resolve => {
        setTimeout(() => {
          resolve({
            distance: 10,
            duration_minutes: 30,
            exercise_name: name,
            notes: '',
            reps: '',
            rest_time: '',
            sets: null,
            weight_kg: null,
            weight_used: null,
            workout_date: '2025-10-09T16:37:27.899000+00:00',
          });
        }, 50);
      });
    });

    const { getByText, getByPlaceholderText } = render(
      <WorkoutLoggingModal
        visible={true}
        onClose={mockOnClose}
        onWorkoutLogged={mockOnWorkoutLogged}
      />
    );
    
    // Start multiple searches rapidly
    const searchInput = getByPlaceholderText('Search for exercises...');
    fireEvent.changeText(searchInput, 'run');
    fireEvent.changeText(searchInput, 'push');
    fireEvent.changeText(searchInput, 'run');
    
    // Wait for all API calls to complete
    await waitFor(() => {
      expect(fitnessService.searchExercises).toHaveBeenCalledTimes(3);
    });
    
    // Select exercise
    const runExerciseButton = getByText('Run');
    fireEvent.press(runExerciseButton);
    
    // Wait for exercise to be processed
    await waitFor(() => {
      expect(fitnessService.getLatestExerciseData).toHaveBeenCalledWith('Run');
    });
    
    // Verify no text rendering errors occurred during concurrent operations
    expect(consoleErrorSpy).not.toHaveBeenCalledWith(
      expect.stringContaining('Text strings must be rendered within a <Text> component')
    );
  });
});

