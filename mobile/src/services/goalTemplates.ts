/**
 * Goal Templates Service
 * Maps qualitative health goals to measurable numerical targets
 */

export interface NumericalGoal {
  id: string;
  name: string;
  unit: string;
  targetValue: number;
  currentValue?: number;
  category: 'fitness' | 'nutrition' | 'wellness' | 'lifestyle';
  priority: 'high' | 'medium' | 'low';
  isCustomizable: boolean;
  description: string;
  icon: string;
  color: string;
}

export interface GoalTemplate {
  healthGoalId: string;
  healthGoalTitle: string;
  numericalGoals: NumericalGoal[];
  suggestedDuration: number; // days
  description: string;
}

export const GOAL_TEMPLATES: GoalTemplate[] = [
  // Weight Loss
  {
    healthGoalId: 'lose_weight',
    healthGoalTitle: 'Lose Weight',
    suggestedDuration: 90,
    description: 'Burn fat and build lean muscle',
    numericalGoals: [
      {
        id: 'weight_loss_target',
        name: 'Weight Loss Target',
        unit: 'kg',
        targetValue: 5, // Default 5kg, will be customized based on user data
        category: 'fitness',
        priority: 'high',
        isCustomizable: true,
        description: 'Target weight loss over the goal period',
        icon: 'trending-down-outline',
        color: '#10b981',
      },
      {
        id: 'weekly_weight_loss',
        name: 'Weekly Weight Loss',
        unit: 'kg/week',
        targetValue: 0.5,
        category: 'fitness',
        priority: 'high',
        isCustomizable: true,
        description: 'Safe and sustainable weekly weight loss',
        icon: 'calendar-outline',
        color: '#3b82f6',
      },
      {
        id: 'body_fat_percentage',
        name: 'Body Fat Percentage',
        unit: '%',
        targetValue: 15, // Will be customized based on gender and current stats
        category: 'fitness',
        priority: 'medium',
        isCustomizable: true,
        description: 'Target body fat percentage',
        icon: 'analytics-outline',
        color: '#8b5cf6',
      },
      {
        id: 'calorie_deficit',
        name: 'Daily Calorie Deficit',
        unit: 'calories',
        targetValue: 500,
        category: 'nutrition',
        priority: 'high',
        isCustomizable: true,
        description: 'Daily calorie deficit for weight loss',
        icon: 'remove-circle-outline',
        color: '#ef4444',
      },
    ],
  },

  // Build Muscle
  {
    healthGoalId: 'build_muscle',
    healthGoalTitle: 'Build Muscle',
    suggestedDuration: 120,
    description: 'Increase strength and muscle mass',
    numericalGoals: [
      {
        id: 'muscle_gain_target',
        name: 'Muscle Gain Target',
        unit: 'kg',
        targetValue: 3,
        category: 'fitness',
        priority: 'high',
        isCustomizable: true,
        description: 'Target muscle mass increase',
        icon: 'trending-up-outline',
        color: '#f59e0b',
      },
      {
        id: 'protein_intake',
        name: 'Daily Protein Intake',
        unit: 'g',
        targetValue: 150, // Will be calculated based on body weight
        category: 'nutrition',
        priority: 'high',
        isCustomizable: true,
        description: 'Daily protein intake for muscle building',
        icon: 'nutrition-outline',
        color: '#10b981',
      },
      {
        id: 'strength_benchmark',
        name: 'Bench Press Strength',
        unit: 'kg',
        targetValue: 80, // Will be customized based on current strength
        category: 'fitness',
        priority: 'medium',
        isCustomizable: true,
        description: 'Target bench press weight',
        icon: 'barbell-outline',
        color: '#3b82f6',
      },
      {
        id: 'workout_frequency',
        name: 'Weekly Workouts',
        unit: 'sessions',
        targetValue: 4,
        category: 'fitness',
        priority: 'high',
        isCustomizable: true,
        description: 'Number of strength training sessions per week',
        icon: 'fitness-outline',
        color: '#8b5cf6',
      },
    ],
  },

  // Drink More Water
  {
    healthGoalId: 'drink_more_water',
    healthGoalTitle: 'Drink More Water',
    suggestedDuration: 30,
    description: 'Stay hydrated throughout the day',
    numericalGoals: [
      {
        id: 'daily_water_intake',
        name: 'Daily Water Intake',
        unit: 'ml',
        targetValue: 3000, // Default 3L, will be customized based on gender
        category: 'nutrition',
        priority: 'high',
        isCustomizable: true,
        description: 'Daily water intake target (2.7L for females, 3.7L for males)',
        icon: 'water-outline',
        color: '#06b6d4',
      },
      {
        id: 'hydration_consistency',
        name: 'Hydration Days',
        unit: 'days/week',
        targetValue: 7,
        category: 'lifestyle',
        priority: 'high',
        isCustomizable: false,
        description: 'Days per week meeting water intake goal',
        icon: 'calendar-outline',
        color: '#10b981',
      },
    ],
  },

  // Improve Sleep
  {
    healthGoalId: 'improve_sleep',
    healthGoalTitle: 'Improve Sleep',
    suggestedDuration: 60,
    description: 'Get better quality sleep',
    numericalGoals: [
      {
        id: 'sleep_duration',
        name: 'Sleep Duration',
        unit: 'hours',
        targetValue: 8,
        category: 'wellness',
        priority: 'high',
        isCustomizable: true,
        description: 'Target hours of sleep per night',
        icon: 'moon-outline',
        color: '#6366f1',
      },
      {
        id: 'bedtime_consistency',
        name: 'Bedtime Consistency',
        unit: 'minutes',
        targetValue: 30, // Within 30 minutes of target bedtime
        category: 'lifestyle',
        priority: 'medium',
        isCustomizable: true,
        description: 'Bedtime consistency window',
        icon: 'time-outline',
        color: '#8b5cf6',
      },
      {
        id: 'sleep_quality_score',
        name: 'Sleep Quality Score',
        unit: '/10',
        targetValue: 8,
        category: 'wellness',
        priority: 'medium',
        isCustomizable: true,
        description: 'Target sleep quality rating',
        icon: 'star-outline',
        color: '#f59e0b',
      },
    ],
  },

  // Reduce Stress
  {
    healthGoalId: 'reduce_stress',
    healthGoalTitle: 'Reduce Stress',
    suggestedDuration: 45,
    description: 'Manage stress and anxiety',
    numericalGoals: [
      {
        id: 'stress_level',
        name: 'Stress Level',
        unit: '/10',
        targetValue: 3, // Target stress level (lower is better)
        category: 'wellness',
        priority: 'high',
        isCustomizable: true,
        description: 'Target daily stress level',
        icon: 'flower-outline',
        color: '#10b981',
      },
      {
        id: 'meditation_minutes',
        name: 'Daily Meditation',
        unit: 'minutes',
        targetValue: 15,
        category: 'wellness',
        priority: 'high',
        isCustomizable: true,
        description: 'Daily meditation practice',
        icon: 'leaf-outline',
        color: '#8b5cf6',
      },
      {
        id: 'breathing_exercises',
        name: 'Breathing Exercises',
        unit: 'sessions/week',
        targetValue: 5,
        category: 'wellness',
        priority: 'medium',
        isCustomizable: true,
        description: 'Weekly breathing exercise sessions',
        icon: 'air-outline',
        color: '#06b6d4',
      },
    ],
  },

  // Eat Healthier
  {
    healthGoalId: 'eat_healthier',
    healthGoalTitle: 'Eat Healthier',
    suggestedDuration: 60,
    description: 'Improve diet quality and nutrition',
    numericalGoals: [
      {
        id: 'vegetable_servings',
        name: 'Daily Vegetable Servings',
        unit: 'servings',
        targetValue: 5,
        category: 'nutrition',
        priority: 'high',
        isCustomizable: true,
        description: 'Daily vegetable servings',
        icon: 'leaf-outline',
        color: '#10b981',
      },
      {
        id: 'fruit_servings',
        name: 'Daily Fruit Servings',
        unit: 'servings',
        targetValue: 3,
        category: 'nutrition',
        priority: 'high',
        isCustomizable: true,
        description: 'Daily fruit servings',
        icon: 'nutrition-outline',
        color: '#f59e0b',
      },
      {
        id: 'processed_food_limit',
        name: 'Processed Food Limit',
        unit: 'servings/week',
        targetValue: 5,
        category: 'nutrition',
        priority: 'medium',
        isCustomizable: true,
        description: 'Weekly processed food limit',
        icon: 'close-circle-outline',
        color: '#ef4444',
      },
      {
        id: 'meal_prep_frequency',
        name: 'Meal Prep Sessions',
        unit: 'sessions/week',
        targetValue: 2,
        category: 'lifestyle',
        priority: 'medium',
        isCustomizable: true,
        description: 'Weekly meal preparation sessions',
        icon: 'restaurant-outline',
        color: '#3b82f6',
      },
    ],
  },
];

