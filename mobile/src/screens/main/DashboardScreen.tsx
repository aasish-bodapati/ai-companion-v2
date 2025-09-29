import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Dimensions,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { hapticFeedback } from '../../utils/haptics';
import EnhancedLoadingState from '../../components/ui/EnhancedLoadingState';
import MobileOptimizedCard from '../../components/ui/MobileOptimizedCard';
import DayAtAGlance from '../../components/ui/DayAtAGlance';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../contexts/AuthContext';
import { dashboardService, DashboardSummary, QuickStats } from '../../services/dashboardService';
import { nutritionService } from '../../services/nutritionService';
import { routineService } from '../../services/routineService';
import { fitnessService } from '../../services/fitnessService';
import AIInsightsCard from '../../components/ai/AIInsightsCard';
import WaterLoggingCard from '../../components/health/WaterLoggingCard';
import MoodLoggingCard from '../../components/health/MoodLoggingCard';
import LogMealModal from '../../components/nutrition/LogMealModal';

const { width } = Dimensions.get('window');

interface DashboardData {
  summary: DashboardSummary | null;
  quickStats: QuickStats | null;
  loading: boolean;
  error: string | null;
}

export default function DashboardScreen() {
  const { user, logout } = useAuth();
  const [data, setData] = useState<DashboardData>({
    summary: null,
    quickStats: null,
    loading: true,
    error: null,
  });
  const [refreshing, setRefreshing] = useState(false);
  const [showLogMealModal, setShowLogMealModal] = useState(false);

  const loadDashboardData = useCallback(async () => {
    try {
      setData(prev => ({ ...prev, loading: true, error: null }));
      
      console.log('📊 Dashboard: Loading dashboard data...');
      
      // Load dashboard summary and quick stats in parallel
      const [summaryResponse, quickStatsResponse] = await Promise.allSettled([
        dashboardService.getDashboardSummary(),
        dashboardService.getQuickStats(),
      ]);

      let summary = summaryResponse.status === 'fulfilled' ? summaryResponse.value : null;
      let quickStats = quickStatsResponse.status === 'fulfilled' ? quickStatsResponse.value : null;

      console.log('📊 Dashboard: Summary response:', summaryResponse.status);
      console.log('📊 Dashboard: Quick stats response:', quickStatsResponse.status);

      // If dashboard API fails, try to get some real data from individual services
      if (!summary || !quickStats) {
        console.log('📊 Dashboard: Primary APIs failed, trying fallback...');
        try {
          const [recentWorkouts, todayWorkoutSummary, recentMeals, todayNutritionSummary] = await Promise.allSettled([
            fitnessService.getRecentWorkouts(5),
            fitnessService.getTodayWorkoutSummary(),
            nutritionService.getRecentMeals(5),
            nutritionService.getTodayNutritionSummary(),
          ]);

          // Create fallback summary with real data if available
          const workouts = recentWorkouts.status === 'fulfilled' ? recentWorkouts.value || [] : [];
          const todayWorkoutData = todayWorkoutSummary.status === 'fulfilled' ? todayWorkoutSummary.value || {} : {};
          const meals = recentMeals.status === 'fulfilled' ? recentMeals.value || [] : [];
          const todayNutritionData = todayNutritionSummary.status === 'fulfilled' ? todayNutritionSummary.value || {} : {};
          
          summary = {
            today_stats: {
              workouts: todayWorkoutData.workouts || 0,
              meals: todayNutritionData.meals_count || 0,
              water_ml: 0, // Will be updated when water logging is implemented
              calories_burned: todayWorkoutData.calories_burned || 0,
              calories_consumed: todayNutritionData.total_calories || 0,
              total_minutes: todayWorkoutData.total_duration || 0,
              protein_g: todayNutritionData.protein_g || 0,
              carbs_g: todayNutritionData.carbs_g || 0,
              fat_g: todayNutritionData.fat_g || 0,
              net_calories: (todayNutritionData.total_calories || 0) - (todayWorkoutData.calories_burned || 0),
            },
            weekly_progress: {
              workouts_completed: workouts.length,
              workouts_target: 5,
              workout_progress: Math.min((workouts.length / 5) * 100, 100),
              meals_logged: meals.length,
              meals_target: 21,
              meal_progress: Math.min((meals.length / 21) * 100, 100),
              overall_progress: Math.min(((workouts.length / 5) + (meals.length / 21)) * 50, 100),
              days_in_week: 7,
              total_minutes_this_week: workouts.reduce((sum, w) => sum + (w.duration_minutes || 0), 0),
              avg_calories_per_day: todayNutritionData.avg_calories_per_meal || 0,
            },
            active_routines: [],
            smart_suggestions: [],
            quick_actions: [],
            streak: workouts.length > 0 || meals.length > 0 ? 1 : 0,
            last_updated: new Date().toISOString(),
            cache_duration: 60,
          };

          quickStats = {
            total_workouts: workouts.length,
            total_meals: meals.length,
            current_streak: workouts.length > 0 || meals.length > 0 ? 1 : 0,
            weekly_goal_progress: Math.min(((workouts.length / 5) + (meals.length / 21)) * 50, 100),
          };

          console.log('📊 Dashboard: Fallback data created:', { summary, quickStats });
        } catch (fallbackError) {
          console.error('📊 Dashboard: Failed to load fallback data:', fallbackError);
        }
      }

      setData({
        summary,
        quickStats,
        loading: false,
        error: null,
      });
      
      console.log('📊 Dashboard: Data loaded successfully');
    } catch (error) {
      console.error('📊 Dashboard: Failed to load dashboard data:', error);
      // Don't set error state, just show fallback data
      setData(prev => ({
        ...prev,
        loading: false,
        error: null,
      }));
    }
  }, []);

  const onRefresh = useCallback(async () => {
    hapticFeedback.light();
    setRefreshing(true);
    await loadDashboardData();
    setRefreshing(false);
  }, [loadDashboardData]);

  const handleLogMeal = () => {
    hapticFeedback.medium();
    setShowLogMealModal(true);
  };

  const handleMealLogged = () => {
    setShowLogMealModal(false);
    loadDashboardData(); // Refresh dashboard data
  };



  useEffect(() => {
    loadDashboardData();
  }, [loadDashboardData]);

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 18) return 'Good Afternoon';
    return 'Good Evening';
  };

  const getMotivationalMessage = () => {
    const streak = data.summary?.streak || 0;
    const workouts = data.summary?.today_stats?.workouts || 0;
    
    if (streak > 7) return `Amazing ${streak}-day streak! 🔥`;
    if (streak > 3) return `Great ${streak}-day streak! Keep it up! 💪`;
    if (workouts > 0) return 'You\'re doing great! Keep building healthy habits! 🌟';
    return 'Ready to start your health journey? Let\'s go! 🚀';
  };


  const getColorForAction = (actionType: string) => {
    switch (actionType) {
      case 'fitness':
        return '#f59e0b';
      case 'nutrition':
        return '#10b981';
      case 'achievement':
        return '#8b5cf6';
      case 'mood':
        return '#ec4899';
      default:
        return '#6b7280';
    }
  };


  const StatCard = ({ 
    icon, 
    title, 
    value, 
    subtitle, 
    color, 
    onPress 
  }: {
    icon: string;
    title: string;
    value: string | number;
    subtitle?: string;
    color: string;
    onPress?: () => void;
  }) => (
    <TouchableOpacity 
      style={[styles.statCard, { backgroundColor: color }]} 
      onPress={onPress}
      activeOpacity={0.8}
    >
      <View style={styles.statContent}>
        <View style={styles.statInfo}>
          <Text style={styles.statValue}>{value}</Text>
          <Text style={styles.statTitle}>{title}</Text>
          {subtitle && <Text style={styles.statSubtitle}>{subtitle}</Text>}
        </View>
        <Ionicons name={icon as any} size={32} color="#ffffff" />
      </View>
    </TouchableOpacity>
  );


  const ActivityItem = ({ 
    type, 
    title, 
    time, 
    details 
  }: {
    type: 'workout' | 'meal' | 'mood';
    title: string;
    time: string;
    details?: string;
  }) => {
    const getIcon = () => {
      switch (type) {
        case 'workout': return 'fitness-outline';
        case 'meal': return 'restaurant-outline';
        case 'mood': return 'happy-outline';
        default: return 'time-outline';
      }
    };

    const getColor = () => {
      switch (type) {
        case 'workout': return '#f59e0b';
        case 'meal': return '#10b981';
        case 'mood': return '#8b5cf6';
        default: return '#6b7280';
      }
    };

    return (
      <View style={styles.activityItem}>
        <View style={[styles.activityIcon, { backgroundColor: getColor() + '20' }]}>
          <Ionicons name={getIcon() as any} size={20} color={getColor()} />
        </View>
        <View style={styles.activityContent}>
          <Text style={styles.activityTitle}>{title}</Text>
          {details && <Text style={styles.activityDetails}>{details}</Text>}
          <Text style={styles.activityTime}>{time}</Text>
        </View>
      </View>
    );
  };

  const GoalProgressItem = ({ 
    title, 
    progress, 
    target, 
    unit 
  }: {
    title: string;
    progress: number;
    target: number;
    unit: string;
  }) => {
    const percentage = Math.min((progress / target) * 100, 100);
    
    return (
      <View style={styles.goalItem}>
        <View style={styles.goalHeader}>
          <Text style={styles.goalTitle}>{title}</Text>
          <Text style={styles.goalProgress}>{progress}/{target} {unit}</Text>
        </View>
        <View style={styles.progressBar}>
          <View 
            style={[
              styles.progressFill, 
              { width: `${percentage}%` }
            ]} 
          />
        </View>
        <Text style={styles.goalPercentage}>{Math.round(percentage)}%</Text>
      </View>
    );
  };

  if (data.loading) {
    return (
      <EnhancedLoadingState
        message="Loading your health data..."
        subMessage="Fetching dashboard information"
        variant="default"
        size="large"
        color="#10b981"
        animated={true}
      />
    );
  }

  if (data.error) {
    return (
      <View style={styles.errorContainer}>
        <Ionicons name="alert-circle-outline" size={64} color="#ef4444" />
        <Text style={styles.errorTitle}>Unable to Load Dashboard</Text>
        <Text style={styles.errorText}>{data.error}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={loadDashboardData}>
          <Ionicons name="refresh" size={20} color="#fff" />
          <Text style={styles.retryButtonText}>Try Again</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const todayStats = data.summary?.today_stats;
  const weeklyProgress = data.summary?.weekly_progress;
  const smartSuggestions = data.summary?.smart_suggestions || [];

  return (
    <ScrollView
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
      showsVerticalScrollIndicator={false}
    >
      {/* Hero Header */}
      <View style={styles.heroHeader}>
        <View style={styles.headerTop}>
          <View style={styles.headerContent}>
            <Text style={styles.greeting}>{getGreeting()}</Text>
            <Text style={styles.userName}>{user?.full_name || 'User'}</Text>
            <Text style={styles.motivation}>{getMotivationalMessage()}</Text>
          </View>
          <TouchableOpacity onPress={logout} style={styles.logoutButton}>
            <Ionicons name="log-out-outline" size={20} color="#6b7280" />
          </TouchableOpacity>
        </View>

        {/* Day at a Glance */}
        <DayAtAGlance
          todayStats={{
            workouts: data.summary?.today_stats?.workouts || 0,
            meals: data.summary?.today_stats?.meals || 0,
            water_ml: data.summary?.today_stats?.water_ml || 0,
            calories_burned: data.summary?.today_stats?.calories_burned || 0,
            calories_consumed: data.summary?.today_stats?.calories_consumed || 0,
            streak: data.summary?.streak || 0,
          }}
          onWorkoutPress={() => {
            // Navigate to fitness screen or open workout modal
            console.log('Navigate to workouts');
          }}
          onMealPress={() => {
            // Navigate to nutrition screen or open meal modal
            console.log('Navigate to meals');
          }}
          onWaterPress={() => {
            // Open water logging modal
            console.log('Open water logging');
          }}
        />
      </View>


      {/* Water Logging */}
      <WaterLoggingCard />

      {/* Mood Logging */}
      <MoodLoggingCard />



      {/* AI Health Insights */}
      <View style={styles.section}>
        <AIInsightsCard refreshTrigger={refreshing ? 1 : 0} />
      </View>

      {/* Smart Suggestions */}
      {smartSuggestions.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Smart Suggestions</Text>
          {smartSuggestions.map((suggestion, index) => (
            <View key={index} style={styles.suggestionCard}>
              <View style={styles.suggestionHeader}>
                <Ionicons 
                  name={suggestion.icon as any} 
                  size={20} 
                  color={getColorForAction(suggestion.type)} 
                />
                <Text style={styles.suggestionTitle}>{suggestion.title}</Text>
                <View style={[styles.priorityBadge, { 
                  backgroundColor: suggestion.priority === 'high' ? '#ef4444' : 
                                 suggestion.priority === 'medium' ? '#f59e0b' : '#10b981' 
                }]}>
                  <Text style={styles.priorityText}>{suggestion.priority}</Text>
                </View>
              </View>
              <Text style={styles.suggestionMessage}>{suggestion.message}</Text>
            </View>
          ))}
        </View>
      )}

      {/* Weekly Summary */}
      {weeklyProgress && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>This Week</Text>
          <View style={styles.weeklyStats}>
            <View style={styles.weeklyStatItem}>
              <Text style={styles.weeklyStatValue}>{weeklyProgress.workouts_completed}</Text>
              <Text style={styles.weeklyStatLabel}>Workouts</Text>
            </View>
            <View style={styles.weeklyStatItem}>
              <Text style={styles.weeklyStatValue}>{weeklyProgress.meals_logged}</Text>
              <Text style={styles.weeklyStatLabel}>Meals</Text>
            </View>
            <View style={styles.weeklyStatItem}>
              <Text style={styles.weeklyStatValue}>{Math.round(weeklyProgress.total_minutes_this_week / 60)}h</Text>
              <Text style={styles.weeklyStatLabel}>Duration</Text>
            </View>
            <View style={styles.weeklyStatItem}>
              <Text style={styles.weeklyStatValue}>{Math.round(weeklyProgress.overall_progress)}%</Text>
              <Text style={styles.weeklyStatLabel}>Progress</Text>
            </View>
          </View>
        </View>
      )}

      {/* Log Meal Modal */}
      <LogMealModal
        visible={showLogMealModal}
        onClose={() => setShowLogMealModal(false)}
        onMealLogged={handleMealLogged}
      />


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
    backgroundColor: '#f8fafc',
    paddingHorizontal: 32,
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1f2937',
    marginTop: 16,
    marginBottom: 8,
  },
  errorText: {
    fontSize: 14,
    color: '#6b7280',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 24,
  },
  retryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#6366f1',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 16,
    marginLeft: 8,
  },
  heroHeader: {
    backgroundColor: '#ffffff',
    borderBottomLeftRadius: 32,
    borderBottomRightRadius: 32,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 6,
    marginBottom: 16,
    paddingBottom: 32,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 24,
  },
  headerContent: {
    flex: 1,
  },
  greeting: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 4,
  },
  userName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 4,
  },
  motivation: {
    fontSize: 14,
    color: '#10b981',
    fontWeight: '500',
  },
  logoutButton: {
    padding: 12,
    marginLeft: 12,
    borderRadius: 8,
    backgroundColor: '#f8fafc',
    alignItems: 'center',
    justifyContent: 'center',
  },
  section: {
    marginTop: 24,
    paddingHorizontal: 16,
    marginBottom: 8,
  },
  logMealButton: {
    backgroundColor: '#f59e0b',
    borderRadius: 16,
    padding: 16,
    shadowColor: '#f59e0b',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  logMealContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  logMealIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  logMealText: {
    flex: 1,
  },
  logMealTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 4,
  },
  logMealSubtitle: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
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
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 16,
    marginTop: 4,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 12,
    paddingHorizontal: 0,
  },
  statCard: {
    width: (width - 48) / 2,
    height: 100, // Fixed height for symmetry
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    justifyContent: 'center', // Center content vertically
  },
  statContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    height: '100%', // Take full height of card
  },
  statInfo: {
    flex: 1,
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 2,
  },
  statTitle: {
    fontSize: 12,
    color: '#ffffff',
    opacity: 0.9,
    fontWeight: '600',
  },
  statSubtitle: {
    fontSize: 10,
    color: '#ffffff',
    opacity: 0.7,
    marginTop: 2,
  },
  routinesScroll: {
    paddingLeft: 0,
  },
  routineCard: {
    width: 200,
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 20,
    marginRight: 16,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  routineHeader: {
    marginBottom: 12,
  },
  routineName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 4,
  },
  routineType: {
    fontSize: 12,
    color: '#6b7280',
    textTransform: 'capitalize',
  },
  routineProgress: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  progressBar: {
    flex: 1,
    height: 6,
    backgroundColor: '#e5e7eb',
    borderRadius: 3,
    marginRight: 8,
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#10b981',
    borderRadius: 3,
  },
  routineProgressText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#10b981',
  },
  nextWorkout: {
    fontSize: 11,
    color: '#6b7280',
    fontStyle: 'italic',
  },
  goalItem: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  goalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  goalTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1f2937',
    flex: 1,
  },
  goalProgress: {
    fontSize: 12,
    color: '#6b7280',
  },
  goalPercentage: {
    fontSize: 12,
    color: '#10b981',
    fontWeight: '600',
    textAlign: 'right',
    marginTop: 4,
  },
  activityContainer: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  activityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  activityIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  activityContent: {
    flex: 1,
  },
  activityTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 2,
  },
  activityDetails: {
    fontSize: 12,
    color: '#6b7280',
    marginBottom: 2,
  },
  activityTime: {
    fontSize: 11,
    color: '#9ca3af',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 32,
    backgroundColor: '#ffffff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  emptyText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#6b7280',
    marginTop: 12,
    marginBottom: 4,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#9ca3af',
    textAlign: 'center',
  },
  weeklyStats: {
    flexDirection: 'row',
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  weeklyStatItem: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 8,
  },
  weeklyStatValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 4,
  },
  weeklyStatLabel: {
    fontSize: 12,
    color: '#6b7280',
    textAlign: 'center',
  },
  suggestionCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 20,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  suggestionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  suggestionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1f2937',
    flex: 1,
    marginLeft: 8,
  },
  priorityBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  priorityText: {
    fontSize: 10,
    color: '#ffffff',
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  suggestionMessage: {
    fontSize: 13,
    color: '#6b7280',
    lineHeight: 18,
  },
});