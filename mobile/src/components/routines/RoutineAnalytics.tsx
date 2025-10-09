import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Dimensions,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { routineService, SimpleRoutineWithProgress } from '../../services/routineService';
import { fitnessService } from '../../services/fitnessService';
import { exerciseCategoryService } from '../../services/exerciseCategoryService';
import { COMMON_STYLES } from '../../theme/constants';
import { useExerciseCategories, useExerciseCategoriesActions } from '../../stores';

interface RoutineAnalyticsProps {
  routine: SimpleRoutineWithProgress;
}

interface AnalyticsData {
  totalWorkouts: number;
  completedWorkouts: number;
  completionRate: number;
  averageWorkoutsPerWeek: number;
  currentStreak: number;
  longestStreak: number;
  totalDuration: number;
  averageDuration: number;
  caloriesBurned: number;
  mostFrequentExercise: string;
  weeklyProgress: {
    week: number;
    completed: number;
    planned: number;
  }[];
  exerciseBreakdown: {
    type: string;
    count: number;
    percentage: number;
  }[];
}

const { width } = Dimensions.get('window');

export default function RoutineAnalytics({ routine }: RoutineAnalyticsProps) {
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  
  // Use exercise categories store
  const categories = useExerciseCategories();
  const { loadCategories } = useExerciseCategoriesActions();
  
  // Load categories if not loaded - DISABLED TO PREVENT INFINITE LOOP
  // React.useEffect(() => {
  //   if (categories.length === 0) {
  //     loadCategories();
  //   }
  // }, [categories.length]); // Removed loadCategories from dependencies to prevent infinite loop

  const loadAnalytics = async () => {
    try {
      setLoading(true);
      
      // Get fitness stats for the routine period
      const fitnessStats = await fitnessService.getWorkoutStats('month');
      
      // Calculate routine-specific analytics
      const totalPlannedWorkouts = routine.total_workouts_per_week * routine.duration_weeks;
      const completedWorkouts = routine.user_progress?.workouts_completed || 0;
      const completionRate = totalPlannedWorkouts > 0 ? (completedWorkouts / totalPlannedWorkouts) * 100 : 0;
      
      // Generate weekly progress data
      const weeklyProgress = Array.from({ length: routine.duration_weeks }, (_, index) => ({
        week: index + 1,
        completed: Math.floor(Math.random() * routine.total_workouts_per_week), // TODO: Get real data
        planned: routine.total_workouts_per_week,
      }));
      
      // Generate exercise breakdown using database categories
      const exerciseBreakdown = categories.map(category => ({
        type: category.display_name.toUpperCase(),
        count: Math.floor(Math.random() * 10) + 1,
        percentage: Math.floor(Math.random() * 30) + 10,
      }));
      
      setAnalytics({
        totalWorkouts: totalPlannedWorkouts,
        completedWorkouts,
        completionRate,
        averageWorkoutsPerWeek: routine.total_workouts_per_week,
        currentStreak: Math.floor(Math.random() * 7) + 1, // TODO: Get real data
        longestStreak: Math.floor(Math.random() * 14) + 7, // TODO: Get real data
        totalDuration: fitnessStats.total_duration || 0,
        averageDuration: fitnessStats.average_duration || 0,
        caloriesBurned: fitnessStats.total_calories_burned || 0,
        mostFrequentExercise: 'Push-ups', // TODO: Get real data
        weeklyProgress,
        exerciseBreakdown,
      });
    } catch (error) {
      // Silent error handling - no console logging to prevent Expo Go notifications
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAnalytics();
  }, [routine, loadAnalytics]);

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

  const ProgressBar = ({ percentage, color = '#3b82f6' }: { percentage: number; color?: string }) => (
    <View style={styles.progressBarContainer}>
      <View style={styles.progressBar}>
        <View 
          style={[
            styles.progressFill, 
            { 
              width: `${Math.min(percentage, 100)}%`,
              backgroundColor: color,
            }
          ]} 
        />
      </View>
      <Text style={styles.progressText}>{Math.round(percentage)}%</Text>
    </View>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#3b82f6" />
        <Text style={styles.loadingText}>Loading analytics...</Text>
      </View>
    );
  }

  if (!analytics) {
    return (
      <View style={styles.errorContainer}>
        <Ionicons name="analytics-outline" size={64} color="#9ca3af" />
        <Text style={styles.errorTitle}>No Data Available</Text>
        <Text style={styles.errorText}>
          Complete some workouts to see your analytics
        </Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Overview Stats */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Overview</Text>
        <View style={styles.statsGrid}>
          <StatCard
            icon="checkmark-circle-outline"
            title="Completed"
            value={analytics.completedWorkouts}
            subtitle={`of ${analytics.totalWorkouts} workouts`}
            color="#10b981"
          />
          <StatCard
            icon="trending-up-outline"
            title="Completion Rate"
            value={`${Math.round(analytics.completionRate)}%`}
            subtitle="overall"
            color="#3b82f6"
          />
          <StatCard
            icon="flame-outline"
            title="Streak"
            value={analytics.currentStreak}
            subtitle="days current"
            color="#ef4444"
          />
          <StatCard
            icon="time-outline"
            title="Duration"
            value={`${Math.round(analytics.totalDuration / 60)}h`}
            subtitle="total time"
            color="#8b5cf6"
          />
        </View>
      </View>

      {/* Progress Tracking */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Progress Tracking</Text>
        <View style={styles.progressCard}>
          <View style={styles.progressHeader}>
            <Text style={styles.progressTitle}>Overall Progress</Text>
            <Text style={styles.progressPercentage}>{Math.round(analytics.completionRate)}%</Text>
          </View>
          <ProgressBar percentage={analytics.completionRate} />
          
          <View style={styles.progressDetails}>
            <View style={styles.progressDetailItem}>
              <Text style={styles.progressDetailLabel}>Workouts Completed</Text>
              <Text style={styles.progressDetailValue}>{analytics.completedWorkouts}</Text>
            </View>
            <View style={styles.progressDetailItem}>
              <Text style={styles.progressDetailLabel}>Remaining</Text>
              <Text style={styles.progressDetailValue}>{analytics.totalWorkouts - analytics.completedWorkouts}</Text>
            </View>
            <View style={styles.progressDetailItem}>
              <Text style={styles.progressDetailLabel}>Per Week</Text>
              <Text style={styles.progressDetailValue}>{analytics.averageWorkoutsPerWeek}</Text>
            </View>
          </View>
        </View>
      </View>

      {/* Weekly Progress */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Weekly Progress</Text>
        <View style={styles.weeklyProgressCard}>
          {analytics.weeklyProgress.map((week, index) => (
            <View key={week.week} style={styles.weekItem}>
              <View style={styles.weekHeader}>
                <Text style={styles.weekNumber}>Week {week.week}</Text>
                <Text style={styles.weekStats}>
                  {week.completed}/{week.planned}
                </Text>
              </View>
              <ProgressBar 
                percentage={(week.completed / week.planned) * 100} 
                color={week.completed === week.planned ? '#10b981' : '#3b82f6'}
              />
            </View>
          ))}
        </View>
      </View>

      {/* Exercise Breakdown */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Exercise Breakdown</Text>
        <View style={styles.exerciseBreakdownCard}>
          {analytics.exerciseBreakdown.map((exercise, index) => (
            <View key={index} style={styles.exerciseItem}>
              <View style={styles.exerciseInfo}>
                <Text style={styles.exerciseType}>{exercise.type}</Text>
                <Text style={styles.exerciseCount}>{exercise.count} workouts</Text>
              </View>
              <View style={styles.exerciseProgress}>
                <ProgressBar percentage={exercise.percentage} color="#f59e0b" />
              </View>
            </View>
          ))}
        </View>
      </View>

      {/* Performance Metrics */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Performance Metrics</Text>
        <View style={styles.metricsGrid}>
          <View style={styles.metricCard}>
            <Ionicons name="flame-outline" size={24} color="#ef4444" />
            <Text style={styles.metricValue}>{analytics.caloriesBurned}</Text>
            <Text style={styles.metricLabel}>Calories Burned</Text>
          </View>
          <View style={styles.metricCard}>
            <Ionicons name="time-outline" size={24} color="#3b82f6" />
            <Text style={styles.metricValue}>{Math.round(analytics.averageDuration)}min</Text>
            <Text style={styles.metricLabel}>Avg Duration</Text>
          </View>
          <View style={styles.metricCard}>
            <Ionicons name="trophy-outline" size={24} color="#f59e0b" />
            <Text style={styles.metricValue}>{analytics.longestStreak}</Text>
            <Text style={styles.metricLabel}>Longest Streak</Text>
          </View>
          <View style={styles.metricCard}>
            <Ionicons name="barbell-outline" size={24} color="#10b981" />
            <Text style={styles.metricValue}>{analytics.mostFrequentExercise}</Text>
            <Text style={styles.metricLabel}>Top Exercise</Text>
          </View>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COMMON_STYLES.secondaryBackground,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COMMON_STYLES.secondaryBackground,
  },
  loadingText: {
    fontSize: 16,
    color: '#6b7280',
    marginTop: 12,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COMMON_STYLES.secondaryBackground,
    paddingHorizontal: 32,
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#374151',
    marginTop: 16,
    marginBottom: 8,
  },
  errorText: {
    fontSize: 14,
    color: '#6b7280',
    textAlign: 'center',
    lineHeight: 20,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 12,
    paddingHorizontal: 16,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    paddingHorizontal: 16,
  },
  statCard: {
    flex: 1,
    minWidth: '45%',
    borderRadius: COMMON_STYLES.standardRadius,
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
  progressCard: {
    backgroundColor: '#ffffff',
    marginHorizontal: 16,
    borderRadius: COMMON_STYLES.standardRadius,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  progressTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
  },
  progressPercentage: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#3b82f6',
  },
  progressBarContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  progressBar: {
    flex: 1,
    height: 8,
    backgroundColor: '#f3f4f6',
    borderRadius: 4,
    overflow: 'hidden',
    marginRight: 12,
  },
  progressFill: {
    height: '100%',
    borderRadius: 4,
  },
  progressText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6b7280',
  },
  progressDetails: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  progressDetailItem: {
    alignItems: 'center',
  },
  progressDetailLabel: {
    fontSize: 12,
    color: '#6b7280',
    marginBottom: 4,
  },
  progressDetailValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
  },
  weeklyProgressCard: {
    backgroundColor: '#ffffff',
    marginHorizontal: 16,
    borderRadius: COMMON_STYLES.standardRadius,
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
  weekItem: {
    marginBottom: 16,
  },
  weekHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  weekNumber: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1f2937',
  },
  weekStats: {
    fontSize: 12,
    color: '#6b7280',
  },
  exerciseBreakdownCard: {
    backgroundColor: '#ffffff',
    marginHorizontal: 16,
    borderRadius: COMMON_STYLES.standardRadius,
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
  exerciseItem: {
    marginBottom: 16,
  },
  exerciseInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  exerciseType: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1f2937',
  },
  exerciseCount: {
    fontSize: 12,
    color: '#6b7280',
  },
  exerciseProgress: {
    marginTop: 4,
  },
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    paddingHorizontal: 16,
  },
  metricCard: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: '#ffffff',
    borderRadius: COMMON_STYLES.standardRadius,
    padding: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  metricValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1f2937',
    marginTop: 8,
    marginBottom: 4,
  },
  metricLabel: {
    fontSize: 12,
    color: '#6b7280',
    textAlign: 'center',
  },
});
