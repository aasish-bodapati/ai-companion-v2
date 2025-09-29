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
import StatsCard from '../ui/StatsCard';
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
      console.error('Failed to load water stats:', error);
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
      console.error('Failed to load water goal from profile:', error);
      setWaterGoal(3000); // Fallback to default
    }
  };

  useEffect(() => {
    loadStats();
    loadWaterGoal();
  }, []);

  // Refresh water goal when component mounts or when screen comes into focus
  useEffect(() => {
    const refreshWaterGoal = () => {
      loadWaterGoal();
    };

    // Refresh every 5 seconds to catch any updates
    const interval = setInterval(refreshWaterGoal, 5000);
    
    return () => clearInterval(interval);
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
            progress_percentage: Math.max(0, ((prevStats.total_ml_today - removedAmount) / prevStats.goal_ml) * 100),
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

  const progressData = {
    current: displayStats.total_ml_today,
    target: displayStats.goal_ml,
    label: 'Daily Goal',
    color: isGoalAchieved ? COLORS.success : COLORS.primary,
  };

  const achievementData = isGoalAchieved ? {
    reached: true,
    message: 'Goal Achieved! 🎉',
    icon: 'trophy',
  } : undefined;

  return (
    <View style={styles.container}>
      <StatsCard
        title="Water Intake"
        icon="water"
        iconColor={COLORS.primary}
        stats={statsData}
        progress={progressData}
        achievement={achievementData}
        style={styles.card}
      />
      
      {/* Action Buttons */}
      <View style={styles.actionContainer}>
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
  },
  card: {
    marginHorizontal: 0, // Override default margin since container handles it
    marginBottom: 0,
  },
  actionContainer: {
    backgroundColor: COLORS.background.primary,
    borderRadius: 12,
    padding: SPACING.lg,
    marginTop: SPACING.sm,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: SPACING.sm,
    marginBottom: SPACING.md,
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
