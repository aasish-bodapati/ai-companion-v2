
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import React from 'react';

import { COLORS, SPACING, BORDER_RADIUS, FONT_WEIGHT } from '../../theme/constants';
import { STYLE_PRESETS } from '../../theme/duplicateStyles';

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
  style?: object;
}

const defaultStreaks: Streak[] = [
  {
    id: 'workout',
    type: 'workout',
    title: 'Workout Streak',
    current: 7,
    target: 30,
    color: COLORS.primary.main,
    icon: 'fitness',
    description: 'Days in a row',
  },
  {
    id: 'nutrition',
    type: 'nutrition',
    title: 'Nutrition Log',
    current: 5,
    target: 30,
    color: COLORS.success,
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
    color: COLORS.warning,
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
            <Ionicons name="flame" size={20} color={COLORS.primary.main} />
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
                <Ionicons name={streak.icon as keyof typeof Ionicons.glyphMap} size={20} color={streak.color} />
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
    ...STYLE_PRESETS.card,
    marginHorizontal: SPACING.lg,
    marginBottom: SPACING.lg,
  },
  header: {
    ...STYLE_PRESETS.rowSpaceBetween,
    marginBottom: SPACING.lg,
    paddingBottom: SPACING.lg,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border.light,
  },
  titleContainer: {
    flex: 1,
    ...STYLE_PRESETS.row,
  },
  iconContainer: {
    width: 32,
    height: 32,
    borderRadius: BORDER_RADIUS.round,
    backgroundColor: COLORS.primary.light + '20', // 20% opacity
    ...STYLE_PRESETS.centerContent,
    marginRight: SPACING.md,
  },
  textContainer: {
    flex: 1,
  },
  title: {
    ...STYLE_PRESETS.textSubheading,
    fontWeight: FONT_WEIGHT.semibold,
  },
  subtitle: {
    ...STYLE_PRESETS.textSecondary,
    marginTop: 2,
  },
  actionButton: {
    ...STYLE_PRESETS.row,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    backgroundColor: COLORS.background.secondary,
    borderRadius: BORDER_RADIUS.sm,
    gap: 4,
  },
  actionText: {
    ...STYLE_PRESETS.textSecondary,
    color: COLORS.primary.main,
    fontWeight: FONT_WEIGHT.medium,
  },
  streaksContainer: {
    paddingRight: SPACING.xl,
  },
  streakCard: {
    width: 160,
    padding: SPACING.lg,
    borderLeftWidth: 4,
    marginRight: SPACING.lg,
  },
  streakHeader: {
    ...STYLE_PRESETS.row,
    marginBottom: SPACING.md,
  },
  streakIcon: {
    width: 32,
    height: 32,
    borderRadius: BORDER_RADIUS.round,
    ...STYLE_PRESETS.centerContent,
    marginRight: SPACING.md,
  },
  streakInfo: {
    flex: 1,
  },
  streakTitle: {
    ...STYLE_PRESETS.textSecondary,
    fontWeight: FONT_WEIGHT.semibold,
    marginBottom: 2,
  },
  streakDescription: {
    ...STYLE_PRESETS.textCaption,
  },
  streakProgress: {
    gap: 8,
  },
  streakNumbers: {
    ...STYLE_PRESETS.row,
    alignItems: 'baseline',
  },
  streakCurrent: {
    ...STYLE_PRESETS.textTitle,
    fontWeight: FONT_WEIGHT.bold,
  },
  streakTarget: {
    ...STYLE_PRESETS.textSubheading,
    color: COLORS.text.secondary,
  },
  progressBar: {
    height: 4,
    backgroundColor: COLORS.border.light,
    borderRadius: BORDER_RADIUS.xs,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: BORDER_RADIUS.xs,
  },
});
