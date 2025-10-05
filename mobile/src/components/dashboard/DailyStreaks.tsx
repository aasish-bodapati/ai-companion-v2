import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface Streak {
  id: string;
  type: 'workout' | 'nutrition' | 'water' | 'mood';
  title: string;
  current: number;
  target: number;
  color: string;
  icon: string;
  description: string;
}

interface DailyStreaksProps {
  streaks?: Streak[];
  onStreakPress?: (streak: Streak) => void;
  onViewAll?: () => void;
  style?: any;
}

const defaultStreaks: Streak[] = [
  {
    id: 'workout',
    type: 'workout',
    title: 'Workout Streak',
    current: 7,
    target: 30,
    color: '#3b82f6',
    icon: 'fitness',
    description: 'Days in a row',
  },
  {
    id: 'nutrition',
    type: 'nutrition',
    title: 'Nutrition Log',
    current: 5,
    target: 30,
    color: '#10b981',
    icon: 'restaurant',
    description: 'Days logged',
  },
  {
    id: 'water',
    type: 'water',
    title: 'Hydration',
    current: 12,
    target: 30,
    color: '#06b6d4',
    icon: 'water',
    description: 'Days hydrated',
  },
  {
    id: 'mood',
    type: 'mood',
    title: 'Mood Check',
    current: 3,
    target: 30,
    color: '#f59e0b',
    icon: 'happy',
    description: 'Days tracked',
  },
];

export default function DailyStreaks({
  streaks = defaultStreaks,
  onStreakPress,
  onViewAll,
  style,
}: DailyStreaksProps) {
  const getProgressPercentage = (current: number, target: number) => {
    return Math.min((current / target) * 100, 100);
  };

  return (
    <View style={[styles.container, style]}>
      <View style={styles.header}>
        <View style={styles.titleContainer}>
          <View style={styles.iconContainer}>
            <Ionicons name="flame" size={20} color="#3b82f6" />
          </View>
          <View style={styles.textContainer}>
            <Text style={styles.title}>Daily Streaks</Text>
            <Text style={styles.subtitle}>Keep the momentum going</Text>
          </View>
        </View>
        {onViewAll && (
          <TouchableOpacity
            style={styles.actionButton}
            onPress={onViewAll}
            activeOpacity={0.7}
          >
            <Text style={styles.actionText}>View All</Text>
            <Ionicons name="chevron-forward" size={16} color="#3b82f6" />
          </TouchableOpacity>
        )}
      </View>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.streaksContainer}
      >
        {streaks.map((streak) => (
          <TouchableOpacity
            key={streak.id || streak.type}
            style={[styles.streakCard, { borderLeftColor: streak.color }]}
            onPress={() => onStreakPress?.(streak)}
            activeOpacity={0.7}
          >
            <View style={styles.streakHeader}>
              <View style={[styles.streakIcon, { backgroundColor: streak.color + '20' }]}>
                <Ionicons name={streak.icon as any} size={20} color={streak.color} />
              </View>
              <View style={styles.streakInfo}>
                <Text style={styles.streakTitle}>{streak.title}</Text>
                <Text style={styles.streakDescription}>{streak.description}</Text>
              </View>
            </View>
            
            <View style={styles.streakProgress}>
              <View style={styles.streakNumbers}>
                <Text style={[styles.streakCurrent, { color: streak.color }]}>
                  {streak.current}
                </Text>
                <Text style={styles.streakTarget}>/ {streak.target}</Text>
              </View>
              
              <View style={styles.progressBar}>
                <View
                  style={[
                    styles.progressFill,
                    {
                      width: `${getProgressPercentage(streak.current, streak.target)}%`,
                      backgroundColor: streak.color,
                    },
                  ]}
                />
              </View>
            </View>
          </TouchableOpacity>
        ))}
      </ScrollView>
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
    shadowRadius: 4,
    elevation: 3,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  titleContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#f0f9ff',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  textContainer: {
    flex: 1,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1f2937',
  },
  subtitle: {
    fontSize: 14,
    color: '#6b7280',
    marginTop: 2,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: '#f8fafc',
    borderRadius: 8,
    gap: 4,
  },
  actionText: {
    fontSize: 14,
    color: '#3b82f6',
    fontWeight: '500',
  },
  streaksContainer: {
    paddingRight: 20,
  },
  streakCard: {
    width: 160,
    padding: 16,
    borderLeftWidth: 4,
    marginRight: 16,
  },
  streakHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  streakIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  streakInfo: {
    flex: 1,
  },
  streakTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 2,
  },
  streakDescription: {
    fontSize: 12,
    color: '#6b7280',
  },
  streakProgress: {
    gap: 8,
  },
  streakNumbers: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  streakCurrent: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  streakTarget: {
    fontSize: 16,
    color: '#6b7280',
  },
  progressBar: {
    height: 4,
    backgroundColor: '#e5e7eb',
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 2,
  },
});
