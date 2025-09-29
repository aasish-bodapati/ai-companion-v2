/**
 * Body Type Goals Service
 * Provides body type goals with hardcoded logic based on user attributes
 */

export interface UserAttributes {
  age: number;
  height: number; // cm
  weight: number; // kg
  gender: 'male' | 'female' | 'other';
  activityLevel: 'sedentary' | 'light' | 'moderate' | 'active' | 'very_active';
}

export interface BodyTypeGoal {
  id: string;
  name: string;
  description: string;
  category: 'body_type';
  icon: string;
  color: string;
  targetBMI: number;
  targetBodyFat?: number;
  createdBy: 'system' | 'user';
  targetAttributes: {
    targetWeight: number;
    weightChange: number;
    waterGoal: number; // ml per day
    calorieTarget: number;
    proteinTarget: number; // g per day
    workoutFrequency: number; // days per week
    cardioMinutes: number; // minutes per week
    timeline: number; // weeks to reach goal
  };
}

export interface BodyTypeCalculation {
  bodyType: BodyTypeGoal;
  currentBMI: number;
  currentBodyFat?: number;
  currentMuscleMass?: number;
  targetBodyFat?: number;
  targetMuscleMass?: number;
  isRealistic: boolean;
  difficulty: 'easy' | 'moderate' | 'hard' | 'extreme';
  recommendations: string[];
}

// Body Type Goals Database
export const BODY_TYPE_GOALS: BodyTypeGoal[] = [
  {
    id: 'athletic',
    name: 'Athletic',
    description: 'Lean, defined physique with excellent conditioning',
    category: 'body_type',
    icon: 'leaf-outline',
    color: '#10b981',
    targetBMI: 20.5,
    targetBodyFat: 10, // Will be adjusted for gender
    createdBy: 'system',
    targetAttributes: {
      targetWeight: 0, // Will be calculated based on height and targetBMI
      weightChange: 0, // Will be calculated
      waterGoal: 3000, // 3L per day for athletic performance
      calorieTarget: 0, // Will be calculated based on user data
      proteinTarget: 1.6, // 1.6g per kg body weight
      workoutFrequency: 5, // 5 days per week
      cardioMinutes: 180, // 3 hours per week
      timeline: 16, // 16 weeks to achieve
    },
  },
  {
    id: 'balanced',
    name: 'Balanced',
    description: 'Well-proportioned build with optimal strength and endurance',
    category: 'body_type',
    icon: 'fitness-outline',
    color: '#3b82f6',
    targetBMI: 22.5,
    targetBodyFat: 14, // Will be adjusted for gender
    createdBy: 'system',
    targetAttributes: {
      targetWeight: 0, // Will be calculated
      weightChange: 0, // Will be calculated
      waterGoal: 2500, // 2.5L per day
      calorieTarget: 0, // Will be calculated
      proteinTarget: 1.2, // 1.2g per kg body weight
      workoutFrequency: 4, // 4 days per week
      cardioMinutes: 150, // 2.5 hours per week
      timeline: 20, // 20 weeks to achieve
    },
  },
  {
    id: 'powerful',
    name: 'Powerful',
    description: 'Strong, muscular build with impressive definition',
    category: 'body_type',
    icon: 'barbell-outline',
    color: '#f59e0b',
    targetBMI: 24.5,
    targetBodyFat: 12, // Will be adjusted for gender
    createdBy: 'system',
    targetAttributes: {
      targetWeight: 0, // Will be calculated
      weightChange: 0, // Will be calculated
      waterGoal: 3500, // 3.5L per day for muscle building
      calorieTarget: 0, // Will be calculated
      proteinTarget: 2.0, // 2.0g per kg body weight for muscle building
      workoutFrequency: 6, // 6 days per week
      cardioMinutes: 120, // 2 hours per week
      timeline: 24, // 24 weeks to achieve
    },
  },
  {
    id: 'elite',
    name: 'Elite',
    description: 'Maximum muscle development and peak physical condition',
    category: 'body_type',
    icon: 'shield-outline',
    color: '#ef4444',
    targetBMI: 27.0,
    targetBodyFat: 13, // Will be adjusted for gender
    createdBy: 'system',
    targetAttributes: {
      targetWeight: 0, // Will be calculated
      weightChange: 0, // Will be calculated
      waterGoal: 4000, // 4L per day for elite performance
      calorieTarget: 0, // Will be calculated
      proteinTarget: 2.5, // 2.5g per kg body weight for elite muscle building
      workoutFrequency: 7, // 7 days per week
      cardioMinutes: 90, // 1.5 hours per week
      timeline: 32, // 32 weeks to achieve
    },
  },
];

