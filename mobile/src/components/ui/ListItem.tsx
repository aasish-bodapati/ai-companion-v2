
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import React from 'react';

import { hapticFeedback } from '../../utils/haptics';
import { COLORS, SPACING, FONT_SIZE, BORDER_RADIUS, SHADOWS } from '../../theme/constants';

interface ListItemProps {
  title: string;
  subtitle?: string;
  description?: string;
  leftIcon?: string;
  rightIcon?: string;
  leftImage?: string;
  rightImage?: string;
  onPress?: () => void;
  onLongPress?: () => void;
  disabled?: boolean;
  loading?: boolean;
  variant?: 'default' | 'card' | 'outlined' | 'filled';
  size?: 'small' | 'medium' | 'large';
  showChevron?: boolean;
  showBadge?: boolean;
  badgeText?: string;
  badgeColor?: string;
  leftIconColor?: string;
  rightIconColor?: string;
  style?: Record<string, unknown>;
  testID?: string;
}

export default function ListItem({
  title,
  subtitle,
  description,
  leftIcon,
  rightIcon,
  leftImage,
  rightImage,
  onPress,
  onLongPress,
  disabled = false,
  loading = false,
  variant = 'default',
  size = 'medium',
  showChevron = false,
  showBadge = false,
  badgeText,
  badgeColor = COLORS.primary.main,
  leftIconColor = COLORS.text.secondary,
  rightIconColor = COLORS.text.secondary,
  style,
  testID,
}: ListItemProps) {
  const handlePress = () => {
    if (disabled || loading) return;
    hapticFeedback.light();
    onPress?.();
  };

  const handleLongPress = () => {
    if (disabled || loading) return;
    hapticFeedback.medium();
    onLongPress?.();
  };

  const renderLeftContent = () => {
    if (loading) {
      return (
        <View style={styles.leftContent}>
          <ActivityIndicator size="small" color={COLORS.primary.main} />
        </View>
      );
    }

    if (leftImage) {
      return (
        <View style={styles.leftContent}>
          <Image source={{ uri: leftImage }} style={styles.leftImage} />
        </View>
      );
    }

    if (leftIcon) {
      return (
        <View style={styles.leftContent}>
          <Ionicons name={leftIcon as keyof typeof Ionicons.glyphMap} size={24} color={leftIconColor} />
        </View>
      );
    }

    return null;
  };

  const renderRightContent = () => {
    if (loading) {
      return (
        <View style={styles.rightContent}>
          <ActivityIndicator size="small" color={COLORS.primary.main} />
        </View>
      );
    }

    if (rightImage) {
      return (
        <View style={styles.rightContent}>
          <Image source={{ uri: rightImage }} style={styles.rightImage} />
        </View>
      );
    }

    if (rightIcon) {
      return (
        <View style={styles.rightContent}>
          <Ionicons name={rightIcon as keyof typeof Ionicons.glyphMap} size={20} color={rightIconColor} />
        </View>
      );
    }

    if (showChevron) {
      return (
        <View style={styles.rightContent}>
          <Ionicons name="chevron-forward" size={16} color={COLORS.text.tertiary} />
        </View>
      );
    }

    if (showBadge && badgeText) {
      return (
        <View style={styles.rightContent}>
          <View style={[styles.badge, { backgroundColor: badgeColor }]}>
            <Text style={styles.badgeText}>{badgeText}</Text>
          </View>
        </View>
      );
    }

    return null;
  };

  const containerStyle = [
    styles.container,
    variant === 'card' && styles.cardVariant,
    variant === 'outlined' && styles.outlinedVariant,
    variant === 'filled' && styles.filledVariant,
    size === 'small' && styles.smallVariant,
    size === 'large' && styles.largeVariant,
    disabled && styles.disabledVariant,
    style,
  ];

  const TouchableComponent = onPress || onLongPress ? TouchableOpacity : View;

  return (
    <TouchableComponent
      style={containerStyle}
      onPress={onPress ? handlePress : undefined}
      onLongPress={onLongPress ? handleLongPress : undefined}
      disabled={disabled || loading}
      testID={testID}
    >
      <View style={styles.content}>
        {renderLeftContent()}

        <View style={styles.textContent}>
          <Text style={[styles.title, disabled && styles.disabledText]} numberOfLines={1}>
            {title}
          </Text>
          {subtitle && (
            <Text style={[styles.subtitle, disabled && styles.disabledText]} numberOfLines={1}>
              {subtitle}
            </Text>
          )}
          {description && (
            <Text style={[styles.description, disabled && styles.disabledText]} numberOfLines={2}>
              {description}
            </Text>
          )}
        </View>

        {renderRightContent()}
      </View>
    </TouchableComponent>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: COLORS.background.primary,
    marginBottom: SPACING.xs,
  },
  cardVariant: {
    backgroundColor: COLORS.background.secondary,
    borderRadius: BORDER_RADIUS.medium,
    marginBottom: SPACING.small,
    ...SHADOWS.small,
  },
  outlinedVariant: {
    borderWidth: 1,
    borderColor: COLORS.border.primary,
    borderRadius: BORDER_RADIUS.medium,
    marginBottom: SPACING.small,
  },
  filledVariant: {
    backgroundColor: COLORS.background.secondary,
    borderRadius: BORDER_RADIUS.medium,
    marginBottom: SPACING.small,
  },
  smallVariant: {
    paddingVertical: SPACING.small,
    paddingHorizontal: SPACING.medium,
  },
  largeVariant: {
    paddingVertical: SPACING.medium,
    paddingHorizontal: SPACING.large,
  },
  disabledVariant: {
    opacity: 0.5,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: SPACING.medium,
    paddingHorizontal: SPACING.medium,
  },
  leftContent: {
    marginRight: SPACING.medium,
    width: 24,
    alignItems: 'center',
  },
  rightContent: {
    marginLeft: SPACING.small,
    alignItems: 'center',
  },
  leftImage: {
    width: 24,
    height: 24,
    borderRadius: BORDER_RADIUS.small,
  },
  rightImage: {
    width: 20,
    height: 20,
    borderRadius: BORDER_RADIUS.small,
  },
  textContent: {
    flex: 1,
  },
  title: {
    fontSize: FONT_SIZE.medium,
    fontWeight: '500',
    color: COLORS.text.primary,
    marginBottom: SPACING.xs,
  },
  subtitle: {
    fontSize: FONT_SIZE.small,
    color: COLORS.text.secondary,
    marginBottom: SPACING.xs,
  },
  description: {
    fontSize: FONT_SIZE.small,
    color: COLORS.text.tertiary,
    lineHeight: 18,
  },
  disabledText: {
    color: COLORS.text.disabled,
  },
  badge: {
    paddingHorizontal: SPACING.small,
    paddingVertical: SPACING.xs,
    borderRadius: BORDER_RADIUS.small,
    minWidth: 20,
    alignItems: 'center',
  },
  badgeText: {
    fontSize: FONT_SIZE.xs,
    color: COLORS.background.primary,
    fontWeight: '600',
  },
});
