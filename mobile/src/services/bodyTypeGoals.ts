/**
 * Body Type Goals Service
 * Provides body type goals fetched from the backend API
 */

import { bodyTypeGoalsApiService, BodyTypeGoal as ApiBodyTypeGoal } from './bodyTypeGoalsApi';

export interface UserAttributes {
  age: number;
  height: number; // cm
  weight: number; // kg
  gender: 'male' | 'female' | 'other';
  activityLevel: 'sedentary' | 'light' | 'moderate' | 'active' | 'very_active';
  ffm?: number; // Fat-Free Mass (kg)
  smm?: number; // Skeletal Muscle Mass (kg)
  bodyFat?: number; // Body Fat Percentage
}

export interface RangeValue {
  min: number;
  max: number;
  recommended: number;
  unit: string;
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
    // BMI ranges
    targetBMIRange: RangeValue;
    
    // Gender-specific body fat ranges
    bodyFatRangeMen: RangeValue;
    bodyFatRangeWomen: RangeValue;
    
    // Gender-specific FFMI ranges
    ffmiRangeMen: RangeValue;
    ffmiRangeWomen: RangeValue;
    
    // SMM level
    smmLevel: string;
    
    // Gender-specific protein requirements
    proteinPerKgMen: RangeValue;
    proteinPerKgWomen: RangeValue;
    
    // Calorie targets
    calorieTarget: string;
    
    // Workout focus
    workoutFocus: string;
    workoutFrequency: RangeValue;
    cardioMinutes: RangeValue;
    strengthSessions: RangeValue;
    
