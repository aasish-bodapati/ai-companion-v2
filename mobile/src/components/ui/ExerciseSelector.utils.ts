// Utility functions and presets for ExerciseSelector component

import { Exercise } from './ExerciseSelector';


export const exerciseSelectorPresets = {
  // Basic exercise selection (single)
  basic: {
    allowMultiple: false,
    showCategories: true,
    showDifficulty: true,
    showCalories: false,
    showDescription: false,
  },

  // Detailed exercise selection (single)
  detailed: {
    allowMultiple: false,
    showCategories: true,
    showDifficulty: true,
    showCalories: true,
    showDescription: true,
  },

  // Multiple exercise selection
  multiple: {
    allowMultiple: true,
    showCategories: true,
    showDifficulty: true,
    showCalories: false,
    showDescription: false,
  },

  // Workout routine selection
  routine: {
    allowMultiple: true,
    showCategories: true,
    showDifficulty: true,
    showCalories: true,
    showDescription: true,
  },

  // Quick exercise selection (minimal info)
  quick: {
    allowMultiple: false,
    showCategories: true,
    showDifficulty: false,
    showCalories: false,
    showDescription: false,
  },
};

// Common exercise selector configurations
export const exerciseSelectorConfigs = {
  // Workout logging modal
  workoutLogging: {
    ...exerciseSelectorPresets.basic,
    searchPlaceholder: 'Search exercises to add...',
    emptyStateTitle: 'No exercises found',
    emptyStateSubtitle: 'Try searching for a different exercise',
  },

  // Routine creation modal
  routineCreation: {
    ...exerciseSelectorPresets.multiple,
    searchPlaceholder: 'Search exercises for routine...',
    emptyStateTitle: 'No exercises available',
    emptyStateSubtitle: 'Add exercises to create your routine',
  },

  // Exercise browsing
  exerciseBrowser: {
    ...exerciseSelectorPresets.detailed,
    searchPlaceholder: 'Browse exercises...',
    emptyStateTitle: 'No exercises found',
    emptyStateSubtitle: 'Try adjusting your search or filters',
  },

  // Quick add exercise
  quickAdd: {
    ...exerciseSelectorPresets.quick,
    searchPlaceholder: 'Quick add exercise...',
    emptyStateTitle: 'No exercises found',
    emptyStateSubtitle: 'Search for an exercise to add',
  },
};

// Helper function to get exercise selector configuration
export const getExerciseSelectorConfig = (type: keyof typeof exerciseSelectorConfigs) => {
  return exerciseSelectorConfigs[type];
};

// Helper function to create custom exercise selector configuration
export const createExerciseSelectorConfig = (
  baseType: keyof typeof exerciseSelectorPresets,
  overrides: Partial<typeof exerciseSelectorPresets[keyof typeof exerciseSelectorPresets]> = {}
) => {
  return {
    ...exerciseSelectorPresets[baseType],
    ...overrides,
  };
};

// Exercise filtering utilities
export const exerciseFilters = {
  // Filter by category
  byCategory: (exercises: Exercise[], category: string) => {
    return exercises.filter(exercise =>
      exercise.category === category || exercise.logging_category === category
    );
  },

  // Filter by difficulty
  byDifficulty: (exercises: Exercise[], difficulty: string) => {
    return exercises.filter(exercise => exercise.difficulty === difficulty);
  },

  // Filter by search query
  bySearchQuery: (exercises: Exercise[], query: string) => {
    if (!query.trim()) return exercises;

    const searchQuery = query.toLowerCase();
    return exercises.filter(exercise =>
      exercise.name.toLowerCase().includes(searchQuery) ||
      exercise.exercise_name?.toLowerCase().includes(searchQuery) ||
      exercise.description?.toLowerCase().includes(searchQuery) ||
      exercise.category?.toLowerCase().includes(searchQuery) ||
      exercise.logging_category?.toLowerCase().includes(searchQuery)
    );
  },

  // Filter by multiple criteria
  byMultiple: (exercises: Exercise[], filters: {
    category?: string;
    difficulty?: string;
    searchQuery?: string;
    hasCalories?: boolean;
  }) => {
    let filtered = exercises;

    if (filters.category) {
      filtered = exerciseFilters.byCategory(filtered, filters.category);
    }

    if (filters.difficulty) {
      filtered = exerciseFilters.byDifficulty(filtered, filters.difficulty);
    }

    if (filters.searchQuery) {
      filtered = exerciseFilters.bySearchQuery(filtered, filters.searchQuery);
    }

    if (filters.hasCalories) {
      filtered = filtered.filter(exercise => exercise.calories_per_minute && exercise.calories_per_minute > 0);
    }

    return filtered;
  },
};

