
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import React from 'react';

import { COLORS, SPACING, FONT_SIZE, MIXINS } from '../../theme/constants';
import { hapticFeedback } from '../../utils/haptics';

interface SectionHeaderProps {
  title: string;
  subtitle?: string;
  icon?: string;
  iconColor?: string;

  // Action button
  actionLabel?: string;
  actionIcon?: string;
  onActionPress?: () => void;
  actionVariant?: 'primary' | 'secondary' | 'text';
  actionDisabled?: boolean;

  // Styling
  style?: object;
  titleStyle?: object;
  subtitleStyle?: object;

  // Layout
  alignment?: 'left' | 'center' | 'space-between';
}

export default function SectionHeader({
  title,
  subtitle,
  icon,
  iconColor = COLORS.primary.main,
  actionLabel,
  actionIcon,
  onActionPress,
  actionVariant = 'primary',
  actionDisabled = false,
  style,
  titleStyle,
  subtitleStyle,
  alignment = 'space-between',
}: SectionHeaderProps) {

  const handleActionPress = () => {
    if (onActionPress && !actionDisabled) {
      hapticFeedback.light();
      onActionPress();
    }
  };

  const getContainerStyle = () => {
    switch (alignment) {
      case 'center':
        return [styles.container, styles.centerAlignment, style];
      case 'left':
        return [styles.container, styles.leftAlignment, style];
      default:
        return [styles.container, styles.spaceBetweenAlignment, style];
    }
  };

  const getActionButtonStyle = () => {
    switch (actionVariant) {
      case 'secondary':
        return styles.secondaryActionButton;
      case 'text':
        return styles.textActionButton;
      default:
        return styles.primaryActionButton;
    }
  };

  const getActionTextStyle = () => {
    switch (actionVariant) {
      case 'secondary':
        return styles.secondaryActionText;
      case 'text':
        return styles.textActionText;
      default:
        return styles.primaryActionText;
    }
  };

  const renderIcon = () => {
    if (!icon) return null;
    return (
      <Ionicons
        name={icon as keyof typeof Ionicons.glyphMap}
        size={20}
        color={iconColor}
        style={styles.titleIcon}
      />
    );
  };

  const renderAction = () => {
    if (!actionLabel && !actionIcon) return null;

    return (
      <TouchableOpacity
        style={[
          getActionButtonStyle(),
          actionDisabled && styles.disabledAction
        ]}
        onPress={handleActionPress}
        disabled={actionDisabled}
      >
        {actionIcon && (
          <Ionicons
            name={actionIcon as keyof typeof Ionicons.glyphMap}
            size={16}
            color={actionVariant === 'primary' ? COLORS.text.inverse : COLORS.primary.main}
            style={actionLabel ? styles.actionIcon : undefined}
          />
        )}
        {actionLabel && (
          <Text style={[
            getActionTextStyle(),
            actionDisabled && styles.disabledActionText
          ]}>
            {actionLabel}
          </Text>
        )}
      </TouchableOpacity>
    );
  };

  const renderContent = () => {
    return (
      <View style={styles.content}>
        <View style={styles.titleContainer}>
          {renderIcon()}
          <View style={styles.textContainer}>
            <Text style={[styles.title, titleStyle]}>
              {title}
            </Text>
            {subtitle && (
              <Text style={[styles.subtitle, subtitleStyle]}>
                {subtitle}
              </Text>
            )}
          </View>
        </View>
        {renderAction()}
      </View>
    );
  };

  if (alignment === 'center') {
    return (
      <View style={getContainerStyle()}>
        <View style={styles.centeredContent}>
          {renderIcon()}
          <Text style={[styles.title, titleStyle]}>{title}</Text>
          {subtitle && (
            <Text style={[styles.subtitle, subtitleStyle]}>
              {subtitle}
            </Text>
          )}
        </View>
        {renderAction()}
      </View>
    );
  }

  return (
    <View style={getContainerStyle()}>
      {renderContent()}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: SPACING.lg,
  },

  // Alignment styles
  spaceBetweenAlignment: {
    ...MIXINS.rowSpaceBetween,
  },
  leftAlignment: {
    ...MIXINS.row,
  },
  centerAlignment: {
    alignItems: 'center',
    flexDirection: 'column',
  },

  content: {
    ...MIXINS.rowSpaceBetween,
    flex: 1,
  },

  titleContainer: {
    ...MIXINS.row,
    flex: 1,
  },

  titleIcon: {
    marginRight: SPACING.sm,
  },

  textContainer: {
    flex: 1,
  },

  title: {
    fontSize: FONT_SIZE.xl,
    fontWeight: '600',
    color: COLORS.text.primary,
    marginBottom: 2,
  },

  subtitle: {
    fontSize: FONT_SIZE.md,
    color: COLORS.text.secondary,
  },

  // Centered layout
  centeredContent: {
    alignItems: 'center',
    marginBottom: SPACING.md,
  },

  // Action button styles
  primaryActionButton: {
    backgroundColor: COLORS.primary.main,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 32,
  },

  secondaryActionButton: {
    backgroundColor: COLORS.background.primary,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.border.medium,
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 32,
  },

  textActionButton: {
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 32,
  },

  // Action text styles
  primaryActionText: {
    color: COLORS.text.inverse,
    fontSize: FONT_SIZE.md,
    fontWeight: '600',
  },

  secondaryActionText: {
    color: COLORS.primary.main,
    fontSize: FONT_SIZE.md,
    fontWeight: '600',
  },

  textActionText: {
    color: COLORS.primary.main,
    fontSize: FONT_SIZE.md,
    fontWeight: '500',
  },

  actionIcon: {
    marginRight: SPACING.xs,
  },

  // Disabled states
  disabledAction: {
    opacity: 0.5,
  },

  disabledActionText: {
    color: COLORS.text.tertiary,
  },
});
