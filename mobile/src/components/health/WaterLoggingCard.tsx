import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { waterService, WaterLogStats } from '../../services/waterService';
import { hapticFeedback } from '../../utils/haptics';

interface WaterLoggingCardProps {
  // No props needed - component manages its own state
}

export default function WaterLoggingCard({}: WaterLoggingCardProps) {
  const [stats, setStats] = useState<WaterLogStats | null>(null);

  const loadStats = async () => {
    try {
      const waterStats = await waterService.getWaterStats();
      setStats(waterStats);
    } catch (error) {
      console.error('Failed to load water stats:', error);
    }
  };

  useEffect(() => {
    loadStats();
  }, []);

  const handleQuickLog = async (amount_ml: number) => {
    try {
      hapticFeedback.light();
      
      await waterService.quickLogWater(amount_ml);
      
      // Update stats optimistically without reloading
      if (stats) {
        setStats(prevStats => {
          if (!prevStats) return prevStats;
          return {
            ...prevStats,
            total_ml_today: prevStats.total_ml_today + amount_ml,
            total_oz_today: prevStats.total_oz_today + (amount_ml * 0.033814),
            logs_today: prevStats.logs_today + 1,
            progress_percentage: Math.min(((prevStats.total_ml_today + amount_ml) / prevStats.daily_goal_ml) * 100, 100),
          };
        });
      }
      
      hapticFeedback.success();
    } catch (error) {
      console.error('Failed to log water:', error);
      hapticFeedback.error();
      Alert.alert('Error', 'Failed to log water. Please try again.');
      // Reload stats on error to get accurate data
      loadStats();
    }
  };

  const handleQuickLogTap = () => {
    // Log a standard amount (250ml) with each tap
    handleQuickLog(250);
  };

  const handleQuickLogMinus = async () => {
    try {
      hapticFeedback.light();
      
      // Get today's water logs to find the most recent one
      const todaysLogs = await waterService.getWaterLogs(1);
      
      if (todaysLogs.length === 0) {
        hapticFeedback.error();
        Alert.alert('No Water Logs', 'No water logs found to remove today.');
        return;
      }
      
      // Delete the most recent log
      const mostRecentLog = todaysLogs[todaysLogs.length - 1];
      await waterService.deleteWaterLog(mostRecentLog.id);
      
      // Update stats optimistically
      if (stats) {
        setStats(prevStats => {
          if (!prevStats) return prevStats;
          const removedAmount = mostRecentLog.amount_ml;
          return {
            ...prevStats,
            total_ml_today: Math.max(0, prevStats.total_ml_today - removedAmount),
            total_oz_today: Math.max(0, prevStats.total_oz_today - (removedAmount * 0.033814)),
            logs_today: Math.max(0, prevStats.logs_today - 1),
            progress_percentage: Math.max(0, ((prevStats.total_ml_today - removedAmount) / prevStats.daily_goal_ml) * 100),
          };
        });
      }
      
      hapticFeedback.success();
    } catch (error) {
      console.error('Failed to remove water log:', error);
      hapticFeedback.error();
      Alert.alert('Error', 'Failed to remove water log. Please try again.');
      // Reload stats on error to get accurate data
      loadStats();
    }
  };

  // Use default values if stats haven't loaded yet
  const displayStats = stats || {
    total_ml_today: 0,
    total_oz_today: 0,
    logs_today: 0,
    daily_goal_ml: 2000,
    daily_goal_oz: 67.63,
    progress_percentage: 0,
    average_per_log: 250,
  };

  const progressPercentage = Math.min(displayStats.progress_percentage, 100);
  const isGoalAchieved = progressPercentage >= 100;

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <View style={styles.titleContainer}>
          <Ionicons name="water" size={20} color="#3b82f6" />
          <Text style={styles.title}>Water Intake</Text>
        </View>
        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={[
              styles.logButton, 
              styles.minusButton,
              displayStats.logs_today === 0 && styles.disabledButton
            ]}
            onPress={handleQuickLogMinus}
            activeOpacity={0.7}
            disabled={displayStats.logs_today === 0}
          >
            <Ionicons name="remove" size={16} color="#ffffff" />
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.logButton, styles.plusButton]}
            onPress={handleQuickLogTap}
            activeOpacity={0.7}
          >
            <Ionicons name="add" size={16} color="#ffffff" />
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.content}>
        <View style={styles.statsRow}>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{displayStats.total_ml_today}ml</Text>
            <Text style={styles.statLabel}>Today</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{displayStats.total_oz_today.toFixed(1)}oz</Text>
            <Text style={styles.statLabel}>Today</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{displayStats.logs_today}</Text>
            <Text style={styles.statLabel}>Logs</Text>
          </View>
        </View>
        
        <View style={styles.quickLogInfo}>
          <Text style={styles.quickLogText}>Tap + to add 250ml, - to remove last log</Text>
          <Text style={styles.quickLogSubtext}>
            {displayStats.logs_today > 0 ? `${displayStats.logs_today} logs today` : 'Tap multiple times for more'}
          </Text>
        </View>

        <View style={styles.progressContainer}>
          <View style={styles.progressHeader}>
            <Text style={styles.progressLabel}>Daily Goal</Text>
            <Text style={styles.progressText}>
              {displayStats.total_ml_today}ml / {displayStats.daily_goal_ml}ml
            </Text>
          </View>
          <View style={styles.progressBar}>
            <View
              style={[
                styles.progressFill,
                {
                  width: `${progressPercentage}%`,
                  backgroundColor: isGoalAchieved ? '#10b981' : '#3b82f6',
                },
              ]}
            />
          </View>
          <Text style={styles.progressPercentage}>
            {progressPercentage.toFixed(0)}% Complete
          </Text>
        </View>

        {isGoalAchieved && (
          <View style={styles.achievementContainer}>
            <Ionicons name="trophy" size={16} color="#10b981" />
            <Text style={styles.achievementText}>Goal Achieved! 🎉</Text>
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 20,
    marginHorizontal: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
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
  buttonContainer: {
    flexDirection: 'row',
    gap: 8,
  },
  logButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    flexDirection: 'row',
    alignItems: 'center',
    minWidth: 40,
    justifyContent: 'center',
  },
  plusButton: {
    backgroundColor: '#10b981',
  },
  minusButton: {
    backgroundColor: '#ef4444',
  },
  disabledButton: {
    backgroundColor: '#9ca3af',
    opacity: 0.5,
  },
  content: {
    gap: 16,
  },
  quickLogInfo: {
    alignItems: 'center',
    paddingVertical: 8,
    backgroundColor: '#f8fafc',
    borderRadius: 8,
    marginVertical: 4,
  },
  quickLogText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#3b82f6',
    marginBottom: 2,
  },
  quickLogSubtext: {
    fontSize: 12,
    color: '#6b7280',
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1f2937',
  },
  statLabel: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 2,
  },
  progressContainer: {
    gap: 8,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  progressLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
  },
  progressText: {
    fontSize: 12,
    color: '#6b7280',
  },
  progressBar: {
    height: 8,
    backgroundColor: '#e5e7eb',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 4,
  },
  progressPercentage: {
    fontSize: 12,
    color: '#6b7280',
    textAlign: 'center',
  },
  achievementContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#d1fae5',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 6,
  },
  achievementText: {
    color: '#065f46',
    fontWeight: '600',
    marginLeft: 4,
  },
});
