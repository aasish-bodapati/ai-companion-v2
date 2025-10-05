import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  Alert,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import { useAuth } from '../../contexts/AuthContext';
import { BodyTypeGoal, UserAttributes } from '../../services/bodyTypeGoals';
import { profileService } from '../../services/profileService';
import TimePeriodSelector, { TimePeriod } from '../../components/analytics/TimePeriodSelector';
import GoalAlignmentHero from '../../components/analytics/GoalAlignmentHero';
import TimeBasedTrends from '../../components/analytics/TimeBasedTrends';
import ComparisonInsights from '../../components/analytics/ComparisonInsights';

export default function AnalyticsScreen() {
  const { user } = useAuth();
  const [bodyTypeGoal, setBodyTypeGoal] = useState<BodyTypeGoal | null>(null);
  const [userAttributes, setUserAttributes] = useState<UserAttributes | null>(null);
  const [selectedPeriod, setSelectedPeriod] = useState<TimePeriod>('week');
  const [loading, setLoading] = useState(true);

  const loadUserData = useCallback(async () => {
    try {
      setLoading(true);
      
      // Load user's body type goal
      const { getBodyTypeGoalById } = await import('../../services/bodyTypeGoals');
      
      const profile = await profileService.getUserProfile();
      if (profile?.bodyTypeGoal) {
        const goal = await getBodyTypeGoalById(profile.bodyTypeGoal);
        setBodyTypeGoal(goal);
      }

      // Set user attributes
      if (profile?.health_data) {
        setUserAttributes({
          age: parseInt(profile.health_data.age || '25'),
          weight: parseInt(profile.health_data.weight || '70'),
          height: parseInt(profile.health_data.height || '175'),
          gender: (profile.health_data.gender as 'male' | 'female' | 'other') || 'male',
          activityLevel: (profile.health_data.activity_level as 'sedentary' | 'light' | 'moderate' | 'active' | 'very_active') || 'moderate',
          ffm: profile.health_data.ffm ? parseFloat(profile.health_data.ffm) : undefined,
          smm: profile.health_data.smm ? parseFloat(profile.health_data.smm) : undefined,
          bodyFat: profile.health_data.body_fat_percentage ? parseFloat(profile.health_data.body_fat_percentage) : undefined,
        });
      }
      
    } catch (error) {
      Alert.alert('Error', 'Failed to load analytics data');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadUserData();
  }, [loadUserData]);

  const handlePeriodChange = (period: TimePeriod) => {
    setSelectedPeriod(period);
    // TODO: Fetch data for the selected period
    console.log('Period changed to:', period);
  };

  const handleCustomRangePress = () => {
    // TODO: Open custom date range picker
    console.log('Custom range pressed');
  };

  // Mock data - replace with real data from APIs
  const goalAlignmentData = {
    alignmentPercentage: 78,
    trend: 'up' as const,
    trendValue: 12,
    dailyScore: 42,
    weeklyScore: 285,
    breakdown: {
      workouts: 85,
      nutrition: 72,
      consistency: 90,
    },
  };

  const workoutTrendData = [
    { date: '2024-01-01', value: 3 },
    { date: '2024-01-02', value: 0 },
    { date: '2024-01-03', value: 2 },
    { date: '2024-01-04', value: 4 },
    { date: '2024-01-05', value: 1 },
    { date: '2024-01-06', value: 3 },
    { date: '2024-01-07', value: 2 },
  ];

  const nutritionTrendData = [
    { date: '2024-01-01', value: 2200 },
    { date: '2024-01-02', value: 1800 },
    { date: '2024-01-03', value: 2400 },
    { date: '2024-01-04', value: 2100 },
    { date: '2024-01-05', value: 1900 },
    { date: '2024-01-06', value: 2300 },
    { date: '2024-01-07', value: 2000 },
  ];

  const moodTrendData = [
    { date: '2024-01-01', value: 4 },
    { date: '2024-01-02', value: 3 },
    { date: '2024-01-03', value: 5 },
    { date: '2024-01-04', value: 4 },
    { date: '2024-01-05', value: 3 },
    { date: '2024-01-06', value: 4 },
    { date: '2024-01-07', value: 5 },
  ];

  const comparisonData = [
    {
      metric: 'Workouts',
      currentValue: 15,
      previousValue: 12,
      change: 25,
      trend: 'up' as const,
      icon: 'fitness-outline',
      color: '#10b981',
      unit: ' sessions',
    },
    {
      metric: 'Protein Intake',
      currentValue: 120,
      previousValue: 95,
      change: 26.3,
      trend: 'up' as const,
      icon: 'leaf-outline',
      color: '#3b82f6',
      unit: 'g',
    },
    {
      metric: 'Calories',
      currentValue: 2100,
      previousValue: 2200,
      change: -4.5,
      trend: 'down' as const,
      icon: 'flame-outline',
      color: '#f97316',
      unit: ' cal',
    },
    {
      metric: 'Consistency',
      currentValue: 85,
      previousValue: 78,
      change: 9,
      trend: 'up' as const,
      icon: 'checkmark-circle-outline',
      color: '#f59e0b',
      unit: '%',
    },
  ];

  const achievements = [
    {
      id: '1',
      title: 'Workout Warrior',
      description: 'Completed 5 workouts this week',
      icon: 'trophy',
      color: '#f59e0b',
      unlocked: true,
    },
    {
      id: '2',
      title: 'Protein Pro',
      description: 'Hit protein goal 5 days in a row',
      icon: 'leaf',
      color: '#10b981',
      unlocked: true,
    },
    {
      id: '3',
      title: 'Consistency King',
      description: 'Log activities for 7 days straight',
      icon: 'checkmark-circle',
      color: '#3b82f6',
      unlocked: false,
      progress: 75,
    },
  ];

  if (loading) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <StatusBar barStyle="dark-content" />
        <ActivityIndicator size="large" color="#3b82f6" />
        <Text style={styles.loadingText}>Loading your analytics...</Text>
      </SafeAreaView>
    );
  }

  if (!bodyTypeGoal || !userAttributes) {
    return (
      <SafeAreaView style={styles.errorContainer}>
        <StatusBar barStyle="dark-content" />
        <Text style={styles.errorText}>
          Please complete your onboarding and select a body type goal to view analytics.
        </Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />
      
      <ScrollView 
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
      >
        {/* Time Period Selector */}
        <TimePeriodSelector
          selectedPeriod={selectedPeriod}
          onPeriodChange={handlePeriodChange}
          onCustomRangePress={handleCustomRangePress}
        />

        {/* Goal Alignment Hero Card */}
        <GoalAlignmentHero
          goalName={bodyTypeGoal.name}
          data={goalAlignmentData}
          onViewDailyLogs={() => console.log('View daily logs')}
          onViewBodyTypeDashboard={() => console.log('View body type dashboard')}
        />

        {/* Time-Based Trends */}
        <TimeBasedTrends
          workoutData={workoutTrendData}
          nutritionData={nutritionTrendData}
          moodData={moodTrendData}
          onWorkoutDataPointPress={(point) => console.log('Workout point pressed:', point)}
          onNutritionDataPointPress={(point) => console.log('Nutrition point pressed:', point)}
          onMoodDataPointPress={(point) => console.log('Mood point pressed:', point)}
        />

        {/* Comparison & Insights */}
        <ComparisonInsights
          comparisons={comparisonData}
          achievements={achievements}
          onMetricPress={(metric) => console.log('Metric pressed:', metric)}
          onAchievementPress={(achievement) => console.log('Achievement pressed:', achievement)}
        />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  scrollView: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#6b7280',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#f8fafc',
  },
  errorText: {
    fontSize: 16,
    color: '#ef4444',
    textAlign: 'center',
  },
});
