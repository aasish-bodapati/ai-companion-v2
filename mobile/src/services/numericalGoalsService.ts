/**
 * Numerical Goals Service
 * Manages numerical goals and connects them to tracking data
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { NumericalGoal } from './goalTemplates';
import { fitnessService, FitnessLog } from './fitnessService';
import { nutritionService, NutritionLog } from './nutritionService';
import { healthService } from './healthService';

export interface GoalProgress {
  goalId: string;
  goalName: string;
  targetValue: number;
  currentValue: number;
  unit: string;
  progressPercentage: number;
  category: string;
  color: string;
  trend: 'up' | 'down' | 'stable';
  lastUpdated: string;
}

export interface GoalAnalytics {
  totalGoals: number;
  completedGoals: number;
  onTrackGoals: number;
  behindGoals: number;
  averageProgress: number;
  topPerformingGoal?: GoalProgress;
  needsAttentionGoal?: GoalProgress;
}

class NumericalGoalsService {
  private goals: NumericalGoal[] = [];
  private readonly STORAGE_KEY = 'user_numerical_goals';

  // Set user's numerical goals
  async setGoals(goals: NumericalGoal[]): Promise<void> {
    try {
      this.goals = goals;
      const jsonValue = JSON.stringify(goals);
      await AsyncStorage.setItem(this.STORAGE_KEY, jsonValue);
      console.log('🎯 Numerical Goals Service: Goals saved to storage:', goals.length);
    } catch (_error) {
      // Silent error handling - no console logging to prevent Expo Go notifications
      throw error;
    }
  }

  // Get current goals
  async getGoals(): Promise<NumericalGoal[]> {
    try {
      // If we already have goals in memory, return them
      if (this.goals.length > 0) {
        return this.goals;
      }
      
      // Otherwise, load from storage
      const jsonValue = await AsyncStorage.getItem(this.STORAGE_KEY);
      if (jsonValue != null) {
        this.goals = JSON.parse(jsonValue);
        console.log('🎯 Numerical Goals Service: Goals loaded from storage:', this.goals.length);
        return this.goals;
      }
      
      console.log('🎯 Numerical Goals Service: No goals found in storage');
      return [];
    } catch (_error) {
      // Silent error handling - no console logging to prevent Expo Go notifications
      return [];
    }
  }

  // Clear all goals
  async clearGoals(): Promise<void> {
    try {
      this.goals = [];
      await AsyncStorage.removeItem(this.STORAGE_KEY);
      console.log('🎯 Numerical Goals Service: Goals cleared from storage');
    } catch (_error) {
      // Silent error handling - no console logging to prevent Expo Go notifications
      throw error;
    }
  }

  // Calculate progress for all goals
  async calculateProgress(): Promise<GoalProgress[]> {
    const progressData: GoalProgress[] = [];

    for (const goal of this.goals) {
      try {
        const progress = await this.calculateGoalProgress(goal);
        progressData.push(progress);
      } catch (_error) {
        // Silent error handling - no console logging to prevent Expo Go notifications
        // Add goal with zero progress if calculation fails
        progressData.push({
          goalId: goal.id,
          goalName: goal.name,
          targetValue: goal.targetValue,
          currentValue: 0,
          unit: goal.unit,
          progressPercentage: 0,
          category: goal.category,
          color: goal.color,
          trend: 'stable',
          lastUpdated: new Date().toISOString(),
        });
      }
    }

    return progressData;
  }

  // Calculate progress for a specific goal
  private async calculateGoalProgress(goal: NumericalGoal): Promise<GoalProgress> {
    let currentValue = 0;
    let trend: 'up' | 'down' | 'stable' = 'stable';

    switch (goal.id) {
      // Fitness Goals
      case 'weight_loss_target':
      case 'muscle_gain_target':
        // These would come from health profile updates
        currentValue = 0; // Placeholder - would integrate with weight tracking
        break;

      case 'weekly_weight_loss':
        // Calculate from recent weight logs
        currentValue = 0; // Placeholder
        break;

      case 'body_fat_percentage':
        // Would come from body composition tracking
        currentValue = 0; // Placeholder
        break;

      case 'calorie_deficit':
        // Calculate from nutrition logs vs estimated burn
        currentValue = await this.calculateCalorieDeficit();
        break;

      case 'protein_intake':
        // Calculate from nutrition logs
        currentValue = await this.calculateDailyProtein();
        break;

      case 'strength_benchmark':
        // Would come from fitness logs
        currentValue = 0; // Placeholder
        break;

      case 'workout_frequency':
        // Calculate from fitness logs
        currentValue = await this.calculateWeeklyWorkouts();
        break;

      // Nutrition Goals
      case 'daily_water_intake':
        // Calculate from water logs
        currentValue = await this.calculateDailyWater();
        break;

      case 'hydration_consistency':
        // Calculate days meeting water goal
        currentValue = await this.calculateHydrationConsistency();
        break;

      case 'vegetable_servings':
        // Calculate from nutrition logs
        currentValue = await this.calculateDailyVegetables();
        break;

      case 'fruit_servings':
        // Calculate from nutrition logs
        currentValue = await this.calculateDailyFruits();
        break;

      case 'processed_food_limit':
        // Calculate from nutrition logs
        currentValue = await this.calculateWeeklyProcessedFood();
        break;

      case 'meal_prep_frequency':
        // Would come from meal prep tracking
        currentValue = 0; // Placeholder
        break;

      // Wellness Goals
      case 'sleep_duration':
        // Would come from sleep tracking
        currentValue = 0; // Placeholder
        break;

      case 'bedtime_consistency':
        // Would come from sleep tracking
        currentValue = 0; // Placeholder
        break;

      case 'sleep_quality_score':
        // Would come from sleep tracking
        currentValue = 0; // Placeholder
        break;

      case 'stress_level':
        // Would come from mood tracking
        currentValue = await this.calculateAverageStressLevel();
        break;

      case 'meditation_minutes':
        // Would come from meditation tracking
        currentValue = 0; // Placeholder
        break;

      case 'breathing_exercises':
        // Would come from wellness tracking
        currentValue = 0; // Placeholder
        break;

      default:
        currentValue = 0;
    }

    const progressPercentage = Math.min((currentValue / goal.targetValue) * 100, 100);
    
    return {
      goalId: goal.id,
      goalName: goal.name,
      targetValue: goal.targetValue,
      currentValue,
      unit: goal.unit,
      progressPercentage,
      category: goal.category,
      color: goal.color,
      trend,
      lastUpdated: new Date().toISOString(),
    };
  }

  // Helper methods to calculate specific metrics
  private async calculateCalorieDeficit(): Promise<number> {
    try {
      // Get today's nutrition logs
      const nutritionLogs = await nutritionService.getNutritionLogs({ 
        period: 'day',
        start_date: new Date().toISOString().split('T')[0],
        end_date: new Date().toISOString().split('T')[0]
      });
      
      // Calculate total calories consumed
      const caloriesConsumed = nutritionLogs.reduce((sum, log) => sum + (log.total_calories || 0), 0);
      
      // Estimate calories burned (simplified - would use more sophisticated calculation)
      const estimatedBurned = 2000; // Base metabolic rate + activity
      
      return Math.max(estimatedBurned - caloriesConsumed, 0);
    } catch (_error) {
      // Silent error handling - no console logging to prevent Expo Go notifications
      return 0;
    }
  }

  private async calculateDailyProtein(): Promise<number> {
    try {
      const nutritionLogs = await nutritionService.getNutritionLogs({ 
        period: 'day',
        start_date: new Date().toISOString().split('T')[0],
        end_date: new Date().toISOString().split('T')[0]
      });
      
      return nutritionLogs.reduce((sum, log) => sum + (log.protein_g || 0), 0);
    } catch (_error) {
      // Silent error handling - no console logging to prevent Expo Go notifications
      return 0;
    }
  }

  private async calculateWeeklyWorkouts(): Promise<number> {
    try {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - 7);
      
      const fitnessLogs = await fitnessService.getFitnessLogs({
        start_date: startDate.toISOString().split('T')[0],
        end_date: new Date().toISOString().split('T')[0]
      });
      
      // Count unique workout days
      const workoutDays = new Set(
        fitnessLogs.map(log => log.activity_date?.split('T')[0])
      );
      
      return workoutDays.size;
    } catch (_error) {
      // Silent error handling - no console logging to prevent Expo Go notifications
      return 0;
    }
  }

  private async calculateDailyWater(): Promise<number> {
    try {
      const waterLogs = await healthService.getWaterLogs(1);
      return waterLogs.reduce((sum, log) => sum + (log.amount_ml || 0), 0);
    } catch (_error) {
      // Silent error handling - no console logging to prevent Expo Go notifications
      return 0;
    }
  }

  private async calculateHydrationConsistency(): Promise<number> {
    try {
      const waterLogs = await healthService.getWaterLogs(7);
      // Use a default target of 3L, but this should ideally be dynamic based on user's goal
      const dailyTarget = 3000; // ml
      
      // Group by day and check if each day meets target
      const dailyTotals = waterLogs.reduce((acc, log) => {
        const date = log.logged_at?.split('T')[0];
        if (date) {
          acc[date] = (acc[date] || 0) + (log.amount_ml || 0);
        }
        return acc;
      }, {} as Record<string, number>);
      
      const daysMeetingGoal = Object.values(dailyTotals).filter((total: any) => total >= dailyTarget).length;
      return daysMeetingGoal;
    } catch (_error) {
      // Silent error handling - no console logging to prevent Expo Go notifications
      return 0;
    }
  }

  private async calculateDailyVegetables(): Promise<number> {
    try {
      const nutritionLogs = await nutritionService.getNutritionLogs({ 
        period: 'day',
        start_date: new Date().toISOString().split('T')[0],
        end_date: new Date().toISOString().split('T')[0]
      });
      
      // This is simplified - would need more sophisticated food categorization
      return nutritionLogs.filter(log => 
        log.meal_name?.toLowerCase().includes('vegetable') ||
        log.meal_name?.toLowerCase().includes('salad') ||
        log.meal_name?.toLowerCase().includes('broccoli')
      ).length;
    } catch (_error) {
      // Silent error handling - no console logging to prevent Expo Go notifications
      return 0;
    }
  }

  private async calculateDailyFruits(): Promise<number> {
    try {
      const nutritionLogs = await nutritionService.getNutritionLogs({ 
        period: 'day',
        start_date: new Date().toISOString().split('T')[0],
        end_date: new Date().toISOString().split('T')[0]
      });
      
      // This is simplified - would need more sophisticated food categorization
      return nutritionLogs.filter(log => 
        log.meal_name?.toLowerCase().includes('fruit') ||
        log.meal_name?.toLowerCase().includes('apple') ||
        log.meal_name?.toLowerCase().includes('banana')
      ).length;
    } catch (_error) {
      // Silent error handling - no console logging to prevent Expo Go notifications
      return 0;
    }
  }

  private async calculateWeeklyProcessedFood(): Promise<number> {
    try {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - 7);
      
      const nutritionLogs = await nutritionService.getNutritionLogs({
        start_date: startDate.toISOString().split('T')[0],
        end_date: new Date().toISOString().split('T')[0]
      });
      
      // This is simplified - would need more sophisticated food categorization
      return nutritionLogs.filter(log => 
        log.meal_name?.toLowerCase().includes('processed') ||
        log.meal_name?.toLowerCase().includes('packaged') ||
        log.meal_name?.toLowerCase().includes('fast food')
      ).length;
    } catch (_error) {
      // Silent error handling - no console logging to prevent Expo Go notifications
      return 0;
    }
  }

  private async calculateAverageStressLevel(): Promise<number> {
    try {
      const moodLogs = await healthService.getMoodLogs(7);
      
      if (moodLogs.length === 0) return 0;
      
      const totalStress = moodLogs.reduce((sum, log) => sum + (log.stress_level || 0), 0);
      return totalStress / moodLogs.length;
    } catch (_error) {
      // Silent error handling - no console logging to prevent Expo Go notifications
      return 0;
    }
  }

  // Get analytics summary
  async getAnalytics(): Promise<GoalAnalytics> {
    const progressData = await this.calculateProgress();
    
    const totalGoals = progressData.length;
    const completedGoals = progressData.filter(goal => goal.progressPercentage >= 100).length;
    const onTrackGoals = progressData.filter(goal => goal.progressPercentage >= 70 && goal.progressPercentage < 100).length;
    const behindGoals = progressData.filter(goal => goal.progressPercentage < 70).length;
    const averageProgress = progressData.reduce((sum, goal) => sum + goal.progressPercentage, 0) / totalGoals;
    
    const topPerformingGoal = progressData.reduce((top, goal) => 
      goal.progressPercentage > top.progressPercentage ? goal : top, progressData[0]
    );
    
    const needsAttentionGoal = progressData.reduce((worst, goal) => 
      goal.progressPercentage < worst.progressPercentage ? goal : worst, progressData[0]
    );

    return {
      totalGoals,
      completedGoals,
      onTrackGoals,
      behindGoals,
      averageProgress,
      topPerformingGoal,
      needsAttentionGoal,
    };
  }
}

export const numericalGoalsService = new NumericalGoalsService();
