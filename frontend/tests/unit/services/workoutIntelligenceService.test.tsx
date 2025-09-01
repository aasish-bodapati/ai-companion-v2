/**
 * @jest-environment jsdom
 */

import { workoutIntelligenceService, type Workout, type WorkoutModification } from '@/services/workoutIntelligenceService';

// Mock localStorage
const localStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
};

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
});

const mockWorkout: Workout = {
  id: 'test-workout-1',
  date: '2024-01-08',
  name: 'Upper Body Strength',
  duration: 90,
  completed: true,
  exercises: [
    { id: 'e1', name: 'Bench Press', sets: 4, reps: 8, weight: 80, unit: 'kg' },
    { id: 'e2', name: 'Squats', sets: 4, reps: 6, weight: 100, unit: 'kg' },
    { id: 'e3', name: 'Rows', sets: 4, reps: 10, weight: 70, unit: 'kg' }
  ]
};

describe('WorkoutIntelligenceService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    localStorageMock.getItem.mockReturnValue(null);
  });

  describe('parseWorkoutInput', () => {
    it('should parse "same as last week" correctly', () => {
      const modifications = workoutIntelligenceService.parseWorkoutInput('same as last week');
      
      expect(modifications).toHaveLength(1);
      expect(modifications[0].type).toBe('same');
      expect(modifications[0].description).toContain('Repeat last week');
    });

    it('should parse weight increases correctly', () => {
      const modifications = workoutIntelligenceService.parseWorkoutInput('increased squats by 2.5kg');
      
      expect(modifications).toHaveLength(1);
      expect(modifications[0]).toEqual({
        type: 'increase',
        exercise: 'squats',
        property: 'weight',
        value: 2.5,
        unit: 'kg',
        description: 'Increase squats weight by 2.5kg'
      });
    });

    it('should parse multiple modifications', () => {
      const modifications = workoutIntelligenceService.parseWorkoutInput(
        'increased squats by 2.5kg and decreased bench press by 5kg'
      );
      
      expect(modifications).toHaveLength(2);
      expect(modifications[0].type).toBe('increase');
      expect(modifications[0].exercise).toBe('squats');
      expect(modifications[1].type).toBe('decrease');
      expect(modifications[1].exercise).toBe('bench press');
    });

    it('should parse "lighter" modifications', () => {
      const modifications = workoutIntelligenceService.parseWorkoutInput('lighter bench press');
      
      expect(modifications).toHaveLength(1);
      expect(modifications[0].type).toBe('decrease');
      expect(modifications[0].exercise).toBe('bench press');
      expect(modifications[0].value).toBe(2.5); // Default decrease
    });

    it('should parse direct weight specifications', () => {
      const modifications = workoutIntelligenceService.parseWorkoutInput('bench press 85kg');
      
      expect(modifications).toHaveLength(1);
      expect(modifications[0].type).toBe('modify');
      expect(modifications[0].exercise).toBe('bench press');
      expect(modifications[0].value).toBe(85);
      expect(modifications[0].unit).toBe('kg');
    });

    it('should parse added exercises', () => {
      const modifications = workoutIntelligenceService.parseWorkoutInput('added pull-ups');
      
      expect(modifications).toHaveLength(1);
      expect(modifications[0].type).toBe('add');
      expect(modifications[0].exercise).toBe('pull-ups');
    });

    it('should parse removed exercises', () => {
      const modifications = workoutIntelligenceService.parseWorkoutInput('skipped rows');
      
      expect(modifications).toHaveLength(1);
      expect(modifications[0].type).toBe('remove');
      expect(modifications[0].exercise).toBe('rows');
    });

    it('should handle pounds unit correctly', () => {
      const modifications = workoutIntelligenceService.parseWorkoutInput('increased bench by 5 lbs');
      
      expect(modifications[0].unit).toBe('lbs');
    });

    it('should return empty array for unrecognized input', () => {
      const modifications = workoutIntelligenceService.parseWorkoutInput('random text that means nothing');
      
      expect(modifications).toHaveLength(0);
    });
  });

  describe('applyWorkoutModifications', () => {
    it('should create new workout with same exercises for "same" modification', () => {
      const modifications: WorkoutModification[] = [
        { type: 'same', description: 'Repeat last week\'s workout' }
      ];
      
      const newWorkout = workoutIntelligenceService.applyWorkoutModifications(mockWorkout, modifications);
      
      expect(newWorkout.exercises).toHaveLength(mockWorkout.exercises.length);
      expect(newWorkout.id).not.toBe(mockWorkout.id); // Should have new ID
      expect(newWorkout.completed).toBe(false);
      expect(newWorkout.date).toBe(new Date().toISOString().split('T')[0]); // Today's date
    });

    it('should increase exercise weight correctly', () => {
      const modifications: WorkoutModification[] = [
        {
          type: 'increase',
          exercise: 'squats',
          property: 'weight',
          value: 2.5,
          unit: 'kg',
          description: 'Increase squats by 2.5kg'
        }
      ];
      
      const newWorkout = workoutIntelligenceService.applyWorkoutModifications(mockWorkout, modifications);
      const squats = newWorkout.exercises.find(e => e.name.toLowerCase().includes('squats'));
      
      expect(squats?.weight).toBe(102.5); // Original 100 + 2.5
    });

    it('should decrease exercise weight correctly', () => {
      const modifications: WorkoutModification[] = [
        {
          type: 'decrease',
          exercise: 'bench',
          property: 'weight',
          value: 5,
          unit: 'kg',
          description: 'Decrease bench by 5kg'
        }
      ];
      
      const newWorkout = workoutIntelligenceService.applyWorkoutModifications(mockWorkout, modifications);
      const bench = newWorkout.exercises.find(e => e.name.toLowerCase().includes('bench'));
      
      expect(bench?.weight).toBe(75); // Original 80 - 5
    });

    it('should modify exercise weight to specific value', () => {
      const modifications: WorkoutModification[] = [
        {
          type: 'modify',
          exercise: 'rows',
          property: 'weight',
          value: 75,
          unit: 'kg',
          description: 'Set rows to 75kg'
        }
      ];
      
      const newWorkout = workoutIntelligenceService.applyWorkoutModifications(mockWorkout, modifications);
      const rows = newWorkout.exercises.find(e => e.name.toLowerCase().includes('rows'));
      
      expect(rows?.weight).toBe(75);
    });

    it('should add new exercise', () => {
      const modifications: WorkoutModification[] = [
        {
          type: 'add',
          exercise: 'pull-ups',
          description: 'Add pull-ups'
        }
      ];
      
      const newWorkout = workoutIntelligenceService.applyWorkoutModifications(mockWorkout, modifications);
      
      expect(newWorkout.exercises).toHaveLength(mockWorkout.exercises.length + 1);
      
      const pullUps = newWorkout.exercises.find(e => e.name.toLowerCase().includes('pull-ups'));
      expect(pullUps).toBeDefined();
      expect(pullUps?.sets).toBe(3); // Default
      expect(pullUps?.reps).toBe(8); // Default
    });

    it('should remove exercise', () => {
      const modifications: WorkoutModification[] = [
        {
          type: 'remove',
          exercise: 'rows',
          description: 'Remove rows'
        }
      ];
      
      const newWorkout = workoutIntelligenceService.applyWorkoutModifications(mockWorkout, modifications);
      
      expect(newWorkout.exercises).toHaveLength(mockWorkout.exercises.length - 1);
      
      const rows = newWorkout.exercises.find(e => e.name.toLowerCase().includes('rows'));
      expect(rows).toBeUndefined();
    });

    it('should not decrease weight below 0', () => {
      const modifications: WorkoutModification[] = [
        {
          type: 'decrease',
          exercise: 'bench',
          property: 'weight',
          value: 100, // More than current weight
          unit: 'kg',
          description: 'Decrease bench by 100kg'
        }
      ];
      
      const newWorkout = workoutIntelligenceService.applyWorkoutModifications(mockWorkout, modifications);
      const bench = newWorkout.exercises.find(e => e.name.toLowerCase().includes('bench'));
      
      expect(bench?.weight).toBe(0); // Should not go negative
    });
  });

  describe('processWorkoutInput', () => {
    beforeEach(() => {
      // Mock having a last workout
      localStorageMock.getItem.mockReturnValue(JSON.stringify([mockWorkout]));
    });

    it('should process valid input successfully', () => {
      const result = workoutIntelligenceService.processWorkoutInput('same as last week');
      
      expect(result.success).toBe(true);
      expect(result.workout).toBeDefined();
      expect(result.modifications).toHaveLength(1);
      expect(result.message).toContain('Created new workout');
    });

    it('should handle no previous workout', () => {
      localStorageMock.getItem.mockReturnValue(null);
      
      const result = workoutIntelligenceService.processWorkoutInput('same as last week');
      
      expect(result.success).toBe(false);
      expect(result.workout).toBe(null);
      expect(result.message).toContain('No previous workout found');
    });

    it('should handle unrecognized input', () => {
      const result = workoutIntelligenceService.processWorkoutInput('random gibberish');
      
      expect(result.success).toBe(false);
      expect(result.workout).toBe(null);
      expect(result.message).toContain('couldn\'t understand');
    });
  });

  describe('getWorkoutSuggestions', () => {
    it('should return first-time user suggestions when no workout exists', () => {
      localStorageMock.getItem.mockReturnValue(null);
      
      const suggestions = workoutIntelligenceService.getWorkoutSuggestions();
      
      expect(suggestions.length).toBeGreaterThan(0);
      expect(suggestions[0]).toContain('Create your first workout');
    });

    it('should return progression suggestions when workout exists', () => {
      localStorageMock.getItem.mockReturnValue(JSON.stringify([mockWorkout]));
      
      const suggestions = workoutIntelligenceService.getWorkoutSuggestions();
      
      expect(suggestions.length).toBeGreaterThan(0);
      expect(suggestions.some(s => s.includes('same as last week'))).toBe(true);
      expect(suggestions.some(s => s.includes('increased'))).toBe(true);
    });

    it('should include time-based suggestions', () => {
      // Mock a workout from 8 days ago
      const oldWorkout = { ...mockWorkout, date: '2024-01-01' };
      localStorageMock.getItem.mockReturnValue(JSON.stringify([oldWorkout]));
      
      // Mock current date
      const mockDate = new Date('2024-01-09');
      jest.spyOn(global, 'Date').mockImplementation(() => mockDate as any);
      
      const suggestions = workoutIntelligenceService.getWorkoutSuggestions();
      
      expect(suggestions.some(s => s.includes('week'))).toBe(true);
      
      jest.restoreAllMocks();
    });
  });
});