// Helper function to calculate BMI
export function calculateBMI(height: number, weight: number): number {
  const heightInMeters = height / 100;
  return weight / (heightInMeters * heightInMeters);
}

// Helper function to estimate body fat percentage (simplified)
export function estimateBodyFat(bmi: number, age: number, gender: 'male' | 'female' | 'other'): number {
  // Simplified body fat estimation based on BMI, age, and gender
  let baseBodyFat = 0;
  
  if (gender === 'male') {
    baseBodyFat = 1.20 * bmi + 0.23 * age - 16.2;
  } else if (gender === 'female') {
    baseBodyFat = 1.20 * bmi + 0.23 * age - 5.4;
  } else {
    baseBodyFat = 1.20 * bmi + 0.23 * age - 10.8; // Average of male/female
  }
  
  return Math.max(3, Math.min(35, baseBodyFat)); // Clamp between 3% and 35%
}

// Calculate water goal based on gender and activity level
export function calculateWaterGoal(gender: 'male' | 'female' | 'other', activityLevel: string): number {
  // Fixed water goals based only on gender
  if (gender === 'male') {
    return 3700; // 3.7L
  } else if (gender === 'female') {
    return 2700; // 2.7L
  } else {
    return 3200; // 3.2L average for other
  }
}

// Calculate calorie target based on user attributes and goal
export function calculateCalorieTarget(
  userData: UserAttributes,
  targetWeight: number,
  isWeightLoss: boolean
): number {
  // Base metabolic rate (simplified Harris-Benedict equation)
  let bmr = 0;
  if (userData.gender === 'male') {
    bmr = 88.362 + (13.397 * userData.weight) + (4.799 * userData.height) - (5.677 * userData.age);
  } else if (userData.gender === 'female') {
    bmr = 447.593 + (9.247 * userData.weight) + (3.098 * userData.height) - (4.330 * userData.age);
  } else {
    bmr = (88.362 + 447.593) / 2 + (13.397 + 9.247) / 2 * userData.weight + (4.799 + 3.098) / 2 * userData.height - (5.677 + 4.330) / 2 * userData.age;
  }
  
  // Activity level multipliers
  const activityMultipliers = {
    sedentary: 1.2,
    light: 1.375,
    moderate: 1.55,
    active: 1.725,
    very_active: 1.9,
  };
  
  const tdee = bmr * (activityMultipliers[userData.activityLevel] || 1.55);
  
  if (isWeightLoss) {
    // Create calorie deficit
    const weightChange = targetWeight - userData.weight;
    const weeklyDeficit = Math.abs(weightChange) * 7700; // 7700 cal per kg
    const dailyDeficit = weeklyDeficit / 7;
    return Math.round(tdee - dailyDeficit);
  } else {
    // Create calorie surplus for weight gain
    const weightChange = targetWeight - userData.weight;
    const weeklySurplus = Math.abs(weightChange) * 7700;
    const dailySurplus = weeklySurplus / 7;
    return Math.round(tdee + dailySurplus);
  }
}

// Calculate protein target based on weight and goal
export function calculateProteinTarget(targetWeight: number, proteinPerKg: number): number {
  return Math.round(targetWeight * proteinPerKg);
}

/**
 * Calculate estimated body fat percentage using BMI and age
 * This is a simplified estimation - in real apps, you'd use more accurate methods
 */
export function calculateBodyFatPercentage(
  bmi: number,
  age: number,
  gender: 'male' | 'female' | 'other'
): number {
  // Simplified body fat estimation based on BMI, age, and gender
  let baseFat = 0;
  
  if (gender === 'male') {
    baseFat = (1.20 * bmi) + (0.23 * age) - 16.2;
  } else if (gender === 'female') {
    baseFat = (1.20 * bmi) + (0.23 * age) - 5.4;
  } else {
    // Average of male and female
    baseFat = (1.20 * bmi) + (0.23 * age) - 10.8;
  }
  
  // Clamp between reasonable values
  return Math.max(3, Math.min(50, Math.round(baseFat * 10) / 10));
}

