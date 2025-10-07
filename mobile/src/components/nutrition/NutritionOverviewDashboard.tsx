import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { nutritionService, NutritionStats } from '../../services/nutritionService';
import { nutritionGoalsService, NutritionGoals } from '../../services/nutritionGoalsService';
import MacroProgressTracker from './MacroProgressTracker';
import MacroRings from './MacroRings';
import { useAuth } from '../../contexts/AuthContext';

interface NutritionOverviewDashboardProps {
  onLogMeal: () => void;
  onViewLogs: () => void;
  onViewAnalytics: () => void;
  refreshing?: boolean;
  onRefresh?: () => void;
}

interface TodayNutrition {
  calories: number;
  protein_g: number;
  carbs_g: number;
  fat_g: number;
  meals_count: number;
  water_ml: number;
  mood_rating?: number;
}

interface WeeklyTrends {
  calories_trend: 'up' | 'down' | 'stable';
  protein_trend: 'up' | 'down' | 'stable';
  meals_trend: 'up' | 'down' | 'stable';
  consistency_score: number;
}

export default function NutritionOverviewDashboard({
  onLogMeal,
  onViewLogs,
  onViewAnalytics,
  refreshing = false,
  onRefresh,
}: NutritionOverviewDashboardProps) {
  const { user } = useAuth();
  const [todayNutrition, setTodayNutrition] = useState<TodayNutrition | null>(null);
  const [weeklyStats, setWeeklyStats] = useState<NutritionStats | null>(null);
  const [weeklyTrends, setWeeklyTrends] = useState<WeeklyTrends | null>(null);
  const [loading, setLoading] = useState(true);
  const [bodyTypeGoal, setBodyTypeGoal] = useState<'sleek' | 'steady' | 'bold'>('steady');
  const [nutritionGoals, setNutritionGoals] = useState<NutritionGoals | null>(null);

  // Load nutrition data
  useEffect(() => {
    loadNutritionData();
    loadNutritionGoals();
  }, [loadNutritionData, loadNutritionGoals]);

  const loadNutritionGoals = useCallback(async () => {
    try {
      // Get user profile from auth context
      if (user) {
        // Mock user profile - in real app, this would come from user profile
        const userProfile = {
          age: 30,
          gender: 'male' as const,
          height_cm: 175,
          weight_kg: 70,
          activity_level: 'moderate' as const,
          bodyTypeGoal: 'steady' as const,
          weight_goal: 'maintain' as const,
        };

        const goals = nutritionGoalsService.calculateGoals(userProfile);
        setNutritionGoals(goals);
        setBodyTypeGoal(goals.bodyTypeGoal);
      }
    } catch (error) {
      console.log('Error loading nutrition goals:', error);
    }
  }, [user]);

  const loadNutritionData = useCallback(async () => {
    try {
      setLoading(true);
      
      // Load today's nutrition
      const today = new Date().toISOString().split('T')[0];
      const todayLogs = await nutritionService.getNutritionLogs({
        start_date: today,
        end_date: today,
        page: 1,
        size: 50
      });

      const todayData = todayLogs.reduce((totals: TodayNutrition, log: any) => ({
        calories: totals.calories + (log.total_calories || 0),
        protein_g: totals.protein_g + (log.protein_g || 0),
        carbs_g: totals.carbs_g + (log.carbs_g || 0),
        fat_g: totals.fat_g + (log.fat_g || 0),
        meals_count: totals.meals_count + 1,
        water_ml: totals.water_ml, // Will be loaded separately
        mood_rating: totals.mood_rating, // Will be loaded separately
      }), {
        calories: 0,
        protein_g: 0,
        carbs_g: 0,
        fat_g: 0,
        meals_count: 0,
        water_ml: 0,
        mood_rating: 0,
      });

      setTodayNutrition(todayData);

      // Load weekly stats
      const weeklyData = await nutritionService.getNutritionStats('week');
      setWeeklyStats(weeklyData);

      // Calculate trends (simplified)
      setWeeklyTrends({
        calories_trend: 'stable',
        protein_trend: 'up',
        meals_trend: 'stable',
        consistency_score: 75,
      });

    } catch (error) {
      console.log('Error loading nutrition data:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  const getTargets = () => {
    // Use calculated goals if available, otherwise fallback to defaults
    if (nutritionGoals) {
      return {
        calories: nutritionGoals.calories,
        protein_g: nutritionGoals.protein_g,
        carbs_g: nutritionGoals.carbs_g,
        fat_g: nutritionGoals.fat_g,
      };
    }

    // Default targets - would be calculated based on user profile and body type
    const baseTargets = {
      calories: 2000,
      protein_g: 150,
      carbs_g: 250,
      fat_g: 80,
    };

    // Adjust based on body type goal
    switch (bodyTypeGoal) {
      case 'sleek':
        return {
          ...baseTargets,
          calories: 1800,
          protein_g: 120,
          carbs_g: 200,
          fat_g: 60,
        };
      case 'steady':
        return baseTargets;
      case 'bold':
        return {
          ...baseTargets,
          calories: 2200,
          protein_g: 180,
          carbs_g: 300,
          fat_g: 100,
        };
      default:
        return baseTargets;
    }
  };


  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'up': return 'trending-up';
      case 'down': return 'trending-down';
      default: return 'remove';
    }
  };

  const getTrendColor = (trend: string) => {
    switch (trend) {
      case 'up': return '#10b981';
      case 'down': return '#ef4444';
      default: return '#6b7280';
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#10b981" />
        <Text style={styles.loadingText}>Loading nutrition data...</Text>
      </View>
    );
  }

  const targets = getTargets();

  return (
    <ScrollView
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
      showsVerticalScrollIndicator={false}
    >
      {/* Quick Stats */}
      <View style={styles.quickStatsSection}>
        <Text style={styles.sectionTitle}>Today's Overview</Text>
        <View style={styles.quickStatsGrid}>
          <View style={styles.quickStatCard}>
            <Ionicons name="restaurant" size={24} color="#10b981" />
            <Text style={styles.quickStatValue}>{todayNutrition?.meals_count || 0}</Text>
            <Text style={styles.quickStatLabel}>Meals</Text>
          </View>
          
          <View style={styles.quickStatCard}>
            <Ionicons name="flame" size={24} color="#ef4444" />
            <Text style={styles.quickStatValue}>{Math.round(todayNutrition?.calories || 0)}</Text>
            <Text style={styles.quickStatLabel}>Calories</Text>
          </View>
          
          <View style={styles.quickStatCard}>
            <Ionicons name="fitness" size={24} color="#3b82f6" />
            <Text style={styles.quickStatValue}>{Math.round(todayNutrition?.protein_g || 0)}g</Text>
            <Text style={styles.quickStatLabel}>Protein</Text>
          </View>
          
          <View style={styles.quickStatCard}>
            <Ionicons name="water" size={24} color="#06b6d4" />
            <Text style={styles.quickStatValue}>2.5L</Text>
            <Text style={styles.quickStatLabel}>Water</Text>
          </View>
        </View>
      </View>

      {/* Macro Rings */}
      <MacroRings
        macros={[
          {
            type: 'calories',
            current: todayNutrition?.calories || 0,
            target: targets.calories,
            color: '#ef4444',
            icon: 'flame',
            unit: 'cal',
          },
          {
            type: 'protein',
            current: todayNutrition?.protein_g || 0,
            target: targets.protein_g,
            color: '#3b82f6',
            icon: 'fitness',
            unit: 'g',
          },
          {
            type: 'carbs',
            current: todayNutrition?.carbs_g || 0,
            target: targets.carbs_g,
            color: '#f59e0b',
            icon: 'leaf',
            unit: 'g',
          },
          {
            type: 'fat',
            current: todayNutrition?.fat_g || 0,
            target: targets.fat_g,
            color: '#8b5cf6',
            icon: 'water',
            unit: 'g',
          },
        ]}
        onMacroPress={(macro) => console.log('Macro pressed:', macro.type)}
      />

      {/* Macro Progress Tracker */}
      <MacroProgressTracker
        current={{
          calories: todayNutrition?.calories || 0,
          protein_g: todayNutrition?.protein_g || 0,
          carbs_g: todayNutrition?.carbs_g || 0,
          fat_g: todayNutrition?.fat_g || 0,
        }}
        targets={targets}
        bodyTypeGoal={bodyTypeGoal}
      />

      {/* Weekly Trends */}
      {weeklyTrends && (
        <View style={styles.trendsSection}>
          <Text style={styles.sectionTitle}>Weekly Trends</Text>
          <View style={styles.trendsContainer}>
            <View style={styles.trendItem}>
              <View style={styles.trendInfo}>
                <Text style={styles.trendLabel}>Calories</Text>
                <Text style={styles.trendValue}>
                  {Math.round(weeklyStats?.total_calories || 0) / 7} avg/day
                </Text>
              </View>
              <Ionicons 
                name={getTrendIcon(weeklyTrends.calories_trend)} 
                size={20} 
                color={getTrendColor(weeklyTrends.calories_trend)} 
              />
            </View>
            
            <View style={styles.trendItem}>
              <View style={styles.trendInfo}>
                <Text style={styles.trendLabel}>Protein</Text>
                <Text style={styles.trendValue}>
                  {Math.round(weeklyStats?.protein_g || 0) / 7} avg/day
                </Text>
              </View>
              <Ionicons 
                name={getTrendIcon(weeklyTrends.protein_trend)} 
                size={20} 
                color={getTrendColor(weeklyTrends.protein_trend)} 
              />
            </View>
            
            <View style={styles.trendItem}>
              <View style={styles.trendInfo}>
                <Text style={styles.trendLabel}>Consistency</Text>
                <Text style={styles.trendValue}>{weeklyTrends.consistency_score}%</Text>
              </View>
              <Ionicons name="checkmark-circle" size={20} color="#10b981" />
            </View>
          </View>
        </View>
      )}

      {/* Recent Meals */}
      <View style={styles.recentMealsSection}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Recent Meals</Text>
          <TouchableOpacity onPress={onViewLogs}>
            <Text style={styles.viewAllText}>View All</Text>
          </TouchableOpacity>
        </View>
        
        {todayNutrition?.meals_count === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="restaurant-outline" size={48} color="#9ca3af" />
            <Text style={styles.emptyText}>No meals logged today</Text>
            <Text style={styles.emptySubtext}>Start by logging your first meal</Text>
            <TouchableOpacity style={styles.emptyActionButton} onPress={onLogMeal}>
              <Text style={styles.emptyActionText}>Log Meal</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.recentMealsList}>
            {/* This would be populated with actual recent meals */}
            <Text style={styles.comingSoonText}>Recent meals will appear here</Text>
          </View>
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
  },
  loadingText: {
    fontSize: 16,
    color: '#6b7280',
    marginTop: 12,
  },
  quickStatsSection: {
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 12,
  },
  quickStatsGrid: {
    flexDirection: 'row',
    gap: 12,
  },
  quickStatCard: {
    flex: 1,
    backgroundColor: '#ffffff',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  quickStatValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1f2937',
    marginTop: 8,
    marginBottom: 4,
  },
  quickStatLabel: {
    fontSize: 12,
    color: '#6b7280',
    textAlign: 'center',
  },
  trendsSection: {
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  trendsContainer: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  trendItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  trendInfo: {
    flex: 1,
  },
  trendLabel: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 2,
  },
  trendValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
  },
  recentMealsSection: {
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  viewAllText: {
    fontSize: 14,
    color: '#10b981',
    fontWeight: '500',
  },
  emptyState: {
    backgroundColor: '#ffffff',
    padding: 32,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  emptyText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#6b7280',
    marginTop: 12,
    marginBottom: 4,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#9ca3af',
    marginBottom: 16,
  },
  emptyActionButton: {
    backgroundColor: '#10b981',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  emptyActionText: {
    color: '#ffffff',
    fontWeight: '500',
    fontSize: 14,
  },
  recentMealsList: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  comingSoonText: {
    fontSize: 14,
    color: '#9ca3af',
    textAlign: 'center',
    fontStyle: 'italic',
  },
});
