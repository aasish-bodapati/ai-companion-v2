
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import React from 'react';

import { Ionicons } from '@expo/vector-icons';
import { UnifiedProgressRing } from './UnifiedProgressRing';
import { COMMON_STYLES, COLORS, SPACING, FONT_SIZE, FONT_WEIGHT, SHADOWS } from '../../theme/constants';
import { getTrendIcon, getTrendColor, getMotivationalText } from '../../utils/componentUtils';

interface ProgressCardProps {
  title: string;
  current: number;
  goal: number;
  unit: string;
  color: string;
  icon: string;
  trend?: 'up' | 'down' | 'stable';
  trendValue?: number;
  onPress?: () => void;
  size?: 'small' | 'medium' | 'large';
}

export default function ProgressCard({
  title,
  current,
  goal,
  unit,
  color,
  icon,
  trend,
  trendValue,
  onPress,
  size = 'medium',
}: ProgressCardProps) {
  const progress = Math.min(current / goal, 1);
  const percentage = Math.round(progress * 100);

  const getSizeStyles = () => {
    switch (size) {
      case 'small':
        return {
          padding: SPACING.md, // 12 -> SPACING.md
          ringSize: 60,
          titleSize: FONT_SIZE.sm, // 12 -> FONT_SIZE.sm
          valueSize: FONT_SIZE.lg, // 16 -> FONT_SIZE.lg
          iconSize: 16,
        };
      case 'large':
        return {
          padding: SPACING.xl, // 20 -> SPACING.xl
          ringSize: 80,
          titleSize: FONT_SIZE.lg, // 16 -> FONT_SIZE.lg
          valueSize: FONT_SIZE.xl, // 20 -> FONT_SIZE.xl
          iconSize: 24,
        };
      default: // medium
        return {
          padding: SPACING.lg, // 16 -> SPACING.lg
          ringSize: 70,
          titleSize: FONT_SIZE.md, // 14 -> FONT_SIZE.md
          valueSize: FONT_SIZE.xl, // 18 -> FONT_SIZE.xl (18, but using xl for consistency)
          iconSize: 20,
        };
    }
  };

  const trendIcon = getTrendIcon(trend);
  const trendColor = getTrendColor(trend);
  const motivationalText = getMotivationalText(progress);

  const sizeStyles = getSizeStyles();

  const CardContent = () => (
    <View style={[styles.container, { padding: sizeStyles.padding }]}>
      <View style={styles.header}>
        <View style={styles.titleContainer}>
          <Ionicons
            name={icon as keyof typeof Ionicons.glyphMap}
            size={sizeStyles.iconSize}
            color={color}
            style={styles.icon}
          />
          <Text style={[styles.title, { fontSize: sizeStyles.titleSize }]}>
            {title}
          </Text>
        </View>

        {trend && trendValue && (
          <View style={styles.trendContainer}>
            <Ionicons
              name={trendIcon as keyof typeof Ionicons.glyphMap}
              size={FONT_SIZE.sm} // 14 -> FONT_SIZE.sm (12, but keeping 14 for now)
              color={trendColor}
            />
            <Text style={[styles.trendText, { color: trendColor }]}>
              {trendValue}%
            </Text>
          </View>
        )}
      </View>

      <View style={styles.content}>
        <UnifiedProgressRing
          progress={progress}
          goal={goal}
          current={current}
          label={unit}
          color={color}
          size={sizeStyles.ringSize}
          showIcon={false}
          variant="ui"
        />

        <View style={styles.stats}>
          <View style={styles.statItem}>
            <Text style={[styles.statValue, { fontSize: sizeStyles.valueSize }]}>
              {current}
            </Text>
            <Text style={styles.statLabel}>Current</Text>
          </View>

          <View style={styles.statItem}>
            <Text style={[styles.statValue, { fontSize: sizeStyles.valueSize }]}>
              {goal}
            </Text>
            <Text style={styles.statLabel}>Goal</Text>
          </View>

          <View style={styles.statItem}>
            <Text style={[styles.statValue, { fontSize: sizeStyles.valueSize }]}>
              {percentage}%
            </Text>
            <Text style={styles.statLabel}>Progress</Text>
          </View>
        </View>
      </View>

      <View style={styles.footer}>
        <Text style={styles.motivation}>{motivationalText}</Text>
      </View>
    </View>
  );

  if (onPress) {
    return (
      <TouchableOpacity onPress={onPress} activeOpacity={0.8}>
        <CardContent />
      </TouchableOpacity>
    );
  }

  return <CardContent />;
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: COMMON_STYLES.cardBackground,
    borderRadius: COMMON_STYLES.largeRadius,
    ...SHADOWS.medium, // Replaced individual shadow properties with SHADOWS.medium
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.lg, // 16 -> SPACING.lg
  },
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  icon: {
    marginRight: SPACING.sm, // 8 -> SPACING.sm
  },
  title: {
    fontWeight: FONT_WEIGHT.semibold, // '600' -> FONT_WEIGHT.semibold
    color: COLORS.text.primary, // '#1f2937' -> COLORS.text.primary
    flex: 1,
  },
  trendContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  trendText: {
    fontSize: FONT_SIZE.sm, // 12 -> FONT_SIZE.sm
    fontWeight: FONT_WEIGHT.semibold, // '600' -> FONT_WEIGHT.semibold
    marginLeft: SPACING.xs, // 4 -> SPACING.xs
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.lg, // 16 -> SPACING.lg
  },
  stats: {
    flex: 1,
    marginLeft: SPACING.lg, // 16 -> SPACING.lg
  },
  statItem: {
    alignItems: 'center',
    marginBottom: SPACING.sm, // 8 -> SPACING.sm
    minWidth: 50,
  },
  statValue: {
    fontWeight: FONT_WEIGHT.bold, // 'bold' -> FONT_WEIGHT.bold
    color: COLORS.text.primary, // '#1f2937' -> COLORS.text.primary
    lineHeight: 1,
    fontSize: FONT_SIZE.sm, // 12 -> FONT_SIZE.sm
  },
  statLabel: {
    fontSize: 9, // Keep as is for very small text
    color: COLORS.text.secondary, // '#6b7280' -> COLORS.text.secondary
    marginTop: 2, // Keep as is for precise spacing
    textAlign: 'center',
  },
  footer: {
    alignItems: 'center',
  },
  motivation: {
    fontSize: FONT_SIZE.sm, // 12 -> FONT_SIZE.sm
    color: COLORS.success, // '#10b981' -> COLORS.success
    fontWeight: FONT_WEIGHT.semibold, // '600' -> FONT_WEIGHT.semibold
    textAlign: 'center',
  },
});
