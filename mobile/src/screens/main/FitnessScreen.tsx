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
import RoutineDashboard from '../../components/routines/RoutineDashboard';
import ComprehensiveRoutineModal from '../../components/routines/ComprehensiveRoutineModal';
import EditRoutineModal from '../../components/routines/EditRoutineModal';
import LogTodaysWorkoutModal from '../../components/workout/LogTodaysWorkoutModal';
import WorkoutLoggingModal from '../../components/fitness/WorkoutLoggingModal';
import EnhancedWorkoutLogger from '../../components/fitness/EnhancedWorkoutLogger';
import FitnessLogsView from '../../components/fitness/FitnessLogsView';
import WeeklyActivityChart from '../../components/fitness/WeeklyActivityChart';
import { fitnessService, WorkoutStats } from '../../services/fitnessService';
import { dashboardService } from '../../services/dashboardService';

export default function FitnessScreen() {
  const [activeTab, setActiveTab] = useState<'overview' | 'routines' | 'logs'>('overview');
  const [fitnessLogsKey, setFitnessLogsKey] = useState(0);
  const [showCreateRoutineModal, setShowCreateRoutineModal] = useState(false);
  const [showEditRoutineModal, setShowEditRoutineModal] = useState(false);
  const [showLogWorkoutModal, setShowLogWorkoutModal] = useState(false);
  const [showEnhancedWorkoutLogger, setShowEnhancedWorkoutLogger] = useState(false);
  const [showLogTodaysWorkoutModal, setShowLogTodaysWorkoutModal] = useState(false);
  const [selectedRoutine, setSelectedRoutine] = useState<any>(null);
  
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

  const handleRoutineEdited = () => {
    setShowEditRoutineModal(false);
    setSelectedRoutine(null);
  };

  const handleWorkoutLogged = () => {
    setShowLogWorkoutModal(false);
    setShowEnhancedWorkoutLogger(false);
    setShowLogTodaysWorkoutModal(false);
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


  const renderOverview = () => (
    <ScrollView
      style={styles.content}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
      showsVerticalScrollIndicator={false}
    >
      {/* This Week's Fitness Overview */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>This Week's Fitness</Text>
        <View style={styles.weekOverviewCard}>
          <View style={styles.weekMetricRow}>
            <View style={styles.weekMetric}>
              <Ionicons name="fitness-outline" size={24} color="#ea580c" />
              <Text style={styles.weekMetricValue}>{weekStats?.total_workouts || 0}</Text>
              <Text style={styles.weekMetricLabel}>Workouts</Text>
            </View>
            <View style={styles.weekMetric}>
              <Ionicons name="time-outline" size={24} color="#f97316" />
              <Text style={styles.weekMetricValue}>{Math.round((weekStats?.total_duration || 0) / 60)}h</Text>
              <Text style={styles.weekMetricLabel}>Duration</Text>
            </View>
          </View>
          
          <View style={styles.weekMetricRow}>
            <View style={styles.weekMetric}>
              <Ionicons name="flame-outline" size={24} color="#fb923c" />
              <Text style={styles.weekMetricValue}>{weekStats?.total_calories_burned || 0}</Text>
              <Text style={styles.weekMetricLabel}>Calories Burned</Text>
            </View>
            <View style={styles.weekMetric}>
              <Ionicons name="barbell-outline" size={24} color="#f59e0b" />
              <Text style={styles.weekMetricValue}>{Math.round((weekStats?.average_duration || 0) / 60)}m</Text>
              <Text style={styles.weekMetricLabel}>Avg Duration</Text>
            </View>
          </View>
        </View>
      </View>


      {/* Weekly Activity Breakdown */}
      {weekStats && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Weekly Breakdown</Text>
          <View style={styles.breakdownCard}>
            <View style={styles.breakdownItem}>
              <Text style={styles.breakdownLabel}>Most Active Day</Text>
              <Text style={styles.breakdownValue}>{weekStats.most_common_activity || 'No data'}</Text>
            </View>
            <View style={styles.breakdownItem}>
              <Text style={styles.breakdownLabel}>Longest Workout</Text>
              <Text style={styles.breakdownValue}>{Math.round((weekStats.longest_workout || 0) / 60)}m</Text>
            </View>
            <View style={styles.breakdownItem}>
              <Text style={styles.breakdownLabel}>Avg Calories/Workout</Text>
              <Text style={styles.breakdownValue}>{Math.round(weekStats.average_calories || 0)}</Text>
            </View>
          </View>
        </View>
      )}

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
        <RoutineDashboard
          onRoutineSelected={() => {
            // Handle routine selection if needed
          }}
          onCreateRoutine={() => setShowCreateRoutineModal(true)}
          onEditRoutine={(routine) => {
            setSelectedRoutine(routine);
            setShowEditRoutineModal(true);
          }}
          onDeleteRoutine={(routineId) => {
            // Handle routine deletion if needed
          }}
        />
      ) : (
        <FitnessLogsView
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

      {/* Edit Routine Modal */}
      <EditRoutineModal
        isVisible={showEditRoutineModal}
        onClose={() => setShowEditRoutineModal(false)}
        onRoutineUpdated={handleRoutineEdited}
        routine={selectedRoutine}
      />

      {/* Enhanced Workout Logger */}
      <EnhancedWorkoutLogger
        visible={showEnhancedWorkoutLogger}
        onClose={() => setShowEnhancedWorkoutLogger(false)}
        onWorkoutLogged={handleWorkoutLogged}
      />

      {/* Log Workout Modal */}
      <WorkoutLoggingModal
        visible={showLogWorkoutModal}
        onClose={() => setShowLogWorkoutModal(false)}
        onWorkoutLogged={handleWorkoutLogged}
      />

      {/* Log Today's Workout Modal */}
      <LogTodaysWorkoutModal
        visible={showLogTodaysWorkoutModal}
        onClose={() => setShowLogTodaysWorkoutModal(false)}
        onWorkoutLogged={handleWorkoutLogged}
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
    paddingHorizontal: 16,
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