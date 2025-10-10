/**
 * Common utility functions for React Native components
 * Extracted from various components to reduce duplication
 */

import { COLORS } from '../theme/constants';

// ============================================================================
// PROGRESS & STATUS UTILITIES
// ============================================================================

/**
 * Calculate progress percentage with bounds checking
 */
export const getProgressPercentage = (current: number, target: number): number => {
  return Math.min((current / target) * 100, 100);
};

/**
 * Get status color based on progress percentage
 */
export const getStatusColor = (percentage: number): string => {
  if (percentage >= 90) return COLORS.success;
  if (percentage >= 70) return COLORS.warning;
  return COLORS.primary.main;
};

/**
 * Get status text based on progress percentage
 */
export const getStatusText = (percentage: number): string => {
  if (percentage >= 90) return 'Excellent';
  if (percentage >= 70) return 'Good';
  if (percentage >= 50) return 'Fair';
  return 'Needs Work';
};

/**
 * Get motivational text based on progress
 */
export const getMotivationalText = (progress: number): string => {
  if (progress >= 1) return 'Goal achieved! 🎉';
  if (progress >= 0.8) return 'Almost there! 💪';
  if (progress >= 0.5) return 'Great progress! 🌟';
  if (progress >= 0.2) return 'Keep going! 💪';
  return 'Every step counts! 🌱';
};

// ============================================================================
// TREND UTILITIES
// ============================================================================

/**
 * Get trend icon based on trend direction
 */
export const getTrendIcon = (trend: 'up' | 'down' | 'neutral'): string => {
  switch (trend) {
    case 'up': return 'trending-up';
    case 'down': return 'trending-down';
    case 'neutral': return 'remove';
    default: return 'remove';
  }
};

/**
 * Get trend color based on trend direction
 */
export const getTrendColor = (trend: 'up' | 'down' | 'neutral'): string => {
  switch (trend) {
    case 'up': return COLORS.success;
    case 'down': return COLORS.danger;
    case 'neutral': return COLORS.text.secondary;
    default: return COLORS.text.secondary;
  }
};

// ============================================================================
// TIME UTILITIES
// ============================================================================

/**
 * Get time-based greeting
 */
export const getTimeBasedGreeting = (): string => {
  const hour = new Date().getHours();
  
  if (hour >= 5 && hour < 12) {
    return 'Good morning';
  } else if (hour >= 12 && hour < 17) {
    return 'Good afternoon';
  } else if (hour >= 17 && hour < 21) {
    return 'Good evening';
  } else {
    return 'Good night';
  }
};

/**
 * Get motivational messages
 */
export const getMotivationalMessage = (): string => {
  const messages = [
    'Every small step counts!',
    'You\'re doing amazing!',
    'Keep up the great work!',
    'Progress is progress!',
    'You\'ve got this!',
    'Small steps, big changes!',
    'Consistency is key!',
    'You\'re stronger than you think!',
  ];
  
  return messages[Math.floor(Math.random() * messages.length)];
};

// ============================================================================
// BADGE & CATEGORY UTILITIES
// ============================================================================

/**
 * Get category configuration for badges
 */
export const getCategoryConfig = (category: string) => {
  const categoryMap: { [key: string]: { variant: string; icon: string; color: string } } = {
    // Strength & Weight Training
    'bodyweight': { variant: 'info', icon: 'person', color: COLORS.primary.main },
    'weighted': { variant: 'primary', icon: 'barbell', color: COLORS.primary.main },
    'strength': { variant: 'primary', icon: 'barbell', color: COLORS.primary.main },
    
    // Cardio
    'cardio_duration': { variant: 'success', icon: 'heart', color: COLORS.success },
    'cardio': { variant: 'success', icon: 'heart', color: COLORS.success },
    'running': { variant: 'success', icon: 'walk', color: COLORS.success },
    'cycling': { variant: 'success', icon: 'bicycle', color: COLORS.success },
    
    // Flexibility & Recovery
    'flexibility': { variant: 'warning', icon: 'leaf', color: COLORS.warning },
    'yoga': { variant: 'warning', icon: 'leaf', color: COLORS.warning },
    'stretching': { variant: 'warning', icon: 'leaf', color: COLORS.warning },
    
    // Sports
    'sports': { variant: 'secondary', icon: 'football', color: COLORS.gray[500] },
    'basketball': { variant: 'secondary', icon: 'basketball', color: COLORS.gray[500] },
    'soccer': { variant: 'secondary', icon: 'football', color: COLORS.gray[500] },
    
    // Distance-based
    'distance_based': { variant: 'info', icon: 'map', color: '#06b6d4' },
    
    // Default
    'default': { variant: 'secondary', icon: 'fitness', color: COLORS.gray[500] },
  };
  
  return categoryMap[category] || categoryMap['default'];
};

/**
 * Get status configuration for badges
 */
export const getStatusConfig = (status: string) => {
  const statusMap: { [key: string]: { variant: string; icon: string; color: string } } = {
    'active': { variant: 'success', icon: 'checkmark-circle', color: COLORS.success },
    'inactive': { variant: 'secondary', icon: 'pause-circle', color: COLORS.gray[500] },
    'pending': { variant: 'warning', icon: 'time', color: COLORS.warning },
    'completed': { variant: 'success', icon: 'checkmark-circle', color: COLORS.success },
    'cancelled': { variant: 'danger', icon: 'close-circle', color: COLORS.danger },
    'paused': { variant: 'warning', icon: 'pause-circle', color: COLORS.warning },
  };
  
  return statusMap[status] || statusMap['inactive'];
};

/**
 * Get difficulty configuration for badges
 */
