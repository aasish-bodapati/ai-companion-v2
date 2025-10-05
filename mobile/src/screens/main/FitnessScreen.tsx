import React, { useState, useEffect } from 'react';
import { useFocusEffect } from '@react-navigation/native';
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
import TodaysSnapshot from '../../components/fitness/TodaysSnapshot';
import UnifiedWorkoutLogger from '../../components/fitness/UnifiedWorkoutLogger';
import SmartRoutineManager from '../../components/fitness/SmartRoutineManager';
import ProgressTracking from '../../components/fitness/ProgressTracking';
import FitnessLogsView from '../../components/fitness/FitnessLogsView';
import WeeklyActivityChart from '../../components/fitness/WeeklyActivityChart';
import ComprehensiveRoutineModal from '../../components/routines/ComprehensiveRoutineModal';
import { fitnessService, WorkoutStats } from '../../services/fitnessService';
import { dashboardService } from '../../services/dashboardService';
import { routineService } from '../../services/routineService';
import useResponsive from '../../hooks/useResponsive';
import { DUPLICATE_STYLES } from '../../theme/duplicateStyles';
import { isFeatureEnabled } from '../../config/featureFlags';
import { MigrationHelpers } from '../../utils/migrationHelpers';

export default function FitnessScreen() {
  const [activeTab, setActiveTab] = useState<'overview' | 'routines' | 'logs'>('overview');
  const [fitnessLogsKey, setFitnessLogsKey] = useState(0);
  const [showUnifiedWorkoutLogger, setShowUnifiedWorkoutLogger] = useState(false);
  const [showCreateRoutineModal, setShowCreateRoutineModal] = useState(false);
  const [selectedRoutine, setSelectedRoutine] = useState<any>(null);
  const [recommendedWorkout, setRecommendedWorkout] = useState<any>(null);
  const responsive = useResponsive();
  
  // Overview state
  const [weekStats, setWeekStats] = useState<WorkoutStats | null>(null);
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


  const loadWeekStats = async () => {
    try {
      // Get recent workouts for the week
      const workouts = await fitnessService.getFitnessLogs({ period: 'week' });
      
      // Calculate stats from the workouts
      const totalWorkouts = workouts.length;
      const totalDuration = workouts.reduce((sum, workout) => sum + (workout.duration_minutes || 0), 0);
      const totalCalories = workouts.reduce((sum, workout) => sum + (workout.calories_burned || 0), 0);
      const averageDuration = totalWorkouts > 0 ? totalDuration / totalWorkouts : 0;
      const averageCalories = totalWorkouts > 0 ? totalCalories / totalWorkouts : 0;
      
      // Find most common activity
      const activityCounts: { [key: string]: number } = {};
      workouts.forEach(workout => {
        const activity = workout.activity_type || 'Unknown';
        activityCounts[activity] = (activityCounts[activity] || 0) + 1;
      });
      const mostCommonActivity = Object.keys(activityCounts).reduce((a, b) => 
        activityCounts[a] > activityCounts[b] ? a : b, 'No data'
      );
      
      // Find longest workout
      const longestWorkout = workouts.reduce((max, workout) => 
        Math.max(max, workout.duration_minutes || 0), 0
      );
      
      setWeekStats({
        total_workouts: totalWorkouts,
        total_duration: totalDuration,
        total_calories_burned: totalCalories,
        average_duration: Math.round(averageDuration),
        average_calories: Math.round(averageCalories),
        most_common_activity: mostCommonActivity,
        longest_workout: longestWorkout,
        this_week_workouts: totalWorkouts,
        this_month_workouts: totalWorkouts, // Simplified for now
      });
    } catch (error) {
      // Silent error handling - no console logging to prevent Expo Go notifications
      // Set fallback stats
      setWeekStats({
        total_workouts: 0,
        total_duration: 0,
        total_calories_burned: 0,
        average_duration: 0,
        average_calories: 0,
        most_common_activity: 'No data',
        longest_workout: 0,
        this_week_workouts: 0,
        this_month_workouts: 0,
      });
    }
  };

  const loadWeeklyActivityData = async () => {
    try {
      // Get recent workouts for the week
      const response = await fitnessService.getFitnessLogs({ period: 'week' });
      
      // Extract workouts array from response
      const workouts = response?.workouts || response || [];
      
      // Group workouts by day of week
      const weeklyData = {
        monday: 0,
        tuesday: 0,
        wednesday: 0,
        thursday: 0,
        friday: 0,
        saturday: 0,
        sunday: 0,
      };
      
      if (Array.isArray(workouts)) {
        workouts.forEach(workout => {
        const date = new Date(workout.activity_date);
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

  // Reset to overview tab every time the screen comes into focus
  useFocusEffect(
    React.useCallback(() => {
      setActiveTab('overview');
    }, [])
  );

  const handleRoutineCreated = () => {
    setShowCreateRoutineModal(false);
  };

  const handleWorkoutLogged = (workoutData: any) => {
    setShowUnifiedWorkoutLogger(false);
    setRecommendedWorkout(null);
    loadOverviewData(); // Refresh overview data after logging workout
    
    // Force component remount with new key
    setFitnessLogsKey(prev => {
      const newKey = prev + 1;
      return newKey;
    });
  };

  const handleFitnessLogsRefresh = () => {
    // This will trigger a re-render of the FitnessLogsView
    setFitnessLogsKey(prev => prev + 1);
  };

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


  // No predefined workout - users create their own
  const todaysWorkout = recommendedWorkout || null;

  const progressRings = [
    {
      id: '1',
      title: 'Weekly Goal',
      current: weekStats?.total_workouts || 0,
      target: 5,
      color: '#3b82f6',
      icon: 'fitness-outline',
      unit: 'workouts',
    },
    {
      id: '2',
      title: 'Calories',
      current: weekStats?.total_calories_burned || 0,
      target: 2000,
      color: '#f97316',
      icon: 'flame-outline',
      unit: 'cal',
    },
    {
      id: '3',
      title: 'Duration',
      current: Math.round((weekStats?.total_duration || 0) / 60),
      target: 300,
      color: '#10b981',
      icon: 'time-outline',
      unit: 'min',
    },
  ];

  const achievements = [
    {
      id: '1',
      title: 'First Workout',
      description: 'Complete your first workout',
      icon: 'trophy',
      color: '#f59e0b',
      unlocked: true,
      unlockedAt: '2024-01-15',
    },
    {
      id: '2',
      title: 'Week Warrior',
      description: 'Complete 5 workouts in a week',
      icon: 'flame',
      color: '#ef4444',
      unlocked: false,
      progress: 80,
    },
    {
      id: '3',
      title: 'Consistency King',
      description: 'Work out 7 days in a row',
      icon: 'checkmark-circle',
      color: '#10b981',
      unlocked: false,
      progress: 60,
    },
  ];

  const streaks = [
    {
      type: 'Workout',
      count: 3,
      icon: 'fitness',
      color: '#3b82f6',
    },
    {
      type: 'Calories',
      count: 5,
      icon: 'flame',
      color: '#f97316',
    },
  ];

  const renderOverview = () => (
    <ScrollView
      style={styles.content}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
      showsVerticalScrollIndicator={false}
    >
      {/* Today's Snapshot */}
      <TodaysSnapshot
        weeklyWorkouts={weekStats?.total_workouts || 0}
        alignmentScore={75}
        caloriesBurned={weekStats?.total_calories_burned || 0}
        streak={3}
        todaysWorkout={todaysWorkout}
        onQuickLog={() => setShowUnifiedWorkoutLogger(true)}
        onViewWorkout={(workout) => {
          setRecommendedWorkout(workout);
          setShowUnifiedWorkoutLogger(true);
        }}
        onViewProgress={() => setActiveTab('logs')}
      />

      {/* Progress Tracking */}
      <ProgressTracking
        progressRings={progressRings}
        achievements={achievements}
        streaks={streaks}
        onRingPress={(ring) => {
          // Handle ring press - could navigate to detailed view
        }}
        onAchievementPress={(achievement) => {
          // Handle achievement press - could show achievement details
        }}
        onStreakPress={(streak) => {
          // Handle streak press - could show streak details
        }}
      />

      {/* Weekly Activity Chart */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Weekly Activity</Text>
        <WeeklyActivityChart 
          weeklyData={weeklyActivityData}
          color="#f97316"
        />
      </View>
    </ScrollView>
  );

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Fitness Hub</Text>
        <Text style={styles.subtitle}>Track your progress, build strength.</Text>
      </View>

      {/* Tab Navigation */}
      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'overview' && styles.activeTab]}
          onPress={() => setActiveTab('overview')}
        >
          <Ionicons 
            name="analytics-outline" 
            size={20} 
            color={activeTab === 'overview' ? '#f97316' : '#6b7280'} 
          />
          <Text style={[
            styles.tabText,
            activeTab === 'overview' && styles.activeTabText
          ]}>
            Overview
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tab, activeTab === 'routines' && styles.activeTab]}
          onPress={() => setActiveTab('routines')}
        >
          <Ionicons 
            name="list-outline" 
            size={20} 
            color={activeTab === 'routines' ? '#f97316' : '#6b7280'} 
          />
          <Text style={[
            styles.tabText,
            activeTab === 'routines' && styles.activeTabText
          ]}>
            Routines
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tab, activeTab === 'logs' && styles.activeTab]}
          onPress={() => setActiveTab('logs')}
        >
          <Ionicons 
            name="calendar-outline" 
            size={20} 
            color={activeTab === 'logs' ? '#f97316' : '#6b7280'} 
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
       activeTab === 'routines' ? (
        <SmartRoutineManager
          userBodyTypeGoal="steady"
          onRoutineSelect={(routine) => {
            setRecommendedWorkout(routine);
            setShowUnifiedWorkoutLogger(true);
          }}
          onCreateRoutine={() => setShowCreateRoutineModal(true)}
          onEditRoutine={(routine) => {
            setSelectedRoutine(routine);
            // Handle edit routine
          }}
          onSetActive={async (routine) => {
            try {
              await routineService.setActiveRoutine(routine.id.toString());
              // Refresh data to show updated active routine
              handleFitnessLogsRefresh();
            } catch (error) {
              // Handle error silently for MVP
            }
          }}
          onSetInactive={async (routine) => {
            try {
              await routineService.clearActiveRoutine();
              // Refresh data to show updated active routine
              handleFitnessLogsRefresh();
            } catch (error) {
              // Handle error silently for MVP
            }
          }}
        />
      ) : (
        <FitnessLogsView
          key={fitnessLogsKey}
          onRefresh={handleFitnessLogsRefresh}
        />
      )}

      {/* Unified Workout Logger */}
      <UnifiedWorkoutLogger
        visible={showUnifiedWorkoutLogger}
        onClose={() => setShowUnifiedWorkoutLogger(false)}
        onSave={handleWorkoutLogged}
        initialWorkout={recommendedWorkout}
        routineId={recommendedWorkout?.routine_id}
      />

      {/* Create Routine Modal */}
      <ComprehensiveRoutineModal
        isVisible={showCreateRoutineModal}
        onClose={() => setShowCreateRoutineModal(false)}
        onRoutineCreated={handleRoutineCreated}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: MigrationHelpers.replaceStyle(
      '#f8fafc',
      DUPLICATE_STYLES.BACKGROUND_F8FAFC
    ),
  },
  header: {
    paddingHorizontal: MigrationHelpers.replaceStyle(
      20,
      DUPLICATE_STYLES.PADDING_HORIZONTAL_20
    ),
    paddingTop: 20,
    paddingBottom: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: MigrationHelpers.replaceStyle(
      '#1f2937',
      DUPLICATE_STYLES.COLORS.TEXT_PRIMARY
    ),
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: MigrationHelpers.replaceStyle(
      '#6b7280',
      DUPLICATE_STYLES.COLORS.TEXT_SECONDARY
    ),
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
    backgroundColor: '#f97316',
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
  // Overview styles
  content: {
    flex: 1,
    paddingHorizontal: 0,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1f2937',
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
  weekCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 20,
    marginHorizontal: 16,
    marginBottom: 12,
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  weekStat: {
    alignItems: 'center',
    flex: 1,
  },
  weekValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 4,
  },
  weekLabel: {
    fontSize: 14,
    color: '#6b7280',
    textAlign: 'center',
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