import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface GoalAlignmentData {
  alignmentPercentage: number;
  trend: 'up' | 'down' | 'stable';
  trendValue: number; // percentage change
  dailyScore: number;
  weeklyScore: number;
  breakdown: {
    workouts: number;
    nutrition: number;
    consistency: number;
  };
}

interface GoalAlignmentHeroProps {
  goalName: string;
  data: GoalAlignmentData;
  onViewDailyLogs?: () => void;
  onViewBodyTypeDashboard?: () => void;
}

export default function GoalAlignmentHero({
  goalName,
  data,
  onViewDailyLogs,
  onViewBodyTypeDashboard,
}: GoalAlignmentHeroProps) {
  const getAlignmentColor = (percentage: number) => {
    if (percentage >= 80) return '#10b981'; // Green
    if (percentage >= 60) return '#f59e0b'; // Yellow
    return '#ef4444'; // Red
  };

  const getAlignmentLabel = (percentage: number) => {
    if (percentage >= 80) return 'Closer';
    if (percentage >= 60) return 'Neutral';
    return 'Farther';
  };

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'up': return 'trending-up';
      case 'down': return 'trending-down';
      default: return 'remove';
    }
  };

  const getTrendColor = (trend: string) => {
    switch (trend) {
      case 'up': return '#10b981';
      case 'down': return '#ef4444';
      default: return '#6b7280';
    }
  };

  const alignmentColor = getAlignmentColor(data.alignmentPercentage);
  const trendColor = getTrendColor(data.trend);

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.goalInfo}>
          <Ionicons name="trophy-outline" size={24} color="#3b82f6" />
          <View style={styles.goalText}>
            <Text style={styles.goalName}>{goalName}</Text>
            <Text style={styles.goalSubtext}>Body Type Goal Alignment</Text>
          </View>
        </View>
        <View style={styles.trendIndicator}>
          <Ionicons 
            name={getTrendIcon(data.trend) as any} 
            size={16} 
            color={trendColor} 
          />
          <Text style={[styles.trendText, { color: trendColor }]}>
            {data.trendValue > 0 ? '+' : ''}{data.trendValue}%
          </Text>
        </View>
      </View>

      {/* Main Alignment Display */}
      <View style={styles.alignmentSection}>
        <View style={styles.alignmentMain}>
          <Text style={styles.alignmentLabel}>Current Alignment</Text>
          <View style={styles.alignmentValueContainer}>
            <Text style={[styles.alignmentValue, { color: alignmentColor }]}>
              {data.alignmentPercentage}%
            </Text>
            <Text style={[styles.alignmentStatus, { color: alignmentColor }]}>
              {getAlignmentLabel(data.alignmentPercentage)}
            </Text>
          </View>
        </View>

        {/* Progress Ring */}
        <View style={styles.progressRingContainer}>
          <View style={[styles.progressRing, { borderColor: alignmentColor }]}>
            <View style={styles.progressRingInner}>
              <Text style={[styles.progressRingText, { color: alignmentColor }]}>
                {data.alignmentPercentage}%
              </Text>
            </View>
          </View>
        </View>
      </View>

      {/* Score Breakdown */}
      <View style={styles.scoreBreakdown}>
        <View style={styles.scoreItem}>
          <Text style={styles.scoreValue}>{data.dailyScore}</Text>
          <Text style={styles.scoreLabel}>Daily Score</Text>
        </View>
        <View style={styles.scoreItem}>
          <Text style={styles.scoreValue}>{data.weeklyScore}</Text>
          <Text style={styles.scoreLabel}>Weekly Score</Text>
        </View>
        <View style={styles.scoreItem}>
          <Text style={[styles.scoreValue, { color: alignmentColor }]}>
            {data.alignmentPercentage}%
          </Text>
          <Text style={styles.scoreLabel}>Alignment</Text>
        </View>
      </View>

      {/* Breakdown Details */}
      <View style={styles.breakdownSection}>
        <Text style={styles.breakdownTitle}>Score Breakdown</Text>
        <View style={styles.breakdownGrid}>
          <View style={styles.breakdownItem}>
            <Ionicons name="fitness-outline" size={16} color="#10b981" />
            <Text style={styles.breakdownValue}>{data.breakdown.workouts}</Text>
            <Text style={styles.breakdownLabel}>Workouts</Text>
          </View>
          <View style={styles.breakdownItem}>
            <Ionicons name="restaurant-outline" size={16} color="#3b82f6" />
            <Text style={styles.breakdownValue}>{data.breakdown.nutrition}</Text>
            <Text style={styles.breakdownLabel}>Nutrition</Text>
          </View>
          <View style={styles.breakdownItem}>
            <Ionicons name="checkmark-circle-outline" size={16} color="#f59e0b" />
            <Text style={styles.breakdownValue}>{data.breakdown.consistency}</Text>
            <Text style={styles.breakdownLabel}>Consistency</Text>
          </View>
        </View>
      </View>

      {/* Action Buttons */}
      <View style={styles.actionButtons}>
        <TouchableOpacity 
          style={[styles.actionButton, styles.primaryButton]}
          onPress={onViewDailyLogs}
        >
          <Ionicons name="list-outline" size={18} color="#ffffff" />
          <Text style={styles.primaryButtonText}>View Daily Logs</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.actionButton, styles.secondaryButton]}
          onPress={onViewBodyTypeDashboard}
        >
          <Ionicons name="analytics-outline" size={18} color="#3b82f6" />
          <Text style={styles.secondaryButtonText}>Body Type Dashboard</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#ffffff',
    borderRadius: 20,
    padding: 20,
    margin: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  goalInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  goalText: {
    marginLeft: 12,
    flex: 1,
  },
  goalName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 2,
  },
  goalSubtext: {
    fontSize: 14,
    color: '#6b7280',
  },
  trendIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  trendText: {
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 4,
  },
  alignmentSection: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  alignmentMain: {
    flex: 1,
  },
  alignmentLabel: {
    fontSize: 16,
    color: '#6b7280',
    marginBottom: 8,
  },
  alignmentValueContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  alignmentValue: {
    fontSize: 48,
    fontWeight: 'bold',
    marginRight: 12,
  },
  alignmentStatus: {
    fontSize: 18,
    fontWeight: '600',
  },
  progressRingContainer: {
    marginLeft: 20,
  },
  progressRing: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  progressRingInner: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#f8fafc',
    alignItems: 'center',
    justifyContent: 'center',
  },
  progressRingText: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  scoreBreakdown: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 20,
    paddingVertical: 16,
    backgroundColor: '#f8fafc',
    borderRadius: 12,
  },
  scoreItem: {
    alignItems: 'center',
  },
  scoreValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 4,
  },
  scoreLabel: {
    fontSize: 12,
    color: '#6b7280',
  },
  breakdownSection: {
    marginBottom: 20,
  },
  breakdownTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 12,
  },
  breakdownGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  breakdownItem: {
    alignItems: 'center',
    flex: 1,
  },
  breakdownValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1f2937',
    marginTop: 4,
    marginBottom: 2,
  },
  breakdownLabel: {
    fontSize: 12,
    color: '#6b7280',
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
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
  },
  primaryButton: {
    backgroundColor: '#3b82f6',
  },
  secondaryButton: {
    backgroundColor: '#f1f5f9',
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  primaryButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
    marginLeft: 6,
  },
  secondaryButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#3b82f6',
    marginLeft: 6,
  },
});
