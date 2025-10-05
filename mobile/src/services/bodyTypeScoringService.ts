/**
 * Body Type Scoring Service
 * Implements comprehensive point-based scoring system for body type goals
 * Based on the detailed scoring tables provided
 */

import { BodyTypeGoal, UserAttributes } from './bodyTypeGoals';

export interface ScoringResult {
  score: number; // Total points earned
  maxScore: number; // Maximum possible points
  percentage: number; // 0 to 100
  feedback: string;
  suggestions: string[];
  alignment: 'closer' | 'neutral' | 'farther';
}

export interface WorkoutLog {
  type: 'cardio' | 'mobility' | 'yoga' | 'light_strength' | 'moderate_strength' | 'heavy_strength' | 'hypertrophy' | 'compound_lifts' | 'functional' | 'skipped';
  duration?: number; // minutes
  intensity?: 'low' | 'moderate' | 'high';
  exercises?: string[];
  planned?: boolean; // Was this a planned workout day?
}

export interface BodyTypeNutritionLog {
  proteinPerKg: number;
  calories: number;
  tdee: number; // Total Daily Energy Expenditure
  isJunkProcessed: boolean;
  mealType?: 'breakfast' | 'lunch' | 'dinner' | 'snack';
}

export interface DailyLog {
  workouts: WorkoutLog[];
  nutrition: BodyTypeNutritionLog[];
  waterIntake: number; // L
  steps: number;
  sleepHours: number;
  progressiveOverload?: boolean; // Did they log progressive overload?
}

export interface WeeklyLog {
  days: DailyLog[];
  totalWorkouts: number;
  missedSessions: number;
  consistencyStreak: number; // days
}

export class BodyTypeScoringService {
  private bodyTypeGoal: BodyTypeGoal;
  private userAttributes: UserAttributes;

  constructor(bodyTypeGoal: BodyTypeGoal, userAttributes: UserAttributes) {
    this.bodyTypeGoal = bodyTypeGoal;
    this.userAttributes = userAttributes;
  }

  /**
   * Score a single workout log
   */
  scoreWorkout(workout: WorkoutLog): number {
    const goalType = this.getGoalType();
    
    switch (goalType) {
      case 'sleek_graceful':
        return this.scoreWorkoutSleekGraceful(workout);
      case 'strong_steady':
        return this.scoreWorkoutStrongSteady(workout);
      case 'big_bold':
        return this.scoreWorkoutBigBold(workout);
      default:
        return 0;
    }
  }

  /**
   * Score a single nutrition log
   */
  scoreNutrition(nutrition: BodyTypeNutritionLog): number {
    const goalType = this.getGoalType();
    
    switch (goalType) {
      case 'sleek_graceful':
        return this.scoreNutritionSleekGraceful(nutrition);
      case 'strong_steady':
        return this.scoreNutritionStrongSteady(nutrition);
      case 'big_bold':
        return this.scoreNutritionBigBold(nutrition);
      default:
        return 0;
    }
  }

  /**
   * Score daily progress
   */
  scoreDailyProgress(dailyLog: DailyLog): ScoringResult {
    let totalScore = 0;
    const suggestions: string[] = [];
    const maxPossibleScore = this.getMaxDailyScore();

    // Score workouts
    for (const workout of dailyLog.workouts) {
      totalScore += this.scoreWorkout(workout);
    }

    // Score nutrition
    for (const nutrition of dailyLog.nutrition) {
      totalScore += this.scoreNutrition(nutrition);
    }

    // Score water intake
    totalScore += this.scoreWater(dailyLog.waterIntake);

    // Score steps
    totalScore += this.scoreSteps(dailyLog.steps);

    // Score sleep
    totalScore += this.scoreSleep(dailyLog.sleepHours);

    const percentage = maxPossibleScore > 0 ? (totalScore / maxPossibleScore) * 100 : 0;
    const alignment = this.getAlignment(percentage);

    return {
      score: totalScore,
      maxScore: maxPossibleScore,
      percentage: Math.round(percentage),
      feedback: this.getDailyFeedback(percentage, alignment),
      suggestions: this.getDailySuggestions(dailyLog, alignment),
      alignment
    };
  }

