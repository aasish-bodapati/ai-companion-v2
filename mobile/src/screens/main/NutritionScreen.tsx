import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { nutritionService, NutritionStats } from '../../services/nutritionService';
import NutritionLogsView from '../../components/nutrition/NutritionLogsView';
import MealLoggingModal from '../../components/nutrition/MealLoggingModalOriginal';
import WeeklyNutritionChart from '../../components/nutrition/WeeklyNutritionChart';

export default function NutritionScreen() {
  const [activeTab, setActiveTab] = useState<'overview' | 'logs' | 'meals'>('overview');
  const [showLogMealModal, setShowLogMealModal] = useState(false);
  const nutritionLogsRef = useRef<any>(null);
  const [weekStats, setWeekStats] = useState<NutritionStats | null>(null);
  const [weeklyActivityData, setWeeklyActivityData] = useState({
    monday: 0,
    tuesday: 0,
    wednesday: 0,
    thursday: 0,
    friday: 0,
    saturday: 0,
    sunday: 0,
  });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Modal is now handled directly in TabNavigator

  const loadWeekStats = async () => {
    try {
      const stats = await nutritionService.getNutritionStats('week');
      
      // Transform the stats to match the expected format
      setWeekStats({
        // Required properties
        total_calories: stats.total_calories || 0,
        protein_g: stats.protein_g || 0,
        carbs_g: stats.carbs_g || 0,
        fat_g: stats.fat_g || 0,
        fiber_g: stats.fiber_g || 0,
        sugar_g: stats.sugar_g || 0,
        sodium_mg: stats.sodium_mg || 0,
        meals_count: stats.meals_count || 0,
        avg_calories_per_meal: stats.avg_calories_per_meal || 0,
        // Additional properties
        total_meals: stats.meals_count || 0,
        average_daily_calories: stats.avg_calories_per_meal || 0,
        macro_breakdown: {
          protein: stats.protein_g || 0,
          carbs: stats.carbs_g || 0,
          fat: stats.fat_g || 0,
        },
        streak: 0, // Will be calculated separately
        weekly_goal_progress: 0, // Will be calculated separately
      });
    } catch (error) {
      // Silent error handling - no console logging to prevent Expo Go notifications
      // Set fallback stats
      setWeekStats({
        // Required properties
        total_calories: 0,
        protein_g: 0,
        carbs_g: 0,
        fat_g: 0,
        fiber_g: 0,
        sugar_g: 0,
        sodium_mg: 0,
        meals_count: 0,
        avg_calories_per_meal: 0,
        // Additional properties
        total_meals: 0,
        average_daily_calories: 0,
        macro_breakdown: {
          protein: 0,
          carbs: 0,
          fat: 0,
        },
        streak: 0,
        weekly_goal_progress: 0,
      });
    }
  };

  const loadWeeklyActivityData = async () => {
    try {
      // Get recent meals for the week
      const response = await nutritionService.getNutritionLogs({ period: 'week' });
      
      // Extract meals array from response
      const meals = response || [];
      
      // Group meals by day of week
      const weeklyData = {
        monday: 0,
        tuesday: 0,
        wednesday: 0,
        thursday: 0,
        friday: 0,
        saturday: 0,
        sunday: 0,
      };
      
      if (Array.isArray(meals)) {
        meals.forEach(meal => {
        const date = new Date(meal.meal_date);
        const dayOfWeek = date.getDay(); // 0 = Sunday, 1 = Monday, etc.
        
        switch (dayOfWeek) {
          case 0: weeklyData.sunday++; break;
          case 1: weeklyData.monday++; break;
          case 2: weeklyData.tuesday++; break;
          case 3: weeklyData.wednesday++; break;
          case 4: weeklyData.thursday++; break;
          case 5: weeklyData.friday++; break;
          case 6: weeklyData.saturday++; break;
        }
        });
      }
      
      setWeeklyActivityData(weeklyData);
    } catch (error) {
      // Silent error handling - no console logging to prevent Expo Go notifications
      // Set fallback data
      setWeeklyActivityData({
        monday: 0,
        tuesday: 0,
        wednesday: 0,
        thursday: 0,
        friday: 0,
        saturday: 0,
        sunday: 0,
      });
    }
  };

  const loadOverviewData = async () => {
    try {
      setLoading(true);
      await Promise.all([loadWeekStats(), loadWeeklyActivityData()]);
    } catch (error) {
      // Silent error handling - no console logging to prevent Expo Go notifications
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadOverviewData();
    setRefreshing(false);
  };

  useEffect(() => {
    loadOverviewData();
  }, []);

  // Reset to overview tab when screen comes into focus
  useFocusEffect(
    React.useCallback(() => {
      setActiveTab('overview');
    }, [])
  );

  const StatCard = ({ icon, title, value, subtitle, color }: {
    icon: string;
    title: string;
    value: string | number;
    subtitle?: string;
    color: string;
  }) => (
    <View style={[styles.statCard, { backgroundColor: color }]}>
      <View style={styles.statContent}>
        <View style={styles.statInfo}>
          <Text style={styles.statValue}>{value}</Text>
          <Text style={styles.statTitle}>{title}</Text>
          {subtitle && <Text style={styles.statSubtitle}>{subtitle}</Text>}
        </View>
        <Ionicons name={icon as any} size={32} color="#ffffff" />
      </View>
    </View>
  );


  const renderOverview = () => (
    <ScrollView
      style={styles.content}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
      showsVerticalScrollIndicator={false}
    >
      {/* This Week's Nutrition Overview */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>This Week's Nutrition</Text>
        <View style={styles.weekOverviewCard}>
          <View style={styles.weekMetricRow}>
            <View style={styles.weekMetric}>
              <Ionicons name="restaurant-outline" size={24} color="#10b981" />
              <Text style={styles.weekMetricValue}>{weekStats?.total_meals || 0}</Text>
              <Text style={styles.weekMetricLabel}>Meals</Text>
            </View>
            <View style={styles.weekMetric}>
              <Ionicons name="flame-outline" size={24} color="#ef4444" />
              <Text style={styles.weekMetricValue}>{Math.round(weekStats?.total_calories || 0)}</Text>
              <Text style={styles.weekMetricLabel}>Calories</Text>
            </View>
          </View>
          
          <View style={styles.weekMetricRow}>
            <View style={styles.weekMetric}>
              <Ionicons name="fitness-outline" size={24} color="#3b82f6" />
              <Text style={styles.weekMetricValue}>{Math.round(weekStats?.macro_breakdown?.protein || 0)}g</Text>
              <Text style={styles.weekMetricLabel}>Protein</Text>
            </View>
            <View style={styles.weekMetric}>
              <Ionicons name="analytics-outline" size={24} color="#f59e0b" />
              <Text style={styles.weekMetricValue}>{Math.round(weekStats?.average_daily_calories || 0)}</Text>
              <Text style={styles.weekMetricLabel}>Avg Daily</Text>
            </View>
          </View>
        </View>
      </View>

      {/* Weekly Nutrition Breakdown */}
      {weekStats && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Weekly Breakdown</Text>
          <View style={styles.breakdownCard}>
            <View style={styles.breakdownItem}>
              <Text style={styles.breakdownLabel}>Macro Balance</Text>
              <Text style={styles.breakdownValue}>
                P: {Math.round(weekStats.macro_breakdown?.protein || 0)}g | 
                C: {Math.round(weekStats.macro_breakdown?.carbs || 0)}g | 
                F: {Math.round(weekStats.macro_breakdown?.fat || 0)}g
              </Text>
            </View>
            <View style={styles.breakdownItem}>
              <Text style={styles.breakdownLabel}>Weekly Goal Progress</Text>
              <Text style={styles.breakdownValue}>{Math.round(weekStats.weekly_goal_progress || 0)}%</Text>
            </View>
            <View style={styles.breakdownItem}>
              <Text style={styles.breakdownLabel}>Current Streak</Text>
              <Text style={styles.breakdownValue}>{weekStats.streak || 0} days</Text>
            </View>
          </View>
        </View>
      )}

      {/* Weekly Activity Chart */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Weekly Activity</Text>
        <WeeklyNutritionChart 
          weeklyData={weeklyActivityData}
          color="#10b981"
          unit="meals"
        />
      </View>
    </ScrollView>
  );

  const renderMeals = () => (
    <ScrollView
      style={styles.content}
      showsVerticalScrollIndicator={false}
    >
      {/* Today's Meal Plan */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Today's Meals</Text>
          <TouchableOpacity 
            style={styles.addMealButton}
            onPress={() => setShowLogMealModal(true)}
          >
            <Ionicons name="add" size={20} color="#10b981" />
            <Text style={styles.addMealText}>Add Meal</Text>
          </TouchableOpacity>
        </View>
        
        <View style={styles.todaysMealsContainer}>
          <TouchableOpacity style={styles.mealCard}>
            <View style={styles.mealHeader}>
              <View style={styles.mealIconContainer}>
                <Ionicons name="sunny-outline" size={20} color="#f59e0b" />
              </View>
              <View style={styles.mealInfo}>
                <Text style={styles.mealName}>Breakfast</Text>
                <Text style={styles.mealTime}>8:00 AM</Text>
              </View>
              <View style={styles.mealCalories}>
                <Text style={styles.mealCaloriesText}>450 cal</Text>
              </View>
            </View>
            <View style={styles.mealItems}>
              <Text style={styles.mealItemText}>• Oatmeal with berries</Text>
              <Text style={styles.mealItemText}>• Greek yogurt</Text>
              <Text style={styles.mealItemText}>• Green tea</Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity style={styles.mealCard}>
            <View style={styles.mealHeader}>
              <View style={styles.mealIconContainer}>
                <Ionicons name="sunny" size={20} color="#f59e0b" />
              </View>
              <View style={styles.mealInfo}>
                <Text style={styles.mealName}>Lunch</Text>
                <Text style={styles.mealTime}>1:00 PM</Text>
              </View>
              <View style={styles.mealCalories}>
                <Text style={styles.mealCaloriesText}>650 cal</Text>
              </View>
            </View>
            <View style={styles.mealItems}>
              <Text style={styles.mealItemText}>• Grilled chicken salad</Text>
              <Text style={styles.mealItemText}>• Quinoa</Text>
              <Text style={styles.mealItemText}>• Mixed vegetables</Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity style={styles.mealCard}>
            <View style={styles.mealHeader}>
              <View style={styles.mealIconContainer}>
                <Ionicons name="moon-outline" size={20} color="#6366f1" />
              </View>
              <View style={styles.mealInfo}>
                <Text style={styles.mealName}>Dinner</Text>
                <Text style={styles.mealTime}>7:00 PM</Text>
              </View>
              <View style={styles.mealCalories}>
                <Text style={styles.mealCaloriesText}>720 cal</Text>
              </View>
            </View>
            <View style={styles.mealItems}>
              <Text style={styles.mealItemText}>• Salmon fillet</Text>
              <Text style={styles.mealItemText}>• Sweet potato</Text>
              <Text style={styles.mealItemText}>• Steamed broccoli</Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.addMealCard}
            onPress={() => setShowLogMealModal(true)}
          >
            <Ionicons name="add-circle-outline" size={32} color="#9ca3af" />
            <Text style={styles.addMealCardText}>Add Snack</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Quick Meal Templates */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Quick Meal Templates</Text>
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          style={styles.quickMealsScroll}
        >
          <TouchableOpacity style={styles.quickMealCard}>
            <View style={styles.quickMealIcon}>
              <Ionicons name="fitness" size={28} color="#10b981" />
            </View>
            <Text style={styles.quickMealTitle}>High Protein</Text>
            <Text style={styles.quickMealCalories}>35g protein</Text>
            <Text style={styles.quickMealCount}>Muscle building</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.quickMealCard}>
            <View style={styles.quickMealIcon}>
              <Ionicons name="leaf" size={28} color="#10b981" />
            </View>
            <Text style={styles.quickMealTitle}>Low Carb</Text>
            <Text style={styles.quickMealCalories}>15g carbs</Text>
            <Text style={styles.quickMealCount}>Weight loss</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.quickMealCard}>
            <View style={styles.quickMealIcon}>
              <Ionicons name="heart" size={28} color="#ef4444" />
            </View>
            <Text style={styles.quickMealTitle}>Heart Healthy</Text>
            <Text style={styles.quickMealCalories}>Low sodium</Text>
            <Text style={styles.quickMealCount}>Cardiovascular</Text>
          </TouchableOpacity>
        </ScrollView>
      </View>

      {/* Meal Planning Tools */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Meal Planning Tools</Text>
        <View style={styles.toolsGrid}>
          <TouchableOpacity style={styles.toolCard}>
            <View style={styles.toolIcon}>
              <Ionicons name="calendar-outline" size={24} color="#3b82f6" />
            </View>
            <Text style={styles.toolTitle}>Weekly Planner</Text>
            <Text style={styles.toolDescription}>Plan your week</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.toolCard}>
            <View style={styles.toolIcon}>
              <Ionicons name="list-outline" size={24} color="#10b981" />
            </View>
            <Text style={styles.toolTitle}>Shopping List</Text>
            <Text style={styles.toolDescription}>Auto-generate list</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.toolCard}>
            <View style={styles.toolIcon}>
              <Ionicons name="restaurant-outline" size={24} color="#f59e0b" />
            </View>
            <Text style={styles.toolTitle}>Meal Prep</Text>
            <Text style={styles.toolDescription}>Batch cooking</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.toolCard}>
            <View style={styles.toolIcon}>
              <Ionicons name="nutrition-outline" size={24} color="#ef4444" />
            </View>
            <Text style={styles.toolTitle}>Nutrition Goals</Text>
            <Text style={styles.toolDescription}>Track macros</Text>
          </TouchableOpacity>
        </View>
      </View>
    </ScrollView>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#10b981" />
        <Text style={styles.loadingText}>Loading nutrition data...</Text>
      </View>
    );
  }


  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Nutrition</Text>
        <Text style={styles.subtitle}>Track your meals and nutrition</Text>
      </View>

      {/* Tab Navigation */}
      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'overview' && styles.activeTab]}
          onPress={() => setActiveTab('overview')}
        >
          <Ionicons 
            name="grid-outline" 
            size={20} 
            color={activeTab === 'overview' ? '#10b981' : '#6b7280'} 
          />
          <Text style={[
            styles.tabText,
            activeTab === 'overview' && styles.activeTabText
          ]}>
            Overview
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[styles.tab, activeTab === 'logs' && styles.activeTab]}
          onPress={() => setActiveTab('logs')}
        >
          <Ionicons 
            name="list-outline" 
            size={20} 
            color={activeTab === 'logs' ? '#10b981' : '#6b7280'} 
          />
          <Text style={[
            styles.tabText,
            activeTab === 'logs' && styles.activeTabText
          ]}>
            Logs
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tab, activeTab === 'meals' && styles.activeTab]}
          onPress={() => setActiveTab('meals')}
        >
          <Ionicons 
            name="restaurant-outline" 
            size={20} 
            color={activeTab === 'meals' ? '#10b981' : '#6b7280'} 
          />
          <Text style={[
            styles.tabText,
            activeTab === 'meals' && styles.activeTabText
          ]}>
            Meals
          </Text>
        </TouchableOpacity>
      </View>

      {/* Content */}
      {activeTab === 'overview' ? renderOverview() : 
       activeTab === 'logs' ? <NutritionLogsView ref={nutritionLogsRef} onRefresh={onRefresh} /> : 
       renderMeals()}

      {/* Log Meal Modal */}
      <MealLoggingModal
        visible={showLogMealModal}
        onClose={() => setShowLogMealModal(false)}
        onMealLogged={() => {
          setShowLogMealModal(false);
          loadOverviewData();
          // Refresh logs if we're on the logs tab
          if (activeTab === 'logs' && nutritionLogsRef.current) {
            nutritionLogsRef.current.refreshLogs();
          }
        }}
      />
    </View>
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
  header: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#6b7280',
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: '#ffffff',
    marginHorizontal: 16,
    borderRadius: 12,
    padding: 4,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  activeTab: {
    backgroundColor: '#10b981',
  },
  tabText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6b7280',
    marginLeft: 6,
  },
  activeTabText: {
    color: '#ffffff',
  },
  content: {
    flex: 1,
    paddingHorizontal: 16,
  },
  section: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1f2937',
  },
  viewAllText: {
    fontSize: 14,
    color: '#10b981',
    fontWeight: '500',
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  statCard: {
    flex: 1,
    minWidth: '45%',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  statContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statInfo: {
    flex: 1,
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 4,
  },
  statTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#ffffff',
    marginBottom: 2,
  },
  statSubtitle: {
    fontSize: 12,
    color: '#ffffff',
    opacity: 0.8,
  },
  snapshotScroll: {
    paddingLeft: 0,
  },
  snapshotCard: {
    width: 100,
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 16,
    marginRight: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  snapshotValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1f2937',
    marginTop: 8,
    marginBottom: 4,
  },
  snapshotLabel: {
    fontSize: 12,
    color: '#6b7280',
    textAlign: 'center',
  },
  trendIndicator: {
    marginTop: 4,
  },
  macroCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  macroItem: {
    marginBottom: 16,
  },
  macroBar: {
    height: 8,
    borderRadius: 4,
    marginBottom: 8,
    overflow: 'hidden',
  },
  macroFill: {
    height: '100%',
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    borderRadius: 4,
  },
  macroInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  macroLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1f2937',
  },
  macroValue: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#1f2937',
  },
  // Meal styles
  quickMealsScroll: {
    paddingLeft: 0,
  },
  quickMealCard: {
    width: 160,
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 20,
    marginRight: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  quickMealIcon: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#f3f4f6',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  quickMealTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
    textAlign: 'center',
    marginBottom: 8,
  },
  quickMealCalories: {
    fontSize: 14,
    color: '#10b981',
    fontWeight: '500',
    marginBottom: 4,
  },
  quickMealCount: {
    fontSize: 12,
    color: '#6b7280',
  },
  // Today's Meals styles
  addMealButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f0fdf4',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#10b981',
  },
  addMealText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#10b981',
    marginLeft: 4,
  },
  todaysMealsContainer: {
    gap: 12,
  },
  mealCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  mealHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  mealIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f3f4f6',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  mealInfo: {
    flex: 1,
  },
  mealName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 2,
  },
  mealTime: {
    fontSize: 14,
    color: '#6b7280',
  },
  mealCalories: {
    backgroundColor: '#f0fdf4',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  mealCaloriesText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#10b981',
  },
  mealItems: {
    marginLeft: 52,
  },
  mealItemText: {
    fontSize: 14,
    color: '#4b5563',
    marginBottom: 4,
  },
  addMealCard: {
    backgroundColor: '#f9fafb',
    borderRadius: 12,
    padding: 24,
    borderWidth: 2,
    borderColor: '#e5e7eb',
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
  },
  addMealCardText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#9ca3af',
    marginTop: 8,
  },
  // Meal Planning Tools styles
  toolsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  toolCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    width: '48%',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  toolIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#f3f4f6',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  toolTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1f2937',
    textAlign: 'center',
    marginBottom: 4,
  },
  toolDescription: {
    fontSize: 12,
    color: '#6b7280',
    textAlign: 'center',
  },
  templateList: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  templateItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  templateInfo: {
    flex: 1,
  },
  templateTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 4,
  },
  templateDetails: {
    fontSize: 14,
    color: '#6b7280',
  },
  createRoutineButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#10b981',
    paddingHorizontal: 24,
    paddingVertical: 16,
    borderRadius: 12,
    marginTop: 8,
    marginBottom: 20,
  },
  createRoutineButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  // New week overview styles
  weekOverviewCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  weekMetricRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  weekMetric: {
    flex: 1,
    alignItems: 'center',
    marginHorizontal: 8,
  },
  weekMetricValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1f2937',
    marginTop: 8,
    marginBottom: 4,
  },
  weekMetricLabel: {
    fontSize: 12,
    color: '#6b7280',
    textAlign: 'center',
  },
  // Weekly breakdown styles
  breakdownCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  breakdownItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  breakdownLabel: {
    fontSize: 14,
    color: '#6b7280',
    flex: 1,
  },
  breakdownValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
  },
});
