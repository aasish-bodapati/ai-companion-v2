import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useNutritionStore, useNutritionLoading } from '../../stores';
import { nutritionService } from '../../services/nutritionService';
import NutritionLogsView from '../../components/nutrition/NutritionLogsView';
import UnifiedNutritionLogger from '../../components/nutrition/UnifiedNutritionLogger';
import NutritionOverviewDashboard from '../../components/nutrition/NutritionOverviewDashboard';
import QuickAddMeals from '../../components/nutrition/QuickAddMeals';
import WeeklyNutritionChart from '../../components/nutrition/WeeklyNutritionChart';

export default function NutritionScreen() {
  // Use individual selectors instead of the actions object to prevent infinite loops
  const refreshNutritionData = useNutritionStore((state) => state.refreshNutritionData);
  const addMeal = useNutritionStore((state) => state.addMeal);
  const loading = useNutritionLoading();
  
  const [activeTab, setActiveTab] = useState<'overview' | 'logs' | 'meals'>('overview');
  const [showLogMealModal, setShowLogMealModal] = useState(false);
  const nutritionLogsRef = useRef<{ refreshLogs: () => void } | null>(null);
  const [weeklyActivityData, setWeeklyActivityData] = useState({
    monday: 0,
    tuesday: 0,
    wednesday: 0,
    thursday: 0,
    friday: 0,
    saturday: 0,
    sunday: 0,
  });
  const [refreshing, setRefreshing] = useState(false);

  // Modal is now handled directly in TabNavigator

  const loadWeekStats = useCallback(async () => {
    // This is now handled by the Zustand store
    await refreshNutritionData();
  }, [refreshNutritionData]);

  const loadWeeklyActivityData = useCallback(async () => {
    try {
      
      // Calculate date range for the past 7 days
      const today = new Date();
      const sevenDaysAgo = new Date(today);
      sevenDaysAgo.setDate(today.getDate() - 7);
      
      const startDate = sevenDaysAgo.toISOString().split('T')[0];
      const endDate = today.toISOString().split('T')[0];
      
      
      // Get recent meals for the week using date range
      const meals = await nutritionService.getNutritionLogs({ 
        start_date: startDate, 
        end_date: endDate 
      });
      
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
          // Parse the meal_date as UTC and convert to user's timezone
          const mealDateUTC = new Date(meal.meal_date);
          
          // Use the local day of week (this handles timezone conversion automatically)
          const dayOfWeek = mealDateUTC.getDay(); // 0 = Sunday, 1 = Monday, etc.
          
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
    } catch {
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
  }, []);

  const loadOverviewData = useCallback(async () => {
    await Promise.all([loadWeekStats(), loadWeeklyActivityData()]);
  }, [loadWeekStats, loadWeeklyActivityData]); // Add missing dependencies

  const onRefresh = async () => {
    setRefreshing(true);
    await loadOverviewData();
    setRefreshing(false);
  };

  useEffect(() => {
    loadOverviewData();
  }, [loadOverviewData]); // Add loadOverviewData dependency

  // Reset to overview tab when screen comes into focus
  useFocusEffect(
    React.useCallback(() => {
      setActiveTab('overview');
    }, [])
  );

  const handleQuickAddMeal = useCallback(async (mealType: string, foodItems: {
    name: string;
    calories: number;
    protein_g: number;
    carbs_g: number;
    fat_g: number;
    quantity: number;
    quantity_unit: string;
  }[]) => {
    try {
      // Handle quick add - convert to meal data format
      const mealData = {
        meal_type: mealType,
        total_calories: foodItems.reduce((sum, item) => sum + item.calories, 0),
        protein_g: foodItems.reduce((sum, item) => sum + item.protein_g, 0),
        carbs_g: foodItems.reduce((sum, item) => sum + item.carbs_g, 0),
        fat_g: foodItems.reduce((sum, item) => sum + item.fat_g, 0),
        food_items: JSON.stringify(foodItems.map(item => ({
          food_id: Date.now(), // Temporary ID
          food_name: item.name,
          quantity: item.quantity,
          quantity_unit: item.quantity_unit,
          quantity_grams: item.quantity * 100,
          calories: item.calories,
          protein_g: item.protein_g,
          carbs_g: item.carbs_g,
          fat_g: item.fat_g,
        }))),
      };
      
      // Log the meal with proper async/await
      await nutritionService.logMeal(mealData);
      
      // Add meal to store and refresh data
      addMeal({
        id: Date.now().toString(),
        meal_type: mealType as 'breakfast' | 'lunch' | 'dinner' | 'snack',
        food_items: foodItems.map(item => ({
          food_item: { id: Date.now(), name: item.name },
          quantity: item.quantity,
          unit: item.quantity_unit,
        })),
        total_calories: mealData.total_calories,
        total_protein: mealData.protein_g,
        total_carbs: mealData.carbs_g,
        total_fat: mealData.fat_g,
        logged_at: new Date().toISOString(),
      });
      
      await refreshNutritionData();
      
      if (nutritionLogsRef.current) {
        nutritionLogsRef.current.refreshLogs();
      }
    } catch {
      // Silent error handling - no console logging to prevent Expo Go notifications
    }
  }, [addMeal, refreshNutritionData]);

  const handleMealLogged = useCallback(async () => {
    setShowLogMealModal(false);
    await refreshNutritionData();
    // Refresh logs if we're on the logs tab
    if (activeTab === 'logs' && nutritionLogsRef.current) {
      nutritionLogsRef.current.refreshLogs();
    }
  }, [refreshNutritionData, activeTab]);


  const renderOverview = () => (
    <NutritionOverviewDashboard
      onLogMeal={() => setShowLogMealModal(true)}
      onViewLogs={() => setActiveTab('logs')}
      onViewAnalytics={() => setActiveTab('meals')}
      refreshing={refreshing}
      onRefresh={onRefresh}
    />
  );

  const renderMeals = () => (
    <ScrollView
      style={styles.content}
      showsVerticalScrollIndicator={false}
    >
      {/* Quick Add Meals */}
      <QuickAddMeals
        onQuickAdd={handleQuickAddMeal}
        onCustomAdd={() => setShowLogMealModal(true)}
      />

      {/* Weekly Nutrition Chart */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Weekly Activity</Text>
        <WeeklyNutritionChart 
          weeklyData={weeklyActivityData}
          color="#10b981"
          unit="meals"
        />
      </View>

      {/* Meal Planning Tools */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Meal Planning Tools</Text>
        <View style={styles.toolsGrid}>
          <TouchableOpacity style={styles.toolCard}>
            <View style={styles.toolIcon}>
              <Ionicons name="calendar-outline" size={16} color="#3b82f6" />
            </View>
            <Text style={styles.toolTitle}>Weekly Planner</Text>
            <Text style={styles.toolDescription}>Plan your week</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.toolCard}>
            <View style={styles.toolIcon}>
              <Ionicons name="list-outline" size={16} color="#10b981" />
            </View>
            <Text style={styles.toolTitle}>Shopping List</Text>
            <Text style={styles.toolDescription}>Auto-generate list</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.toolCard}>
            <View style={styles.toolIcon}>
              <Ionicons name="restaurant-outline" size={16} color="#f59e0b" />
            </View>
            <Text style={styles.toolTitle}>Meal Prep</Text>
            <Text style={styles.toolDescription}>Batch cooking</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.toolCard}>
            <View style={styles.toolIcon}>
              <Ionicons name="nutrition-outline" size={16} color="#ef4444" />
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
      </View>

      {/* Content */}
      {activeTab === 'overview' ? renderOverview() : 
       activeTab === 'meals' ? renderMeals() : 
       <NutritionLogsView ref={nutritionLogsRef} onRefresh={onRefresh} />}

      {/* Unified Nutrition Logger Modal */}
      <UnifiedNutritionLogger
        visible={showLogMealModal}
        onClose={() => setShowLogMealModal(false)}
        onMealLogged={handleMealLogged}
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
    paddingHorizontal: 0,
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
    marginHorizontal: 16,
    marginBottom: 12,
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
    marginHorizontal: 16,
    marginBottom: 12,
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
    marginHorizontal: 16,
    marginBottom: 12,
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
    justifyContent: 'space-between',
    gap: 6,
  },
  toolCard: {
    backgroundColor: '#ffffff',
    borderRadius: 10,
    padding: 10,
    width: '22%',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  toolIcon: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#f3f4f6',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 4,
  },
  toolTitle: {
    fontSize: 11,
    fontWeight: '600',
    color: '#1f2937',
    textAlign: 'center',
    marginBottom: 2,
  },
  toolDescription: {
    fontSize: 9,
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
    marginHorizontal: 16,
    marginBottom: 12,
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
    marginHorizontal: 16,
    marginBottom: 12,
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