export const getDifficultyConfig = (difficulty: string) => {
  const difficultyMap: { [key: string]: { variant: string; icon: string; color: string } } = {
    'beginner': { variant: 'info', icon: 'leaf', color: COLORS.primary.main },
    'easy': { variant: 'info', icon: 'leaf', color: COLORS.primary.main },
    'intermediate': { variant: 'warning', icon: 'flame', color: COLORS.warning },
    'advanced': { variant: 'danger', icon: 'flash', color: COLORS.danger },
    'expert': { variant: 'danger', icon: 'flash', color: COLORS.danger },
  };
  
  return difficultyMap[difficulty] || difficultyMap['beginner'];
};

// ============================================================================
// SIZE UTILITIES
// ============================================================================

/**
 * Get size configuration for components
 */
export const getSizeConfig = (size: 'small' | 'medium' | 'large') => {
  const sizeMap = {
    small: {
      padding: 12,
      fontSize: 14,
      iconSize: 16,
      height: 36,
    },
    medium: {
      padding: 16,
      fontSize: 16,
      iconSize: 20,
      height: 44,
    },
    large: {
      padding: 20,
      fontSize: 18,
      iconSize: 24,
      height: 52,
    },
  };
  
  return sizeMap[size] || sizeMap.medium;
};

// ============================================================================
// VALIDATION UTILITIES
// ============================================================================

/**
 * Get BMI category and color
 */
export const getBMICategory = (bmi: number) => {
  if (bmi < 18.5) return { category: 'Underweight', color: COLORS.primary.main };
  if (bmi < 25) return { category: 'Normal', color: COLORS.success };
  if (bmi < 30) return { category: 'Overweight', color: COLORS.warning };
  return { category: 'Obese', color: COLORS.danger };
};

/**
 * Get exercise category from name
 */
export const getExerciseCategory = (exerciseName: string): string => {
  const commonExerciseMappings: { [key: string]: string } = {
    'run': 'distance_based',
    'running': 'distance_based',
    'jog': 'distance_based',
    'jogging': 'distance_based',
    'walk': 'distance_based',
    'walking': 'distance_based',
    'cycle': 'distance_based',
    'cycling': 'distance_based',
    'bike': 'distance_based',
    'biking': 'distance_based',
    'swim': 'distance_based',
    'swimming': 'distance_based',
    'push-up': 'bodyweight',
    'push-ups': 'bodyweight',
    'pushup': 'bodyweight',
    'pushups': 'bodyweight',
    'sit-up': 'bodyweight',
    'sit-ups': 'bodyweight',
    'situp': 'bodyweight',
    'situps': 'bodyweight',
    'pull-up': 'bodyweight',
    'pull-ups': 'bodyweight',
    'pullup': 'bodyweight',
    'pullups': 'bodyweight',
    'squat': 'bodyweight',
    'squats': 'bodyweight',
    'lunge': 'bodyweight',
    'lunges': 'bodyweight',
    'plank': 'bodyweight',
    'planks': 'bodyweight',
    'yoga': 'flexibility',
    'stretch': 'flexibility',
    'stretching': 'flexibility',
    'meditation': 'flexibility',
    'basketball': 'sports',
    'soccer': 'sports',
    'football': 'sports',
    'tennis': 'sports',
    'volleyball': 'sports',
  };
  
  const lowerName = exerciseName.toLowerCase();
  return commonExerciseMappings[lowerName] || 'weighted';
};

// ============================================================================
// ALIGNMENT UTILITIES
// ============================================================================

/**
 * Get alignment text based on progress
 */
export const getAlignmentText = (alignment: 'closer' | 'further' | 'same'): string => {
  switch (alignment) {
    case 'closer': return 'Getting closer to your goal!';
    case 'further': return 'Moving away from your goal';
    case 'same': return 'Maintaining your current progress';
    default: return 'Tracking your progress';
  }
};

// ============================================================================
// SEARCH UTILITIES
// ============================================================================

/**
 * Calculate relevance score for search results
 */
export const getRelevanceScore = (name: string, query: string): number => {
  let score = 0;
  
  // Exact match gets highest score
  if (name.toLowerCase() === query.toLowerCase()) {
    score += 100;
  }
  
  // Starts with query gets high score
  if (name.toLowerCase().startsWith(query.toLowerCase())) {
    score += 50;
  }
  
  // Contains query gets medium score
  if (name.toLowerCase().includes(query.toLowerCase())) {
    score += 25;
  }
  
  // Word boundary matches get bonus
  const words = name.toLowerCase().split(/\s+/);
  const queryWords = query.toLowerCase().split(/\s+/);
  
  queryWords.forEach(queryWord => {
    words.forEach(word => {
      if (word.startsWith(queryWord)) {
        score += 10;
      }
    });
  });
  
  return score;
};

// ============================================================================
// COMPLETION UTILITIES
// ============================================================================

/**
 * Calculate completion percentage for routines
 */
export const getCompletionPercentage = (completed: number, total: number): number => {
  if (total === 0) return 0;
  return Math.round((completed / total) * 100);
};

// ============================================================================
// TOAST UTILITIES
// ============================================================================

/**
 * Get toast configuration based on type
 */
export const getToastConfig = (type: 'success' | 'error' | 'info' | 'warning') => {
  const configs = {
    success: {
      backgroundColor: COLORS.success,
      icon: 'checkmark-circle' as const,
      iconColor: COLORS.text.inverse,
    },
    error: {
      backgroundColor: COLORS.danger,
      icon: 'close-circle' as const,
      iconColor: COLORS.text.inverse,
    },
    warning: {
      backgroundColor: COLORS.warning,
      icon: 'warning' as const,
      iconColor: COLORS.text.inverse,
    },
    info: {
      backgroundColor: '#06b6d4',
      icon: 'information-circle' as const,
      iconColor: COLORS.text.inverse,
    },
  };
  
  return configs[type] || configs.info;
};
