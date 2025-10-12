/**
 * Comprehensive tests for the normalized store
 * Tests entity management, relationships, and performance
 */

import { renderHook, act } from '@testing-library/react-native';
import { useNormalizedStore } from '../stores/normalizedStore';
import { 
  mockRoutine, 
  mockWorkout, 
  mockMeal, 
  mockExercise, 
  mockCategory,
  createTestData,
  waitForHookUpdate,
  measurePerformance,
  expectStoreActionCalled,
  expectStoreActionNotCalled
} from '../test-utils/stateManagementTestUtils';

describe('NormalizedStore', () => {
  beforeEach(() => {
    // Reset store state before each test
    useNormalizedStore.getState().clearAll();
  });

  describe('Routine Management', () => {
    it('should add routines correctly', () => {
      const routine = mockRoutine();
      
      act(() => {
        useNormalizedStore.getState().addRoutine(routine);
      });

      const state = useNormalizedStore.getState();
      expect(state.routines.getEntity(routine.id)).toEqual(routine);
      expect(state.routines.getCount()).toBe(1);
    });

    it('should update routines correctly', () => {
      const routine = mockRoutine();
      
      act(() => {
        useNormalizedStore.getState().addRoutine(routine);
        useNormalizedStore.getState().updateRoutine(routine.id, { name: 'Updated Routine' });
      });

      const state = useNormalizedStore.getState();
      const updatedRoutine = state.routines.getEntity(routine.id);
      expect(updatedRoutine?.name).toBe('Updated Routine');
    });

    it('should remove routines correctly', () => {
      const routine = mockRoutine();
      
      act(() => {
        useNormalizedStore.getState().addRoutine(routine);
        useNormalizedStore.getState().removeRoutine(routine.id);
      });

      const state = useNormalizedStore.getState();
      expect(state.routines.getEntity(routine.id)).toBeUndefined();
      expect(state.routines.getCount()).toBe(0);
    });

    it('should get active routines correctly', () => {
      const activeRoutine = mockRoutine({ is_active: true });
      const inactiveRoutine = mockRoutine({ is_active: false });
      
      act(() => {
        useNormalizedStore.getState().addRoutine(activeRoutine);
        useNormalizedStore.getState().addRoutine(inactiveRoutine);
      });

      const state = useNormalizedStore.getState();
      const activeRoutines = state.routines.getActiveRoutines();
      expect(activeRoutines).toHaveLength(1);
      expect(activeRoutines[0].id).toBe(activeRoutine.id);
    });

    it('should get routines by difficulty correctly', () => {
      const beginnerRoutine = mockRoutine({ difficulty: 'beginner' });
      const intermediateRoutine = mockRoutine({ difficulty: 'intermediate' });
      
      act(() => {
        useNormalizedStore.getState().addRoutine(beginnerRoutine);
        useNormalizedStore.getState().addRoutine(intermediateRoutine);
      });

      const state = useNormalizedStore.getState();
      const beginnerRoutines = state.routines.getRoutinesByDifficulty('beginner');
      expect(beginnerRoutines).toHaveLength(1);
      expect(beginnerRoutines[0].id).toBe(beginnerRoutine.id);
    });

    it('should get user routines correctly', () => {
      const userRoutine = mockRoutine({ created_by_user_id: 1 });
      const templateRoutine = mockRoutine({ created_by_user_id: null });
      
      act(() => {
        useNormalizedStore.getState().addRoutine(userRoutine);
        useNormalizedStore.getState().addRoutine(templateRoutine);
      });

      const state = useNormalizedStore.getState();
      const userRoutines = state.routines.getUserRoutines(1);
      expect(userRoutines).toHaveLength(1);
      expect(userRoutines[0].id).toBe(userRoutine.id);
    });

    it('should get template routines correctly', () => {
      const templateRoutine = mockRoutine({ is_template: true });
      const userRoutine = mockRoutine({ is_template: false });
      
      act(() => {
        useNormalizedStore.getState().addRoutine(templateRoutine);
        useNormalizedStore.getState().addRoutine(userRoutine);
      });

      const state = useNormalizedStore.getState();
      const templateRoutines = state.routines.getTemplateRoutines();
      expect(templateRoutines).toHaveLength(1);
      expect(templateRoutines[0].id).toBe(templateRoutine.id);
    });
  });

  describe('Workout Management', () => {
    it('should add workouts correctly', () => {
      const workout = mockWorkout();
      
      act(() => {
        useNormalizedStore.getState().addWorkout(workout);
      });

      const state = useNormalizedStore.getState();
      expect(state.workouts.getEntity(workout.id)).toEqual(workout);
      expect(state.workouts.getCount()).toBe(1);
    });

    it('should get workouts by date range correctly', () => {
      const today = new Date();
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);
      
      const todayWorkout = mockWorkout({ activity_date: today.toISOString() });
      const yesterdayWorkout = mockWorkout({ activity_date: yesterday.toISOString() });
      
      act(() => {
        useNormalizedStore.getState().addWorkout(todayWorkout);
        useNormalizedStore.getState().addWorkout(yesterdayWorkout);
      });

      const state = useNormalizedStore.getState();
      const todayWorkouts = state.workouts.getWorkoutsByDateRange(
        today.toISOString().split('T')[0],
        today.toISOString().split('T')[0]
      );
      expect(todayWorkouts).toHaveLength(1);
      expect(todayWorkouts[0].id).toBe(todayWorkout.id);
    });

    it('should get recent workouts correctly', () => {
      const workouts = createTestData.workouts(5);
      
      act(() => {
        workouts.forEach(workout => {
          useNormalizedStore.getState().addWorkout(workout);
        });
      });

      const state = useNormalizedStore.getState();
      const recentWorkouts = state.workouts.getRecentWorkouts(3);
      expect(recentWorkouts).toHaveLength(3);
    });

    it('should get workouts by user correctly', () => {
      const user1Workout = mockWorkout({ user_id: 1 });
      const user2Workout = mockWorkout({ user_id: 2 });
      
      act(() => {
        useNormalizedStore.getState().addWorkout(user1Workout);
        useNormalizedStore.getState().addWorkout(user2Workout);
      });

      const state = useNormalizedStore.getState();
      const user1Workouts = state.workouts.getWorkoutsByUser(1);
      expect(user1Workouts).toHaveLength(1);
      expect(user1Workouts[0].id).toBe(user1Workout.id);
    });
  });

  describe('Meal Management', () => {
    it('should add meals correctly', () => {
      const meal = mockMeal();
      
      act(() => {
        useNormalizedStore.getState().addMeal(meal);
      });

      const state = useNormalizedStore.getState();
      expect(state.meals.getEntity(meal.id)).toEqual(meal);
      expect(state.meals.getCount()).toBe(1);
    });

    it('should get meals by date range correctly', () => {
      const today = new Date();
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);
      
      const todayMeal = mockMeal({ meal_date: today.toISOString() });
      const yesterdayMeal = mockMeal({ meal_date: yesterday.toISOString() });
      
      act(() => {
        useNormalizedStore.getState().addMeal(todayMeal);
        useNormalizedStore.getState().addMeal(yesterdayMeal);
      });

      const state = useNormalizedStore.getState();
      const todayMeals = state.meals.getMealsByDateRange(
        today.toISOString().split('T')[0],
        today.toISOString().split('T')[0]
      );
      expect(todayMeals).toHaveLength(1);
      expect(todayMeals[0].id).toBe(todayMeal.id);
    });

    it('should get recent meals correctly', () => {
      const meals = createTestData.meals(5);
      
      act(() => {
        meals.forEach(meal => {
          useNormalizedStore.getState().addMeal(meal);
        });
      });

      const state = useNormalizedStore.getState();
      const recentMeals = state.meals.getRecentMeals(3);
      expect(recentMeals).toHaveLength(3);
    });

    it('should get meals by user correctly', () => {
      const user1Meal = mockMeal({ user_id: 1 });
      const user2Meal = mockMeal({ user_id: 2 });
      
      act(() => {
        useNormalizedStore.getState().addMeal(user1Meal);
        useNormalizedStore.getState().addMeal(user2Meal);
      });

      const state = useNormalizedStore.getState();
      const user1Meals = state.meals.getMealsByUser(1);
      expect(user1Meals).toHaveLength(1);
      expect(user1Meals[0].id).toBe(user1Meal.id);
    });
  });

  describe('Exercise Management', () => {
    it('should add exercises correctly', () => {
      const exercise = mockExercise();
      
      act(() => {
        useNormalizedStore.getState().addExercise(exercise);
      });

      const state = useNormalizedStore.getState();
      expect(state.exercises.getEntity(exercise.id)).toEqual(exercise);
      expect(state.exercises.getCount()).toBe(1);
    });

    it('should update exercises correctly', () => {
      const exercise = mockExercise();
      
      act(() => {
        useNormalizedStore.getState().addExercise(exercise);
        useNormalizedStore.getState().updateExercise(exercise.id, { name: 'Updated Exercise' });
      });

      const state = useNormalizedStore.getState();
      const updatedExercise = state.exercises.getEntity(exercise.id);
      expect(updatedExercise?.name).toBe('Updated Exercise');
    });

    it('should remove exercises correctly', () => {
      const exercise = mockExercise();
      
      act(() => {
        useNormalizedStore.getState().addExercise(exercise);
        useNormalizedStore.getState().removeExercise(exercise.id);
      });

      const state = useNormalizedStore.getState();
      expect(state.exercises.getEntity(exercise.id)).toBeUndefined();
      expect(state.exercises.getCount()).toBe(0);
    });
  });

  describe('Category Management', () => {
    it('should add categories correctly', () => {
      const category = mockCategory();
      
      act(() => {
        useNormalizedStore.getState().addCategory(category);
      });

      const state = useNormalizedStore.getState();
      expect(state.categories.getEntity(category.id)).toEqual(category);
      expect(state.categories.getCount()).toBe(1);
    });

    it('should update categories correctly', () => {
      const category = mockCategory();
      
      act(() => {
        useNormalizedStore.getState().addCategory(category);
        useNormalizedStore.getState().updateCategory(category.id, { name: 'Updated Category' });
      });

      const state = useNormalizedStore.getState();
      const updatedCategory = state.categories.getEntity(category.id);
      expect(updatedCategory?.name).toBe('Updated Category');
    });

    it('should remove categories correctly', () => {
      const category = mockCategory();
      
      act(() => {
        useNormalizedStore.getState().addCategory(category);
        useNormalizedStore.getState().removeCategory(category.id);
      });

      const state = useNormalizedStore.getState();
      expect(state.categories.getEntity(category.id)).toBeUndefined();
      expect(state.categories.getCount()).toBe(0);
    });
  });

  describe('Loading States', () => {
    it('should set loading states correctly', () => {
      act(() => {
        useNormalizedStore.getState().setRoutinesLoading(true);
        useNormalizedStore.getState().setWorkoutsLoading(true);
        useNormalizedStore.getState().setMealsLoading(true);
        useNormalizedStore.getState().setExercisesLoading(true);
        useNormalizedStore.getState().setCategoriesLoading(true);
      });

      const state = useNormalizedStore.getState();
      expect(state.loading.routines).toBe(true);
      expect(state.loading.workouts).toBe(true);
      expect(state.loading.meals).toBe(true);
      expect(state.loading.exercises).toBe(true);
      expect(state.loading.categories).toBe(true);
    });

    it('should reset loading states correctly', () => {
      act(() => {
        useNormalizedStore.getState().setRoutinesLoading(true);
        useNormalizedStore.getState().setRoutinesLoading(false);
      });

      const state = useNormalizedStore.getState();
      expect(state.loading.routines).toBe(false);
    });
  });

  describe('Error States', () => {
    it('should set error states correctly', () => {
      const errorMessage = 'Test error';
      
      act(() => {
        useNormalizedStore.getState().setRoutinesError(errorMessage);
        useNormalizedStore.getState().setWorkoutsError(errorMessage);
        useNormalizedStore.getState().setMealsError(errorMessage);
        useNormalizedStore.getState().setExercisesError(errorMessage);
        useNormalizedStore.getState().setCategoriesError(errorMessage);
      });

      const state = useNormalizedStore.getState();
      expect(state.errors.routines).toBe(errorMessage);
      expect(state.errors.workouts).toBe(errorMessage);
      expect(state.errors.meals).toBe(errorMessage);
      expect(state.errors.exercises).toBe(errorMessage);
      expect(state.errors.categories).toBe(errorMessage);
    });

    it('should reset errors correctly', () => {
      act(() => {
        useNormalizedStore.getState().setRoutinesError('Test error');
        useNormalizedStore.getState().resetErrors();
      });

      const state = useNormalizedStore.getState();
      expect(state.errors.routines).toBeNull();
      expect(state.errors.workouts).toBeNull();
      expect(state.errors.meals).toBeNull();
      expect(state.errors.exercises).toBeNull();
      expect(state.errors.categories).toBeNull();
    });
  });

  describe('Performance Tests', () => {
    it('should handle large datasets efficiently', async () => {
      const largeDataset = createTestData.routines(1000);
      
      const performance = await measurePerformance(async () => {
        act(() => {
          useNormalizedStore.getState().setRoutines(largeDataset);
        });
        
        const state = useNormalizedStore.getState();
        return state.routines.getCount();
      });

      expect(performance.average).toBeLessThan(100); // Should complete in less than 100ms
      expect(performance.results[0]).toBe(1000);
    });

    it('should handle frequent updates efficiently', async () => {
      const routines = createTestData.routines(100);
      
      const performance = await measurePerformance(async () => {
        act(() => {
          routines.forEach(routine => {
            useNormalizedStore.getState().addRoutine(routine);
          });
        });
        
        const state = useNormalizedStore.getState();
        return state.routines.getCount();
      });

      expect(performance.average).toBeLessThan(50); // Should complete in less than 50ms
      expect(performance.results[0]).toBe(100);
    });

    it('should handle concurrent operations efficiently', async () => {
      const routines = createTestData.routines(50);
      const workouts = createTestData.workouts(50);
      const meals = createTestData.meals(50);
      
      const performance = await measurePerformance(async () => {
        act(() => {
          useNormalizedStore.getState().setRoutines(routines);
          useNormalizedStore.getState().setWorkouts(workouts);
          useNormalizedStore.getState().setMeals(meals);
        });
        
        const state = useNormalizedStore.getState();
        return {
          routines: state.routines.getCount(),
          workouts: state.workouts.getCount(),
          meals: state.meals.getCount(),
        };
      });

      expect(performance.average).toBeLessThan(30); // Should complete in less than 30ms
      expect(performance.results[0]).toEqual({
        routines: 50,
        workouts: 50,
        meals: 50,
      });
    });
  });

  describe('Data Integrity', () => {
    it('should maintain data integrity during updates', () => {
      const routine = mockRoutine();
      
      act(() => {
        useNormalizedStore.getState().addRoutine(routine);
        useNormalizedStore.getState().updateRoutine(routine.id, { name: 'Updated' });
        useNormalizedStore.getState().updateRoutine(routine.id, { difficulty: 'advanced' });
      });

      const state = useNormalizedStore.getState();
      const updatedRoutine = state.routines.getEntity(routine.id);
      expect(updatedRoutine?.name).toBe('Updated');
      expect(updatedRoutine?.difficulty).toBe('advanced');
      expect(updatedRoutine?.id).toBe(routine.id); // ID should remain unchanged
    });

    it('should handle duplicate IDs correctly', () => {
      const routine1 = mockRoutine({ id: 1 });
      const routine2 = mockRoutine({ id: 1, name: 'Duplicate' });
      
      act(() => {
        useNormalizedStore.getState().addRoutine(routine1);
        useNormalizedStore.getState().addRoutine(routine2);
      });

      const state = useNormalizedStore.getState();
      const routine = state.routines.getEntity(1);
      expect(routine?.name).toBe('Duplicate'); // Should be overwritten
      expect(state.routines.getCount()).toBe(1); // Should not create duplicates
    });

    it('should handle non-existent entity operations gracefully', () => {
      act(() => {
        useNormalizedStore.getState().updateRoutine(999, { name: 'Non-existent' });
        useNormalizedStore.getState().removeRoutine(999);
      });

      const state = useNormalizedStore.getState();
      expect(state.routines.getEntity(999)).toBeUndefined();
      expect(state.routines.getCount()).toBe(0);
    });
  });
});