  /**
   * Score weekly progress
   */
  scoreWeeklyProgress(weeklyLog: WeeklyLog): ScoringResult {
    let totalScore = 0;
    const suggestions: string[] = [];
    const maxPossibleScore = this.getMaxWeeklyScore();

    // Score each day
    for (const dailyLog of weeklyLog.days) {
      const dailyResult = this.scoreDailyProgress(dailyLog);
      totalScore += dailyResult.score;
    }

    // Add consistency bonuses
    totalScore += this.scoreConsistency(weeklyLog);

    const percentage = maxPossibleScore > 0 ? (totalScore / maxPossibleScore) * 100 : 0;
    const alignment = this.getAlignment(percentage);

    return {
      score: totalScore,
      maxScore: maxPossibleScore,
      percentage: Math.round(percentage),
      feedback: this.getWeeklyFeedback(percentage, alignment),
      suggestions: this.getWeeklySuggestions(weeklyLog, alignment),
      alignment
    };
  }

  // Private scoring methods for each body type

  private scoreWorkoutSleekGraceful(workout: WorkoutLog): number {
    switch (workout.type) {
      case 'cardio':
      case 'mobility':
      case 'yoga':
        return 10;
      case 'light_strength':
      case 'moderate_strength':
        return 5;
      case 'heavy_strength':
      case 'hypertrophy':
        return -5;
      case 'skipped':
        return workout.planned ? -8 : 0;
      default:
        return 0;
    }
  }

  private scoreWorkoutStrongSteady(workout: WorkoutLog): number {
    switch (workout.type) {
      case 'compound_lifts':
      case 'functional':
      case 'moderate_strength':
        return 12;
      case 'cardio':
        return 5;
      case 'light_strength':
        return 3;
      case 'heavy_strength':
        return 8;
      case 'skipped':
        return workout.planned ? -10 : 0;
      default:
        return 0;
    }
  }

  private scoreWorkoutBigBold(workout: WorkoutLog): number {
    switch (workout.type) {
      case 'heavy_strength':
      case 'hypertrophy':
        return 15;
      case 'compound_lifts':
        return 12;
      case 'cardio':
        return 3;
      case 'skipped':
        return workout.planned ? -12 : 0;
      default:
        return 0;
    }
  }

  private scoreNutritionSleekGraceful(nutrition: BodyTypeNutritionLog): number {
    let score = 0;

    // Protein scoring (1.2-1.6 g/kg)
    if (nutrition.proteinPerKg >= 1.2 && nutrition.proteinPerKg <= 1.6) {
      score += 7;
    } else if (nutrition.proteinPerKg < 1.2) {
      score += Math.max(0, 7 - (1.2 - nutrition.proteinPerKg) * 10);
    } else {
      score += Math.max(0, 7 - (nutrition.proteinPerKg - 1.6) * 5);
    }

    // Calorie scoring (deficit/maintenance)
    const calorieRatio = nutrition.calories / nutrition.tdee;
    if (calorieRatio >= 0.8 && calorieRatio <= 1.0) {
      score += 10;
    } else if (calorieRatio > 1.2) {
      score -= 10; // Overeating penalty
    } else if (calorieRatio < 0.7) {
      score -= 5; // Too much deficit
    }

    // Junk food penalty
    if (nutrition.isJunkProcessed) {
      score -= 5;
    }

    return score;
  }

  private scoreNutritionStrongSteady(nutrition: BodyTypeNutritionLog): number {
    let score = 0;

    // Protein scoring (1.6-2.0 g/kg)
    if (nutrition.proteinPerKg >= 1.6 && nutrition.proteinPerKg <= 2.0) {
      score += 10;
    } else if (nutrition.proteinPerKg < 1.6) {
      score += Math.max(0, 10 - (1.6 - nutrition.proteinPerKg) * 8);
    } else {
      score += Math.max(0, 10 - (nutrition.proteinPerKg - 2.0) * 5);
    }

    // Calorie scoring (maintenance/slight surplus)
    const calorieRatio = nutrition.calories / nutrition.tdee;
    if (calorieRatio >= 0.9 && calorieRatio <= 1.1) {
      score += 8;
    } else if (calorieRatio < 0.8) {
      score -= 10; // Severe deficit penalty
    } else if (calorieRatio > 1.3) {
      score -= 5; // Too much surplus
    }

    // Junk food penalty
    if (nutrition.isJunkProcessed) {
      score -= 5;
    }

    return score;
  }