    // Additional metrics
    waterGoal: RangeValue;
    sleepDuration: RangeValue;
    dailySteps: RangeValue;
    recoveryDays: RangeValue;
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

// Helper function to convert API body type goal to frontend format
function convertApiBodyTypeGoal(apiGoal: ApiBodyTypeGoal): BodyTypeGoal {
  if (!apiGoal.target_attributes) {
    // Silent error handling - no console logging to prevent Expo Go notifications
    throw new Error(`Body type goal ${apiGoal.id} is missing target_attributes`);
  }
  
  // Parse the JSON target_attributes if it's a string
  let targetAttributes;
  if (typeof apiGoal.target_attributes === 'string') {
    try {
      targetAttributes = JSON.parse(apiGoal.target_attributes);
    } catch (e) {
      // Silent error handling - no console logging to prevent Expo Go notifications
      throw new Error(`Invalid target_attributes format for goal ${apiGoal.id}`);
    }
  } else {
    targetAttributes = apiGoal.target_attributes;
  }
  
  // Helper function to extract recommended value from range or return the value as-is
  const getRecommendedValue = (value: any): number => {
    if (value && typeof value === 'object' && 'recommended' in value) {
      return value.recommended;
    }
    return value || 0;
  };
  
  return {
    id: apiGoal.id,
    name: apiGoal.name,
    description: apiGoal.description,
    category: apiGoal.category as 'body_type',
    icon: apiGoal.icon,
    color: apiGoal.color,
    targetBMI: apiGoal.target_bmi,
    targetBodyFat: apiGoal.target_body_fat,
    createdBy: apiGoal.created_by as 'system' | 'user',
    targetAttributes: {
      // BMI ranges
      targetBMIRange: targetAttributes.target_bmi_range || { min: 0, max: 0, recommended: 0, unit: 'kg/m²' },
      
      // Gender-specific body fat ranges
      bodyFatRangeMen: targetAttributes.body_fat_range_men || { min: 0, max: 0, recommended: 0, unit: '%' },
      bodyFatRangeWomen: targetAttributes.body_fat_range_women || { min: 0, max: 0, recommended: 0, unit: '%' },
      
      // Gender-specific FFMI ranges
      ffmiRangeMen: targetAttributes.ffmi_range_men || { min: 0, max: 0, recommended: 0, unit: 'kg/m²' },
      ffmiRangeWomen: targetAttributes.ffmi_range_women || { min: 0, max: 0, recommended: 0, unit: 'kg/m²' },
      
      // SMM level
      smmLevel: targetAttributes.smm_level || 'Moderate',
      
      // Gender-specific protein requirements
      proteinPerKgMen: targetAttributes.protein_per_kg_men || { min: 0, max: 0, recommended: 0, unit: 'g/kg' },
      proteinPerKgWomen: targetAttributes.protein_per_kg_women || { min: 0, max: 0, recommended: 0, unit: 'g/kg' },
      
      // Calorie targets
      calorieTarget: targetAttributes.calorie_target || 'Maintenance',
      
      // Workout focus
      workoutFocus: targetAttributes.workout_focus || 'General fitness',
      workoutFrequency: targetAttributes.workout_frequency || { min: 0, max: 0, recommended: 0, unit: 'days/week' },
      cardioMinutes: targetAttributes.cardio_minutes || { min: 0, max: 0, recommended: 0, unit: 'minutes/week' },
      strengthSessions: targetAttributes.strength_sessions || { min: 0, max: 0, recommended: 0, unit: 'sessions/week' },
      
      // Additional metrics
      waterGoal: targetAttributes.water_goal || { min: 0, max: 0, recommended: 0, unit: 'L/day' },
      sleepDuration: targetAttributes.sleep_duration || { min: 0, max: 0, recommended: 0, unit: 'hours/night' },
      dailySteps: targetAttributes.daily_steps || { min: 0, max: 0, recommended: 0, unit: 'steps/day' },
      recoveryDays: targetAttributes.recovery_days || { min: 0, max: 0, recommended: 0, unit: 'days/week' },
    },
  };
}

// Helper function to calculate BMI
export function calculateBMI(height: number, weight: number): number {
  const heightInMeters = height / 100;
  return weight / (heightInMeters * heightInMeters);
}

// Helper function to calculate FFMI
export function calculateFFMI(height: number, ffm: number): number {
  const heightInMeters = height / 100;
  return ffm / (heightInMeters * heightInMeters);
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

// Legacy protein target calculation (kept for backward compatibility)
export function calculateLegacyProteinTarget(targetWeight: number, proteinPerKg: number): number {
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

// Helper function to calculate protein target using comprehensive formula
function calculateProteinTarget(weight: number, ffm?: number, smm?: number, bodyFat?: number): number {
  // Comprehensive protein calculation based on available metrics
  // Case 1: All optional metrics are provided (FFM, SMM, BF%)
  if (ffm && smm && bodyFat) {
    const ffmi = calculateFFMI(175, ffm); // Default height for FFMI calculation
    const proteinTarget = ffm * 1.6 * (1 + 0.3 * smm / 30 + 0.1 * (ffmi - 20));
    return Math.round(proteinTarget * 10) / 10;
  }
  
  // Case 2: FFM provided, SMM and FFMI not provided
  if (ffm && !smm && !bodyFat) {
    const proteinTarget = ffm * 1.8;
    return Math.round(proteinTarget * 10) / 10;
  }
  
  // Case 3: SMM and BF% provided, FFM not provided
  if (smm && bodyFat && !ffm) {
    const estimatedFFM = weight * (1 - bodyFat / 100);
    const proteinTarget = estimatedFFM * 1.6 * (1 + 0.3 * smm / 30);
    return Math.round(proteinTarget * 10) / 10;
  }
  
  // Case 4: Only BF% provided, SMM and FFM not provided
  if (bodyFat && !smm && !ffm) {
    const estimatedFFM = weight * (1 - bodyFat / 100);
    const proteinTarget = estimatedFFM * 1.8;
    return Math.round(proteinTarget * 10) / 10;
  }
  
  // Case 5: Only SMM provided, FFM & BF% not provided
  if (smm && !ffm && !bodyFat) {
    const estimatedFFM = smm * 2; // Skeletal muscle is ~50% of FFM
    const proteinTarget = estimatedFFM * 1.6 * (1 + 0.3 * smm / 30);
    return Math.round(proteinTarget * 10) / 10;
  }
  
  // Case 6: None of the optional metrics provided (only height & weight)
  const proteinTarget = weight * 1.6;
  return Math.round(proteinTarget * 10) / 10;
}

// Main function to calculate body type goals
export async function calculateBodyTypeGoal(
  userData: UserAttributes,
  bodyTypeId: string
): Promise<BodyTypeCalculation> {
  const bodyType = await getBodyTypeGoalById(bodyTypeId);
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
  
  // Calculate protein target using comprehensive formula
  const proteinTarget = calculateProteinTarget(
    userData.weight, 
    userData.ffm, 
    userData.smm, 
    userData.bodyFat
  );
  
  // Determine if goal is realistic
  const timeline = bodyType.targetAttributes.timeline || 20; // Default to 20 weeks
  const weightChangePerWeek = Math.abs(weightChange) / timeline;
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
  if (currentBodyFat > 20) {
    recommendations.push('Consider a cutting phase first to reduce body fat');
  }
  if (currentBMI < 20) {
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
export async function getAvailableBodyTypes(userData: UserAttributes): Promise<BodyTypeGoal[]> {
  try {
    const apiGoals = await bodyTypeGoalsApiService.getBodyTypeGoals();
    return apiGoals.map(convertApiBodyTypeGoal);
  } catch (error) {
    // Silent error handling - no console logging to prevent Expo Go notifications
    return []; // Return empty array on error
  }
}

// Get body type categories
export function getBodyTypeCategories() {
  return [
    { id: 'body_type', title: 'Body Type', icon: 'body-outline', color: '#3b82f6' },
  ];
}

// Get a specific body type goal by ID
export async function getBodyTypeGoalById(id: string): Promise<BodyTypeGoal | null> {
  try {
    const apiGoal = await bodyTypeGoalsApiService.getBodyTypeGoalById(id);
    return apiGoal ? convertApiBodyTypeGoal(apiGoal) : null;
  } catch (error) {
    // Silent error handling - no console logging to prevent Expo Go notifications
    return null;
  }
}