export const getGoalTemplate = (healthGoalId: string): GoalTemplate | undefined => {
  return GOAL_TEMPLATES.find(template => template.healthGoalId === healthGoalId);
};

// Mapping from display names to goal IDs
const GOAL_NAME_TO_ID_MAP: Record<string, string> = {
  'Weight Loss': 'lose_weight',
  'Muscle Gain': 'build_muscle',
  'Better Health': 'eat_healthier',
  'Increased Energy': 'improve_sleep',
  'Better Sleep': 'improve_sleep',
  'Stress Reduction': 'reduce_stress',
  'Improved Fitness': 'improve_endurance',
  'Better Nutrition': 'eat_healthier',
  'Habit Building': 'be_consistent',
  'General Wellness': 'reduce_stress',
  'Gain Weight': 'gain_weight',
  'Build Muscle': 'build_muscle',
  'Improve Endurance': 'improve_endurance',
  'Get Stronger': 'get_stronger',
  'Eat Healthier': 'eat_healthier',
  'Track Calories': 'track_calories',
  'Drink More Water': 'drink_more_water',
  'Reduce Sugar': 'reduce_sugar',
  'Reduce Stress': 'reduce_stress',
  'Improve Sleep': 'improve_sleep',
  'Meditate': 'meditate',
  'Track Mood': 'track_mood',
  'Be Consistent': 'be_consistent',
  'Stay Motivated': 'stay_motivated',
  'Track Progress': 'track_progress',
};

