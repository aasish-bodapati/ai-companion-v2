import React, { useState, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../contexts/AuthContext';
import { TodaysWorkout } from '../../components/fitness/TodaysSnapshot';
import SimpleRoutineDisplay from '../../components/fitness/SimpleRoutineDisplay';
import { routineService, SimpleRoutineWithProgress } from '../../services/RoutineService';
import SimpleFitnessLogs from '../../components/fitness/SimpleFitnessLogs';
import ComprehensiveRoutineModal from '../../components/routines/ComprehensiveRoutineModal';
import { useActiveRoutine } from '../../hooks/useActiveRoutine';
import { useWeeklyActivity } from '../../hooks/useWeeklyActivity';

import { COLORS, SPACING, BORDER_RADIUS, FONT_SIZE } from '../../theme/constants';
import { STYLE_PRESETS } from '../../theme/duplicateStyles';

import { DebugUtils } from '../../utils/debugUtils';

export default function FitnessScreen() {
  const { user } = useAuth();

  // Local state
  const [activeTab, setActiveTab] = useState('overview');
  const [fitnessLogsKey, setFitnessLogsKey] = useState(0);
  const { activeRoutineId, refreshActiveRoutine } = useActiveRoutine();
  const { weeklyActivityData } = useWeeklyActivity();
  const [settingActiveRoutine, setSettingActiveRoutine] = useState<number | null>(null);
  const [routines, setRoutines] = useState<SimpleRoutineWithProgress[]>([]);
  const [routinesLoading, setRoutinesLoading] = useState(false);
  const routinesLoadedRef = React.useRef(false);
  const [showCreateRoutineModal, setShowCreateRoutineModal] = useState(false);
  const [recommendedWorkout, setRecommendedWorkout] = useState<TodaysWorkout | null>(null);

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
      try {
        const todaysWorkoutData = await routineService.getTodaysWorkout();
        if (todaysWorkoutData) {
          setRecommendedWorkout(todaysWorkoutData);
          DebugUtils.log('✅ [FITNESS SCREEN] Today\'s workout loaded:', todaysWorkoutData);
        } else {
          DebugUtils.log('ℹ️ [FITNESS SCREEN] No workout scheduled for today');
        }
      } catch (error: any) {
        // Handle 404 as expected behavior (no workout scheduled)
        if (error?.response?.status === 404 || 
            error?.status === 404 || 
            (error?.data && error.data.status === 404)) {
          DebugUtils.log('ℹ️ [FITNESS SCREEN] No workout scheduled for today (404)');
          setRecommendedWorkout(null);
        } else {
          DebugUtils.error('❌ [FITNESS SCREEN] Error loading today\'s workout:', error);
        }
      }

      // Weekly activity data is now handled by useWeeklyActivity hook

    } catch (error) {
      DebugUtils.error('❌ [FITNESS SCREEN] Unexpected error loading overview data:', error);
    } finally {
      isLoadingRef.current = false;
    }
  };

  // Handler functions - optimized with useCallback
  const handleCreateRoutine = useCallback(() => {
    setShowCreateRoutineModal(true);
  }, []);

  const handleSetActiveRoutine = useCallback(async (routine: SimpleRoutineWithProgress) => {
    setSettingActiveRoutine(routine.id);
    try {
      DebugUtils.log('🔄 [FITNESS SCREEN] Setting routine as active:', routine.id);
      await routineService.setActiveRoutine(routine.id.toString());
      DebugUtils.log('✅ [FITNESS SCREEN] Routine set as active successfully');
      await refreshActiveRoutine(); // Refresh the global state
      DebugUtils.log('✅ [FITNESS SCREEN] Active routine refreshed');
    } catch (error) {
      DebugUtils.error('❌ [FITNESS SCREEN] Error setting active routine:', error);
    } finally {
      setSettingActiveRoutine(null);
    }
  }, [refreshActiveRoutine]);

  const loadRoutines = async () => {
    setRoutinesLoading(true);
    try {
      // Load both user routines and template routines
      const [userRoutinesData, templateRoutinesData] = await Promise.all([
        routineService.getRoutines({ limit: 10 }),
        routineService.getRoutineTemplates({ limit: 10 })
      ]);

      // Extract routines from both responses
      const userRoutines = Array.isArray(userRoutinesData)
        ? userRoutinesData
        : userRoutinesData.routines || [];

      const templateRoutines = Array.isArray(templateRoutinesData)
        ? templateRoutinesData
        : templateRoutinesData.routines || [];

      // Combine user routines and template routines
      const allRoutines = [...userRoutines, ...templateRoutines];
      setRoutines(allRoutines);

      DebugUtils.log('🔍 Loaded routines - user:', userRoutines.length, 'templates:', templateRoutines.length, 'total:', allRoutines.length);
    } catch (error) {
      DebugUtils.error('Error loading routines:', error);
    } finally {
      setRoutinesLoading(false);
    }
  };

  const handleRoutineCreated = () => {
    setShowCreateRoutineModal(false);
    // Refresh routines list
    loadRoutines();
  };

  const handleFitnessLogsRefresh = useCallback(() => {
    setFitnessLogsKey(prev => prev + 1);
  }, []);

  // const handleWorkoutLogged = useCallback(async (workoutData: { // Unused for now
  //   activity_type?: string;
  //   duration_minutes?: number;
  //   calories_burned?: number;
  //   notes?: string;
  //   activity_date?: string;
  //   routine_id?: string;
  // }) => {
  //   setShowUnifiedWorkoutLogger(false);
  //   setRecommendedWorkout(null);
  //
  //   // Force component remount with new key
  //   setFitnessLogsKey(prev => prev + 1);
  // }, []);

  // Load routines when routines tab is accessed
  React.useEffect(() => {
    if (activeTab === 'routines' && !routinesLoadedRef.current && !routinesLoading) {
      routinesLoadedRef.current = true;
      loadRoutines();
    } else if (activeTab !== 'routines') {
      // Reset the ref when switching away from routines tab
      routinesLoadedRef.current = false;
    }
  }, [activeTab, routinesLoading]); // Add routinesLoading dependency

  // Load overview data when overview tab is accessed
  React.useEffect(() => {
    if (activeTab === 'overview') {
      loadOverviewData();
    }
  }, [activeTab]);

  // No predefined workout - users create their own
  const todaysWorkout = recommendedWorkout || null;

  // Calculate weekly workout count from activity data
  const weeklyWorkoutCount = Object.values(weeklyActivityData).reduce((sum, count) => sum + count, 0);

  const renderOverview = () => (
    <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
      {/* Simple Stats Cards */}
      <View style={styles.statsContainer}>
        <View style={styles.statCard}>
          <View style={styles.statIcon}>
            <Ionicons name="fitness-outline" size={24} color="#3b82f6" />
          </View>
          <Text style={styles.statValue}>{weeklyWorkoutCount}</Text>
          <Text style={styles.statLabel}>Workouts This Week</Text>
        </View>
        
        <View style={styles.statCard}>
          <View style={styles.statIcon}>
            <Ionicons name="flame-outline" size={24} color="#f97316" />
          </View>
          <Text style={styles.statValue}>1,200</Text>
          <Text style={styles.statLabel}>Calories Burned</Text>
        </View>
      </View>

      {/* Today's Workout */}
      {todaysWorkout && (
        <View style={styles.todaysWorkoutCard}>
          <Text style={styles.cardTitle}>Today's Workout</Text>
          <Text style={styles.workoutName}>{todaysWorkout.name}</Text>
          <Text style={styles.workoutDescription}>
            {todaysWorkout.exercises?.length || 0} exercises planned
          </Text>
        </View>
      )}

      {/* Quick Actions */}
      <View style={styles.quickActionsCard}>
        <Text style={styles.cardTitle}>Quick Actions</Text>
        <View style={styles.actionButtons}>
          <TouchableOpacity style={styles.actionButton}>
            <Ionicons name="add-circle-outline" size={20} color="#3b82f6" />
            <Text style={styles.actionButtonText}>Log Workout</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionButton}>
            <Ionicons name="list-outline" size={20} color="#10b981" />
            <Text style={styles.actionButtonText}>View Logs</Text>
          </TouchableOpacity>
        </View>
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
          routines={routines || []}
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
    backgroundColor: COLORS.background.secondary,
  },
  debugContainer: {
    backgroundColor: '#fff',
    padding: SPACING.lg,
    margin: 10,
    borderRadius: BORDER_RADIUS.sm,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  debugText: {
    fontSize: FONT_SIZE.lg,
    marginBottom: 10,
    color: '#333',
  },
  section: {
    marginHorizontal: 16,
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: FONT_SIZE.xxl,
    fontWeight: 'bold',
    color: COLORS.text.primary,
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
    fontSize: FONT_SIZE.lg,
    fontWeight: 'bold',
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
    backgroundColor: '#f97316',
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
  // Overview styles
  content: {
    flex: 1,
    paddingHorizontal: 0,
  },
  sectionBottom: {
    marginBottom: 24,
  },
  sectionTitleLarge: {
    fontSize: FONT_SIZE.xl,
    fontWeight: '600',
    color: COLORS.text.primary,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  statContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statInfo: {
    flex: 1,
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
  weekCard: {
    backgroundColor: COLORS.background.primary,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.lg,
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
    color: COLORS.text.primary,
    marginBottom: 4,
  },
  weekLabel: {
    fontSize: FONT_SIZE.md,
    color: COLORS.text.secondary,
    textAlign: 'center',
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
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.background.secondary,
    padding: SPACING.lg,
  },
  loadingText: {
    marginTop: 16,
    fontSize: FONT_SIZE.lg,
    color: COLORS.text.secondary,
    textAlign: 'center',
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
    backgroundColor: '#f0f9ff',
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
  todaysWorkoutCard: {
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
  workoutName: {
    fontSize: FONT_SIZE.xl,
    fontWeight: 'bold',
    color: COLORS.text.primary,
    marginBottom: 4,
  },
  workoutDescription: {
    fontSize: FONT_SIZE.md,
    color: COLORS.text.secondary,
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
