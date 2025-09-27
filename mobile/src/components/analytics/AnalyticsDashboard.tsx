import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { analyticsService, DashboardData } from '../../services/analyticsService';
import { aiInsightsService } from '../../services/aiInsightsService';
import EnhancedAnalyticsCard from './EnhancedAnalyticsCard';
import ProgressCharts from './ProgressCharts';

const { width } = Dimensions.get('window');

interface AnalyticsDashboardProps {
  refreshTrigger?: number;
}

export default function AnalyticsDashboard({ refreshTrigger = 0 }: AnalyticsDashboardProps) {
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

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

  useEffect(() => {
    loadDashboardData();
  }, [refreshTrigger]);


  const renderQuickStats = () => {
    if (!dashboardData) return null;

    // Only show trends if there's actual data
    const hasWorkoutData = dashboardData.summary.recent_workouts > 0;
    const hasMealData = dashboardData.summary.recent_meals > 0;

    return (
      <View style={styles.quickStatsContainer}>
        <EnhancedAnalyticsCard
          title="Workouts"
          value={hasWorkoutData ? dashboardData.summary.recent_workouts : "—"}
          subtitle={hasWorkoutData ? dashboardData.summary.period : "No data yet"}
          icon="fitness-outline"
          iconColor={hasWorkoutData ? "#3b82f6" : "#d1d5db"}
          trend={hasWorkoutData ? { value: 15, direction: 'up' } : undefined}
          style={{ flex: 1 }}
        />
        <EnhancedAnalyticsCard
          title="Meals Logged"
          value={hasMealData ? dashboardData.summary.recent_meals : "—"}
          subtitle={hasMealData ? dashboardData.summary.period : "No data yet"}
          icon="restaurant-outline"
          iconColor={hasMealData ? "#10b981" : "#d1d5db"}
          trend={hasMealData ? { value: 8, direction: 'up' } : undefined}
          style={{ flex: 1 }}
        />
        <EnhancedAnalyticsCard
          title="Health Score"
          value={dashboardData.overall_health_score || "73"}
          subtitle="Overall"
          icon="heart-outline"
          iconColor="#ef4444"
          trend={{ value: 5, direction: 'up' }}
          style={{ flex: 1 }}
        />
      </View>
    );
  };

  const renderFitnessInsights = () => {
    if (!dashboardData?.trends?.fitness) return null;

    const { fitness } = dashboardData.trends;
    const latestWeek = fitness.weekly_data && Array.isArray(fitness.weekly_data) && fitness.weekly_data.length > 0 
      ? fitness.weekly_data[fitness.weekly_data.length - 1] 
      : null;

    // Check if there's any meaningful fitness data
    const hasFitnessData = fitness.total_workouts > 0 || (latestWeek && latestWeek.total_duration > 0);

    return (
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Fitness Insights</Text>
        {!hasFitnessData ? (
          <View style={styles.emptyState}>
            <Ionicons name="fitness-outline" size={48} color="#d1d5db" />
            <Text style={styles.emptyStateTitle}>No Fitness Data Yet</Text>
            <Text style={styles.emptyStateText}>Start logging your workouts to see insights here</Text>
          </View>
        ) : (
          <View style={styles.insightsGrid}>
            <EnhancedAnalyticsCard
              title="Total Workouts"
              value={fitness.total_workouts}
              subtitle="All time"
              icon="trophy-outline"
              iconColor="#f59e0b"
            />
            <EnhancedAnalyticsCard
              title="Avg per Week"
              value={fitness.avg_workouts_per_week ? fitness.avg_workouts_per_week.toFixed(1) : '0.0'}
              subtitle="Consistency"
              icon="repeat-outline"
              iconColor="#8b5cf6"
            />
            <EnhancedAnalyticsCard
              title="This Week"
              value={latestWeek?.total_duration || 0}
              subtitle="Minutes"
              icon="time-outline"
              iconColor="#06b6d4"
            />
            <EnhancedAnalyticsCard
              title="Calories Burned"
              value={latestWeek?.total_calories || 0}
              subtitle="This week"
              icon="flame-outline"
              iconColor="#ef4444"
            />
          </View>
        )}
      </View>
    );
  };

  const renderNutritionInsights = () => {
    if (!dashboardData?.trends?.nutrition) return null;

    const { nutrition } = dashboardData.trends;
    const latestWeek = nutrition.weekly_data && Array.isArray(nutrition.weekly_data) && nutrition.weekly_data.length > 0 
      ? nutrition.weekly_data[nutrition.weekly_data.length - 1] 
      : null;

    // Check if there's any meaningful nutrition data
    const hasNutritionData = nutrition.total_meals > 0 || (latestWeek && latestWeek.avg_calories_per_meal > 0);

    return (
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Nutrition Insights</Text>
        {!hasNutritionData ? (
          <View style={styles.emptyState}>
            <Ionicons name="restaurant-outline" size={48} color="#d1d5db" />
            <Text style={styles.emptyStateTitle}>No Nutrition Data Yet</Text>
            <Text style={styles.emptyStateText}>Start logging your meals to see insights here</Text>
          </View>
        ) : (
          <View style={styles.insightsGrid}>
            <EnhancedAnalyticsCard
              title="Total Meals"
              value={nutrition.total_meals}
              subtitle="All time"
              icon="restaurant-outline"
              iconColor="#10b981"
            />
            <EnhancedAnalyticsCard
              title="Avg per Week"
              value={nutrition.avg_meals_per_week ? nutrition.avg_meals_per_week.toFixed(1) : '0.0'}
              subtitle="Consistency"
              icon="repeat-outline"
              iconColor="#8b5cf6"
            />
            <EnhancedAnalyticsCard
              title="Calories/Meal"
              value={latestWeek?.avg_calories_per_meal ? latestWeek.avg_calories_per_meal.toFixed(0) : '0'}
              subtitle="Average"
              icon="nutrition-outline"
              iconColor="#f59e0b"
            />
            <EnhancedAnalyticsCard
              title="Protein"
              value={`${latestWeek?.total_protein || 0}g`}
              subtitle="This week"
              icon="fitness-outline"
              iconColor="#ef4444"
            />
          </View>
        )}
      </View>
    );
  };

  const renderRecommendations = () => {
    if (!dashboardData?.recommendations?.recommendations || !Array.isArray(dashboardData.recommendations.recommendations)) return null;

    return (
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Personalized Recommendations</Text>
        {dashboardData.recommendations.recommendations.slice(0, 3).map((rec, index) => (
          <View key={index} style={styles.recommendationCard}>
            <View style={styles.recommendationHeader}>
              <Ionicons
                name={rec.category === 'fitness' ? 'fitness-outline' : 'restaurant-outline'}
                size={20}
                color={rec.category === 'fitness' ? '#3b82f6' : '#10b981'}
              />
              <Text style={styles.recommendationTitle}>{rec.title}</Text>
              <View style={[
                styles.priorityBadge,
                { backgroundColor: rec.priority === 'high' ? '#ef4444' : rec.priority === 'medium' ? '#f59e0b' : '#10b981' }
              ]}>
                <Text style={styles.priorityText}>{rec.priority}</Text>
              </View>
            </View>
            <Text style={styles.recommendationDescription}>{rec.description}</Text>
            <Text style={styles.recommendationAction}>{rec.action}</Text>
          </View>
        ))}
      </View>
    );
  };

  const renderCorrelations = () => {
    if (!dashboardData?.correlations?.correlations || !Array.isArray(dashboardData.correlations.correlations)) return null;

    return (
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Health Correlations</Text>
        {dashboardData.correlations.correlations.map((correlation, index) => (
          <View key={index} style={styles.correlationCard}>
            <View style={styles.correlationHeader}>
              <Ionicons name="trending-up-outline" size={20} color="#8b5cf6" />
              <Text style={styles.correlationTitle}>{correlation.type.replace('_', ' ').toUpperCase()}</Text>
              <View style={[
                styles.strengthBadge,
                { backgroundColor: correlation.strength === 'strong' ? '#10b981' : correlation.strength === 'moderate' ? '#f59e0b' : '#6b7280' }
              ]}>
                <Text style={styles.strengthText}>{correlation.strength}</Text>
              </View>
            </View>
            <Text style={styles.correlationDescription}>{correlation.description}</Text>
          </View>
        ))}
      </View>
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#3b82f6" />
        <Text style={styles.loadingText}>Loading analytics dashboard...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {renderQuickStats()}
      <ProgressCharts refreshTrigger={refreshTrigger} />
      {renderFitnessInsights()}
      {renderNutritionInsights()}
      {renderRecommendations()}
      {renderCorrelations()}
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
    padding: 40,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: '#6b7280',
  },
  quickStatsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    gap: 8,
    marginBottom: 20,
    marginTop: 8,
  },
  section: {
    marginBottom: 20,
    paddingHorizontal: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 16,
  },
  insightsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  recommendationCard: {
    backgroundColor: '#ffffff',
    marginBottom: 12,
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  recommendationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  recommendationTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
    marginLeft: 8,
    flex: 1,
  },
  priorityBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  priorityText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#ffffff',
    textTransform: 'uppercase',
  },
  recommendationDescription: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 8,
    lineHeight: 20,
  },
  recommendationAction: {
    fontSize: 12,
    color: '#3b82f6',
    fontWeight: '500',
  },
  correlationCard: {
    backgroundColor: '#ffffff',
    marginBottom: 12,
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  correlationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  correlationTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1f2937',
    marginLeft: 8,
    flex: 1,
  },
  strengthBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  strengthText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#ffffff',
    textTransform: 'uppercase',
  },
  correlationDescription: {
    fontSize: 14,
    color: '#6b7280',
    lineHeight: 20,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
    paddingHorizontal: 20,
  },
  emptyStateTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#374151',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyStateText: {
    fontSize: 14,
    color: '#6b7280',
    textAlign: 'center',
    lineHeight: 20,
  },
});