export const getNumericalGoalsForHealthGoals = (healthGoalNames: string[]): NumericalGoal[] => {
  const allNumericalGoals: NumericalGoal[] = [];
  
  healthGoalNames.forEach(goalName => {
    const goalId = GOAL_NAME_TO_ID_MAP[goalName];
    if (goalId) {
      const template = getGoalTemplate(goalId);
      if (template) {
        allNumericalGoals.push(...template.numericalGoals);
      }
    }
  });
  
  return allNumericalGoals;
};

export const customizeGoalForUser = (
  goal: NumericalGoal, 
  userData: {
    age?: number;
    weight?: number;
    height?: number;
    gender?: string;
    activityLevel?: string;
  }
): NumericalGoal => {
  const customized = { ...goal };
  
  // Customize based on user data
  switch (goal.id) {
    case 'weight_loss_target':
      // Suggest 5-10% of current weight
      if (userData.weight) {
        customized.targetValue = Math.round(userData.weight * 0.08); // 8% of current weight
      }
      break;
      
    case 'daily_water_intake':
      // Gender-based water intake recommendations
      if (userData.gender === 'female') {
        customized.targetValue = 2700; // 2.7L for females
        console.log('💧 Water goal customized for female: 2.7L');
      } else if (userData.gender === 'male') {
        customized.targetValue = 3700; // 3.7L for males
        console.log('💧 Water goal customized for male: 3.7L');
      } else {
        // Default to 3L for other/unspecified gender
        customized.targetValue = 3000;
        console.log('💧 Water goal using default: 3L (gender:', userData.gender, ')');
      }
      break;
      
    case 'protein_intake':
      // 1.6-2.2g per kg for muscle building
      if (userData.weight) {
        customized.targetValue = Math.round(userData.weight * 1.8);
      }
      break;
      
    case 'calorie_deficit':
      // Adjust based on activity level
      if (userData.activityLevel === 'very_active') {
        customized.targetValue = 750;
      } else if (userData.activityLevel === 'active') {
        customized.targetValue = 600;
      } else {
        customized.targetValue = 500;
      }
      break;
  }
  
  return customized;
};
