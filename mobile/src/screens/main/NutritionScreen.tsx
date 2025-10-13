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
import { nutritionService } from '../../services/api';
import { useWeeklyActivity } from '../../hooks/useWeeklyActivity';
import NutritionLogsView from '../../components/nutrition/NutritionLogsView';
import UnifiedNutritionLogger from '../../components/nutrition/UnifiedNutritionLogger';
import QuickAddMeals from '../../components/nutrition/QuickAddMeals';
import WeeklyNutritionChart from '../../components/nutrition/WeeklyNutritionChart';

import { COLORS, SPACING, BORDER_RADIUS, FONT_SIZE } from '../../theme/constants';
import { STYLE_PRESETS } from '../../theme/duplicateStyles';

export default function NutritionScreen() {
  // Use individual selectors instead of the actions object to prevent infinite loops
  const refreshNutritionData = useNutritionStore((state) => state.refreshNutritionData);
  const addMeal = useNutritionStore((state) => state.addMeal);
  const loading = useNutritionLoading();

  const [activeTab, setActiveTab] = useState<'overview' | 'logs' | 'meals'>('overview');
  const [showLogMealModal, setShowLogMealModal] = useState(false);
  const nutritionLogsRef = useRef<{ refreshLogs: () => void } | null>(null);
  const { weeklyActivityData } = useWeeklyActivity();
  const [refreshing, setRefreshing] = useState(false);

  // Modal is now handled directly in TabNavigator

  const loadWeekStats = useCallback(async () => {
    // This is now handled by the Zustand store
    await refreshNutritionData();
  }, []); // Remove refreshNutritionData from dependencies to prevent infinite re-renders

  // Weekly activity data is now handled by useWeeklyActivity hook

  const loadOverviewData = useCallback(async () => {
    await loadWeekStats();
  }, []); // Remove loadWeekStats from dependencies to prevent infinite re-renders

  const onRefresh = async () => {
    setRefreshing(true);
    await loadOverviewData();
    setRefreshing(false);
  };

  useEffect(() => {
    loadOverviewData();
  }, []); // Remove loadOverviewData from dependencies to prevent infinite re-renders

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
    <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
      {/* Simple Stats Cards */}
      <View style={styles.statsContainer}>
        <View style={styles.statCard}>
          <View style={styles.statIcon}>
            <Ionicons name="restaurant-outline" size={24} color="#10b981" />
          </View>
          <Text style={styles.statValue}>3</Text>
          <Text style={styles.statLabel}>Meals Today</Text>
        </View>
        
        <View style={styles.statCard}>
          <View style={styles.statIcon}>
            <Ionicons name="flame-outline" size={24} color="#f97316" />
          </View>
          <Text style={styles.statValue}>1,850</Text>
          <Text style={styles.statLabel}>Calories</Text>
        </View>
      </View>

      {/* Macro Summary */}
      <View style={styles.macroCard}>
        <Text style={styles.cardTitle}>Today's Macros</Text>
        <View style={styles.macroRow}>
          <View style={styles.macroItem}>
            <Text style={styles.macroLabel}>Protein</Text>
            <Text style={styles.macroValue}>120g</Text>
          </View>
          <View style={styles.macroItem}>
            <Text style={styles.macroLabel}>Carbs</Text>
            <Text style={styles.macroValue}>180g</Text>
          </View>
          <View style={styles.macroItem}>
            <Text style={styles.macroLabel}>Fat</Text>
            <Text style={styles.macroValue}>65g</Text>
          </View>
        </View>
      </View>

      {/* Quick Actions */}
      <View style={styles.quickActionsCard}>
        <Text style={styles.cardTitle}>Quick Actions</Text>
        <View style={styles.actionButtons}>
          <TouchableOpacity 
            style={styles.actionButton}
            onPress={() => setShowLogMealModal(true)}
          >
            <Ionicons name="add-circle-outline" size={20} color="#10b981" />
            <Text style={styles.actionButtonText}>Log Meal</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.actionButton}
            onPress={() => setActiveTab('logs')}
          >
            <Ionicons name="list-outline" size={20} color="#3b82f6" />
            <Text style={styles.actionButtonText}>View Logs</Text>
          </TouchableOpacity>
        </View>
      </View>
    </ScrollView>
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
    backgroundColor: COLORS.background.secondary,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.background.secondary,
  },
  loadingText: {
    fontSize: FONT_SIZE.lg,
    color: COLORS.text.secondary,
    marginTop: 12,
  },
  header: {
    paddingHorizontal: SPACING.lg,
    paddingTop: 20,
    paddingBottom: 16,
  },
  title: {
    fontSize: FONT_SIZE.xxxxl,
    fontWeight: 'bold',
    color: COLORS.text.primary,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: FONT_SIZE.lg,
    color: COLORS.text.secondary,
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: COLORS.background.primary,
    marginHorizontal: 16,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.xxs,
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
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.md,
    borderRadius: BORDER_RADIUS.sm,
  },
  activeTab: {
    backgroundColor: COLORS.success,
  },
  tabText: {
    fontSize: FONT_SIZE.md,
    fontWeight: '500',
    color: COLORS.text.secondary,
    marginLeft: 6,
  },
  activeTabText: {
    color: COLORS.text.inverse,
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
    fontSize: FONT_SIZE.xl,
    fontWeight: '600',
    color: COLORS.text.primary,
  },
  viewAllText: {
    fontSize: FONT_SIZE.md,
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
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.md,
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
    color: COLORS.text.inverse,
    marginBottom: 4,
  },
  statTitle: {
    fontSize: FONT_SIZE.md,
    fontWeight: '600',
    color: COLORS.text.inverse,
    marginBottom: 2,
  },
  statSubtitle: {
    fontSize: FONT_SIZE.sm,
    color: COLORS.text.inverse,
    opacity: 0.8,
  },
  snapshotScroll: {
    paddingLeft: 0,
  },
  snapshotCard: {
    width: 100,
    backgroundColor: COLORS.background.primary,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.md,
    marginRight: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  snapshotValue: {
    fontSize: FONT_SIZE.xxl,
    fontWeight: 'bold',
    color: COLORS.text.primary,
    marginTop: 8,
    marginBottom: 4,
  },
  snapshotLabel: {
    fontSize: FONT_SIZE.sm,
    color: COLORS.text.secondary,
    textAlign: 'center',
  },
  trendIndicator: {
    marginTop: 4,
  },
  macroCard: {
    backgroundColor: COLORS.background.primary,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.lg,
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
    borderRadius: BORDER_RADIUS.xs,
    marginBottom: 8,
    overflow: 'hidden',
  },
  macroFill: {
    height: '100%',
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    borderRadius: BORDER_RADIUS.xs,
  },
  macroInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  macroLabel: {
    fontSize: FONT_SIZE.md,
    fontWeight: '600',
    color: COLORS.text.primary,
  },
  macroValue: {
    fontSize: FONT_SIZE.md,
    fontWeight: 'bold',
    color: COLORS.text.primary,
  },
  // Meal styles
  quickMealsScroll: {
    paddingLeft: 0,
  },
  quickMealCard: {
    width: 160,
    backgroundColor: COLORS.background.primary,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.lg,
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
    backgroundColor: COLORS.background.tertiary,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  quickMealTitle: {
    fontSize: FONT_SIZE.lg,
    fontWeight: '600',
    color: COLORS.text.primary,
    textAlign: 'center',
    marginBottom: 8,
  },
  quickMealCalories: {
    fontSize: FONT_SIZE.md,
    color: '#10b981',
    fontWeight: '500',
    marginBottom: 4,
  },
  quickMealCount: {
    fontSize: FONT_SIZE.sm,
    color: COLORS.text.secondary,
  },
  // Today's Meals styles
  addMealButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f0fdf4',
    paddingHorizontal: SPACING.sm,
    paddingVertical: 6,
    borderRadius: BORDER_RADIUS.xxl,
    borderWidth: 1,
    borderColor: '#10b981',
  },
  addMealText: {
    fontSize: FONT_SIZE.md,
    fontWeight: '600',
    color: '#10b981',
    marginLeft: 4,
  },
  todaysMealsContainer: {
    gap: 12,
  },
  mealCard: {
    backgroundColor: COLORS.background.primary,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.md,
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
    borderRadius: BORDER_RADIUS.xxl,
    backgroundColor: COLORS.background.tertiary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  mealInfo: {
    flex: 1,
  },
  mealName: {
    fontSize: FONT_SIZE.lg,
    fontWeight: '600',
    color: COLORS.text.primary,
    marginBottom: 2,
  },
  mealTime: {
    fontSize: FONT_SIZE.md,
    color: COLORS.text.secondary,
  },
  mealCalories: {
    backgroundColor: '#f0fdf4',
    paddingHorizontal: SPACING.xs,
    paddingVertical: SPACING.xxs,
    borderRadius: BORDER_RADIUS.md,
  },
  mealCaloriesText: {
    fontSize: FONT_SIZE.md,
    fontWeight: '600',
    color: '#10b981',
  },
  mealItems: {
    marginLeft: 52,
  },
  mealItemText: {
    fontSize: FONT_SIZE.md,
    color: '#4b5563',
    marginBottom: 4,
  },
  addMealCard: {
    backgroundColor: '#f9fafb',
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.xl,
    borderWidth: 2,
    borderColor: '#e5e7eb',
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
  },
  addMealCardText: {
    fontSize: FONT_SIZE.lg,
    fontWeight: '500',
    color: COLORS.text.tertiary,
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
    backgroundColor: COLORS.background.primary,
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
    backgroundColor: COLORS.background.tertiary,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 4,
  },
  toolTitle: {
    fontSize: 11,
    fontWeight: '600',
    color: COLORS.text.primary,
    textAlign: 'center',
    marginBottom: 2,
  },
  toolDescription: {
    fontSize: 9,
    color: COLORS.text.secondary,
    textAlign: 'center',
  },
  templateList: {
    backgroundColor: COLORS.background.primary,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.md,
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
    paddingVertical: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  templateInfo: {
    flex: 1,
  },
  templateTitle: {
    fontSize: FONT_SIZE.lg,
    fontWeight: '600',
    color: COLORS.text.primary,
    marginBottom: 4,
  },
  templateDetails: {
    fontSize: FONT_SIZE.md,
    color: COLORS.text.secondary,
  },
  createRoutineButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.success,
    paddingHorizontal: SPACING.xl,
    paddingVertical: SPACING.md,
    borderRadius: BORDER_RADIUS.md,
    marginTop: 8,
    marginBottom: 20,
  },
  createRoutineButtonText: {
    color: COLORS.text.inverse,
    fontSize: FONT_SIZE.lg,
    fontWeight: '600',
    marginLeft: 8,
  },
  // New week overview styles
  weekOverviewCard: {
    backgroundColor: COLORS.background.primary,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.lg,
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
    color: COLORS.text.primary,
    marginTop: 8,
    marginBottom: 4,
  },
  weekMetricLabel: {
    fontSize: FONT_SIZE.sm,
    color: COLORS.text.secondary,
    textAlign: 'center',
  },
  // Weekly breakdown styles
  breakdownCard: {
    backgroundColor: COLORS.background.primary,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.lg,
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
    paddingVertical: SPACING.sm,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  breakdownLabel: {
    fontSize: FONT_SIZE.md,
    color: COLORS.text.secondary,
    flex: 1,
  },
  breakdownValue: {
    fontSize: FONT_SIZE.lg,
    fontWeight: '600',
    color: COLORS.text.primary,
  },
  // Simplified overview styles
  statsContainer: {
    flexDirection: 'row',
    marginHorizontal: 16,
    marginBottom: 20,
    gap: 12,
  },
  statCard: {
    flex: 1,
    backgroundColor: COLORS.background.primary,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.lg,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  statIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#f0fdf4',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  statValue: {
    fontSize: 28,
    fontWeight: 'bold',
    color: COLORS.text.primary,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: FONT_SIZE.sm,
    color: COLORS.text.secondary,
    textAlign: 'center',
  },
  macroCard: {
    backgroundColor: COLORS.background.primary,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.lg,
    marginHorizontal: 16,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cardTitle: {
    fontSize: FONT_SIZE.lg,
    fontWeight: '600',
    color: COLORS.text.primary,
    marginBottom: 12,
  },
  macroRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  macroItem: {
    alignItems: 'center',
  },
  macroLabel: {
    fontSize: FONT_SIZE.sm,
    color: COLORS.text.secondary,
    marginBottom: 4,
  },
  macroValue: {
    fontSize: FONT_SIZE.lg,
    fontWeight: 'bold',
    color: COLORS.text.primary,
  },
  quickActionsCard: {
    backgroundColor: COLORS.background.primary,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.lg,
    marginHorizontal: 16,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f8fafc',
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.lg,
    borderRadius: BORDER_RADIUS.md,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  actionButtonText: {
    fontSize: FONT_SIZE.md,
    fontWeight: '500',
    color: COLORS.text.primary,
    marginLeft: 8,
  },
});
