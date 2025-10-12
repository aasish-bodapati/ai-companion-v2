/**
 * Data normalization utilities for complex data structures
 * Provides entity management and relationship handling
 */

// Base entity interface
export interface Entity {
  id: string | number;
}

// Normalized state structure
export interface NormalizedState<T extends Entity> {
  byId: Record<string | number, T>;
  allIds: (string | number)[];
}

// Entity manager for handling normalized data
export class EntityManager<T extends Entity> {
  private state: NormalizedState<T>;

  constructor(initialState: NormalizedState<T> = { byId: {}, allIds: [] }) {
    this.state = initialState;
  }

  // Add or update entities
  addEntities(entities: T[]): NormalizedState<T> {
    const newState = { ...this.state };
    
    entities.forEach(entity => {
      newState.byId[entity.id] = entity;
      if (!newState.allIds.includes(entity.id)) {
        newState.allIds.push(entity.id);
      }
    });

    this.state = newState;
    return newState;
  }

  // Add or update a single entity
  addEntity(entity: T): NormalizedState<T> {
    return this.addEntities([entity]);
  }

  // Remove entities
  removeEntities(ids: (string | number)[]): NormalizedState<T> {
    const newState = { ...this.state };
    
    ids.forEach(id => {
      delete newState.byId[id];
      newState.allIds = newState.allIds.filter(existingId => existingId !== id);
    });

    this.state = newState;
    return newState;
  }

  // Remove a single entity
  removeEntity(id: string | number): NormalizedState<T> {
    return this.removeEntities([id]);
  }

  // Update entity
  updateEntity(id: string | number, updates: Partial<T>): NormalizedState<T> {
    const newState = { ...this.state };
    
    if (newState.byId[id]) {
      newState.byId[id] = { ...newState.byId[id], ...updates };
    }

    this.state = newState;
    return newState;
  }

  // Get entity by ID
  getEntity(id: string | number): T | undefined {
    return this.state.byId[id];
  }

  // Get all entities
  getAllEntities(): T[] {
    return this.state.allIds.map(id => this.state.byId[id]);
  }

  // Get entities by IDs
  getEntitiesByIds(ids: (string | number)[]): T[] {
    return ids.map(id => this.state.byId[id]).filter(Boolean);
  }

  // Get current state
  getState(): NormalizedState<T> {
    return this.state;
  }

  // Clear all entities
  clear(): NormalizedState<T> {
    this.state = { byId: {}, allIds: [] };
    return this.state;
  }

  // Get count
  getCount(): number {
    return this.state.allIds.length;
  }

  // Check if entity exists
  hasEntity(id: string | number): boolean {
    return id in this.state.byId;
  }
}

// Specialized entity managers for common types
export class RoutineManager extends EntityManager<any> {
  // Get active routines
  getActiveRoutines(): any[] {
    return this.getAllEntities().filter(routine => routine.is_active);
  }

  // Get routines by difficulty
  getRoutinesByDifficulty(difficulty: string): any[] {
    return this.getAllEntities().filter(routine => routine.difficulty === difficulty);
  }

  // Get user routines
  getUserRoutines(userId: number): any[] {
    return this.getAllEntities().filter(routine => routine.created_by_user_id === userId);
  }

  // Get template routines
  getTemplateRoutines(): any[] {
    return this.getAllEntities().filter(routine => routine.is_template);
  }
}

export class WorkoutManager extends EntityManager<any> {
  // Get workouts by date range
  getWorkoutsByDateRange(startDate: string, endDate: string): any[] {
    return this.getAllEntities().filter(workout => {
      const workoutDate = new Date(workout.activity_date);
      const start = new Date(startDate);
      const end = new Date(endDate);
      return workoutDate >= start && workoutDate <= end;
    });
  }

  // Get workouts by user
  getWorkoutsByUser(userId: number): any[] {
    return this.getAllEntities().filter(workout => workout.user_id === userId);
  }

  // Get recent workouts
  getRecentWorkouts(limit: number = 10): any[] {
    return this.getAllEntities()
      .sort((a, b) => new Date(b.activity_date).getTime() - new Date(a.activity_date).getTime())
      .slice(0, limit);
  }
}

export class MealManager extends EntityManager<any> {
  // Get meals by date range
  getMealsByDateRange(startDate: string, endDate: string): any[] {
    return this.getAllEntities().filter(meal => {
      const mealDate = new Date(meal.meal_date);
      const start = new Date(startDate);
      const end = new Date(endDate);
      return mealDate >= start && mealDate <= end;
    });
  }

  // Get meals by user
  getMealsByUser(userId: number): any[] {
    return this.getAllEntities().filter(meal => meal.user_id === userId);
  }

  // Get recent meals
  getRecentMeals(limit: number = 10): any[] {
    return this.getAllEntities()
      .sort((a, b) => new Date(b.meal_date).getTime() - new Date(a.meal_date).getTime())
      .slice(0, limit);
  }
}

// Relationship manager for handling entity relationships
export class RelationshipManager {
  private relationships: Record<string, Record<string | number, (string | number)[]>> = {};

  // Add relationship
  addRelationship(entityType: string, entityId: string | number, relatedIds: (string | number)[]): void {
    if (!this.relationships[entityType]) {
      this.relationships[entityType] = {};
    }
    this.relationships[entityType][entityId] = relatedIds;
  }

  // Get related entities
  getRelatedEntities(entityType: string, entityId: string | number): (string | number)[] {
    return this.relationships[entityType]?.[entityId] || [];
  }

  // Remove relationship
  removeRelationship(entityType: string, entityId: string | number): void {
    if (this.relationships[entityType]) {
      delete this.relationships[entityType][entityId];
    }
  }

  // Clear all relationships
  clear(): void {
    this.relationships = {};
  }
}

// Normalized store state interface
export interface NormalizedStoreState {
  routines: NormalizedState<any>;
  workouts: NormalizedState<any>;
  meals: NormalizedState<any>;
  exercises: NormalizedState<any>;
  categories: NormalizedState<any>;
  relationships: RelationshipManager;
}

// Utility functions for data normalization
export const normalizeData = <T extends Entity>(data: T[]): NormalizedState<T> => {
  const byId: Record<string | number, T> = {};
  const allIds: (string | number)[] = [];

  data.forEach(item => {
    byId[item.id] = item;
    allIds.push(item.id);
  });

  return { byId, allIds };
};

export const denormalizeData = <T extends Entity>(normalizedState: NormalizedState<T>): T[] => {
  return normalizedState.allIds.map(id => normalizedState.byId[id]);
};

export const mergeNormalizedData = <T extends Entity>(
  existing: NormalizedState<T>,
  incoming: NormalizedState<T>
): NormalizedState<T> => {
  return {
    byId: { ...existing.byId, ...incoming.byId },
    allIds: [...new Set([...existing.allIds, ...incoming.allIds])],
  };
};

export default {
  EntityManager,
  RoutineManager,
  WorkoutManager,
  MealManager,
  RelationshipManager,
  normalizeData,
  denormalizeData,
  mergeNormalizedData,
};
