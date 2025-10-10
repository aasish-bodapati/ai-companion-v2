import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import WorkoutLoggingModal from '../fitness/WorkoutLoggingModal';
import SimpleLoggingItem from '../ui/SimpleLoggingItem';
import { Badge, CategoryBadge } from '../ui/Badge';
import { fitnessService } from '../../services/fitnessService';

// Mock the fitness service
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

describe('WorkoutLoggingDebug - Text Rendering Error Investigation', () => {
  const mockOnClose = jest.fn();
  const mockOnWorkoutLogged = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Mock successful API responses
    (fitnessService.searchExercises as jest.Mock).mockResolvedValue([
      {
        id: 1,
        name: 'Push-ups',
        category: 'bodyweight',
        muscle_group: 'chest',
        equipment: null,
        instructions: null,
        difficulty: 'beginner',
      },
      {
        id: 2,
        name: 'Run',
        category: 'distance_based',
        muscle_group: 'general',
        equipment: null,
        instructions: null,
        difficulty: 'intermediate',
      },
    ]);

    (fitnessService.getLatestExerciseData as jest.Mock).mockResolvedValue({
      sets: 3,
      reps: '10',
      weight_kg: null,
      duration_minutes: 30,
      distance: 5,
      rest_time: '60',
      notes: 'Test notes',
    });

    (fitnessService.logWorkout as jest.Mock).mockResolvedValue({ success: true });
  });

  describe('Badge Component Text Rendering', () => {
    it('should handle string children correctly', () => {
      const { getByText } = render(
        <Badge variant="primary" size="medium">
          Test String
        </Badge>
      );
      
      expect(getByText('Test String')).toBeTruthy();
    });

    it('should handle undefined children safely', () => {
      const { getByText } = render(
        <Badge variant="primary" size="medium">
          {undefined}
        </Badge>
      );
      
      expect(getByText('')).toBeTruthy();
    });

    it('should handle null children safely', () => {
      const { getByText } = render(
        <Badge variant="primary" size="medium">
          {null}
        </Badge>
      );
      
      expect(getByText('')).toBeTruthy();
    });

    it('should handle number children correctly', () => {
      const { getByText } = render(
        <Badge variant="primary" size="medium">
          {123}
        </Badge>
      );
      
      expect(getByText('123')).toBeTruthy();
    });

    it('should handle object children safely', () => {
      const { getByText } = render(
        <Badge variant="primary" size="medium">
          {{ test: 'object' } as unknown}
        </Badge>
      );
      
      expect(getByText('[object Object]')).toBeTruthy();
    });
  });

  describe('CategoryBadge Component Text Rendering', () => {
    it('should render with category string', () => {
      const { getByText } = render(
        <CategoryBadge category="bodyweight" size="small" />
      );
      
      expect(getByText('bodyweight')).toBeTruthy();
    });

    it('should handle undefined category safely', () => {
      const { getByText } = render(
        <CategoryBadge category={undefined} size="small" />
      );
      
      expect(getByText('Not Found')).toBeTruthy();
    });

    it('should handle null category safely', () => {
      const { getByText } = render(
        <CategoryBadge category={null as unknown} size="small" />
      );
      
      expect(getByText('Not Found')).toBeTruthy();
    });

    it('should handle empty string category', () => {
      const { getByText } = render(
        <CategoryBadge category="" size="small" />
      );
      
      expect(getByText('Not Found')).toBeTruthy();
    });

    it('should handle children prop correctly', () => {
      const { getByText } = render(
        <CategoryBadge category="bodyweight" size="small">
          Custom Text
        </CategoryBadge>
      );
      
      expect(getByText('Custom Text')).toBeTruthy();
    });
  });

  describe('SimpleLoggingItem Component Text Rendering', () => {
    const mockItem = {
      id: '1',
      name: 'Push-ups',
      category: 'bodyweight',
      muscle_group: 'chest',
      equipment: null,
      instructions: null,
      difficulty: 'beginner',
      sets: 3,
      reps: '10',
      weight_kg: undefined,
      duration_minutes: undefined,
      distance: undefined,
      rest_time: '60',
      notes: 'Test notes',
    };

    it('should render with valid item data', () => {
      const { getByText } = render(
        <SimpleLoggingItem item={mockItem} editable={true} />
      );
      
      expect(getByText('Push-ups')).toBeTruthy();
      expect(getByText('bodyweight')).toBeTruthy();
    });

    it('should handle item with undefined name', () => {
      const itemWithUndefinedName = { ...mockItem, name: undefined };
      const { getByText } = render(
        <SimpleLoggingItem item={itemWithUndefinedName as unknown} editable={true} />
      );
      
      expect(getByText('Exercise')).toBeTruthy();
    });

    it('should handle item with null name', () => {
      const itemWithNullName = { ...mockItem, name: null };
      const { getByText } = render(
        <SimpleLoggingItem item={itemWithNullName as unknown} editable={true} />
      );
      
      expect(getByText('Exercise')).toBeTruthy();
    });

    it('should handle item with undefined category', () => {
      const itemWithUndefinedCategory = { ...mockItem, category: undefined };
      const { getByText } = render(
        <SimpleLoggingItem item={itemWithUndefinedCategory as unknown} editable={true} />
      );
      
      expect(getByText('Push-ups')).toBeTruthy();
      expect(getByText('Not Found')).toBeTruthy();
    });

    it('should handle item with null category', () => {
      const itemWithNullCategory = { ...mockItem, category: null };
      const { getByText } = render(
        <SimpleLoggingItem item={itemWithNullCategory as unknown} editable={true} />
      );
      
      expect(getByText('Push-ups')).toBeTruthy();
      expect(getByText('Not Found')).toBeTruthy();
    });

    it('should handle item with empty string category', () => {
      const itemWithEmptyCategory = { ...mockItem, category: '' };
      const { getByText } = render(
        <SimpleLoggingItem item={itemWithEmptyCategory} editable={true} />
      );
      
      expect(getByText('Push-ups')).toBeTruthy();
      expect(getByText('Not Found')).toBeTruthy();
    });

    it('should handle field values safely', () => {
      const itemWithProblematicFields = {
        ...mockItem,
        reps: null,
        rest_time: undefined,
        notes: '',
      };
      
      const { getByText } = render(
        <SimpleLoggingItem item={itemWithProblematicFields as unknown} editable={false} />
      );
      
      expect(getByText('Push-ups')).toBeTruthy();
      // Should not throw any text rendering errors
    });
  });

  describe('WorkoutLoggingModal Integration', () => {
    it('should render without text rendering errors', async () => {
      const { getByText } = render(
        <WorkoutLoggingModal
          visible={true}
          onClose={mockOnClose}
          onWorkoutLogged={mockOnWorkoutLogged}
        />
      );
      
      expect(getByText('Log Workout')).toBeTruthy();
    });

    it('should handle exercise selection without text rendering errors', async () => {
      const { getByText, getByPlaceholderText } = render(
        <WorkoutLoggingModal
          visible={true}
          onClose={mockOnClose}
          onWorkoutLogged={mockOnWorkoutLogged}
        />
      );
      
      // Search for an exercise
      const searchInput = getByPlaceholderText('Search for exercises...');
      fireEvent.changeText(searchInput, 'push');
      
      // Wait for search results
      await waitFor(() => {
        expect(fitnessService.searchExercises).toHaveBeenCalledWith('push');
      });
      
      // Simulate selecting an exercise
      const exerciseButton = getByText('Push-ups');
      fireEvent.press(exerciseButton);
      
      // Should not throw any text rendering errors
      await waitFor(() => {
        expect(getByText('Push-ups')).toBeTruthy();
      });
    });

    it('should handle exercise with problematic data', async () => {
      // Mock exercise with problematic data
      (fitnessService.searchExercises as jest.Mock).mockResolvedValue([
        {
          id: 1,
          name: null, // Problematic name
          category: undefined, // Problematic category
          muscle_group: 'chest',
          equipment: null,
          instructions: null,
          difficulty: 'beginner',
        },
      ]);

      const { getByText, getByPlaceholderText } = render(
        <WorkoutLoggingModal
          visible={true}
          onClose={mockOnClose}
          onWorkoutLogged={mockOnWorkoutLogged}
        />
      );
      
      // Search for an exercise
      const searchInput = getByPlaceholderText('Search for exercises...');
      fireEvent.changeText(searchInput, 'test');
      
      // Wait for search results
      await waitFor(() => {
        expect(fitnessService.searchExercises).toHaveBeenCalledWith('test');
      });
      
      // Should handle problematic data gracefully
      await waitFor(() => {
        expect(getByText('Exercise')).toBeTruthy(); // Fallback name
      });
    });
  });

  describe('Edge Cases and Error Scenarios', () => {
    it('should handle rapid state changes without text rendering errors', async () => {
      const { getByText, rerender } = render(
        <WorkoutLoggingModal
          visible={true}
          onClose={mockOnClose}
          onWorkoutLogged={mockOnWorkoutLogged}
        />
      );
      
      // Rapidly change visibility
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
      
      // Should not throw any text rendering errors
      expect(getByText('Log Workout')).toBeTruthy();
    });

    it('should handle concurrent exercise additions', async () => {
      const { getByText, getByPlaceholderText } = render(
        <WorkoutLoggingModal
          visible={true}
          onClose={mockOnClose}
          onWorkoutLogged={mockOnWorkoutLogged}
        />
      );
      
      // Add multiple exercises rapidly
      const searchInput = getByPlaceholderText('Search for exercises...');
      fireEvent.changeText(searchInput, 'push');
      
      await waitFor(() => {
        expect(fitnessService.searchExercises).toHaveBeenCalled();
      });
      
      // Add first exercise
      const exerciseButton1 = getByText('Push-ups');
      fireEvent.press(exerciseButton1);
      
      // Change search and add second exercise
      fireEvent.changeText(searchInput, 'run');
      
      await waitFor(() => {
        expect(fitnessService.searchExercises).toHaveBeenCalledWith('run');
      });
      
      const exerciseButton2 = getByText('Run');
      fireEvent.press(exerciseButton2);
      
      // Should handle both exercises without text rendering errors
      await waitFor(() => {
        expect(getByText('Push-ups')).toBeTruthy();
        expect(getByText('Run')).toBeTruthy();
      });
    });
  });

  describe('Console Error Detection', () => {
    let consoleErrorSpy: jest.SpyInstance;

    beforeEach(() => {
      consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    });

    afterEach(() => {
      consoleErrorSpy.mockRestore();
    });

    it('should not log text rendering errors', async () => {
      render(
        <WorkoutLoggingModal
          visible={true}
          onClose={mockOnClose}
          onWorkoutLogged={mockOnWorkoutLogged}
        />
      );
      
      // Wait for any potential errors
      await waitFor(() => {
        expect(consoleErrorSpy).not.toHaveBeenCalledWith(
          expect.stringContaining('Text strings must be rendered within a <Text> component')
        );
      });
    });

    it('should not log text rendering errors when adding exercises', async () => {
      const { getByText, getByPlaceholderText } = render(
        <WorkoutLoggingModal
          visible={true}
          onClose={mockOnClose}
          onWorkoutLogged={mockOnWorkoutLogged}
        />
      );
      
      // Search and add exercise
      const searchInput = getByPlaceholderText('Search for exercises...');
      fireEvent.changeText(searchInput, 'push');
      
      await waitFor(() => {
        expect(fitnessService.searchExercises).toHaveBeenCalled();
      });
      
      const exerciseButton = getByText('Push-ups');
      fireEvent.press(exerciseButton);
      
      // Wait for any potential errors
      await waitFor(() => {
        expect(consoleErrorSpy).not.toHaveBeenCalledWith(
          expect.stringContaining('Text strings must be rendered within a <Text> component')
        );
      });
    });
  });
});

