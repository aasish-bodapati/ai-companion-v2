import React, { useState, useEffect, useCallback, useRef } from 'react';
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
// Store imports removed to prevent infinite loops
// import { 
//   useFitnessStore, 
//   useFitnessWeekStats, 
//   useFitnessLoading,
//   useFitnessTodayStats,
//   useFitnessError,
//   useFitnessLastUpdated,
//   useFitnessActions
// } from '../../stores';
import { useAuth } from '../../contexts/AuthContext';
import TodaysSnapshot from '../../components/fitness/TodaysSnapshot';
import UnifiedWorkoutLogger from '../../components/fitness/UnifiedWorkoutLogger';
import SimpleRoutineDisplay from '../../components/fitness/SimpleRoutineDisplay';
import { routineService, SimpleRoutineWithProgress } from '../../services/routineService';
import ProgressTracking from '../../components/fitness/ProgressTracking';
import SimpleFitnessLogs from '../../components/fitness/SimpleFitnessLogs';
import WeeklyActivityChart from '../../components/fitness/WeeklyActivityChart';
import ComprehensiveRoutineModal from '../../components/routines/ComprehensiveRoutineModal';
import { fitnessService } from '../../services/fitnessService';

export default function FitnessScreen() {
  const { user } = useAuth();
  
  // Store selectors - REMOVED TO PREVENT INFINITE LOOPS
  // const weekStats = useFitnessWeekStats();
  // const todayStats = useFitnessTodayStats();
  // const loading = useFitnessLoading();
  // const error = useFitnessError();
  // const lastUpdated = useFitnessLastUpdated();
  // const { refreshFitnessData, addWorkout } = useFitnessActions();
  
  // Local state
  const [activeTab, setActiveTab] = useState('overview');
  const [refreshing, setRefreshing] = useState(false);
  const [showUnifiedWorkoutLogger, setShowUnifiedWorkoutLogger] = useState(false);
  const [recommendedWorkout, setRecommendedWorkout] = useState(null);
  const [fitnessLogsKey, setFitnessLogsKey] = useState(0);
  const [activeRoutineId, setActiveRoutineId] = useState<number | null>(null);
  const [settingActiveRoutine, setSettingActiveRoutine] = useState<number | null>(null);
  const [routines, setRoutines] = useState<SimpleRoutineWithProgress[]>([]);
  const [routinesLoading, setRoutinesLoading] = useState(false);
  const routinesLoadedRef = React.useRef(false);
  const [showCreateRoutineModal, setShowCreateRoutineModal] = useState(false);
  const [weeklyActivityData, setWeeklyActivityData] = useState({
    monday: 0,
    tuesday: 0,
    wednesday: 0,
    thursday: 0,
    friday: 0,
    saturday: 0,
    sunday: 0,
  });
  
  // Refs
  const isLoadingRef = useRef(false);
  


  const loadOverviewData = async () => {
    // Prevent multiple simultaneous calls
    if (isLoadingRef.current) {
      return;
    }
    
    try {
      isLoadingRef.current = true;
      
      // Load today's workout from active routine
      const todaysWorkoutData = await routineService.getTodaysWorkout();
      if (todaysWorkoutData) {
        setRecommendedWorkout(todaysWorkoutData);
      } else {
      }
      
      // Load weekly activity data
      try {
        const weeklyData = await fitnessService.getWeeklyActivity();
        if (weeklyData) {
          setWeeklyActivityData(weeklyData);
        }
      } catch (weeklyError) {
        // Set default weekly data if service fails
        setWeeklyActivityData({
          monday: 2,
          tuesday: 1,
          wednesday: 3,
          thursday: 0,
          friday: 2,
          saturday: 1,
          sunday: 0,
        });
      }
      
    } catch (error) {
      console.error('❌ [FITNESS SCREEN] Error loading overview data:', error);
    } finally {
      isLoadingRef.current = false;
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadOverviewData();
    setRefreshing(false);
  };

  // Remove automatic data loading to prevent infinite loops
  // Data will be loaded only when user explicitly refreshes

  // Reset to overview tab every time the screen comes into focus - TEMPORARILY COMMENTED OUT FOR DEBUGGING
  // useFocusEffect(
  //   React.useCallback(() => {
  //     setActiveTab('overview');
  //   }, [])
  // );

  // const handleRoutineCreated = () => {
  //   setShowCreateRoutineModal(false);
  // }; // DISABLED - using placeholder

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
    
    // Force component remount with new key
    setFitnessLogsKey(prev => prev + 1);
  }, []);

  const handleFitnessLogsRefresh = useCallback(() => {
    // This will trigger a re-render of the FitnessLogsView
    setFitnessLogsKey(prev => prev + 1);
  }, []);


  const handleSetInactiveRoutine = useCallback(async () => {
    try {
      await routineService.clearActiveRoutine();
      // Refresh data to show updated active routine
      setFitnessLogsKey(prev => prev + 1);
    } catch (error) {
      console.error('🔄 [FITNESS SCREEN] Error clearing active routine:', error);
      // Handle error silently for MVP
    }
  }, []);

  const loadRoutines = useCallback(async () => {
    try {
      setRoutinesLoading(true);
      
      // Try to get both user routines and template routines
      const [userRoutinesResponse, templateRoutinesResponse] = await Promise.all([
        routineService.getRoutines({ limit: 10 }),
        routineService.getRoutineTemplates({ limit: 10 })
      ]);
      
      // Combine user routines and template routines
      const allRoutines = [
        ...userRoutinesResponse.routines,
        ...templateRoutinesResponse.routines
      ];
      
      setRoutines(allRoutines);
      
      // Also load the active routine to ensure state is synchronized
      await loadActiveRoutine();
    } catch (error) {
      console.error('🔄 [FITNESS SCREEN] Error loading routines:', error);
    } finally {
      setRoutinesLoading(false);
    }
  }, []);

  const handleCreateRoutine = useCallback(() => {
    setShowCreateRoutineModal(true);
  }, []);

  const handleSetActiveRoutine = useCallback(async (routine: SimpleRoutineWithProgress) => {
    try {
      
      setSettingActiveRoutine(routine.id);
      
      const response = await routineService.setActiveRoutine(routine.id.toString());
      
      setActiveRoutineId(routine.id);
      
      // Refresh data to show updated active routine
      setFitnessLogsKey(prev => prev + 1);
      
      // Also refresh the active routine from database to ensure consistency
      await loadActiveRoutine();
    } catch (error) {
      console.error('❌ [FITNESS SCREEN] Error setting active routine:', error);
      console.error('❌ [FITNESS SCREEN] Error details:', error.message);
    } finally {
      setSettingActiveRoutine(null);
    }
  }, [activeRoutineId]);

  const handleRoutineCreated = useCallback(() => {
    setShowCreateRoutineModal(false);
    // Refresh routines list
    loadRoutines();
  }, [loadRoutines]);

  // Load routines when routines tab is accessed
  React.useEffect(() => {
    if (activeTab === 'routines' && !routinesLoadedRef.current && !routinesLoading) {
      routinesLoadedRef.current = true;
      loadRoutines();
    } else if (activeTab !== 'routines') {
      // Reset the ref when switching away from routines tab
      routinesLoadedRef.current = false;
    }
  }, [activeTab]); // Only depend on activeTab to prevent infinite loop

  // Load overview data when overview tab is accessed
  React.useEffect(() => {
    if (activeTab === 'overview') {
      loadOverviewData();
    }
  }, [activeTab]);

  // Load active routine on component mount
  React.useEffect(() => {
    loadActiveRoutine();
  }, []);

  const loadActiveRoutine = async () => {
    try {
      const activeRoutine = await routineService.getActiveRoutine();
      if (activeRoutine) {
        setActiveRoutineId(activeRoutine.id);
      } else {
        setActiveRoutineId(null);
      }
    } catch (error) {
      console.error('❌ [FITNESS SCREEN] Error loading active routine:', error);
      setActiveRoutineId(null);
    }
  };

  // No predefined workout - users create their own
  const todaysWorkout = recommendedWorkout || null;

  // Calculate weekly workout count from activity data
  const weeklyWorkoutCount = Object.values(weeklyActivityData).reduce((sum, count) => sum + count, 0);
  
  const progressRings = [
    {
      id: '1',
      title: 'Weekly Goal',
      current: weeklyWorkoutCount,
      target: 5,
      color: '#3b82f6',
      icon: 'fitness-outline',
      unit: 'workouts',
    },
    {
      id: '2',
      title: 'Calories',
      current: 1200, // Mock data for now
      target: 2000,
      color: '#f97316',
      icon: 'flame-outline',
      unit: 'cal',
    },
    {
      id: '3',
      title: 'Duration',
      current: 180, // Mock data for now
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
    <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
      {/* Today's Snapshot */}
      <TodaysSnapshot
        weeklyWorkouts={weeklyWorkoutCount}
        alignmentScore={Math.min(100, Math.max(0, (weeklyWorkoutCount / 5) * 100))}
        caloriesBurned={1200}
        streak={7}
        todaysWorkout={todaysWorkout}
        onQuickLog={() => setShowUnifiedWorkoutLogger(true)}
        onViewWorkout={(workout) => {
        }}
        onViewProgress={() => {
        }}
      />

      {/* Progress Tracking */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Progress Tracking</Text>
        <ProgressTracking
          progressRings={progressRings}
          achievements={achievements}
          streaks={streaks}
          onRingPress={(ring) => {
          }}
          onAchievementPress={(achievement) => {
          }}
          onStreakPress={(streak) => {
          }}
        />
      </View>

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

  // Show loading state while data is being fetched - DISABLED TO PREVENT INFINITE LOOPS
  // if (loading) {
  //   return (
  //     <View style={styles.centerContainer}>
  //       <ActivityIndicator size="large" color="#007AFF" />
  //       <Text style={styles.loadingText}>Loading fitness data...</Text>
  //     </View>
  //   );
  // }

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
        <SimpleRoutineDisplay
          routines={routines}
          onRoutineSelect={(routine) => {
            // TODO: Add routine selection logic
          }}
          onCreateRoutine={handleCreateRoutine}
          onSetActive={handleSetActiveRoutine}
          activeRoutineId={activeRoutineId}
          settingActiveRoutine={settingActiveRoutine}
        />
      ) : (
        <SimpleFitnessLogs
          key={fitnessLogsKey}
          onRefresh={handleFitnessLogsRefresh}
        />
      )}

      {/* Unified Workout Logger - CAUSES INFINITE LOOP */}
      {/* <UnifiedWorkoutLogger
        visible={showUnifiedWorkoutLogger}
        onClose={() => setShowUnifiedWorkoutLogger(false)}
        onSave={handleWorkoutLogged}
        initialWorkout={recommendedWorkout}
        routineId={recommendedWorkout?.routine_id}
      /> */}

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
  debugContainer: {
    backgroundColor: '#fff',
    padding: 20,
    margin: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  debugText: {
    fontSize: 16,
    marginBottom: 10,
    color: '#333',
  },
  section: {
    marginHorizontal: 16,
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 12,
  },
  debugButton: {
    backgroundColor: '#007AFF',
    padding: 10,
    borderRadius: 5,
    alignItems: 'center',
    marginTop: 10,
  },
  debugButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
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
  sectionBottom: {
    marginBottom: 24,
  },
  sectionTitleLarge: {
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
