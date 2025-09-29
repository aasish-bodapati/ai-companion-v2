import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { hapticFeedback } from '../../utils/haptics';
import { dashboardService } from '../../services/dashboardService';
import { fitnessService } from '../../services/fitnessService';
import { nutritionService } from '../../services/nutritionService';
import { waterService } from '../../services/waterService';
import { moodService } from '../../services/moodService';
import ProgressLineChart from '../../components/ui/ProgressLineChart';
import SimpleChart from '../../components/ui/SimpleChart';

interface RealTimeData {
  todayStats: any;
  weeklyStats: any;
  fitnessLogs: any[];
  nutritionLogs: any[];
  waterLogs: any[];
  moodLogs: any[];
}

export default function AnalyticsScreen() {
  const [activeTab, setActiveTab] = useState<'overview' | 'fitness' | 'nutrition' | 'mood'>('overview');
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<RealTimeData | null>(null);

  const loadRealTimeData = async () => {
    try {
      setLoading(true);
      
      // Load all real data in parallel
      const [
        dashboardSummary,
        fitnessLogs,
        nutritionLogs,
        waterLogs,
        moodLogs
      ] = await Promise.all([
        dashboardService.getDashboardSummary(),
        fitnessService.getWorkoutLogs({ period: 'week' }),
        nutritionService.getMealLogs({ period: 'week' }),
        waterService.getWaterLogs(7), // 7 days for the week
        moodService.getMoodLogs({ limit: 50 }) // Get recent mood logs
      ]);

      setData({
        todayStats: dashboardSummary.today_stats,
        weeklyStats: dashboardSummary.weekly_progress,
        fitnessLogs: Array.isArray(fitnessLogs) ? fitnessLogs : (fitnessLogs?.data || []),
        nutritionLogs: Array.isArray(nutritionLogs) ? nutritionLogs : (nutritionLogs?.data || []),
        waterLogs: Array.isArray(waterLogs) ? waterLogs : [],
        moodLogs: Array.isArray(moodLogs) ? moodLogs : []
      });
    } catch (error) {
      console.error('Failed to load real-time data:', error);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    hapticFeedback.light();
    await loadRealTimeData();
    setRefreshing(false);
  };

  useEffect(() => {
    loadRealTimeData();
  }, []);

  const tabs = [
    { key: 'overview', label: 'Overview', icon: 'analytics-outline' },
    { key: 'fitness', label: 'Fitness', icon: 'fitness-outline' },
    { key: 'nutrition', label: 'Nutrition', icon: 'restaurant-outline' },
    { key: 'mood', label: 'Mood', icon: 'happy-outline' },
  ] as const;


  const renderFitnessAnalytics = () => {
    if (!data) return null;

    const { fitnessLogs, todayStats, weeklyStats } = data;
    
    // Safety check for fitnessLogs
    if (!Array.isArray(fitnessLogs)) {
      return (
        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          <View style={styles.sectionCard}>
            <Text style={styles.sectionTitle}>Fitness Analytics</Text>
            <Text style={styles.placeholderText}>No fitness data available</Text>
          </View>
        </ScrollView>
      );
    }
    
    // Calculate fitness metrics from real data
    const totalWorkouts = fitnessLogs.length;
    const totalMinutes = fitnessLogs.reduce((sum, log) => sum + (log.duration_minutes || 0), 0);
    const totalCalories = fitnessLogs.reduce((sum, log) => sum + (log.calories_burned || 0), 0);
    const avgDuration = totalWorkouts > 0 ? totalMinutes / totalWorkouts : 0;
    
    // Group by activity type
    const activityTypes = fitnessLogs.reduce((acc, log) => {
      acc[log.activity_type] = (acc[log.activity_type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    const mostCommonActivity = Object.keys(activityTypes).reduce((a, b) => 
      activityTypes[a] > activityTypes[b] ? a : b, 'None'
    );

    return (
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Fitness Summary */}
        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Fitness Summary</Text>
          <View style={styles.metricRow}>
            <View style={styles.metricItem}>
              <Text style={styles.metricValue}>{totalWorkouts}</Text>
              <Text style={styles.metricLabel}>Total Workouts</Text>
            </View>
            <View style={styles.metricItem}>
              <Text style={styles.metricValue}>{todayStats.workouts || 0}</Text>
              <Text style={styles.metricLabel}>Today</Text>
            </View>
            <View style={styles.metricItem}>
              <Text style={styles.metricValue}>{Math.round(avgDuration)}</Text>
              <Text style={styles.metricLabel}>Avg Minutes</Text>
            </View>
          </View>
        </View>

        {/* Weekly Progress */}
        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>This Week</Text>
          <View style={styles.metricRow}>
            <View style={styles.metricItem}>
              <Text style={styles.metricValue}>{weeklyStats.workouts_completed || 0}</Text>
              <Text style={styles.metricLabel}>Workouts</Text>
            </View>
            <View style={styles.metricItem}>
              <Text style={styles.metricValue}>{weeklyStats.total_minutes_this_week || 0}</Text>
              <Text style={styles.metricLabel}>Minutes</Text>
            </View>
            <View style={styles.metricItem}>
              <Text style={styles.metricValue}>{totalCalories}</Text>
              <Text style={styles.metricLabel}>Calories</Text>
            </View>
          </View>
        </View>

        {/* Activity Breakdown */}
        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Activity Breakdown</Text>
          {Object.keys(activityTypes).length > 0 ? (
            Object.entries(activityTypes).map(([activity, count]) => (
              <View key={activity} style={styles.activityRow}>
                <Text style={styles.activityLabel}>{activity}</Text>
                <View style={styles.activityBar}>
                  <View 
                    style={[
                      styles.activityFill, 
                      { width: `${(count / totalWorkouts) * 100}%` }
                    ]} 
                  />
                </View>
                <Text style={styles.activityCount}>{count}</Text>
              </View>
            ))
          ) : (
            <Text style={styles.placeholderText}>No workout data available</Text>
          )}
        </View>

        {/* Recent Workouts */}
        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Recent Workouts</Text>
          {fitnessLogs.slice(0, 5).map((log, index) => (
            <View key={log.id || index} style={styles.workoutRow}>
              <View style={styles.workoutInfo}>
                <Text style={styles.workoutName}>{log.activity_name || log.activity_type}</Text>
                <Text style={styles.workoutDate}>
                  {new Date(log.activity_date).toLocaleDateString()}
                </Text>
              </View>
              <View style={styles.workoutStats}>
                <Text style={styles.workoutDuration}>{log.duration_minutes}min</Text>
                {log.calories_burned && (
                  <Text style={styles.workoutCalories}>{log.calories_burned} cal</Text>
                )}
              </View>
            </View>
          ))}
          {fitnessLogs.length === 0 && (
            <Text style={styles.placeholderText}>No recent workouts</Text>
          )}
        </View>
      </ScrollView>
    );
  };

  const renderNutritionAnalytics = () => {
    if (!data) return null;

    const { nutritionLogs, todayStats, weeklyStats } = data;
    
    // Safety check for nutritionLogs
    if (!Array.isArray(nutritionLogs)) {
      return (
        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          <View style={styles.sectionCard}>
            <Text style={styles.sectionTitle}>Nutrition Analytics</Text>
            <Text style={styles.placeholderText}>No nutrition data available</Text>
          </View>
        </ScrollView>
      );
    }
    
    // Calculate nutrition metrics from real data
    const totalMeals = nutritionLogs.length;
    const totalCalories = nutritionLogs.reduce((sum, log) => sum + (log.total_calories || 0), 0);
    const totalProtein = nutritionLogs.reduce((sum, log) => sum + (log.protein_g || 0), 0);
    const totalCarbs = nutritionLogs.reduce((sum, log) => sum + (log.carbs_g || 0), 0);
    const totalFat = nutritionLogs.reduce((sum, log) => sum + (log.fat_g || 0), 0);
    const avgCaloriesPerMeal = totalMeals > 0 ? totalCalories / totalMeals : 0;
    
    // Group by meal type
    const mealTypes = nutritionLogs.reduce((acc, log) => {
      const mealType = log.meal_type || 'Other';
      acc[mealType] = (acc[mealType] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return (
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Nutrition Summary */}
        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Nutrition Summary</Text>
          <View style={styles.metricRow}>
            <View style={styles.metricItem}>
              <Text style={styles.metricValue}>{totalMeals}</Text>
              <Text style={styles.metricLabel}>Total Meals</Text>
            </View>
            <View style={styles.metricItem}>
              <Text style={styles.metricValue}>{todayStats.meals || 0}</Text>
              <Text style={styles.metricLabel}>Today</Text>
            </View>
            <View style={styles.metricItem}>
              <Text style={styles.metricValue}>{Math.round(avgCaloriesPerMeal)}</Text>
              <Text style={styles.metricLabel}>Cal/Meal</Text>
            </View>
          </View>
        </View>

        {/* Weekly Progress */}
        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>This Week</Text>
          <View style={styles.metricRow}>
            <View style={styles.metricItem}>
              <Text style={styles.metricValue}>{weeklyStats.meals_logged || 0}</Text>
              <Text style={styles.metricLabel}>Meals Logged</Text>
            </View>
            <View style={styles.metricItem}>
              <Text style={styles.metricValue}>{Math.round(weeklyStats.avg_calories_per_day || 0)}</Text>
              <Text style={styles.metricLabel}>Avg Cal/Day</Text>
            </View>
            <View style={styles.metricItem}>
              <Text style={styles.metricValue}>{Math.round(totalCalories)}</Text>
              <Text style={styles.metricLabel}>Total Calories</Text>
            </View>
          </View>
        </View>

        {/* Macro Breakdown */}
        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Macro Breakdown</Text>
          <View style={styles.macroContainer}>
            <View style={styles.macroItem}>
              <View style={[styles.macroBar, { backgroundColor: '#ef4444', width: '60%' }]} />
              <Text style={styles.macroLabel}>Protein: {Math.round(totalProtein)}g</Text>
            </View>
            <View style={styles.macroItem}>
              <View style={[styles.macroBar, { backgroundColor: '#3b82f6', width: '70%' }]} />
              <Text style={styles.macroLabel}>Carbs: {Math.round(totalCarbs)}g</Text>
            </View>
            <View style={styles.macroItem}>
              <View style={[styles.macroBar, { backgroundColor: '#f59e0b', width: '50%' }]} />
              <Text style={styles.macroLabel}>Fat: {Math.round(totalFat)}g</Text>
            </View>
          </View>
        </View>

        {/* Meal Type Breakdown */}
        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Meal Types</Text>
          {Object.keys(mealTypes).length > 0 ? (
            Object.entries(mealTypes).map(([mealType, count]) => (
              <View key={mealType} style={styles.mealTypeRow}>
                <Text style={styles.mealTypeLabel}>{mealType}</Text>
                <View style={styles.mealTypeBar}>
                  <View 
                    style={[
                      styles.mealTypeFill, 
                      { width: `${(count / totalMeals) * 100}%` }
                    ]} 
                  />
                </View>
                <Text style={styles.mealTypeCount}>{count}</Text>
              </View>
            ))
          ) : (
            <Text style={styles.placeholderText}>No meal data available</Text>
          )}
        </View>

        {/* Recent Meals */}
        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Recent Meals</Text>
          {nutritionLogs.slice(0, 5).map((log, index) => (
            <View key={log.id || index} style={styles.mealRow}>
              <View style={styles.mealInfo}>
                <Text style={styles.mealName}>{log.meal_name || log.meal_type || 'Meal'}</Text>
                <Text style={styles.mealDate}>
                  {new Date(log.meal_date).toLocaleDateString()}
                </Text>
              </View>
              <View style={styles.mealStats}>
                <Text style={styles.mealCalories}>{log.total_calories} cal</Text>
                {log.protein_g && (
                  <Text style={styles.mealProtein}>{log.protein_g}g protein</Text>
                )}
              </View>
            </View>
          ))}
          {nutritionLogs.length === 0 && (
            <Text style={styles.placeholderText}>No recent meals</Text>
          )}
        </View>
      </ScrollView>
    );
  };

  const renderMoodAnalytics = () => {
    if (!data) return null;

    const { moodLogs, waterLogs } = data;
    
    // Safety check for moodLogs and waterLogs
    const safeMoodLogs = Array.isArray(moodLogs) ? moodLogs : [];
    const safeWaterLogs = Array.isArray(waterLogs) ? waterLogs : [];
    
    // Calculate mood metrics from real data
    const totalMoodLogs = safeMoodLogs.length;
    const avgMood = totalMoodLogs > 0 
      ? safeMoodLogs.reduce((sum, log) => sum + (log.mood_rating || 0), 0) / totalMoodLogs 
      : 0;
    
    // Calculate energy and stress levels
    const avgEnergy = totalMoodLogs > 0 
      ? safeMoodLogs.reduce((sum, log) => sum + (log.energy_level || 0), 0) / totalMoodLogs 
      : 0;
    
    const avgStress = totalMoodLogs > 0 
      ? safeMoodLogs.reduce((sum, log) => sum + (log.stress_level || 0), 0) / totalMoodLogs 
      : 0;
    
    // Calculate water intake
    const totalWater = safeWaterLogs.reduce((sum, log) => sum + (log.amount_ml || 0), 0);
    const avgWaterPerDay = safeWaterLogs.length > 0 ? totalWater / safeWaterLogs.length : 0;

    return (
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Mood & Wellness</Text>
          <View style={styles.moodContainer}>
            <View style={styles.moodItem}>
              <Ionicons name="happy-outline" size={32} color="#10b981" />
              <Text style={styles.moodValue}>{avgMood.toFixed(1)}</Text>
              <Text style={styles.moodLabel}>Average Mood</Text>
            </View>
            <View style={styles.moodItem}>
              <Ionicons name="battery-half-outline" size={32} color="#3b82f6" />
              <Text style={styles.moodValue}>{Math.round(avgEnergy)}%</Text>
              <Text style={styles.moodLabel}>Energy Level</Text>
            </View>
            <View style={styles.moodItem}>
              <Ionicons name="shield-checkmark-outline" size={32} color="#8b5cf6" />
              <Text style={styles.moodValue}>{Math.round(100 - avgStress)}%</Text>
              <Text style={styles.moodLabel}>Wellness</Text>
            </View>
          </View>
        </View>

        {/* Water Intake */}
        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Hydration</Text>
          <View style={styles.metricRow}>
            <View style={styles.metricItem}>
              <Text style={styles.metricValue}>{Math.round(totalWater)}ml</Text>
              <Text style={styles.metricLabel}>Total Water</Text>
            </View>
            <View style={styles.metricItem}>
              <Text style={styles.metricValue}>{Math.round(avgWaterPerDay)}ml</Text>
              <Text style={styles.metricLabel}>Avg/Day</Text>
            </View>
            <View style={styles.metricItem}>
              <Text style={styles.metricValue}>{safeWaterLogs.length}</Text>
              <Text style={styles.metricLabel}>Logs</Text>
            </View>
          </View>
        </View>

        {/* Recent Mood Logs */}
        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Recent Mood Logs</Text>
          {safeMoodLogs.slice(0, 5).map((log, index) => (
            <View key={log.id || index} style={styles.moodLogRow}>
              <View style={styles.moodLogInfo}>
                <Text style={styles.moodLogDate}>
                  {new Date(log.log_date).toLocaleDateString()}
                </Text>
                {log.mood_label && (
                  <Text style={styles.moodLogLabel}>{log.mood_label}</Text>
                )}
              </View>
              <View style={styles.moodLogStats}>
                <Text style={styles.moodLogRating}>{log.mood_rating}/10</Text>
                {log.energy_level && (
                  <Text style={styles.moodLogEnergy}>Energy: {log.energy_level}%</Text>
                )}
              </View>
            </View>
          ))}
          {safeMoodLogs.length === 0 && (
            <Text style={styles.placeholderText}>No mood logs available</Text>
          )}
        </View>

        {/* Wellness Insights */}
        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Wellness Insights</Text>
          <View style={styles.insightItem}>
            <Ionicons name="bulb-outline" size={20} color="#f59e0b" />
            <Text style={styles.insightText}>
              {totalMoodLogs > 0 
                ? `Your average mood is ${avgMood.toFixed(1)}/10 this week`
                : 'Start logging your mood to see insights'
              }
            </Text>
          </View>
          <View style={styles.insightItem}>
            <Ionicons name="water-outline" size={20} color="#3b82f6" />
            <Text style={styles.insightText}>
              {safeWaterLogs.length > 0 
                ? `You've logged ${Math.round(totalWater)}ml of water this week`
                : 'Start logging water intake for better insights'
              }
            </Text>
          </View>
          <View style={styles.insightItem}>
            <Ionicons name="trending-up-outline" size={20} color="#10b981" />
            <Text style={styles.insightText}>
              {totalMoodLogs > 0 
                ? `Keep tracking your mood to identify patterns`
                : 'Log your mood daily to track patterns'
              }
            </Text>
          </View>
        </View>
      </ScrollView>
    );
  };

  const renderOverviewTab = () => {
    if (!data) return null;

    const { todayStats, weeklyStats, fitnessLogs, nutritionLogs, waterLogs } = data;
    
    // Calculate weekly activity data for charts
    const weeklyActivity = Array.from({ length: 7 }, (_, i) => {
      const date = new Date();
      date.setDate(date.getDate() - (6 - i));
      const dayName = date.toLocaleDateString('en-US', { weekday: 'short' });
      
      const dayWorkouts = fitnessLogs.filter(log => {
        const logDate = new Date(log.activity_date || log.created_at);
        return logDate.toDateString() === date.toDateString();
      }).length;
      
      const dayMeals = nutritionLogs.filter(log => {
        const logDate = new Date(log.meal_date || log.created_at);
        return logDate.toDateString() === date.toDateString();
      }).length;
      
      return {
        label: dayName,
        value: dayWorkouts + dayMeals,
        color: '#3b82f6'
      };
    });

    // Calculate macro breakdown
    const totalCalories = nutritionLogs.reduce((sum, log) => sum + (log.total_calories || 0), 0);
    const totalProtein = nutritionLogs.reduce((sum, log) => sum + (log.protein_g || 0), 0);
    const totalCarbs = nutritionLogs.reduce((sum, log) => sum + (log.carbs_g || 0), 0);
    const totalFat = nutritionLogs.reduce((sum, log) => sum + (log.fat_g || 0), 0);
    
    const macroData = [
      { label: 'Protein', value: totalProtein, color: '#ef4444' },
      { label: 'Carbs', value: totalCarbs, color: '#3b82f6' },
      { label: 'Fat', value: totalFat, color: '#f59e0b' },
    ];
    
    return (
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Progress Line Charts */}
        <View style={styles.progressGrid}>
          <View style={styles.progressCardWrapper}>
            <ProgressLineChart
              title="Workouts"
              current={todayStats.workouts || 0}
              goal={3}
              unit="sessions"
              color="#f59e0b"
              icon="fitness"
              trend="up"
              trendValue={Math.round(weeklyStats.workout_progress || 0)}
              size="small"
            />
          </View>
          <View style={styles.progressCardWrapper}>
            <ProgressLineChart
              title="Meals"
              current={todayStats.meals || 0}
              goal={3}
              unit="meals"
              color="#10b981"
              icon="restaurant"
              trend="up"
              trendValue={Math.round(weeklyStats.meal_progress || 0)}
              size="small"
            />
          </View>
          <View style={styles.progressCardWrapper}>
            <ProgressLineChart
              title="Water"
              current={Math.round((todayStats.water_ml || 0) / 250)}
              goal={8}
              unit="glasses"
              color="#3b82f6"
              icon="water"
              size="small"
            />
          </View>
          <View style={styles.progressCardWrapper}>
            <ProgressLineChart
              title="Streak"
              current={todayStats.streak || 0}
              goal={7}
              unit="days"
              color="#8b5cf6"
              icon="flame"
              size="small"
            />
          </View>
        </View>

        {/* Weekly Activity Chart */}
        <SimpleChart
          title="Weekly Activity"
          data={weeklyActivity}
          type="bar"
          height={180}
        />

        {/* Macro Breakdown Chart */}
        <SimpleChart
          title="Macro Breakdown (This Week)"
          data={macroData}
          type="donut"
          height={200}
        />

        {/* Quick Stats */}
        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Quick Stats</Text>
          <View style={styles.quickStatsGrid}>
            <View style={styles.quickStatItem}>
              <Ionicons name="time" size={24} color="#6b7280" />
              <Text style={styles.quickStatValue}>
                {Math.round(weeklyStats.total_minutes_this_week || 0)} min
              </Text>
              <Text style={styles.quickStatLabel}>This Week</Text>
            </View>
            <View style={styles.quickStatItem}>
              <Ionicons name="flame" size={24} color="#6b7280" />
              <Text style={styles.quickStatValue}>
                {Math.round(totalCalories)}
              </Text>
              <Text style={styles.quickStatLabel}>Calories</Text>
            </View>
            <View style={styles.quickStatItem}>
              <Ionicons name="trophy" size={24} color="#6b7280" />
              <Text style={styles.quickStatValue}>
                {Math.round(weeklyStats.overall_progress || 0)}%
              </Text>
              <Text style={styles.quickStatLabel}>Progress</Text>
            </View>
          </View>
        </View>
      </ScrollView>
    );
  };

  const renderTabContent = () => {
    if (loading) {
      return (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#3b82f6" />
          <Text style={styles.loadingText}>Loading analytics...</Text>
        </View>
      );
    }

    switch (activeTab) {
      case 'overview':
        return (
          <ScrollView
            style={styles.content}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
            }
            showsVerticalScrollIndicator={false}
          >
            {renderOverviewTab()}
          </ScrollView>
        );
      case 'fitness':
        return (
          <ScrollView
            style={styles.content}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
            }
            showsVerticalScrollIndicator={false}
          >
            {renderFitnessAnalytics()}
          </ScrollView>
        );
      case 'nutrition':
        return (
          <ScrollView
            style={styles.content}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
            }
            showsVerticalScrollIndicator={false}
          >
            {renderNutritionAnalytics()}
          </ScrollView>
        );
      case 'mood':
        return (
          <ScrollView
            style={styles.content}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
            }
            showsVerticalScrollIndicator={false}
          >
            {renderMoodAnalytics()}
          </ScrollView>
        );
      default:
        return null;
    }
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <Text style={styles.title}>Analytics</Text>
          <TouchableOpacity
            style={styles.refreshButton}
            onPress={onRefresh}
            disabled={refreshing}
          >
            <Ionicons 
              name="refresh" 
              size={20} 
              color={refreshing ? '#9ca3af' : '#3b82f6'} 
            />
          </TouchableOpacity>
        </View>
        <Text style={styles.subtitle}>Track your progress and insights</Text>
      </View>

      {/* Tab Navigation */}
      <View style={styles.tabContainer}>
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.tabScrollContent}
        >
          {tabs.map((tab) => (
            <TouchableOpacity
              key={tab.key}
              style={[
                styles.tab,
                activeTab === tab.key && styles.activeTab
              ]}
              onPress={() => {
                setActiveTab(tab.key);
                hapticFeedback.light();
              }}
            >
              <Ionicons 
                name={tab.icon as any} 
                size={20} 
                color={activeTab === tab.key ? '#ffffff' : '#6b7280'} 
              />
              <Text style={[
                styles.tabText,
                activeTab === tab.key && styles.activeTabText
              ]}>
                {tab.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Content */}
      {renderTabContent()}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 16,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1f2937',
  },
  refreshButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: '#f3f4f6',
  },
  subtitle: {
    fontSize: 16,
    color: '#6b7280',
  },
  tabContainer: {
    backgroundColor: '#ffffff',
    marginHorizontal: 16,
    borderRadius: 12,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  tabScrollContent: {
    paddingHorizontal: 4,
    paddingVertical: 4,
  },
  tab: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginHorizontal: 4,
    minWidth: 100,
  },
  activeTab: {
    backgroundColor: '#3b82f6',
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
  },
  insightsSection: {
    marginTop: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: '#6b7280',
  },
  // Summary Cards
  summaryContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    marginBottom: 16,
    gap: 12,
  },
  summaryCard: {
    flex: 1,
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  summaryValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1f2937',
    marginTop: 8,
  },
  summaryLabel: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 4,
  },
  summaryPeriod: {
    fontSize: 10,
    color: '#9ca3af',
    marginTop: 2,
  },
  // Section Cards
  sectionCard: {
    backgroundColor: '#ffffff',
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 16,
  },
  // Metrics
  metricRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  metricItem: {
    alignItems: 'center',
  },
  metricValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1f2937',
  },
  metricLabel: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 4,
  },
  // Trends
  trendContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  trendText: {
    fontSize: 16,
    fontWeight: '500',
    marginLeft: 8,
  },
  // Weekly Breakdown
  weekRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  weekLabel: {
    fontSize: 14,
    color: '#6b7280',
    fontWeight: '500',
  },
  weekMetrics: {
    flexDirection: 'row',
    gap: 12,
  },
  weekValue: {
    fontSize: 12,
    color: '#374151',
  },
  // Macro Breakdown
  macroContainer: {
    gap: 12,
  },
  macroItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  macroBar: {
    height: 8,
    borderRadius: 4,
    minWidth: 60,
  },
  macroLabel: {
    fontSize: 14,
    color: '#374151',
    fontWeight: '500',
  },
  // Mood Analytics
  moodContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  moodItem: {
    alignItems: 'center',
  },
  moodValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1f2937',
    marginTop: 8,
  },
  moodLabel: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 4,
  },
  // Insights
  insightItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  insightText: {
    fontSize: 14,
    color: '#6b7280',
    marginLeft: 8,
    flex: 1,
    lineHeight: 20,
  },
  // Placeholder
  placeholderContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  placeholderTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1f2937',
    marginTop: 16,
    marginBottom: 8,
  },
  placeholderText: {
    fontSize: 14,
    color: '#6b7280',
    textAlign: 'center',
    lineHeight: 20,
  },
  // Progress bars
  progressContainer: {
    gap: 16,
  },
  progressItem: {
    gap: 8,
  },
  progressLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
  },
  progressBar: {
    height: 8,
    backgroundColor: '#f3f4f6',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#3b82f6',
    borderRadius: 4,
  },
  progressText: {
    fontSize: 12,
    color: '#6b7280',
    textAlign: 'right',
  },
  // Streak
  streakContainer: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  streakValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1f2937',
    marginTop: 8,
  },
  streakLabel: {
    fontSize: 14,
    color: '#6b7280',
    marginTop: 4,
  },
  // Activity breakdown
  activityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 12,
  },
  activityLabel: {
    fontSize: 14,
    color: '#374151',
    minWidth: 80,
  },
  activityBar: {
    flex: 1,
    height: 8,
    backgroundColor: '#f3f4f6',
    borderRadius: 4,
    overflow: 'hidden',
  },
  activityFill: {
    height: '100%',
    backgroundColor: '#3b82f6',
    borderRadius: 4,
  },
  activityCount: {
    fontSize: 12,
    color: '#6b7280',
    minWidth: 30,
    textAlign: 'right',
  },
  // Workout rows
  workoutRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  workoutInfo: {
    flex: 1,
  },
  workoutName: {
    fontSize: 14,
    fontWeight: '500',
    color: '#1f2937',
  },
  workoutDate: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 2,
  },
  workoutStats: {
    alignItems: 'flex-end',
  },
  workoutDuration: {
    fontSize: 14,
    fontWeight: '500',
    color: '#1f2937',
  },
  workoutCalories: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 2,
  },
  // Meal rows
  mealTypeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 12,
  },
  mealTypeLabel: {
    fontSize: 14,
    color: '#374151',
    minWidth: 80,
  },
  mealTypeBar: {
    flex: 1,
    height: 8,
    backgroundColor: '#f3f4f6',
    borderRadius: 4,
    overflow: 'hidden',
  },
  mealTypeFill: {
    height: '100%',
    backgroundColor: '#10b981',
    borderRadius: 4,
  },
  mealTypeCount: {
    fontSize: 12,
    color: '#6b7280',
    minWidth: 30,
    textAlign: 'right',
  },
  mealRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  mealInfo: {
    flex: 1,
  },
  mealName: {
    fontSize: 14,
    fontWeight: '500',
    color: '#1f2937',
  },
  mealDate: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 2,
  },
  mealStats: {
    alignItems: 'flex-end',
  },
  mealCalories: {
    fontSize: 14,
    fontWeight: '500',
    color: '#1f2937',
  },
  mealProtein: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 2,
  },
  // Mood logs
  moodLogRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  moodLogInfo: {
    flex: 1,
  },
  moodLogDate: {
    fontSize: 14,
    fontWeight: '500',
    color: '#1f2937',
  },
  moodLogLabel: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 2,
  },
  moodLogStats: {
    alignItems: 'flex-end',
  },
  moodLogRating: {
    fontSize: 14,
    fontWeight: '500',
    color: '#1f2937',
  },
  moodLogEnergy: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 2,
  },
  // New styles for improved visualization
  progressGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 16,
    gap: 8,
  },
  quickStatsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 16,
  },
  quickStatItem: {
    alignItems: 'center',
    flex: 1,
  },
  quickStatValue: {
    fontSize: 18,
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
  progressCardWrapper: {
    width: '48%',
    marginBottom: 8,
  },
});
