
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ViewStyle,
  TextStyle,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import React from 'react';

import { COLORS, SPACING, FONT_SIZE, FONT_WEIGHT, BORDER_RADIUS } from '../../theme/constants';

export type EmptyStateSize = 'small' | 'medium' | 'large';
export type EmptyStateVariant = 'default' | 'minimal' | 'detailed' | 'actionable';

interface EmptyStateProps {
  // Core props
  title: string;
  subtitle?: string;
  visible?: boolean;

  // Configuration
  size?: EmptyStateSize;
  variant?: EmptyStateVariant;
  showIcon?: boolean;
  icon?: keyof typeof Ionicons.glyphMap;

  // Action button
  actionText?: string;
  onActionPress?: () => void;
  actionIcon?: keyof typeof Ionicons.glyphMap;

  // Styling
  containerStyle?: ViewStyle;
  titleStyle?: TextStyle;
  subtitleStyle?: TextStyle;
  actionStyle?: ViewStyle;
  actionTextStyle?: TextStyle;
  iconColor?: string;

  // Customization
  customIcon?: React.ReactNode;
  customAction?: React.ReactNode;

  // Accessibility
  accessibilityLabel?: string;
  accessibilityHint?: string;
}

export default function EmptyState({
  title,
  subtitle,
  visible = true,
  size = 'medium',
  variant = 'default',
  showIcon = true,
  icon = 'document-outline',
  actionText,
  onActionPress,
  actionIcon,
  containerStyle,
  titleStyle,
  subtitleStyle,
  actionStyle,
  actionTextStyle,
  iconColor = COLORS.text.disabled,
  customIcon,
  customAction,
  accessibilityLabel,
  accessibilityHint,
}: EmptyStateProps) {
  if (!visible) return null;

  const getIconSize = () => {
    switch (size) {
      case 'small':
        return 32;
      case 'medium':
        return 48;
      case 'large':
        return 64;
      default:
        return 48;
    }
  };

  const getContainerStyles = (): ViewStyle[] => {
    const baseStyles = [styles.container];

    // Size-based styles
    switch (size) {
      case 'small':
        baseStyles.push(styles.containerSmall);
        break;
      case 'medium':
        baseStyles.push(styles.containerMedium);
        break;
      case 'large':
        baseStyles.push(styles.containerLarge);
        break;
    }

    // Variant-based styles
    switch (variant) {
      case 'minimal':
        baseStyles.push(styles.containerMinimal);
        break;
      case 'detailed':
        baseStyles.push(styles.containerDetailed);
        break;
      case 'actionable':
        baseStyles.push(styles.containerActionable);
        break;
      default:
        baseStyles.push(styles.containerDefault);
        break;
    }

    if (containerStyle) baseStyles.push(containerStyle);

    return baseStyles;
  };

  const getTitleStyles = (): TextStyle[] => {
    const baseStyles = [styles.title];

    // Size-based title styles
    switch (size) {
      case 'small':
        baseStyles.push(styles.titleSmall);
        break;
      case 'medium':
        baseStyles.push(styles.titleMedium);
        break;
      case 'large':
        baseStyles.push(styles.titleLarge);
        break;
    }

    if (titleStyle) baseStyles.push(titleStyle);

    return baseStyles;
  };

  const getSubtitleStyles = (): TextStyle[] => {
    const baseStyles = [styles.subtitle];

    // Size-based subtitle styles
    switch (size) {
      case 'small':
        baseStyles.push(styles.subtitleSmall);
        break;
      case 'medium':
        baseStyles.push(styles.subtitleMedium);
        break;
      case 'large':
        baseStyles.push(styles.subtitleLarge);
        break;
    }

    if (subtitleStyle) baseStyles.push(subtitleStyle);

    return baseStyles;
  };

  const getActionStyles = (): ViewStyle[] => {
    const baseStyles = [styles.action];

    // Size-based action styles
    switch (size) {
      case 'small':
        baseStyles.push(styles.actionSmall);
        break;
      case 'medium':
        baseStyles.push(styles.actionMedium);
        break;
      case 'large':
        baseStyles.push(styles.actionLarge);
        break;
    }

    if (actionStyle) baseStyles.push(actionStyle);

    return baseStyles;
  };

  return (
    <View
      style={getContainerStyles()}
      accessibilityLabel={accessibilityLabel || title}
      accessibilityHint={accessibilityHint || subtitle}
    >
      {/* Icon */}
      {showIcon && (
        <View style={styles.iconContainer}>
          {customIcon || (
            <Ionicons
              name={icon}
              size={getIconSize()}
              color={iconColor}
            />
          )}
        </View>
      )}

      {/* Title */}
      <Text style={getTitleStyles()}>
        {title}
      </Text>

      {/* Subtitle */}
      {subtitle && (
        <Text style={getSubtitleStyles()}>
          {subtitle}
        </Text>
      )}

      {/* Action Button */}
      {actionText && onActionPress && (
        <View style={styles.actionContainer}>
          {customAction || (
            <TouchableOpacity
              style={getActionStyles()}
              onPress={onActionPress}
              accessibilityLabel={actionText}
              accessibilityHint="Tap to perform action"
            >
              {actionIcon && (
                <Ionicons
                  name={actionIcon}
                  size={16}
                  color={COLORS.primary.main}
                  style={styles.actionIcon}
                />
              )}
              <Text style={[styles.actionText, actionTextStyle]}>
                {actionText}
              </Text>
            </TouchableOpacity>
          )}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.lg,
  },
  containerDefault: {
    padding: SPACING.lg,
  },
  containerMinimal: {
    padding: SPACING.sm,
  },
  containerDetailed: {
    padding: SPACING.xl,
  },
  containerActionable: {
    padding: SPACING.lg,
  },
  containerSmall: {
    padding: SPACING.sm,
  },
  containerMedium: {
    padding: SPACING.lg,
  },
  containerLarge: {
    padding: SPACING.xl,
  },
  iconContainer: {
    marginBottom: SPACING.md,
  },
  title: {
    fontSize: FONT_SIZE.lg,
    fontWeight: FONT_WEIGHT.semibold,
    color: COLORS.text.primary,
    textAlign: 'center',
    marginBottom: SPACING.sm,
  },
  titleSmall: {
    fontSize: FONT_SIZE.md,
  },
  titleMedium: {
    fontSize: FONT_SIZE.lg,
  },
  titleLarge: {
    fontSize: FONT_SIZE.xl,
  },
  subtitle: {
    fontSize: FONT_SIZE.md,
    color: COLORS.text.secondary,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: SPACING.lg,
  },
  subtitleSmall: {
    fontSize: FONT_SIZE.sm,
  },
  subtitleMedium: {
    fontSize: FONT_SIZE.md,
  },
  subtitleLarge: {
    fontSize: FONT_SIZE.lg,
  },
  actionContainer: {
    marginTop: SPACING.sm,
  },
  action: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.primary.light,
    borderRadius: BORDER_RADIUS.md,
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.primary.main,
  },
  actionSmall: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
  },
  actionMedium: {
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
  },
  actionLarge: {
    paddingHorizontal: SPACING.xl,
    paddingVertical: SPACING.lg,
  },
  actionIcon: {
    marginRight: SPACING.sm,
  },
  actionText: {
    fontSize: FONT_SIZE.md,
    fontWeight: FONT_WEIGHT.medium,
    color: COLORS.primary.main,
  },
});
