import React from 'react';
import { View, StyleSheet, ScrollView, RefreshControl } from 'react-native';
import DashboardHeaderCard from '../components/dashboard/DashboardHeaderCard';
import WelcomeCard from '../components/dashboard/WelcomeCard';
import BodyTypeCard from '../components/shared/BodyTypeCard';
import SimpleWaterLoggingCard from '../components/health/SimpleWaterLoggingCard';
import DailyStreaks from '../components/dashboard/DailyStreaks';
import AchievementBadges from '../components/dashboard/AchievementBadges';
import PredictiveInsights from '../components/dashboard/PredictiveInsights';
import TrendAnalysis from '../components/dashboard/TrendAnalysis';
import { useProgressMetricsData } from '../hooks/useProgressMetrics';
import { useAchievements, useStreaks, useAIInsights } from '../stores';
import { useAuth } from '../contexts/AuthContext';
import useResponsive from '../hooks/useResponsive';
import { useBodyTypeGoalMetrics } from '../hooks/useBodyTypeGoalMetrics';

interface DashboardModuleProps {
  onRefresh?: () => Promise<void>;
  refreshing?: boolean;
  onNavigate?: (screen: string, params?: any) => void;
}

export default function DashboardModule({
  onRefresh,
  refreshing = false,
  onNavigate,
}: DashboardModuleProps) {
  const { user } = useAuth();
  // Re-enable useProgressMetricsData hook
  const progressData = useProgressMetricsData();
  // Re-enable Zustand hooks with shallow comparison
  const { achievements } = useAchievements();
  const { streaks } = useStreaks();
  const aiInsights = useAIInsights();
  const responsive = useResponsive();
  // Re-enable useBodyTypeGoalMetrics with fixes
  const bodyTypeMetrics = useBodyTypeGoalMetrics();

  const quickStats = [
    {
      label: 'Workouts',
      value: progressData.rings[0]?.value || 0,
      icon: 'fitness',
      color: '#3b82f6',
    },
    {
      label: 'Calories',
      value: progressData.rings[1]?.value || 0,
      icon: 'flame',
      color: '#ef4444',
    },
    {
      label: 'Protein',
      value: progressData.rings[2]?.value || 0,
      icon: 'nutrition',
      color: '#10b981',
    },
    {
      label: 'Steps',
      value: Math.round(progressData.rings[3]?.value || 0),
      icon: 'walk',
      color: '#8b5cf6',
    },
  ];

  const headerActions = [
    {
      icon: 'notifications',
      onPress: () => onNavigate?.('Notifications'),
    },
    {
      icon: 'settings',
      onPress: () => onNavigate?.('Settings'),
    },
  ];

  const dynamicStyles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: '#f8fafc',
    },
    content: {
      flex: 1,
      paddingHorizontal: responsive.breakpoints.isTablet ? 24 : 0,
    },
  });

  return (
    <View style={dynamicStyles.container}>
      <ScrollView
        style={dynamicStyles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={
          onRefresh ? (
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          ) : undefined
        }
      >
        {/* Welcome Card */}
        <WelcomeCard
          userName={user?.full_name || 'there'}
          onPress={() => onNavigate?.('Profile')}
        />

        {/* Dashboard Header Card */}
        <DashboardHeaderCard
          title="Today's Progress"
          subtitle="Your daily health metrics"
          quickStats={quickStats}
          headerActions={headerActions}
        />

              {/* Water Logging - Simplified version */}
              <SimpleWaterLoggingCard />

        {/* Body Type Goal */}
        <BodyTypeCard
          goalName={bodyTypeMetrics.goalName}
          dailyScore={bodyTypeMetrics.dailyScore}
          weeklyAlignment={bodyTypeMetrics.weeklyAlignment}
          weeklyTrend={bodyTypeMetrics.weeklyTrend}
          alignment={bodyTypeMetrics.alignment}
          suggestions={bodyTypeMetrics.suggestions}
          loading={bodyTypeMetrics.loading}
          onLogWorkout={() => onNavigate?.('Fitness')}
          onLogMeal={() => onNavigate?.('Nutrition')}
          onViewAnalytics={() => onNavigate?.('Analytics')}
        />

        {/* Daily Streaks */}
        <DailyStreaks
          streaks={streaks as any}
          onStreakPress={(streak) => {
            console.log('Streak pressed:', streak.type);
          }}
          onViewAll={() => onNavigate?.('Streaks')}
        />

        {/* Achievements */}
        <AchievementBadges
          achievements={achievements as any}
          onAchievementPress={(achievement) => {
            console.log('Achievement pressed:', achievement.title);
          }}
          onViewAll={() => onNavigate?.('Achievements')}
        />

        {/* AI Insights */}
        <PredictiveInsights
          onInsightPress={(insight) => {
            console.log('Insight pressed:', insight.title);
          }}
          onViewAll={() => onNavigate?.('Insights')}
        />

        {/* Trend Analysis */}
        <TrendAnalysis
          onMetricPress={(metric) => {
            console.log('Metric pressed:', metric.type);
          }}
          onViewDetails={(metric) => {
            console.log('View details for:', metric);
          }}
          onViewAll={() => onNavigate?.('Trends')}
        />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  content: {
    flex: 1,
  },
});
