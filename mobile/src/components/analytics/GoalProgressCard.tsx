import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import MobileOptimizedCard from '../ui/MobileOptimizedCard';
import { GoalProgress, GoalAnalytics, numericalGoalsService } from '../../services/numericalGoalsService';
import { hapticFeedback } from '../../utils/haptics';
import { COMMON_STYLES } from '../../theme/constants';

interface GoalProgressCardProps {
  onPress?: () => void;
}

export default function GoalProgressCard({ onPress }: GoalProgressCardProps) {
  const [analytics, setAnalytics] = useState<GoalAnalytics | null>(null);
  const [progressData, setProgressData] = useState<GoalProgress[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadGoalData();
  }, []);

  const loadGoalData = async () => {
    try {
      setLoading(true);
      const [analyticsData, progressData] = await Promise.all([
        numericalGoalsService.getAnalytics(),
        numericalGoalsService.calculateProgress(),
      ]);
      
      setAnalytics(analyticsData);
      setProgressData(progressData);
    } catch (error) {
      // Silent error handling - no console logging to prevent Expo Go notifications
    } finally {
      setLoading(false);
    }
  };

  const getProgressColor = (percentage: number) => {
    if (percentage >= 100) return '#10b981'; // Green
    if (percentage >= 70) return '#f59e0b'; // Yellow
    return '#ef4444'; // Red
  };

  const getProgressIcon = (percentage: number) => {
    if (percentage >= 100) return 'checkmark-circle';
    if (percentage >= 70) return 'trending-up';
    return 'warning';
  };

  if (loading) {
    return (
      <MobileOptimizedCard variant="elevated" style={styles.card}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="small" color="#3b82f6" />
          <Text style={styles.loadingText}>Loading goal progress...</Text>
        </View>
      </MobileOptimizedCard>
    );
  }

  if (!analytics || analytics.totalGoals === 0) {
    return (
      <MobileOptimizedCard variant="elevated" style={styles.card}>
        <View style={styles.emptyContainer}>
          <Ionicons name="flag-outline" size={32} color="#9ca3af" />
          <Text style={styles.emptyTitle}>No Goals Set</Text>
          <Text style={styles.emptyText}>
            Set up numerical goals to track your progress
          </Text>
        </View>
      </MobileOptimizedCard>
    );
  }

  return (
    <MobileOptimizedCard 
      variant="elevated" 
      style={styles.card}
      onPress={onPress}
      hapticFeedback="light"
    >
      <View style={styles.header}>
        <View style={styles.titleContainer}>
          <Ionicons name="analytics-outline" size={24} color="#3b82f6" />
          <Text style={styles.title}>Goal Progress</Text>
        </View>
        <TouchableOpacity onPress={onPress}>
          <Ionicons name="chevron-forward" size={20} color="#6b7280" />
        </TouchableOpacity>
      </View>

      {/* Summary Stats */}
      <View style={styles.summaryContainer}>
        <View style={styles.summaryItem}>
          <Text style={styles.summaryValue}>{analytics.completedGoals}</Text>
          <Text style={styles.summaryLabel}>Completed</Text>
        </View>
        <View style={styles.summaryDivider} />
        <View style={styles.summaryItem}>
          <Text style={styles.summaryValue}>{analytics.onTrackGoals}</Text>
          <Text style={styles.summaryLabel}>On Track</Text>
        </View>
        <View style={styles.summaryDivider} />
        <View style={styles.summaryItem}>
          <Text style={styles.summaryValue}>{analytics.behindGoals}</Text>
          <Text style={styles.summaryLabel}>Behind</Text>
        </View>
      </View>

      {/* Overall Progress */}
      <View style={styles.overallProgress}>
        <Text style={styles.overallProgressLabel}>Overall Progress</Text>
        <View style={styles.progressBarContainer}>
          <View style={styles.progressBar}>
            <View 
              style={[
                styles.progressFill, 
                { 
                  width: `${analytics.averageProgress}%`,
                  backgroundColor: getProgressColor(analytics.averageProgress)
                }
              ]} 
            />
          </View>
          <Text style={styles.progressPercentage}>
            {Math.round(analytics.averageProgress)}%
          </Text>
        </View>
      </View>

      {/* Top Goals */}
      <View style={styles.goalsList}>
        {progressData.slice(0, 3).map((goal) => (
          <View key={goal.goalId} style={styles.goalItem}>
            <View style={styles.goalInfo}>
              <View style={styles.goalHeader}>
                <Text style={styles.goalName}>{goal.goalName}</Text>
                <Ionicons 
                  name={getProgressIcon(goal.progressPercentage)} 
                  size={16} 
                  color={getProgressColor(goal.progressPercentage)} 
                />
              </View>
              <Text style={styles.goalProgress}>
                {goal.currentValue.toFixed(1)} / {goal.targetValue} {goal.unit}
              </Text>
            </View>
            <View style={styles.goalProgressBar}>
              <View 
                style={[
                  styles.goalProgressFill, 
                  { 
                    width: `${Math.min(goal.progressPercentage, 100)}%`,
                    backgroundColor: goal.color
                  }
                ]} 
              />
            </View>
          </View>
        ))}
        
        {progressData.length > 3 && (
          <Text style={styles.moreGoalsText}>
            +{progressData.length - 3} more goals
          </Text>
        )}
      </View>
    </MobileOptimizedCard>
  );
}