  private scoreNutritionBigBold(nutrition: BodyTypeNutritionLog): number {
    let score = 0;

    // Protein scoring (1.8-2.4 g/kg)
    if (nutrition.proteinPerKg >= 1.8 && nutrition.proteinPerKg <= 2.4) {
      score += 12;
    } else if (nutrition.proteinPerKg < 1.8) {
      score += Math.max(0, 12 - (1.8 - nutrition.proteinPerKg) * 8);
    } else {
      score += Math.max(0, 12 - (nutrition.proteinPerKg - 2.4) * 5);
    }

    // Calorie scoring (slight-moderate surplus)
    const calorieRatio = nutrition.calories / nutrition.tdee;
    if (calorieRatio >= 1.05 && calorieRatio <= 1.2) {
      score += 10;
    } else if (calorieRatio < 1.0) {
      score -= 15; // Deficit penalty
    } else if (calorieRatio > 1.4) {
      score -= 5; // Too much surplus
    }

    // Junk food penalty (more severe for Big & Bold)
    if (nutrition.isJunkProcessed) {
      score -= 7;
    }

    return score;
  }

  private scoreWater(waterIntake: number): number {
    const goalType = this.getGoalType();
    let targetWater = 3.0; // Default 3L

    if (goalType === 'sleek_graceful') {
      targetWater = this.userAttributes.gender === 'female' ? 2.7 : 3.2;
    } else if (goalType === 'strong_steady') {
      targetWater = this.userAttributes.gender === 'female' ? 2.8 : 3.5;
    } else if (goalType === 'big_bold') {
      targetWater = this.userAttributes.gender === 'female' ? 3.0 : 3.8;
    }

    const ratio = waterIntake / targetWater;
    if (ratio >= 0.9 && ratio <= 1.1) {
      return 5; // Perfect hydration
    } else if (ratio >= 0.7 && ratio <= 1.3) {
      return 3; // Good hydration
    } else {
      return 0; // Poor hydration
    }
  }

  private scoreSteps(steps: number): number {
    const goalType = this.getGoalType();
    let targetSteps = 8000; // Default

    if (goalType === 'sleek_graceful') {
      targetSteps = 10000;
    } else if (goalType === 'strong_steady') {
      targetSteps = 8500;
    } else if (goalType === 'big_bold') {
      targetSteps = 7000;
    }

    const ratio = steps / targetSteps;
    if (ratio >= 0.9 && ratio <= 1.1) {
      return 3; // Perfect steps
    } else if (ratio >= 0.7 && ratio <= 1.3) {
      return 2; // Good steps
    } else {
      return 0; // Poor steps
    }
  }

  private scoreSleep(sleepHours: number): number {
    const goalType = this.getGoalType();
    let targetSleep = 8; // Default

    if (goalType === 'sleek_graceful') {
      targetSleep = 8.5;
    } else if (goalType === 'strong_steady') {
      targetSleep = 8;
    } else if (goalType === 'big_bold') {
      targetSleep = 7.5;
    }

    const ratio = sleepHours / targetSleep;
    if (ratio >= 0.9 && ratio <= 1.1) {
      return 5; // Perfect sleep
    } else if (ratio >= 0.8 && ratio <= 1.2) {
      return 3; // Good sleep
    } else {
      return 0; // Poor sleep
    }
  }

