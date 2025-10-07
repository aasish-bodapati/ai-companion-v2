import React, { useState, useEffect, useCallback } from 'react';
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
import { useFitnessStore, useFitnessWeekStats, useFitnessLoading } from '../../stores';
import { useAuth } from '../../contexts/AuthContext';
import TodaysSnapshot from '../../components/fitness/TodaysSnapshot';
import UnifiedWorkoutLogger from '../../components/fitness/UnifiedWorkoutLogger';
import SmartRoutineManager from '../../components/fitness/SmartRoutineManager';
import ProgressTracking from '../../components/fitness/ProgressTracking';
import FitnessLogsView from '../../components/fitness/FitnessLogsView';
import WeeklyActivityChart from '../../components/fitness/WeeklyActivityChart';
import ComprehensiveRoutineModal from '../../components/routines/ComprehensiveRoutineModal';
import { fitnessService } from '../../services/fitnessService';
import { routineService } from '../../services/routineService';

export default function FitnessScreen() {
  // Use individual selectors instead of the actions object to prevent infinite loops
  const refreshFitnessData = useFitnessStore((state) => state.refreshFitnessData);
  const addWorkout = useFitnessStore((state) => state.addWorkout);
  const weekStats = useFitnessWeekStats();
  const loading = useFitnessLoading();
  const { user } = useAuth();
  
  const [activeTab, setActiveTab] = useState<'overview' | 'routines' | 'logs'>('overview');
  const [fitnessLogsKey, setFitnessLogsKey] = useState(0);
  const [showUnifiedWorkoutLogger, setShowUnifiedWorkoutLogger] = useState(false);
  const [showCreateRoutineModal, setShowCreateRoutineModal] = useState(false);
  const [recommendedWorkout, setRecommendedWorkout] = useState<{ routine_id?: string; activity_type?: string } | null>(null);
  
  // Overview state
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


  const loadWeekStats = useCallback(async () => {
    // This is now handled by the Zustand store
    await refreshFitnessData();
  }, [refreshFitnessData]);

  const loadWeeklyActivityData = useCallback(async () => {
    try {
      // Get recent workouts for the week
      const response = await fitnessService.getFitnessLogs({ period: 'week' });
      
      // Extract workouts array from response
      const workouts = Array.isArray(response) ? response : [];
      
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
  }, [loadWeekStats, loadWeeklyActivityData]);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadOverviewData();
    setRefreshing(false);
  };

  useEffect(() => {
    // Only load data if user is authenticated
    if (user) {
      loadOverviewData();
    }
  }, [user, loadOverviewData]); // Load data when user changes

  // Reset to overview tab every time the screen comes into focus
  useFocusEffect(
    React.useCallback(() => {
      setActiveTab('overview');
    }, [])
  );

  const handleRoutineCreated = () => {
    setShowCreateRoutineModal(false);
  };

  const handleWorkoutLogged = useCallback(async (workoutData: {
    activity_type?: string;
    duration_minutes?: number;
    calories_burned?: number;
    notes?: string;
    activity_date?: string;
    routine_id?: string;
  }) => {
    setShowUnifiedWorkoutLogger(false);
    setRecommendedWorkout(null);
    
    // Add workout to store
    addWorkout({
      id: Date.now().toString(),
      activity_type: workoutData.activity_type || 'Unknown',
      duration_minutes: workoutData.duration_minutes || 0,
      calories_burned: workoutData.calories_burned || 0,
      notes: workoutData.notes || '',
      activity_date: workoutData.activity_date || new Date().toISOString(),
      routine_id: workoutData.routine_id,
    });
    
    await refreshFitnessData();
    
    // Force component remount with new key
    setFitnessLogsKey(prev => prev + 1);
  }, [addWorkout, refreshFitnessData]);

  const handleFitnessLogsRefresh = useCallback(() => {
    // This will trigger a re-render of the FitnessLogsView
    setFitnessLogsKey(prev => prev + 1);
  }, []);

  const handleSetActiveRoutine = useCallback(async (routine: { id: string | number }) => {
    try {
      await routineService.setActiveRoutine(routine.id.toString());
      // Refresh data to show updated active routine
      handleFitnessLogsRefresh();
    } catch {
      // Handle error silently for MVP
    }
  }, [handleFitnessLogsRefresh]);

  const handleSetInactiveRoutine = useCallback(async () => {
    try {
      await routineService.clearActiveRoutine();
      // Refresh data to show updated active routine
      handleFitnessLogsRefresh();
    } catch {
      // Handle error silently for MVP
    }
  }, [handleFitnessLogsRefresh]);

  // No predefined workout - users create their own
  const todaysWorkout = recommendedWorkout || null;

  const progressRings = [
    {
      id: '1',
      title: 'Weekly Goal',
      current: weekStats?.totalWorkouts || 0,
      target: 5,
      color: '#3b82f6',
      icon: 'fitness-outline',
      unit: 'workouts',
    },
    {
      id: '2',
      title: 'Calories',
      current: weekStats?.totalCalories || 0,
      target: 2000,
      color: '#f97316',
      icon: 'flame-outline',
      unit: 'cal',
    },
    {
      id: '3',
      title: 'Duration',
      current: Math.round((weekStats?.totalDuration || 0) / 60),
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
        weeklyWorkouts={weekStats?.totalWorkouts || 0}
        alignmentScore={75}
        caloriesBurned={weekStats?.totalCalories || 0}
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

  // Show loading state if user is not authenticated
  if (!user) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.loadingText}>Please log in to view fitness data...</Text>
      </View>
    );
  }

  // Show loading state while data is being fetched
  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.loadingText}>Loading fitness data...</Text>
      </View>
    );
  }

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
            // Handle edit routine
          }}
          onSetActive={handleSetActiveRoutine}
          onSetInactive={handleSetInactiveRoutine}
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
    backgroundColor: '#f8fafc',
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
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    padding: 20,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#6b7280',
    textAlign: 'center',
  },
});