const styles = StyleSheet.create({
  card: {
    marginBottom: 16,
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 20,
  },
  loadingText: {
    marginLeft: 8,
    fontSize: 14,
    color: '#6b7280',
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 24,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#6b7280',
    marginTop: 12,
    marginBottom: 4,
  },
  emptyText: {
    fontSize: 14,
    color: '#9ca3af',
    textAlign: 'center',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1f2937',
    marginLeft: 8,
  },
  summaryContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COMMON_STYLES.secondaryBackground,
    borderRadius: COMMON_STYLES.standardRadius,
    padding: 16,
    marginBottom: 16,
  },
  summaryItem: {
    flex: 1,
    alignItems: 'center',
  },
  summaryValue: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1f2937',
    marginBottom: 4,
  },
  summaryLabel: {
    fontSize: 12,
    color: '#6b7280',
    fontWeight: '500',
  },
  summaryDivider: {
    width: 1,
    height: 40,
    backgroundColor: '#e5e7eb',
    marginHorizontal: 16,
  },
  overallProgress: {
    marginBottom: 16,
  },
  overallProgressLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6b7280',
    marginBottom: 8,
  },
  progressBarContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  progressBar: {
    flex: 1,
    height: 8,
    backgroundColor: '#e5e7eb',
    borderRadius: 4,
    overflow: 'hidden',
    marginRight: 12,
  },
  progressFill: {
    height: '100%',
    borderRadius: 4,
  },
  progressPercentage: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1f2937',
    minWidth: 40,
    textAlign: 'right',
  },
  goalsList: {
    gap: 12,
  },
  goalItem: {
    backgroundColor: COMMON_STYLES.secondaryBackground,
    borderRadius: 8,
    padding: 12,
  },
  goalInfo: {
    marginBottom: 8,
  },
  goalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  goalName: {
    fontSize: 14,
    fontWeight: '500',
    color: '#1f2937',
    flex: 1,
  },
  goalProgress: {
    fontSize: 12,
    color: '#6b7280',
  },
  goalProgressBar: {
    height: 4,
    backgroundColor: '#e5e7eb',
    borderRadius: 2,
    overflow: 'hidden',
  },
  goalProgressFill: {
    height: '100%',
    borderRadius: 2,
  },
  moreGoalsText: {
    fontSize: 12,
    color: '#6b7280',
    textAlign: 'center',
    fontStyle: 'italic',
    marginTop: 4,
  },
});