  private scoreConsistency(weeklyLog: WeeklyLog): number {
    let score = 0;
    const goalType = this.getGoalType();

    // Consistency streak bonus
    if (goalType === 'sleek_graceful' || goalType === 'strong_steady') {
      if (weeklyLog.consistencyStreak >= 4 && weeklyLog.consistencyStreak <= 5) {
        score += 15;
      }
    } else if (goalType === 'big_bold') {
      if (weeklyLog.consistencyStreak >= 5 && weeklyLog.consistencyStreak <= 6) {
        score += 20;
      }
    }

    // Progressive overload bonus
    const progressiveOverloadCount = weeklyLog.days.filter(day => day.progressiveOverload).length;
    if (goalType === 'strong_steady' && progressiveOverloadCount >= 2) {
      score += 10;
    } else if (goalType === 'big_bold' && progressiveOverloadCount >= 3) {
      score += 15;
    }

    // Missed sessions penalty
    if (weeklyLog.missedSessions >= 2) {
      score -= 10;
    }

    return score;
  }

  private getGoalType(): string {
    const name = this.bodyTypeGoal.name.toLowerCase();
    if (name.includes('sleek') && name.includes('graceful')) return 'sleek_graceful';
    if (name.includes('strong') && name.includes('steady')) return 'strong_steady';
    if (name.includes('big') && name.includes('bold')) return 'big_bold';
    return 'unknown';
  }

  private getMaxDailyScore(): number {
    const goalType = this.getGoalType();
    switch (goalType) {
      case 'sleek_graceful':
        return 50; // 2 workouts (20) + 3 meals (30) + water (5) + steps (3) + sleep (5) = 63 max
      case 'strong_steady':
        return 60; // 2 workouts (24) + 3 meals (36) + water (5) + steps (3) + sleep (5) = 73 max
      case 'big_bold':
        return 70; // 2 workouts (30) + 3 meals (42) + water (5) + steps (3) + sleep (5) = 85 max
      default:
        return 50;
    }
  }

  private getMaxWeeklyScore(): number {
    return this.getMaxDailyScore() * 7 + 50; // Daily scores + consistency bonuses
  }

  private getAlignment(percentage: number): 'closer' | 'neutral' | 'farther' {
    if (percentage >= 70) return 'closer';
    if (percentage >= 40) return 'neutral';
    return 'farther';
  }

  private getDailyFeedback(percentage: number, alignment: string): string {
    if (alignment === 'closer') {
      return `You're ${percentage}% aligned today — keep up the great progress! 💪`;
    } else if (alignment === 'neutral') {
      return `You're ${percentage}% aligned today — some adjustments could help. ⚖️`;
    } else {
      return `You're ${percentage}% aligned today — focus on your body type goals. 📈`;
    }
  }

  private getWeeklyFeedback(percentage: number, alignment: string): string {
    if (alignment === 'closer') {
      return `You're ${percentage}% aligned this week — excellent progress! 🎉`;
    } else if (alignment === 'neutral') {
      return `You're ${percentage}% aligned this week — steady progress. ⚖️`;
    } else {
      return `You're ${percentage}% aligned this week — let's refocus. 📈`;
    }
  }

  private getDailySuggestions(dailyLog: DailyLog, alignment: string): string[] {
    const suggestions: string[] = [];
    
    if (alignment === 'farther') {
      suggestions.push('Focus on your body type goal requirements');
      suggestions.push('Log your workouts and meals consistently');
    }
    
    if (dailyLog.workouts.length === 0) {
      suggestions.push('Add a workout that aligns with your body type goal');
    }
    
    if (dailyLog.nutrition.length === 0) {
      suggestions.push('Log your meals to track nutrition alignment');
    }

    return suggestions.slice(0, 3);
  }

  private getWeeklySuggestions(weeklyLog: WeeklyLog, alignment: string): string[] {
    const suggestions: string[] = [];
    
    if (alignment === 'farther') {
      suggestions.push('Focus on consistency with your body type goal');
      suggestions.push('Review your workout and nutrition patterns');
    }
    
    if (weeklyLog.missedSessions > 2) {
      suggestions.push('Reduce missed workout sessions');
    }
    
    if (weeklyLog.consistencyStreak < 3) {
      suggestions.push('Build a consistent daily routine');
    }

    return suggestions.slice(0, 3);
  }
}

export default BodyTypeScoringService;