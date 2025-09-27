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
import AnalyticsDashboard from '../../components/analytics/AnalyticsDashboard';
import { hapticFeedback } from '../../utils/haptics';
import { analyticsService, DashboardData } from '../../services/analyticsService';

export default function AnalyticsScreen() {
  const [activeTab, setActiveTab] = useState<'overview' | 'fitness' | 'nutrition' | 'mood'>('overview');
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      const data = await analyticsService.getDashboardData();
      setDashboardData(data);
    } catch (error) {
      console.error('Failed to load dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    hapticFeedback.light();
    await loadDashboardData();
    setRefreshing(false);
  };

  useEffect(() => {
    loadDashboardData();
  }, []);

  const tabs = [
    { key: 'overview', label: 'Overview', icon: 'analytics-outline' },
    { key: 'fitness', label: 'Fitness', icon: 'fitness-outline' },
    { key: 'nutrition', label: 'Nutrition', icon: 'restaurant-outline' },
    { key: 'mood', label: 'Mood', icon: 'happy-outline' },
  ] as const;


  const renderFitnessAnalytics = () => {
    if (!dashboardData?.trends?.fitness) return null;

    const { fitness } = dashboardData.trends;
    const latestWeek = fitness.weekly_data && Array.isArray(fitness.weekly_data) && fitness.weekly_data.length > 0 
      ? fitness.weekly_data[fitness.weekly_data.length - 1] 
      : null;

    return (
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Fitness Summary */}
        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Fitness Summary</Text>
          <View style={styles.metricRow}>
            <View style={styles.metricItem}>
              <Text style={styles.metricValue}>{fitness.total_workouts}</Text>
              <Text style={styles.metricLabel}>Total Workouts</Text>
            </View>
            <View style={styles.metricItem}>
              <Text style={styles.metricValue}>{fitness.avg_workouts_per_week ? fitness.avg_workouts_per_week.toFixed(1) : '0.0'}</Text>
              <Text style={styles.metricLabel}>Avg/Week</Text>
            </View>
            <View style={styles.metricItem}>
              <Text style={styles.metricValue}>{latestWeek?.total_duration || 0}</Text>
              <Text style={styles.metricLabel}>Minutes</Text>
            </View>
          </View>
        </View>

        {/* Trend Indicator */}
        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Trend</Text>
          <View style={styles.trendContainer}>
            <Ionicons 
              name={fitness.trend === 'increasing' ? 'trending-up' : fitness.trend === 'decreasing' ? 'trending-down' : 'remove'} 
              size={24} 
              color={fitness.trend === 'increasing' ? '#10b981' : fitness.trend === 'decreasing' ? '#ef4444' : '#6b7280'} 
            />
            <Text style={[styles.trendText, { color: fitness.trend === 'increasing' ? '#10b981' : fitness.trend === 'decreasing' ? '#ef4444' : '#6b7280' }]}>
              {fitness.trend ? fitness.trend.charAt(0).toUpperCase() + fitness.trend.slice(1) : 'Unknown'} workout frequency
            </Text>
          </View>
        </View>

        {/* Weekly Breakdown */}
        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Weekly Breakdown</Text>
          {fitness.weekly_data && Array.isArray(fitness.weekly_data) ? (
            fitness.weekly_data.slice(-4).map((week, index) => (
              <View key={week.week} style={styles.weekRow}>
                <Text style={styles.weekLabel}>Week {fitness.weekly_data.length - 3 + index}</Text>
                <View style={styles.weekMetrics}>
                  <Text style={styles.weekValue}>{week.workouts} workouts</Text>
                  <Text style={styles.weekValue}>{week.total_duration}min</Text>
                  <Text style={styles.weekValue}>{week.total_calories} cal</Text>
                </View>
              </View>
            ))
          ) : (
            <Text style={styles.placeholderText}>No weekly data available</Text>
          )}
        </View>
      </ScrollView>
    );
  };

  const renderNutritionAnalytics = () => {
    if (!dashboardData?.trends?.nutrition) return null;

    const { nutrition } = dashboardData.trends;
    const latestWeek = nutrition.weekly_data && Array.isArray(nutrition.weekly_data) && nutrition.weekly_data.length > 0 
      ? nutrition.weekly_data[nutrition.weekly_data.length - 1] 
      : null;

    return (
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Nutrition Summary */}
        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Nutrition Summary</Text>
          <View style={styles.metricRow}>
            <View style={styles.metricItem}>
              <Text style={styles.metricValue}>{nutrition.total_meals}</Text>
              <Text style={styles.metricLabel}>Total Meals</Text>
            </View>
            <View style={styles.metricItem}>
              <Text style={styles.metricValue}>{nutrition.avg_meals_per_week ? nutrition.avg_meals_per_week.toFixed(1) : '0.0'}</Text>
              <Text style={styles.metricLabel}>Avg/Week</Text>
            </View>
            <View style={styles.metricItem}>
              <Text style={styles.metricValue}>{latestWeek?.avg_calories_per_meal ? latestWeek.avg_calories_per_meal.toFixed(0) : '0'}</Text>
              <Text style={styles.metricLabel}>Cal/Meal</Text>
            </View>
          </View>
        </View>

        {/* Macro Breakdown */}
        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Macro Breakdown (Latest Week)</Text>
          <View style={styles.macroContainer}>
            <View style={styles.macroItem}>
              <View style={[styles.macroBar, { backgroundColor: '#ef4444', width: '60%' }]} />
              <Text style={styles.macroLabel}>Protein: {latestWeek?.total_protein || 0}g</Text>
            </View>
            <View style={styles.macroItem}>
              <View style={[styles.macroBar, { backgroundColor: '#3b82f6', width: '70%' }]} />
              <Text style={styles.macroLabel}>Carbs: {latestWeek?.total_carbs || 0}g</Text>
            </View>
            <View style={styles.macroItem}>
              <View style={[styles.macroBar, { backgroundColor: '#f59e0b', width: '50%' }]} />
              <Text style={styles.macroLabel}>Fat: {latestWeek?.total_fat || 0}g</Text>
            </View>
          </View>
        </View>

        {/* Weekly Breakdown */}
        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Weekly Breakdown</Text>
          {nutrition.weekly_data && Array.isArray(nutrition.weekly_data) ? (
            nutrition.weekly_data.slice(-4).map((week, index) => (
              <View key={week.week} style={styles.weekRow}>
                <Text style={styles.weekLabel}>Week {nutrition.weekly_data.length - 3 + index}</Text>
                <View style={styles.weekMetrics}>
                  <Text style={styles.weekValue}>{week.meals} meals</Text>
                  <Text style={styles.weekValue}>{week.avg_calories_per_meal ? week.avg_calories_per_meal.toFixed(0) : '0'} cal</Text>
                  <Text style={styles.weekValue}>{week.total_protein}g protein</Text>
                </View>
              </View>
            ))
          ) : (
            <Text style={styles.placeholderText}>No weekly data available</Text>
          )}
        </View>
      </ScrollView>
    );
  };

  const renderMoodAnalytics = () => {
    return (
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Mood & Wellness</Text>
          <View style={styles.moodContainer}>
            <View style={styles.moodItem}>
              <Ionicons name="happy-outline" size={32} color="#10b981" />
              <Text style={styles.moodValue}>7.2</Text>
              <Text style={styles.moodLabel}>Average Mood</Text>
            </View>
            <View style={styles.moodItem}>
              <Ionicons name="battery-half-outline" size={32} color="#3b82f6" />
              <Text style={styles.moodValue}>75%</Text>
              <Text style={styles.moodLabel}>Energy Level</Text>
            </View>
            <View style={styles.moodItem}>
              <Ionicons name="shield-checkmark-outline" size={32} color="#8b5cf6" />
              <Text style={styles.moodValue}>68%</Text>
              <Text style={styles.moodLabel}>Stability</Text>
            </View>
          </View>
        </View>

        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Wellness Insights</Text>
          <View style={styles.insightItem}>
            <Ionicons name="bulb-outline" size={20} color="#f59e0b" />
            <Text style={styles.insightText}>Your mood improves by 23% on workout days</Text>
          </View>
          <View style={styles.insightItem}>
            <Ionicons name="trending-up-outline" size={20} color="#10b981" />
            <Text style={styles.insightText}>Energy levels have been consistently high this week</Text>
          </View>
          <View style={styles.insightItem}>
            <Ionicons name="time-outline" size={20} color="#3b82f6" />
            <Text style={styles.insightText}>Best mood times: 9-11 AM and 6-8 PM</Text>
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
          <View style={styles.content}>
            <AnalyticsDashboard refreshTrigger={refreshing ? 1 : 0} />
          </View>
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
});
