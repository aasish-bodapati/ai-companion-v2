/**
 * @jest-environment jsdom
 */

import { routineService } from '@/services/routineService';

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

describe('RoutineService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    localStorageMock.getItem.mockReturnValue(null);
  });

  describe('getDefaultRoutine', () => {
    it('should return the correct number of default activities', () => {
      const routine = routineService.getDefaultRoutine();
      expect(routine).toHaveLength(13); // Based on 9-5 workflow document
    });

    it('should include key activities from user workflow', () => {
      const routine = routineService.getDefaultRoutine();
      const activityNames = routine.map(r => r.activity.toLowerCase());
      
      expect(activityNames).toContain('wake up');
      expect(activityNames).toContain('workout');
      expect(activityNames).toContain('breakfast');
      expect(activityNames).toContain('lunch');
      expect(activityNames).toContain('dinner');
      expect(activityNames).toContain('bedtime');
    });

    it('should have proper nutrition info for meals', () => {
      const routine = routineService.getDefaultRoutine();
      const breakfast = routine.find(r => r.activity === 'Breakfast');
      
      expect(breakfast).toBeDefined();
      expect(breakfast?.nutritionInfo).toBeDefined();
      expect(breakfast?.nutritionInfo?.calories).toBeGreaterThan(0);
      expect(breakfast?.nutritionInfo?.protein).toBeGreaterThan(0);
    });
  });

  describe('getTodaysRoutine', () => {
    it('should filter activities based on day of week', () => {
      // Mock current date to be a Sunday (day 0)
      const mockDate = new Date('2024-01-14'); // Sunday
      jest.spyOn(global, 'Date').mockImplementation(() => mockDate as any);

      const routine = routineService.getTodaysRoutine();
      
      // Workout should not be included on Sunday (Monday-Saturday only)
      const workout = routine.find(r => r.activity === 'Workout');
      expect(workout).toBeUndefined();

      // Wake up should be included (every day)
      const wakeUp = routine.find(r => r.activity === 'Wake up');
      expect(wakeUp).toBeDefined();

      jest.restoreAllMocks();
    });

    it('should set correct status based on current time', () => {
      // Mock current time to be 5:30 AM
      const mockDate = new Date('2024-01-15T05:30:00'); // Monday 5:30 AM
      jest.spyOn(global, 'Date').mockImplementation(() => mockDate as any);

      const routine = routineService.getTodaysRoutine();
      
      // Wake up (4:30) should be completed or in-progress
      const wakeUp = routine.find(r => r.activity === 'Wake up');
      expect(wakeUp?.status).toMatch(/completed|in-progress/);

      // Workout (5:00) should be in-progress
      const workout = routine.find(r => r.activity === 'Workout');
      expect(workout?.status).toBe('in-progress');

      // Breakfast (8:00) should be upcoming
      const breakfast = routine.find(r => r.activity === 'Breakfast');
      expect(breakfast?.status).toBe('upcoming');

      jest.restoreAllMocks();
    });
  });

  describe('completeActivity', () => {
    it('should mark activity as completed', () => {
      const mockStorageData = {
        date: new Date().toDateString(),
        activities: [],
        completionRate: 0,
        streakDays: 0,
        insights: []
      };
      
      localStorageMock.getItem.mockReturnValue(JSON.stringify(mockStorageData));

      routineService.completeActivity('wake_up');

      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        'ai_companion_routine',
        expect.stringContaining('"status":"completed"')
      );
    });
  });

  describe('getTodayCompletionRate', () => {
    it('should calculate completion rate correctly', () => {
      // Mock a scenario where 2 out of 4 activities are completed
      const mockDate = new Date('2024-01-15T12:00:00'); // Monday noon
      jest.spyOn(global, 'Date').mockImplementation(() => mockDate as any);

      const mockStorageData = {
        date: mockDate.toDateString(),
        activities: [
          { id: 'wake_up', status: 'completed', completedAt: new Date() },
          { id: 'workout', status: 'completed', completedAt: new Date() }
        ],
        completionRate: 0,
        streakDays: 0,
        insights: []
      };
      
      localStorageMock.getItem.mockReturnValue(JSON.stringify(mockStorageData));

      const completionRate = routineService.getTodayCompletionRate();
      expect(completionRate).toBeGreaterThan(0);
      expect(completionRate).toBeLessThanOrEqual(100);

      jest.restoreAllMocks();
    });
  });

  describe('getDailyNutritionTotals', () => {
    it('should calculate nutrition totals correctly', () => {
      const mockDate = new Date('2024-01-15T12:00:00');
      jest.spyOn(global, 'Date').mockImplementation(() => mockDate as any);

      const mockStorageData = {
        date: mockDate.toDateString(),
        activities: [
          { id: 'breakfast', status: 'completed', completedAt: new Date() }
        ],
        completionRate: 0,
        streakDays: 0,
        insights: []
      };
      
      localStorageMock.getItem.mockReturnValue(JSON.stringify(mockStorageData));

      const nutrition = routineService.getDailyNutritionTotals();
      
      expect(nutrition).toHaveProperty('calories');
      expect(nutrition).toHaveProperty('protein');
      expect(nutrition).toHaveProperty('carbs');
      expect(nutrition).toHaveProperty('fat');
      expect(nutrition).toHaveProperty('fiber');

      // Should have some nutrition from breakfast
      expect(nutrition.calories).toBeGreaterThan(0);
      expect(nutrition.protein).toBeGreaterThan(0);

      jest.restoreAllMocks();
    });
  });

  describe('getPersonalizedInsights', () => {
    it('should return insights based on completion rate', () => {
      const insights = routineService.getPersonalizedInsights();
      
      expect(Array.isArray(insights)).toBe(true);
      expect(insights.length).toBeGreaterThan(0);
      expect(typeof insights[0]).toBe('string');
    });

    it('should include time-based insights', () => {
      // Mock early morning time
      const mockDate = new Date('2024-01-15T05:00:00');
      jest.spyOn(global, 'Date').mockImplementation(() => mockDate as any);

      const insights = routineService.getPersonalizedInsights();
      const morningInsight = insights.find(insight => 
        insight.includes('4:30 AM') || insight.includes('morning')
      );
      
      expect(morningInsight).toBeDefined();

      jest.restoreAllMocks();
    });
  });
});
