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
import RoutineDashboard from '../../components/routines/RoutineDashboard';
import ComprehensiveRoutineModal from '../../components/routines/ComprehensiveRoutineModal';
import EditRoutineModal from '../../components/routines/EditRoutineModal';
import LogTodaysWorkoutModal from '../../components/workout/LogTodaysWorkoutModal';
import LogWorkoutModal from '../../components/fitness/LogWorkoutModal';
import EnhancedWorkoutLogger from '../../components/fitness/EnhancedWorkoutLogger';
import FitnessLogsView from '../../components/fitness/FitnessLogsView';
import { fitnessService, WorkoutStats } from '../../services/fitnessService';
import { dashboardService } from '../../services/dashboardService';

export default function FitnessScreen() {
  const [activeTab, setActiveTab] = useState<'overview' | 'routines' | 'logs'>('overview');
  const [showCreateRoutineModal, setShowCreateRoutineModal] = useState(false);
  const [showEditRoutineModal, setShowEditRoutineModal] = useState(false);
  const [showLogWorkoutModal, setShowLogWorkoutModal] = useState(false);
  const [showEnhancedWorkoutLogger, setShowEnhancedWorkoutLogger] = useState(false);
  const [showLogTodaysWorkoutModal, setShowLogTodaysWorkoutModal] = useState(false);
  const [selectedRoutine, setSelectedRoutine] = useState<any>(null);
  
  // Overview state
  const [todayStats, setTodayStats] = useState({
    workouts: 0,
    duration: 0,
    calories: 0,
    exercises: 0,
  });
  const [weekStats, setWeekStats] = useState<WorkoutStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadTodayStats = async () => {
    try {
      const response = await dashboardService.getDashboardSummary();
      setTodayStats({
        workouts: response.today_stats.workouts,
        duration: response.today_stats.calories_burned, // Using calories as proxy for duration
        calories: response.today_stats.calories_burned,
        exercises: response.today_stats.workouts * 3, // Estimate exercises per workout
      });
    } catch (error) {
      console.error('Failed to load today\'s stats:', error);
    }
  };

  const loadWeekStats = async () => {
    try {
      const stats = await fitnessService.getWorkoutStats('week');
      setWeekStats(stats);
    } catch (error) {
      console.error('Failed to load week stats:', error);
    }
  };

  const loadOverviewData = async () => {
    try {
      setLoading(true);
      await Promise.all([loadTodayStats(), loadWeekStats()]);
    } catch (error) {
      console.error('Failed to load overview data:', error);
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


      {/* Today's Snapshot */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Today's Snapshot</Text>
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          style={styles.snapshotScroll}
        >
          <View style={styles.snapshotCard}>
            <Ionicons name="fitness-outline" size={20} color="#10b981" />
            <Text style={styles.snapshotValue}>{todayStats.workouts}</Text>
            <Text style={styles.snapshotLabel}>Workouts</Text>
            <View style={styles.trendIndicator}>
              <Ionicons name="trending-up" size={12} color="#10b981" />
            </View>
          </View>
          <View style={styles.snapshotCard}>
            <Ionicons name="time-outline" size={20} color="#3b82f6" />
            <Text style={styles.snapshotValue}>{todayStats.duration}m</Text>
            <Text style={styles.snapshotLabel}>Duration</Text>
            <View style={styles.trendIndicator}>
              <Ionicons name="trending-up" size={12} color="#10b981" />
            </View>
          </View>
          <View style={styles.snapshotCard}>
            <Ionicons name="flame-outline" size={20} color="#ef4444" />
            <Text style={styles.snapshotValue}>{todayStats.calories}</Text>
            <Text style={styles.snapshotLabel}>Calories</Text>
            <View style={styles.trendIndicator}>
              <Ionicons name="trending-up" size={12} color="#10b981" />
            </View>
          </View>
          <View style={styles.snapshotCard}>
            <Ionicons name="barbell-outline" size={20} color="#f59e0b" />
            <Text style={styles.snapshotValue}>{todayStats.exercises}</Text>
            <Text style={styles.snapshotLabel}>Exercises</Text>
            <View style={styles.trendIndicator}>
              <Ionicons name="trending-up" size={12} color="#10b981" />
            </View>
          </View>
        </ScrollView>
      </View>

      {/* Recent Activity */}
      {weekStats && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>This Week</Text>
          <View style={styles.weekCard}>
            <View style={styles.weekStat}>
              <Text style={styles.weekValue}>{weekStats.total_workouts || 0}</Text>
              <Text style={styles.weekLabel}>Workouts</Text>
            </View>
            <View style={styles.weekStat}>
              <Text style={styles.weekValue}>{weekStats.total_duration || 0}m</Text>
              <Text style={styles.weekLabel}>Duration</Text>
            </View>
            <View style={styles.weekStat}>
              <Text style={styles.weekValue}>{weekStats.total_calories || 0}</Text>
              <Text style={styles.weekLabel}>Calories</Text>
            </View>
          </View>
        </View>
      )}

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
            color={activeTab === 'overview' ? '#3b82f6' : '#6b7280'} 
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
            color={activeTab === 'routines' ? '#3b82f6' : '#6b7280'} 
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
            color={activeTab === 'logs' ? '#3b82f6' : '#6b7280'} 
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
          onRefresh={() => {}}
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
      <LogWorkoutModal
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
});