// Exercise sorting utilities
export const exerciseSorters = {
  // Sort by name (A-Z)
  byName: (exercises: Exercise[]) => {
    return [...exercises].sort((a, b) => {
      const nameA = a.name || a.exercise_name || '';
      const nameB = b.name || b.exercise_name || '';
      return nameA.localeCompare(nameB);
    });
  },

  // Sort by category
  byCategory: (exercises: Exercise[]) => {
    return [...exercises].sort((a, b) => {
      const categoryA = a.category || a.logging_category || '';
      const categoryB = b.category || b.logging_category || '';
      return categoryA.localeCompare(categoryB);
    });
  },

  // Sort by difficulty
  byDifficulty: (exercises: Exercise[]) => {
    const difficultyOrder = ['Beginner', 'Intermediate', 'Advanced'];
    return [...exercises].sort((a, b) => {
      const difficultyA = difficultyOrder.indexOf(a.difficulty || '');
      const difficultyB = difficultyOrder.indexOf(b.difficulty || '');
      return difficultyA - difficultyB;
    });
  },

  // Sort by calories (high to low)
  byCalories: (exercises: Exercise[]) => {
    return [...exercises].sort((a, b) => {
      const caloriesA = a.calories_per_minute || 0;
      const caloriesB = b.calories_per_minute || 0;
      return caloriesB - caloriesA;
    });
  },
};

// Exercise search utilities
export const exerciseSearch = {
  // Get search suggestions
  getSuggestions: (exercises: Exercise[], query: string, maxSuggestions: number = 5) => {
    if (!query.trim()) return [];

    const searchQuery = query.toLowerCase();
    const suggestions = exercises
      .filter(exercise => {
        const name = exercise.name || exercise.exercise_name || '';
        return name.toLowerCase().includes(searchQuery);
      })
      .slice(0, maxSuggestions);

    return suggestions;
  },

  // Highlight search terms in text
  highlightSearchTerms: (text: string, searchQuery: string) => {
    if (!searchQuery.trim()) return text;

    const regex = new RegExp(`(${searchQuery})`, 'gi');
    return text.replace(regex, '**$1**');
  },
};

// Exercise validation utilities
export const exerciseValidation = {
  // Validate exercise data
  isValid: (exercise: Exercise) => {
    return !!(
      exercise.id &&
      (exercise.name || exercise.exercise_name) &&
      (exercise.category || exercise.logging_category)
    );
  },

  // Validate multiple exercises
  validateMultiple: (exercises: Exercise[]) => {
    return exercises.filter(exercise => exerciseValidation.isValid(exercise));
  },

  // Check for duplicate exercises
  hasDuplicates: (exercises: Exercise[]) => {
    const ids = exercises.map(exercise => exercise.id);
    return ids.length !== new Set(ids).size;
  },

  // Remove duplicate exercises
  removeDuplicates: (exercises: Exercise[]) => {
    const seen = new Set();
    return exercises.filter(exercise => {
      if (seen.has(exercise.id)) {
        return false;
      }
      seen.add(exercise.id);
      return true;
    });
  },
};

// Exercise statistics utilities
export const exerciseStats = {
  // Get category distribution
  getCategoryDistribution: (exercises: Exercise[]) => {
    const distribution: Record<string, number> = {};

    exercises.forEach(exercise => {
      const category = exercise.category || exercise.logging_category || 'Unknown';
      distribution[category] = (distribution[category] || 0) + 1;
    });

    return distribution;
  },

  // Get difficulty distribution
  getDifficultyDistribution: (exercises: Exercise[]) => {
    const distribution: Record<string, number> = {};

    exercises.forEach(exercise => {
      const difficulty = exercise.difficulty || 'Unknown';
      distribution[difficulty] = (distribution[difficulty] || 0) + 1;
    });

    return distribution;
  },

  // Get average calories
  getAverageCalories: (exercises: Exercise[]) => {
    const exercisesWithCalories = exercises.filter(exercise => exercise.calories_per_minute);
    if (exercisesWithCalories.length === 0) return 0;

    const totalCalories = exercisesWithCalories.reduce(
      (sum, exercise) => sum + (exercise.calories_per_minute || 0),
      0
    );

    return totalCalories / exercisesWithCalories.length;
  },
};
