import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  ViewStyle,
  Pressable,
  TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { hapticFeedback, touchUtils } from '../../utils/haptics';
import { COLORS, SPACING, FONT_WEIGHT, BORDER_RADIUS, SHADOWS } from '../../theme/constants';
import { STYLE_PRESETS } from '../../theme/duplicateStyles';

export type CardVariant = 'default' | 'elevated' | 'outlined' | 'filled' | 'stats' | 'mobile';
export type CardSize = 'small' | 'medium' | 'large';

interface CardAction {
  label: string;
  onPress: () => void;
  icon?: string;
  variant?: 'primary' | 'secondary' | 'text';
  disabled?: boolean;
  testID?: string;
}

interface StatItem {
  id: string;
  label: string;
  value: number;
  target: number;
  unit: string;
  icon: string;
  color: string;
  type: 'ring' | 'bar' | 'number';
}

interface UnifiedCardProps {
  children?: React.ReactNode;
  onPress?: () => void;
  onLongPress?: () => void;
  title?: string;
  subtitle?: string;
  icon?: string;
  iconColor?: string;
  variant?: CardVariant;
  size?: CardSize;
  disabled?: boolean;
  loading?: boolean;
  hapticFeedback?: 'light' | 'medium' | 'heavy' | 'success' | 'warning' | 'error' | 'selection' | 'none';
  style?: ViewStyle;
  contentStyle?: ViewStyle;
  headerStyle?: ViewStyle;
  footerStyle?: ViewStyle;
  testID?: string;

  // Stats-specific props
  stats?: StatItem[];
  statsLayout?: 'grid' | 'horizontal' | 'vertical';
  showTargets?: boolean;
  onStatPress?: (stat: StatItem) => void;
  onViewAll?: () => void;

  // Action-specific props
  actions?: CardAction[];
}

