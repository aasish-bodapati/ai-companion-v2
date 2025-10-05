import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { hapticFeedback } from '../../utils/haptics';
import { COLORS, SPACING, FONT_SIZE, BORDER_RADIUS, SHADOWS } from '../../theme/constants';

interface ProgressData {
  current: number;
  target: number;
  label?: string;
  color?: string;
}

interface AchievementData {
  reached: boolean;
  message: string;
  icon: string;
}

interface StatsCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon?: string;
  iconColor?: string;
  trend?: 'up' | 'down' | 'neutral';
  trendValue?: string;
  onPress?: () => void;
  variant?: 'default' | 'primary' | 'success' | 'warning' | 'error';
  size?: 'small' | 'medium' | 'large';
  loading?: boolean;
  disabled?: boolean;
  style?: any;
  testID?: string;
  progress?: ProgressData;
  achievement?: AchievementData;
}

export default function StatsCard({
  title,
  value,
  subtitle,
  icon,
  iconColor = COLORS.primary.main,
  trend,
  trendValue,
  onPress,
  variant = 'default',
  size = 'medium',
  loading = false,
  disabled = false,
  style,
  testID,
  progress,
  achievement,
}: StatsCardProps) {
  const handlePress = () => {
    if (disabled || loading) return;
    hapticFeedback.light();
    onPress?.();
  };

  const getTrendIcon = () => {
    switch (trend) {
      case 'up':
        return 'trending-up';
      case 'down':
        return 'trending-down';
      case 'neutral':
        return 'remove';
      default:
        return null;
    }
  };

  const getTrendColor = () => {
    switch (trend) {
      case 'up':
        return COLORS.success;
      case 'down':
        return COLORS.error.main;
      case 'neutral':
        return COLORS.text.secondary;
      default:
        return COLORS.text.secondary;
    }
  };

  const getVariantStyles = () => {
    switch (variant) {
      case 'primary':
        return {
          backgroundColor: COLORS.primary.main + '20',
          borderColor: COLORS.primary.main + '40',
        };
      case 'success':
        return {
          backgroundColor: COLORS.success + '20',
          borderColor: COLORS.success + '40',
        };
      case 'warning':
        return {
          backgroundColor: COLORS.warning + '20',
          borderColor: COLORS.warning + '40',
        };
      case 'error':
        return {
          backgroundColor: COLORS.error + '20',
          borderColor: COLORS.error + '40',
        };
      default:
        return {
          backgroundColor: COLORS.background.secondary,
          borderColor: COLORS.border.primary,
        };
    }
  };

  const getSizeStyles = () => {
    switch (size) {
      case 'small':
        return {
          padding: SPACING.small,
          minHeight: 80,
        };
      case 'large':
        return {
          padding: SPACING.large,
          minHeight: 120,
        };
      default:
        return {
          padding: SPACING.medium,
          minHeight: 100,
        };
    }
  };

  const containerStyle = [
    styles.container,
    getVariantStyles(),
    getSizeStyles(),
    disabled && styles.disabledVariant,
    style,
  ];

  const TouchableComponent = onPress ? TouchableOpacity : View;

  return (
    <TouchableComponent
      style={containerStyle}
      onPress={onPress ? handlePress : undefined}
      disabled={disabled || loading}
      testID={testID}
    >
      <View style={styles.content}>
        <View style={styles.header}>
          <Text style={[styles.title, disabled && styles.disabledText]}>
            {title}
          </Text>
          {icon && (
            <Ionicons
              name={icon as any}
              size={20}
              color={disabled ? COLORS.text.disabled : iconColor}
            />
          )}
        </View>
        
        <View style={styles.valueContainer}>
          <Text style={[styles.value, disabled && styles.disabledText]}>
            {loading ? '...' : value}
          </Text>
          {trend && trendValue && (
            <View style={styles.trendContainer}>
              <Ionicons
                name={getTrendIcon() as any}
                size={16}
                color={getTrendColor()}
              />
              <Text style={[styles.trendText, { color: getTrendColor() }]}>
                {trendValue}
              </Text>
            </View>
          )}
        </View>
        
        {subtitle && (
          <Text style={[styles.subtitle, disabled && styles.disabledText]}>
            {subtitle}
          </Text>
        )}
        
        {/* Progress Bar */}
        {progress && (
          <View style={styles.progressContainer}>
            <View style={styles.progressHeader}>
              <Text style={styles.progressLabel}>
                {progress.label || 'Progress'}
              </Text>
              <Text style={styles.progressText}>
                {progress.current} / {progress.target}
              </Text>
            </View>
            <View style={styles.progressBarContainer}>
              <View 
                style={[
                  styles.progressBar,
                  {
                    width: `${Math.min((progress.current / progress.target) * 100, 100)}%`,
                    backgroundColor: progress.color || COLORS.primary.main,
                  }
                ]}
              />
            </View>
          </View>
        )}
        
        {/* Achievement */}
        {achievement && achievement.reached && (
          <View style={styles.achievementContainer}>
            <Ionicons
              name={achievement.icon as any}
              size={16}
              color={COLORS.success}
            />
            <Text style={styles.achievementText}>
              {achievement.message}
            </Text>
          </View>
        )}
      </View>
    </TouchableComponent>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: BORDER_RADIUS.medium,
    borderWidth: 1,
    marginBottom: SPACING.small,
    ...SHADOWS.small,
  },
  disabledVariant: {
    opacity: 0.5,
  },
  content: {
    flex: 1,
    justifyContent: 'space-between',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.small,
  },
  title: {
    fontSize: FONT_SIZE.small,
    fontWeight: '500',
    color: COLORS.text.secondary,
    flex: 1,
  },
  valueContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
    marginBottom: SPACING.xs,
  },
  value: {
    fontSize: FONT_SIZE.xl,
    fontWeight: '700',
    color: COLORS.text.primary,
    flex: 1,
  },
  trendContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
  },
  trendText: {
    fontSize: FONT_SIZE.small,
    fontWeight: '500',
  },
  subtitle: {
    fontSize: FONT_SIZE.small,
    color: COLORS.text.tertiary,
  },
  disabledText: {
    color: COLORS.text.disabled,
  },
  progressContainer: {
    marginTop: SPACING.small,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.xs,
  },
  progressLabel: {
    fontSize: FONT_SIZE.small,
    color: COLORS.text.secondary,
    fontWeight: '500',
  },
  progressText: {
    fontSize: FONT_SIZE.small,
    color: COLORS.text.primary,
    fontWeight: '600',
  },
  progressBarContainer: {
    height: 10,
    backgroundColor: COLORS.border.primary,
    borderRadius: 5,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    borderRadius: 5,
  },
  achievementContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: SPACING.small,
    gap: SPACING.xs,
  },
  achievementText: {
    fontSize: FONT_SIZE.small,
    color: COLORS.success,
    fontWeight: '600',
  },
});