/**
 * Calculate estimated muscle mass in kg
 */
export function calculateMuscleMass(
  weight: number,
  bodyFatPercentage: number
): number {
  const fatMass = weight * (bodyFatPercentage / 100);
  const leanBodyMass = weight - fatMass;
  // Muscle mass is approximately 50% of lean body mass
  const muscleMass = leanBodyMass * 0.5;
  return Math.round(muscleMass * 10) / 10;
}

// Main function to calculate body type goals
export function calculateBodyTypeGoal(
  userData: UserAttributes,
  bodyTypeId: string
): BodyTypeCalculation {
  const bodyType = BODY_TYPE_GOALS.find(bt => bt.id === bodyTypeId);
  if (!bodyType) {
    throw new Error(`Body type ${bodyTypeId} not found`);
  }
  
  const currentBMI = calculateBMI(userData.height, userData.weight);
  const currentBodyFat = calculateBodyFatPercentage(currentBMI, userData.age, userData.gender);
  const currentMuscleMass = calculateMuscleMass(userData.weight, currentBodyFat);
  
  // Calculate target weight based on target BMI
  const targetWeight = Math.round((userData.height / 100) ** 2 * bodyType.targetBMI);
  const weightChange = targetWeight - userData.weight;
  
  // Calculate target body fat and muscle mass
  const targetBodyFat = bodyType.targetBodyFat;
  const targetMuscleMass = targetBodyFat ? 
    calculateMuscleMass(targetWeight, targetBodyFat) : undefined;
  
  // Calculate all targets
  const waterGoal = calculateWaterGoal(userData.gender, userData.activityLevel);
  const isWeightLoss = bodyType.category === 'weight_loss';
  const calorieTarget = calculateCalorieTarget(userData, targetWeight, isWeightLoss);
  const proteinTarget = calculateProteinTarget(targetWeight, bodyType.targetAttributes.proteinTarget);
  
  // Determine if goal is realistic
  const weightChangePerWeek = Math.abs(weightChange) / bodyType.timeline;
  const isRealistic = weightChangePerWeek <= 1.0; // Max 1kg per week change
  
  // Determine difficulty
  let difficulty: 'easy' | 'moderate' | 'hard' | 'extreme' = 'moderate';
  if (Math.abs(weightChange) < 5) {
    difficulty = 'easy';
  } else if (Math.abs(weightChange) < 15) {
    difficulty = 'moderate';
  } else if (Math.abs(weightChange) < 25) {
    difficulty = 'hard';
  } else {
    difficulty = 'extreme';
  }
  
  // Generate recommendations
  const recommendations: string[] = [];
  if (!isRealistic) {
    recommendations.push('Consider a longer timeline for sustainable results');
  }
  if (difficulty === 'hard' || difficulty === 'extreme') {
    recommendations.push('Consult with a healthcare professional before starting');
  }
  if (bodyType.category === 'muscle_building' && currentBodyFat > 20) {
    recommendations.push('Consider a cutting phase first to reduce body fat');
  }
  if (bodyType.category === 'weight_loss' && currentBMI < 20) {
    recommendations.push('Your current weight is already quite low - consider maintenance instead');
  }
  
  // Create the calculated body type goal
  const calculatedBodyType: BodyTypeGoal = {
    ...bodyType,
    targetAttributes: {
      ...bodyType.targetAttributes,
      targetWeight,
      weightChange,
      waterGoal,
      calorieTarget,
      proteinTarget,
    },
  };
  
  return {
    bodyType: calculatedBodyType,
    currentBMI,
    currentBodyFat,
    currentMuscleMass,
    targetBodyFat,
    targetMuscleMass,
    isRealistic,
    difficulty,
    recommendations,
  };
}

// Get available body types for a user based on their current state
export function getAvailableBodyTypes(userData: UserAttributes): BodyTypeGoal[] {
  // All body types are available to everyone - let them choose what they want
  return BODY_TYPE_GOALS;
}

// Get body type categories
export function getBodyTypeCategories() {
  return [
    { id: 'body_type', title: 'Body Type', icon: 'body-outline', color: '#3b82f6' },
  ];
}
