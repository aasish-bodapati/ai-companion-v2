
import { View, Text, StyleSheet, TouchableOpacity, ViewStyle } from 'react-native';
import React from 'react';

import { Ionicons } from '@expo/vector-icons';
import { COMMON_STYLES, COLORS, SPACING, FONT_SIZE } from '../../theme/constants';

interface CardAction {
  label: string;
  onPress: () => void;
  icon?: string;
  variant?: 'primary' | 'secondary' | 'text';
  disabled?: boolean;
  testID?: string;
}

interface CardContainerProps {
  title?: string;
  subtitle?: string;
  children: React.ReactNode;
  actions?: CardAction[];
  variant?: 'default' | 'elevated' | 'outlined' | 'filled';
  size?: 'small' | 'medium' | 'large';
  onPress?: () => void;
  disabled?: boolean;
  loading?: boolean;
  style?: ViewStyle;
  contentStyle?: ViewStyle;
  headerStyle?: ViewStyle;
  footerStyle?: ViewStyle;
  testID?: string;
}

/**
 * Generic card container component that handles common card patterns
 * Provides consistent styling and interaction patterns
 */
export const CardContainer: React.FC<CardContainerProps> = ({
  title,
  subtitle,
  children,
  actions = [],
  variant = 'default',
  size = 'medium',
  onPress,
  disabled = false,
  loading = false,
  style,
  contentStyle,
  headerStyle,
  footerStyle,
  testID,
}) => {
  const getCardStyles = () => {
    const baseStyle = {
      backgroundColor: COMMON_STYLES.cardBackground,
      borderRadius: COMMON_STYLES.standardRadius,
      padding: getSizePadding(),
    };

    switch (variant) {
      case 'elevated':
        return {
          ...baseStyle,
          ...COMMON_STYLES.elevatedShadow,
        };
      case 'outlined':
        return {
          ...baseStyle,
          borderWidth: 1,
          borderColor: COLORS.border.medium,
        };
      case 'filled':
        return {
          ...baseStyle,
          backgroundColor: COMMON_STYLES.secondaryBackground,
        };
      case 'default':
      default:
        return {
          ...baseStyle,
          ...COMMON_STYLES.standardShadow,
        };
    }
  };

  const getSizePadding = () => {
    switch (size) {
      case 'small':
        return SPACING.md;
      case 'medium':
        return SPACING.lg;
      case 'large':
        return SPACING.xl;
      default:
        return SPACING.lg;
    }
  };

  const renderHeader = () => {
    if (!title && !subtitle) return null;

    return (
      <View style={[styles.header, headerStyle]}>
        {title && <Text style={styles.title}>{title}</Text>}
        {subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
      </View>
    );
  };

  const renderActions = () => {
    if (actions.length === 0) return null;

    return (
      <View style={[styles.footer, footerStyle]}>
        {actions.map((action, index) => (
          <TouchableOpacity
            key={index}
            style={[
              styles.actionButton,
              styles[`actionButton${action.variant || 'primary'}`],
              action.disabled && styles.actionButtonDisabled,
            ]}
            onPress={action.onPress}
            disabled={action.disabled || loading}
            testID={action.testID}
          >
            {action.icon && (
              <Ionicons
                name={action.icon as keyof typeof Ionicons.glyphMap}
                size={16}
                color={getActionIconColor(action.variant || 'primary', action.disabled || false)}
                style={styles.actionIcon}
              />
            )}
            <Text
              style={[
                styles.actionButtonText,
                styles[`actionButtonText${action.variant || 'primary'}`],
                action.disabled === true && styles.actionButtonTextDisabled,
              ]}
            >
              {action.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    );
  };

  const getActionIconColor = (variant: string, disabled: boolean) => {
    if (disabled) return COLORS.disabled;

    switch (variant) {
      case 'primary':
        return 'white';
      case 'secondary':
        return COLORS.text.primary as string;
      case 'text':
        return COLORS.text.secondary as string;
      default:
        return 'white';
    }
  };

  const cardStyles = getCardStyles();
  const CardComponent = onPress ? TouchableOpacity : View;

  return (
    <CardComponent
      style={[
        cardStyles,
        disabled && styles.disabled,
        loading && styles.loading,
        style,
      ]}
      onPress={onPress}
      disabled={disabled || loading}
      testID={testID}
    >
      {renderHeader()}
      <View style={[styles.content, contentStyle]}>
        {children}
      </View>
      {renderActions()}
      {loading && (
        <View style={styles.loadingOverlay}>
          <Text style={styles.loadingText}>Loading...</Text>
        </View>
      )}
    </CardComponent>
  );
};

const styles = StyleSheet.create({
  header: {
    marginBottom: SPACING.md,
  },
  title: {
    fontSize: FONT_SIZE.lg,
    fontWeight: '600',
    color: COLORS.text.primary,
    marginBottom: SPACING.xs,
  },
  subtitle: {
    fontSize: FONT_SIZE.md,
    color: COLORS.text.secondary,
    lineHeight: 20,
  },
  content: {
    flex: 1,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: SPACING.md,
    gap: SPACING.md,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: COMMON_STYLES.smallRadius,
    minWidth: 60,
    justifyContent: 'center',
  },
  actionButtonprimary: {
    backgroundColor: COLORS.primary.main,
  },
  actionButtonsecondary: {
    backgroundColor: COLORS.background.secondary,
    borderWidth: 1,
    borderColor: COLORS.border.medium,
  },
  actionButtontext: {
    backgroundColor: 'transparent',
  },
  actionButtonDisabled: {
    backgroundColor: COLORS.background.disabled,
    borderColor: COLORS.border.disabled,
  },
  actionIcon: {
    marginRight: SPACING.xs,
  },
  actionButtonText: {
    fontSize: FONT_SIZE.sm,
    fontWeight: '500',
  },
  actionButtonTextprimary: {
    color: 'white',
  },
  actionButtonTextsecondary: {
    color: COLORS.text.primary,
  },
  actionButtonTexttext: {
    color: COLORS.text.secondary,
  },
  actionButtonTextDisabled: {
    color: COLORS.text.disabled,
  },
  disabled: {
    opacity: 0.6,
  },
  loading: {
    position: 'relative',
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: COMMON_STYLES.standardRadius,
  },
  loadingText: {
    fontSize: FONT_SIZE.sm,
    color: COLORS.text.secondary,
  },
});

export default CardContainer;
