import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { nutritionService } from '../services/nutritionService';
import { fitnessService } from '../services/fitnessService';
import { waterService } from '../services/waterService';
import stepTrackingService from '../services/stepTrackingService';

export interface BodyTypeGoalMetrics {
  goalName: string;
  dailyScore: number;
  weeklyAlignment: number;
  weeklyTrend: 'up' | 'down' | 'stable';
  alignment: 'closer' | 'further' | 'same';
  suggestions: string[];
  loading: boolean;
}

interface NutritionLog {
  total_calories?: number;
  protein_g?: number;
}

interface FitnessLog {
  activity_type?: string;
}

interface WaterStats {
  total_ml_today?: number;
}

interface NutritionData {
  totalCalories: number;
  totalProtein: number;
  calorieGap: number;
  proteinGap: number;
  mealCount: number;
}

interface FitnessData {
  workoutCount: number;
  hasStrengthWorkout: boolean;
  hasCardioWorkout: boolean;
  stepsToday: number;
  hasActivity: boolean;
}

interface WaterData {
  currentIntake: number;
  deficit: number;
  percentage: number;
}

export function useBodyTypeGoalMetrics(): BodyTypeGoalMetrics {
  const { user } = useAuth();
  const [metrics, setMetrics] = useState<BodyTypeGoalMetrics>({
    goalName: 'Strong & Steady',
    dailyScore: 0,
    weeklyAlignment: 0,
    weeklyTrend: 'stable',
    alignment: 'same',
    suggestions: [],
    loading: true,
  });

  useEffect(() => {
    // Defer loading to reduce initial API calls
    const timer = setTimeout(() => {
      loadBodyTypeMetrics();
    }, 1000); // Load after 1 second delay
    
    return () => clearTimeout(timer);
  }, [user, loadBodyTypeMetrics]); // Include loadBodyTypeMetrics dependency

  const loadBodyTypeMetrics = useCallback(async () => {
    try {
      setMetrics(prev => ({ ...prev, loading: true }));
      
      // Get today's date in user's timezone
      const today = new Date();
      const todayStr = today.toISOString().split('T')[0];
      
      // Get this week's date range
      const weekStart = new Date(today);
      weekStart.setDate(today.getDate() - 6);
      const weekStartStr = weekStart.toISOString().split('T')[0];
      
      console.log('🎯 [BODY TYPE METRICS] Loading metrics for:', { todayStr, weekStartStr });
      
      // Fetch data in parallel
      const [todayNutrition, weekNutrition, todayFitness, weekFitness, waterStats] = await Promise.all([
        nutritionService.getNutritionLogs({ start_date: todayStr, end_date: todayStr }),
        nutritionService.getNutritionLogs({ start_date: weekStartStr, end_date: todayStr }),
        fitnessService.getFitnessLogs({ start_date: todayStr, end_date: todayStr }),
        fitnessService.getFitnessLogs({ start_date: weekStartStr, end_date: todayStr }),
        waterService.getWaterStats().catch(() => null),
      ]);

      console.log('🎯 [BODY TYPE METRICS] Data loaded:', {
        todayNutrition: todayNutrition?.length || 0,
        weekNutrition: weekNutrition?.length || 0,
        todayFitness: todayFitness?.length || 0,
        weekFitness: weekFitness?.length || 0,
        waterStats: waterStats ? 'loaded' : 'failed'
      });

      // Calculate daily score (0-100) - now async for step tracking
      const dailyScore = await calculateDailyScore(todayNutrition, todayFitness, waterStats);
      
      // Calculate weekly alignment (0-100) - now async for step tracking
      const weeklyAlignment = await calculateWeeklyAlignment(weekNutrition, weekFitness, waterStats);
      
      // Calculate weekly trend
      const weeklyTrend = calculateWeeklyTrend(weekNutrition, weekFitness);
      
      // Calculate alignment direction
      const alignment = calculateAlignment(weeklyAlignment, 75); // 75% is target
      
      // Generate smart suggestions - now async for step tracking
      const suggestions = await generateSuggestions(todayNutrition, todayFitness, waterStats, dailyScore);
      
      // Determine goal name based on user's body type goal
      const goalName = getUserGoalName();

      setMetrics({
        goalName,
        dailyScore,
        weeklyAlignment,
        weeklyTrend,
        alignment,
        suggestions,
        loading: false,
      });

      console.log('🎯 [BODY TYPE METRICS] Calculated metrics:', {
        dailyScore,
        weeklyAlignment,
        weeklyTrend,
        alignment,
        suggestionsCount: suggestions.length
      });

    } catch (error) {
      console.error('🎯 [BODY TYPE METRICS] Error loading metrics:', error);
      setMetrics(prev => ({ ...prev, loading: false }));
    }
  }, [user]); // Add dependencies to prevent infinite loop

  const calculateDailyScore = async (nutrition: NutritionLog[], fitness: FitnessLog[], waterStats: WaterStats | null): Promise<number> => {
    let score = 0;
    let factors = 0;

    // Nutrition factor (35% weight) - reduced from 40%
    if (nutrition && nutrition.length > 0) {
      const totalCalories = nutrition.reduce((sum, meal) => sum + (meal.total_calories || 0), 0);
      const totalProtein = nutrition.reduce((sum, meal) => sum + (meal.protein_g || 0), 0);
      
      // Score based on calorie and protein intake (simplified)
      const calorieScore = Math.min(100, (totalCalories / 2000) * 100); // 2000 cal target
      const proteinScore = Math.min(100, (totalProtein / 150) * 100); // 150g protein target
      
      score += (calorieScore + proteinScore) / 2 * 0.35;
      factors += 0.35;
    }

    // Activity factor (25% weight) - includes workouts OR steps
    const activityScore = await calculateActivityScore(fitness);
    if (activityScore > 0) {
      score += activityScore * 0.25;
      factors += 0.25;
    }

    // Water factor (20% weight)
    if (waterStats) {
      const waterScore = Math.min(100, (waterStats.total_ml_today / 3000) * 100); // 3L target
      score += waterScore * 0.2;
      factors += 0.2;
    }

    // Logging consistency factor (20% weight) - increased from 10%
    const loggedToday = (nutrition?.length || 0) + (fitness?.length || 0) + (waterStats ? 1 : 0);
    const consistencyScore = Math.min(100, (loggedToday / 3) * 100); // 3 types of logging
    score += consistencyScore * 0.2;
    factors += 0.2;

    return factors > 0 ? Math.round(score / factors) : 0;
  };

  const calculateActivityScore = async (fitness: FitnessLog[]): Promise<number> => {
    // If there are workouts logged, give full points
    if (fitness && fitness.length > 0) {
      return 100; // Full points for any workout
    }

    // If no workouts, check for steps
    try {
      const stepsToday = await getStepsToday();
      if (stepsToday > 0) {
        // Score based on steps: 10,000 steps = 100 points
        const stepsScore = Math.min(100, (stepsToday / 10000) * 100);
        console.log('🚶 Activity score from steps:', { stepsToday, stepsScore });
        return stepsScore;
      }
    } catch (error) {
      console.error('🚶 Error calculating activity score from steps:', error);
    }

    // If no activity at all, return 0
    return 0;
  };

  const getStepsToday = async (): Promise<number> => {
    try {
      // Check if step tracking is available
      const isAvailable = await stepTrackingService.isAvailable();
      if (!isAvailable) {
        console.log('🚶 Step tracking not available on this device');
        return 0;
      }

      // Start tracking if not already started
      if (!stepTrackingService.isCurrentlyTracking()) {
        const started = await stepTrackingService.startTracking();
        if (!started) {
          console.log('🚶 Failed to start step tracking');
          return 0;
        }
      }

      // Get today's steps
      const steps = await stepTrackingService.getTodaySteps();
      console.log('🚶 Today steps from service:', steps);
      return steps;
    } catch (error) {
      console.error('🚶 Error getting today steps:', error);
      // Return 0 on error to prevent breaking the scoring system
      return 0;
    }
  };

  const calculateWeeklyAlignment = async (nutrition: NutritionLog[], fitness: FitnessLog[], waterStats: WaterStats | null): Promise<number> => {
    let alignment = 0;
    let factors = 0;

    // Nutrition consistency (35% weight) - reduced from 40%
    if (nutrition && nutrition.length > 0) {
      const avgCalories = nutrition.reduce((sum, meal) => sum + (meal.total_calories || 0), 0) / nutrition.length;
      const avgProtein = nutrition.reduce((sum, meal) => sum + (meal.protein_g || 0), 0) / nutrition.length;
      
      const calorieAlignment = Math.min(100, (avgCalories / 2000) * 100);
      const proteinAlignment = Math.min(100, (avgProtein / 150) * 100);
      
      alignment += (calorieAlignment + proteinAlignment) / 2 * 0.35;
      factors += 0.35;
    }

    // Activity consistency (25% weight) - reduced from 30%, includes workouts OR steps
    const activityScore = await calculateActivityScore(fitness);
    if (activityScore > 0) {
      alignment += activityScore * 0.25;
      factors += 0.25;
    }

    // Water consistency (20% weight)
    if (waterStats) {
      const avgWater = waterStats.total_ml_today || 0;
      const waterAlignment = Math.min(100, (avgWater / 3000) * 100);
      alignment += waterAlignment * 0.2;
      factors += 0.2;
    }

    // Logging consistency (20% weight) - increased from 10%
    const totalLogs = (nutrition?.length || 0) + (fitness?.length || 0) + (waterStats ? 1 : 0);
    const loggingConsistency = Math.min(100, (totalLogs / 21) * 100); // 21 total logs per week (3 per day)
    alignment += loggingConsistency * 0.2;
    factors += 0.2;

    return factors > 0 ? Math.round(alignment / factors) : 0;
  };

  const calculateWeeklyTrend = (nutrition: NutritionLog[], fitness: FitnessLog[]): 'up' | 'down' | 'stable' => {
    // Simple trend calculation based on recent activity
    const recentDays = 3;
    const olderDays = 4;
    
    if (nutrition.length < 2 || fitness.length < 2) {
      return 'stable';
    }

    // Compare recent vs older activity
    const recentNutrition = nutrition.slice(-recentDays);
    const olderNutrition = nutrition.slice(0, olderDays);
    
    const recentFitness = fitness.slice(-recentDays);
    const olderFitness = fitness.slice(0, olderDays);

    const recentActivity = recentNutrition.length + recentFitness.length;
    const olderActivity = olderNutrition.length + olderFitness.length;

    if (recentActivity > olderActivity * 1.2) return 'up';
    if (recentActivity < olderActivity * 0.8) return 'down';
    return 'stable';
  };

  const calculateAlignment = (currentAlignment: number, targetAlignment: number): 'closer' | 'further' | 'same' => {
    const threshold = 5; // 5% threshold for change
    const difference = currentAlignment - targetAlignment;
    
    if (Math.abs(difference) < threshold) return 'same';
    return difference > 0 ? 'closer' : 'further';
  };

  const generateSuggestions = async (nutrition: NutritionLog[], fitness: FitnessLog[], waterStats: WaterStats | null, dailyScore: number): Promise<string[]> => {
    const suggestions: Suggestion[] = [];
    const currentHour = new Date().getHours();
    const goalName = getUserGoalName();

    // Get detailed nutrition data
    const nutritionData = analyzeNutritionData(nutrition);
    const fitnessData = await analyzeFitnessData(fitness);
    const waterData = analyzeWaterData(waterStats);

    // HIGH PRIORITY SUGGESTIONS (Critical gaps)
    
    // 1. Nutrition Critical Gaps
    if (nutritionData.calorieGap > 500) {
      suggestions.push({
        text: `You're ${Math.round(nutritionData.calorieGap)} calories short - try adding ${getCalorieSuggestions(nutritionData.calorieGap)}`,
        priority: 'high',
        category: 'nutrition'
      });
    }
    
    if (nutritionData.proteinGap > 30) {
      suggestions.push({
        text: `Add ${Math.round(nutritionData.proteinGap)}g more protein - try ${getProteinSuggestions(nutritionData.proteinGap)}`,
        priority: 'high',
        category: 'nutrition'
      });
    }

    // 2. Activity Critical Gaps (Workouts OR Steps)
    if (fitnessData.workoutCount === 0 && fitnessData.stepsToday < 5000) {
      const activitySuggestion = getActivitySuggestion(goalName, currentHour, fitnessData.stepsToday);
      suggestions.push({
        text: activitySuggestion,
        priority: 'high',
        category: 'fitness'
      });
    }

    // 3. Water Critical Gaps
    if (waterData.deficit > 1000) {
      suggestions.push({
        text: `You're ${Math.round(waterData.deficit / 1000)}L behind on water - drink ${getWaterSuggestions(waterData.deficit)}`,
        priority: 'high',
        category: 'hydration'
      });
    }

    // MEDIUM PRIORITY SUGGESTIONS (Improvements)
    
    // 4. Goal-Specific Nutrition
    if (nutritionData.calorieGap <= 500 && nutritionData.calorieGap > 200) {
      const goalSpecificSuggestion = getGoalSpecificNutritionSuggestion(goalName, nutritionData);
      if (goalSpecificSuggestion) {
        suggestions.push({
          text: goalSpecificSuggestion,
          priority: 'medium',
          category: 'nutrition'
        });
      }
    }

    // 5. Time-Aware Suggestions
    const timeAwareSuggestion = getTimeAwareSuggestion(currentHour, nutritionData, fitnessData, waterData);
    if (timeAwareSuggestion) {
      suggestions.push({
        text: timeAwareSuggestion,
        priority: 'medium',
        category: 'timing'
      });
    }

    // 6. Consistency Suggestions
    if (dailyScore < 50) {
      suggestions.push({
        text: "Focus on logging consistently - even small actions add up!",
        priority: 'medium',
        category: 'consistency'
      });
    }

    // LOW PRIORITY SUGGESTIONS (Optimizations)
    
    // 7. Performance Boosts
    if (dailyScore >= 70 && dailyScore < 90) {
      suggestions.push({
        text: getPerformanceBoostSuggestion(goalName, nutritionData, fitnessData),
        priority: 'low',
        category: 'optimization'
      });
    }

    // 8. Celebration
    if (dailyScore >= 90) {
      suggestions.push({
        text: getCelebrationMessage(goalName, dailyScore),
        priority: 'low',
        category: 'celebration'
      });
    }

    // Sort by priority and return top 3
    const sortedSuggestions = suggestions
      .sort((a, b) => {
        const priorityOrder = { high: 3, medium: 2, low: 1 };
        return priorityOrder[b.priority] - priorityOrder[a.priority];
      })
      .slice(0, 3)
      .map(s => s.text);

    return sortedSuggestions;
  };

  interface Suggestion {
    text: string;
    priority: 'high' | 'medium' | 'low';
    category: 'nutrition' | 'fitness' | 'hydration' | 'timing' | 'consistency' | 'optimization' | 'celebration';
  }

  const analyzeNutritionData = (nutrition: NutritionLog[]): NutritionData => {
    if (!nutrition || nutrition.length === 0) {
      return {
        totalCalories: 0,
        totalProtein: 0,
        calorieGap: 2000, // Default target
        proteinGap: 150,  // Default target
        mealCount: 0
      };
    }

    const totalCalories = nutrition.reduce((sum, meal) => sum + (meal.total_calories || 0), 0);
    const totalProtein = nutrition.reduce((sum, meal) => sum + (meal.protein_g || 0), 0);
    
    return {
      totalCalories,
      totalProtein,
      calorieGap: Math.max(0, 2000 - totalCalories), // 2000 cal target
      proteinGap: Math.max(0, 150 - totalProtein),   // 150g protein target
      mealCount: nutrition.length
    };
  };

  const analyzeFitnessData = async (fitness: FitnessLog[]): Promise<FitnessData> => {
    const stepsToday = await getStepsToday(); // Real step data
    
    return {
      workoutCount: fitness?.length || 0,
      hasStrengthWorkout: fitness?.some(w => w.activity_type === 'strength') || false,
      hasCardioWorkout: fitness?.some(w => w.activity_type === 'cardio') || false,
      stepsToday,
      hasActivity: (fitness?.length || 0) > 0 || stepsToday > 5000
    };
  };

  const analyzeWaterData = (waterStats: WaterStats | null): WaterData => {
    if (!waterStats) {
      return { currentIntake: 0, deficit: 3000, percentage: 0 };
    }
    
    const currentIntake = waterStats.total_ml_today || 0;
    const target = 3000; // 3L target
    const deficit = Math.max(0, target - currentIntake);
    const percentage = (currentIntake / target) * 100;
    
    return { currentIntake, deficit, percentage };
  };

  const getCalorieSuggestions = (gap: number): string => {
    if (gap > 800) return "a protein shake with banana and oats";
    if (gap > 500) return "nuts, avocado, or Greek yogurt";
    if (gap > 300) return "a handful of almonds or a piece of fruit";
    return "a small healthy snack";
  };

  const getProteinSuggestions = (gap: number): string => {
    if (gap > 50) return "chicken breast, fish, or protein powder";
    if (gap > 30) return "Greek yogurt, eggs, or cottage cheese";
    return "nuts, seeds, or legumes";
  };

  const getWorkoutSuggestion = (goalName: string, currentHour: number): string => {
    const timeContext = currentHour < 12 ? "morning" : currentHour < 18 ? "afternoon" : "evening";
    
    switch (goalName) {
      case 'Strong & Steady':
        return `Start your ${timeContext} with a strength workout - try squats, push-ups, or planks`;
      case 'Sleek & Lean':
        return `Get your ${timeContext} cardio in - 20-30 minutes of walking, running, or cycling`;
      case 'Bold & Powerful':
        return `Power through your ${timeContext} with compound movements - deadlifts, squats, or pull-ups`;
      default:
        return `Log a ${timeContext} workout to boost your daily score`;
    }
  };

  const getActivitySuggestion = (goalName: string, currentHour: number, stepsToday: number): string => {
    const timeContext = currentHour < 12 ? "morning" : currentHour < 18 ? "afternoon" : "evening";
    
    if (stepsToday > 0 && stepsToday < 5000) {
      return `You're at ${stepsToday.toLocaleString()} steps - aim for 10,000 today! Try a ${timeContext} walk`;
    } else if (stepsToday === 0) {
      switch (goalName) {
        case 'Strong & Steady':
          return `No activity yet - perfect ${timeContext} for strength training or a walk`;
        case 'Sleek & Lean':
          return `Time to move! Try a ${timeContext} walk or light cardio`;
        case 'Bold & Powerful':
          return `Let's get powerful! A ${timeContext} workout or walk would be great`;
        default:
          return `Let's get moving! A ${timeContext} walk or workout would be great`;
      }
    } else {
      return `Great job with ${stepsToday.toLocaleString()} steps! Keep it up or add a workout`;
    }
  };

  const getWaterSuggestions = (deficit: number): string => {
    if (deficit > 2000) return "2-3 glasses right now";
    if (deficit > 1000) return "a large glass of water";
    return "a glass of water";
  };

  const getGoalSpecificNutritionSuggestion = (goalName: string, nutritionData: NutritionData): string => {
    switch (goalName) {
      case 'Strong & Steady':
        if (nutritionData.proteinGap > 20) {
          return "Focus on protein-rich foods to support muscle maintenance";
        }
        return "Add complex carbs like quinoa or sweet potato for sustained energy";
      case 'Sleek & Lean':
        if (nutritionData.calorieGap < 300) {
          return "Consider lighter options like salads or lean proteins";
        }
        return "Add more vegetables and lean proteins to your meals";
      case 'Bold & Powerful':
        if (nutritionData.proteinGap > 30) {
          return "Increase protein intake to 2g per kg body weight for muscle building";
        }
        return "Add healthy fats like avocado or nuts for energy density";
      default:
        return "Focus on balanced nutrition with whole foods";
    }
  };

  const getTimeAwareSuggestion = (currentHour: number, nutritionData: NutritionData, fitnessData: FitnessData, waterData: WaterData): string => {
    if (currentHour < 10 && nutritionData.mealCount === 0) {
      return "Start your day with a protein-rich breakfast to fuel your morning";
    }
    if (currentHour >= 12 && currentHour < 15 && nutritionData.mealCount < 2) {
      return "Time for lunch! Log your meal to stay on track with nutrition goals";
    }
    if (currentHour >= 15 && currentHour < 18 && fitnessData.workoutCount === 0) {
      return "Perfect time for an afternoon workout - your energy levels are optimal";
    }
    if (currentHour >= 18 && waterData.percentage < 60) {
      return "Catch up on hydration before dinner - you're behind on water goals";
    }
    if (currentHour >= 20 && nutritionData.mealCount < 3) {
      return "Don't skip dinner - a light, balanced meal will help with recovery";
    }
    return "";
  };

  const getPerformanceBoostSuggestion = (goalName: string, nutritionData: NutritionData, fitnessData: FitnessData): string => {
    switch (goalName) {
      case 'Strong & Steady':
        return "Add 2 more strength exercises to maximize your workout";
      case 'Sleek & Lean':
        return "Try 10 minutes of HIIT to boost calorie burn";
      case 'Bold & Powerful':
        return "Increase your protein intake to 2.2g per kg for optimal muscle building";
      default:
        return "You're doing great! Consider adding one more activity to reach 90+";
    }
  };

  const getCelebrationMessage = (goalName: string, dailyScore: number): string => {
    if (dailyScore >= 95) {
      return `Incredible! You're absolutely crushing your ${goalName} goals! 🎉`;
    }
    if (dailyScore >= 90) {
      return `Outstanding work! You're exceeding your ${goalName} targets! 🚀`;
    }
    return `Excellent day! You're perfectly aligned with your ${goalName} goals! ✨`;
  };

  const getUserGoalName = (): string => {
    // This would ideally come from user profile
    // For now, return a default based on common goals
    // TODO: Integrate with user profile to get actual body type goal
    return 'Strong & Steady';
  };

  return metrics;
}