export default function UnifiedCard({
  children,
  onPress,
  onLongPress,
  title,
  subtitle,
  icon,
  iconColor = COLORS.primary.main,
  variant = 'default',
  size = 'medium',
  disabled = false,
  loading = false,
  hapticFeedback: hapticType = 'light',
  style,
  contentStyle,
  headerStyle,
  footerStyle,
  testID,
  stats,
  statsLayout = 'grid',
  showTargets = true,
  onStatPress,
  onViewAll,
  actions = [],
}: UnifiedCardProps) {
  const [scaleValue] = useState(new Animated.Value(1));
  const [opacityValue] = useState(new Animated.Value(1));

  const handlePress = () => {
    if (disabled || loading) return;

    // Haptic feedback
    if (hapticType !== 'none') {
      hapticFeedback(hapticType);
    }

    onPress?.();
  };

  const handleLongPress = () => {
    if (disabled || loading) return;

    hapticFeedback('medium');
    onLongPress?.();
  };

  const getContainerStyle = (): ViewStyle[] => {
    const baseStyles = [styles.container];

    // Variant styles
    switch (variant) {
      case 'elevated':
        baseStyles.push(styles.elevated);
        break;
      case 'outlined':
        baseStyles.push(styles.outlined);
        break;
      case 'filled':
        baseStyles.push(styles.filled);
        break;
      case 'stats':
        baseStyles.push(styles.stats);
        break;
      case 'mobile':
        baseStyles.push(styles.mobile);
        break;
      default:
        baseStyles.push(styles.default);
        break;
    }

    // Size styles
    switch (size) {
      case 'small':
        baseStyles.push(styles.small);
        break;
      case 'medium':
        baseStyles.push(styles.medium);
        break;
      case 'large':
        baseStyles.push(styles.large);
        break;
    }

    if (disabled) baseStyles.push(styles.disabled);
    if (style) baseStyles.push(style);

    return baseStyles;
  };

  const getContentStyle = (): ViewStyle[] => {
    const baseStyles = [styles.content];

    if (contentStyle) baseStyles.push(contentStyle);

    return baseStyles;
  };

  const renderHeader = () => {
    if (!title && !subtitle && !icon) return null;

    return (
      <View style={[styles.header, headerStyle]}>
        {icon && (
          <View style={styles.iconContainer}>
            <Ionicons
              name={icon as keyof typeof Ionicons.glyphMap}
              size={24}
              color={iconColor}
            />
          </View>
        )}
        <View style={styles.headerText}>
          {title && (
            <Text style={styles.title} numberOfLines={1}>
              {title}
            </Text>
          )}
          {subtitle && (
            <Text style={styles.subtitle} numberOfLines={2}>
              {subtitle}
            </Text>
          )}
        </View>
      </View>
    );
  };

  const renderStats = () => {
    if (!stats || stats.length === 0) return null;

    const getStatsContainerStyle = () => {
      switch (statsLayout) {
        case 'horizontal':
          return styles.horizontalStats;
        case 'vertical':
          return styles.verticalStats;
        default:
          return styles.gridStats;
      }
    };

    return (
      <View style={getStatsContainerStyle()}>
        {stats.map((stat) => (
          <TouchableOpacity
            key={stat.id}
            style={styles.statItem}
            onPress={() => onStatPress?.(stat)}
            disabled={!onStatPress}
          >
            <View style={styles.statIcon}>
              <Ionicons
                name={stat.icon as keyof typeof Ionicons.glyphMap}
                size={20}
                color={stat.color}
              />
            </View>
            <Text style={styles.statLabel}>{stat.label}</Text>
            <Text style={[styles.statValue, { color: stat.color }]}>
              {stat.value}{stat.unit}
            </Text>
            {showTargets && (
              <Text style={styles.statTarget}>
                / {stat.target}{stat.unit}
              </Text>
            )}
          </TouchableOpacity>
        ))}
      </View>
    );
  };

  const renderActions = () => {
    if (!actions || actions.length === 0) return null;

    return (
      <View style={[styles.actions, footerStyle]}>
        {actions.map((action, index) => (
          <TouchableOpacity
            key={index}
            style={[
              styles.actionButton,
              action.variant === 'primary' && styles.actionPrimary,
              action.variant === 'secondary' && styles.actionSecondary,
              action.variant === 'text' && styles.actionText,
              action.disabled && styles.actionDisabled,
            ]}
            onPress={action.onPress}
            disabled={action.disabled}
            testID={action.testID}
          >
            {action.icon && (
              <Ionicons
                name={action.icon as keyof typeof Ionicons.glyphMap}
                size={16}
                color={action.variant === 'text' ? COLORS.primary.main : COLORS.text.inverse}
                style={styles.actionIcon}
              />
            )}
            <Text style={[
              styles.actionLabel,
              action.variant === 'text' && styles.actionTextLabel,
              action.disabled && styles.actionDisabledLabel,
            ]}>
              {action.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    );
  };

  const renderContent = () => {
    return (
      <View style={getContentStyle()}>
        {renderHeader()}
        {children && <View style={styles.body}>{children}</View>}
        {renderStats()}
        {renderActions()}
      </View>
    );
  };

  if (variant === 'mobile') {
    // Mobile-optimized variant with animations
    return (
      <Pressable
        onPress={handlePress}
        onLongPress={handleLongPress}
        disabled={disabled || loading}
        testID={testID}
        style={({ pressed }) => [
          ...getContainerStyle(),
          pressed && !disabled && styles.pressed,
        ]}
      >
        <Animated.View
          style={[
            {
              transform: [{ scale: scaleValue }],
              opacity: opacityValue,
            },
          ]}
        >
          {renderContent()}
        </Animated.View>
      </Pressable>
    );
  }

  // Default variant
  return (
    <TouchableOpacity
      onPress={handlePress}
      onLongPress={handleLongPress}
      disabled={disabled || loading}
      testID={testID}
      style={getContainerStyle()}
      activeOpacity={0.7}
    >
      {renderContent()}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: COLORS.background.primary,
    borderRadius: BORDER_RADIUS.lg,
    ...SHADOWS.medium,
  },
  default: {
    // Default card styles
  },
  elevated: {
    ...SHADOWS.large,
  },
  outlined: {
    borderWidth: 1,
    borderColor: COLORS.border.primary,
    ...SHADOWS.none,
  },
  filled: {
    backgroundColor: COLORS.background.secondary,
  },
  stats: {
    backgroundColor: COLORS.background.primary,
    ...SHADOWS.small,
  },
  mobile: {
    backgroundColor: COLORS.background.primary,
    ...SHADOWS.medium,
  },
  small: {
    padding: SPACING.md,
  },
  medium: {
    padding: SPACING.lg,
  },
  large: {
    padding: SPACING.xl,
  },
  disabled: {
    opacity: 0.6,
  },
  pressed: {
    transform: [{ scale: 0.98 }],
  },
  content: {
    flex: 1,
  },
  header: {
    ...STYLE_PRESETS.row,
    marginBottom: SPACING.md,
  },
  iconContainer: {
    marginRight: SPACING.sm,
  },
  headerText: {
    flex: 1,
  },
  title: {
    ...STYLE_PRESETS.textHeading,
    marginBottom: SPACING.xs,
  },
  subtitle: {
    ...STYLE_PRESETS.textSecondary,
  },
  body: {
    marginBottom: SPACING.md,
  },
  // Stats styles
  gridStats: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  horizontalStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  verticalStats: {
    flexDirection: 'column',
  },
  statItem: {
    alignItems: 'center',
    padding: SPACING.sm,
    minWidth: 80,
  },
  statIcon: {
    marginBottom: SPACING.xs,
  },
  statLabel: {
    ...STYLE_PRESETS.textCaption,
    textAlign: 'center',
    marginBottom: SPACING.xs,
  },
  statValue: {
    ...STYLE_PRESETS.textHeading,
    textAlign: 'center',
  },
  statTarget: {
    ...STYLE_PRESETS.textSecondary,
    textAlign: 'center',
  },
  // Actions styles
  actions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: SPACING.md,
    gap: SPACING.sm,
  },
  actionButton: {
    ...STYLE_PRESETS.row,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: BORDER_RADIUS.sm,
    backgroundColor: COLORS.primary.main,
  },
  actionPrimary: {
    backgroundColor: COLORS.primary.main,
  },
  actionSecondary: {
    backgroundColor: COLORS.background.primary,
    borderWidth: 1,
    borderColor: COLORS.primary.main,
  },
  actionText: {
    backgroundColor: 'transparent',
  },
  actionDisabled: {
    opacity: 0.5,
  },
  actionIcon: {
    marginRight: SPACING.xs,
  },
  actionLabel: {
    ...STYLE_PRESETS.textSecondary,
    color: COLORS.text.inverse,
    fontWeight: FONT_WEIGHT.medium,
  },
  actionTextLabel: {
    color: COLORS.primary.main,
  },
  actionDisabledLabel: {
    opacity: 0.5,
  },
});

// Export presets for common card configurations
export const cardPresets = {
  default: {
    variant: 'default' as const,
    size: 'medium' as const,
  },
  mobile: {
    variant: 'mobile' as const,
    size: 'medium' as const,
    hapticFeedback: 'light' as const,
  },
  stats: {
    variant: 'stats' as const,
    size: 'large' as const,
    statsLayout: 'grid' as const,
    showTargets: true,
  },
  elevated: {
    variant: 'elevated' as const,
    size: 'medium' as const,
  },
  outlined: {
    variant: 'outlined' as const,
    size: 'medium' as const,
  },
};
