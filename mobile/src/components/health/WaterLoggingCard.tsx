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
import SectionHeader from '../layout/SectionHeader';
import { COLORS, SPACING } from '../../theme/constants';

interface WaterLoggingCardProps {
  // No props needed - component manages its own state
}

export default function WaterLoggingCard({}: WaterLoggingCardProps) {
  const [stats, setStats] = useState<WaterLogStats | null>(null);
  const [waterGoal, setWaterGoal] = useState<number>(3000); // Default 3L

  const loadStats = async () => {
    try {
      const waterStats = await waterService.getWaterStats();
      setStats(waterStats);
    } catch (error) {
      // Silent error handling - no console logging to prevent Expo Go notifications
    }
  };

  const loadWaterGoal = async () => {
    try {
      // Get user profile to determine gender-based water goal
      const { profileService } = await import('../../services/profileService');
      const profile = await profileService.getUserProfile();
      
      if (profile?.health_data?.gender) {
        const gender = profile.health_data.gender;
        let waterGoalMl = 3000; // Default 3L
        
        if (gender === 'female') {
          waterGoalMl = 2700; // 2.7L for females
        } else if (gender === 'male') {
          waterGoalMl = 3700; // 3.7L for males
        } else {
          waterGoalMl = 3000; // Default 3L for other
        }
        
        setWaterGoal(waterGoalMl);
      } else {
        setWaterGoal(3000);
      }
    } catch (error) {
      // Silent error handling - no console logging to prevent Expo Go notifications
      setWaterGoal(3000); // Fallback to default
    }
  };

  useEffect(() => {
    loadStats();
    loadWaterGoal();
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
            progress_percentage: Math.min(((prevStats.total_ml_today + amount_ml) / prevStats.goal_ml) * 100, 100),
          };
        });
      }
      
      hapticFeedback.success();
    } catch (error) {
      // Silent error handling - no console logging to prevent Expo Go notifications
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
            progress_percentage: Math.max(0, ((prevStats.total_ml_today - removedAmount) / prevStats.goal_ml) * 100),
          };
        });
      }
      
      hapticFeedback.success();
    } catch (error) {
      // Silent error handling - no console logging to prevent Expo Go notifications
      hapticFeedback.error();
      Alert.alert('Error', 'Failed to remove water log. Please try again.');
      // Reload stats on error to get accurate data
      loadStats();
    }
  };

  // Use default values if stats haven't loaded yet, but use dynamic water goal
  const displayStats = stats ? {
    ...stats,
    goal_ml: waterGoal, // Override with numerical goal
    goal_oz: waterGoal * 0.033814, // Convert to oz
  } : {
    total_ml_today: 0,
    total_oz_today: 0,
    logs_today: 0,
    goal_ml: waterGoal, // Use dynamic goal
    goal_oz: waterGoal * 0.033814, // Convert to oz
    progress_percentage: 0,
    average_per_log: 250,
  };

  // Calculate progress percentage dynamically
  const progressPercentage = Math.min((displayStats.total_ml_today / displayStats.goal_ml) * 100, 100);
  const isGoalAchieved = progressPercentage >= 100;
  

  const statsData = [
    {
      label: 'ML Today',
      value: displayStats.total_ml_today,
      unit: 'ml',
      color: COLORS.primary,
    },
    {
      label: 'OZ Today',
      value: displayStats.total_oz_today.toFixed(1),
      unit: 'oz',
      color: COLORS.primary,
    },
    {
      label: 'Logs',
      value: displayStats.logs_today,
      color: COLORS.success,
    },
  ];


  return (
    <View style={styles.container}>
      <View style={styles.card}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <View style={styles.iconContainer}>
              <Ionicons name="water" size={20} color={COLORS.primary} />
            </View>
            <View style={styles.headerText}>
              <Text style={styles.title}>Water Intake</Text>
              <Text style={styles.subtitle}>
                {displayStats.total_ml_today}ml ({displayStats.total_oz_today.toFixed(1)} fl oz)
              </Text>
            </View>
          </View>
          <View style={[
            styles.badge,
            { backgroundColor: COLORS.primary }
          ]}>
            <Text style={styles.badgeText}>{Math.round(displayStats.progress_percentage)}%</Text>
          </View>
        </View>

        {/* Progress Bar */}
        <View style={styles.progressContainer}>
          <View style={styles.progressBar}>
            <View 
              style={[
                styles.progressFill,
                { 
                  width: `${Math.min(displayStats.progress_percentage, 100)}%`,
                  backgroundColor: COLORS.primary
                }
              ]} 
            />
          </View>
          <Text style={styles.progressText}>
            {displayStats.total_ml_today}ml / {displayStats.goal_ml}ml
          </Text>
        </View>
        
        {/* Action Buttons */}
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
        
        <View style={styles.quickLogInfo}>
          <Text style={styles.quickLogText}>Tap + to add 250ml, - to remove last log</Text>
          <Text style={styles.quickLogSubtext}>
            {displayStats.logs_today > 0 ? `${displayStats.logs_today} logs today` : 'Tap multiple times for more'}
          </Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginHorizontal: SPACING.lg,
    marginBottom: SPACING.md,
  },
  card: {
    backgroundColor: COLORS.background.primary,
    borderRadius: 12,
    padding: SPACING.lg,
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
    marginBottom: SPACING.md,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.primary + '20',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: SPACING.sm,
  },
  headerText: {
    flex: 1,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.text.primary,
    marginBottom: 2,
  },
  subtitle: {
    fontSize: 14,
    color: COLORS.text.secondary,
  },
  badge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  badgeText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '600',
  },
  progressContainer: {
    marginBottom: SPACING.md,
  },
  progressBar: {
    height: 8,
    backgroundColor: COLORS.gray[200],
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: SPACING.xs,
  },
  progressFill: {
    height: '100%',
    borderRadius: 4,
  },
  progressText: {
    fontSize: 12,
    color: COLORS.text.secondary,
    textAlign: 'center',
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: SPACING.sm,
    marginBottom: SPACING.sm,
  },
  logButton: {
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.sm,
    borderRadius: 20,
    flexDirection: 'row',
    alignItems: 'center',
    minWidth: 40,
    justifyContent: 'center',
  },
  plusButton: {
    backgroundColor: COLORS.success,
  },
  minusButton: {
    backgroundColor: COLORS.danger,
  },
  disabledButton: {
    backgroundColor: COLORS.gray[400],
    opacity: 0.5,
  },
  quickLogInfo: {
    alignItems: 'center',
    paddingVertical: SPACING.sm,
    backgroundColor: COLORS.background.secondary,
    borderRadius: SPACING.sm,
  },
  quickLogText: {
    fontSize: 14,
    fontWeight: '500',
    color: COLORS.primary,
    marginBottom: 2,
  },
  quickLogSubtext: {
    fontSize: 12,
    color: COLORS.text.secondary,
  },
});
