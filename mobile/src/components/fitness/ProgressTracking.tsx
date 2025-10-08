import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface ProgressRing {
  id: string;
  title: string;
  current: number;
  target: number;
  color: string;
  icon: string;
  unit: string;
}

interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  color: string;
  unlocked: boolean;
  progress?: number;
  unlockedAt?: string;
}

interface Streak {
  type: string;
  count: number;
  icon: string;
  color: string;
}

interface ProgressTrackingProps {
  progressRings: ProgressRing[];
  achievements: Achievement[];
  streaks: Streak[];
  onRingPress?: (ring: ProgressRing) => void;
  onAchievementPress?: (achievement: Achievement) => void;
  onStreakPress?: (streak: Streak) => void;
}

export default function ProgressTracking({
  progressRings,
  achievements,
  streaks,
  onRingPress,
  onAchievementPress,
  onStreakPress,
}: ProgressTrackingProps) {
  const ProgressRingComponent = ({ ring }: { ring: ProgressRing }) => {
    const percentage = Math.min((ring.current / ring.target) * 100, 100);

    return (
      <TouchableOpacity
        style={styles.ringContainer}
        onPress={() => onRingPress?.(ring)}
        activeOpacity={0.7}
      >
        <View style={styles.ringWrapper}>
          <View style={styles.ringBackground}>
            <View style={[styles.ringProgress, { 
              borderColor: ring.color,
              transform: [{ rotate: `${(percentage / 100) * 360}deg` }]
            }]} />
          </View>
          <View style={styles.ringContent}>
            <Ionicons name={ring.icon as keyof typeof Ionicons.glyphMap} size={20} color={ring.color} />
            <Text style={styles.ringValue}>{ring.current}</Text>
            <Text style={styles.ringUnit}>{ring.unit}</Text>
          </View>
        </View>
        <Text style={styles.ringTitle}>{ring.title}</Text>
        <Text style={styles.ringProgressText}>{Math.round(percentage)}%</Text>
      </TouchableOpacity>
    );
  };

  const AchievementComponent = ({ achievement }: { achievement: Achievement }) => (
    <TouchableOpacity
      style={[
        styles.achievementCard,
        { 
          backgroundColor: achievement.unlocked ? '#f0f9ff' : '#f8fafc',
          borderColor: achievement.unlocked ? achievement.color : '#e5e7eb'
        }
      ]}
      onPress={() => onAchievementPress?.(achievement)}
      activeOpacity={0.7}
    >
      <View style={[
        styles.achievementIcon,
        { backgroundColor: achievement.unlocked ? achievement.color : '#e5e7eb' }
      ]}>
        <Ionicons 
          name={achievement.icon as keyof typeof Ionicons.glyphMap} 
          size={20} 
          color={achievement.unlocked ? '#ffffff' : '#9ca3af'} 
        />
      </View>
      <View style={styles.achievementContent}>
        <Text style={[
          styles.achievementTitle,
          { color: achievement.unlocked ? '#1f2937' : '#9ca3af' }
        ]}>
          {achievement.title}
        </Text>
        <Text style={[
          styles.achievementDescription,
          { color: achievement.unlocked ? '#6b7280' : '#d1d5db' }
        ]}>
          {achievement.description}
        </Text>
        {achievement.progress !== undefined && !achievement.unlocked && (
          <View style={styles.achievementProgress}>
            <View style={styles.progressBar}>
              <View 
                style={[
                  styles.progressFill,
                  { 
                    width: `${achievement.progress}%`,
                    backgroundColor: achievement.color
                  }
                ]}
              />
            </View>
            <Text style={styles.progressText}>{achievement.progress}%</Text>
          </View>
        )}
        {achievement.unlocked && achievement.unlockedAt && (
          <Text style={styles.unlockedText}>
            Unlocked {new Date(achievement.unlockedAt).toLocaleDateString()}
          </Text>
        )}
      </View>
    </TouchableOpacity>
  );

  const StreakComponent = ({ streak }: { streak: Streak }) => (
    <TouchableOpacity
      style={styles.streakCard}
      onPress={() => onStreakPress?.(streak)}
      activeOpacity={0.7}
    >
      <View style={[styles.streakIcon, { backgroundColor: streak.color + '20' }]}>
        <Ionicons name={streak.icon as keyof typeof Ionicons.glyphMap} size={24} color={streak.color} />
      </View>
      <View style={styles.streakContent}>
        <Text style={styles.streakCount}>{streak.count}</Text>
        <Text style={styles.streakType}>{streak.type}</Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      {/* Unified Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Progress Tracking</Text>
        <TouchableOpacity>
          <Text style={styles.viewAllText}>View All</Text>
        </TouchableOpacity>
      </View>

      {/* Progress Rings */}
      <View style={styles.section}>
        <View style={styles.ringsContainer}>
          {progressRings.map((ring) => (
            <ProgressRingComponent key={ring.id} ring={ring} />
          ))}
        </View>
      </View>

      {/* Streaks */}
      {streaks.length > 0 && (
        <View style={styles.section}>
          <View style={styles.streaksContainer}>
            {streaks.map((streak, index) => (
              <StreakComponent key={streak.type || index} streak={streak} />
            ))}
          </View>
        </View>
      )}

      {/* Achievements */}
      {achievements.length > 0 && (
        <View style={styles.section}>
          <View style={styles.achievementsContainer}>
            {achievements.slice(0, 3).map((achievement) => (
              <AchievementComponent key={achievement.id} achievement={achievement} />
            ))}
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 20,
    marginHorizontal: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1f2937',
  },
  section: {
    marginBottom: 20,
  },
  ringsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    flexWrap: 'wrap',
    width: '100%',
  },
  ringContainer: {
    alignItems: 'center',
    marginBottom: 16,
    minWidth: 80,
    flex: 1,
  },
  ringWrapper: {
    position: 'relative',
    width: 90,
    height: 90,
    marginBottom: 8,
  },
  ringBackground: {
    width: 90,
    height: 90,
    borderRadius: 45,
    borderWidth: 8,
    borderColor: '#e5e7eb',
    position: 'absolute',
  },
  ringProgress: {
    width: 90,
    height: 90,
    borderRadius: 45,
    borderWidth: 8,
    borderColor: 'transparent',
    borderTopColor: '#3b82f6',
    position: 'absolute',
  },
  ringContent: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ringValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1f2937',
    marginTop: 2,
  },
  ringUnit: {
    fontSize: 10,
    color: '#6b7280',
  },
  ringTitle: {
    fontSize: 12,
    fontWeight: '500',
    color: '#1f2937',
    textAlign: 'center',
    marginBottom: 2,
  },
  ringProgressText: {
    fontSize: 10,
    color: '#6b7280',
  },
  streaksContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  streakCard: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  streakIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  streakContent: {
    flex: 1,
  },
  streakCount: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1f2937',
  },
  streakType: {
    fontSize: 12,
    color: '#6b7280',
  },
  achievementsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  viewAllText: {
    fontSize: 14,
    color: '#3b82f6',
    fontWeight: '500',
  },
  achievementsContainer: {
    gap: 12,
  },
  achievementCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    marginHorizontal: 0,
  },
  achievementIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  achievementContent: {
    flex: 1,
  },
  achievementTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 2,
  },
  achievementDescription: {
    fontSize: 12,
    marginBottom: 4,
  },
  achievementProgress: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  progressBar: {
    flex: 1,
    height: 4,
    backgroundColor: '#e5e7eb',
    borderRadius: 2,
    marginRight: 8,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 2,
  },
  progressText: {
    fontSize: 10,
    color: '#6b7280',
  },
  unlockedText: {
    fontSize: 10,
    color: '#10b981',
    fontStyle: 'italic',
  },
});
