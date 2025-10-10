import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  ViewStyle,
  Pressable,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { hapticFeedback, touchUtils } from '../../utils/haptics';
import { COMMON_STYLES, COLORS, SPACING, FONT_SIZE, FONT_WEIGHT, SHADOWS } from '../../theme/constants';

interface MobileOptimizedCardProps {
  children: React.ReactNode;
  onPress?: () => void;
  onLongPress?: () => void;
  title?: string;
  subtitle?: string;
  icon?: string;
  iconColor?: string;
  variant?: 'default' | 'elevated' | 'outlined' | 'filled';
  size?: 'small' | 'medium' | 'large';
  disabled?: boolean;
  loading?: boolean;
  hapticFeedback?: 'light' | 'medium' | 'heavy' | 'success' | 'warning' | 'error' | 'selection' | 'none';
  style?: ViewStyle;
  contentStyle?: ViewStyle;
  testID?: string;
}

export default function MobileOptimizedCard({
  children,
  onPress,
  onLongPress,
  title,
  subtitle,
  icon,
  iconColor = COLORS.primary.main, // '#3b82f6' -> COLORS.primary.main
  variant = 'default',
  size = 'medium',
  disabled = false,
  loading = false,
  hapticFeedback: hapticType = 'light',
  style,
  contentStyle,
  testID,
}: MobileOptimizedCardProps) {
  const [scaleValue] = useState(new Animated.Value(1));
  const [opacityValue] = useState(new Animated.Value(1));
  const [isPressed, setIsPressed] = useState(false);

  const handlePressIn = () => {
    if (disabled || loading || !onPress) return;

    setIsPressed(true);
    
    // Haptic feedback
    if (hapticType !== 'none') {
      hapticFeedback[hapticType]();
    }

    // Scale animation
    Animated.parallel([
      Animated.timing(scaleValue, {
        toValue: 0.98,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(opacityValue, {
        toValue: 0.9,
        duration: 100,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const handlePressOut = () => {
    if (disabled || loading || !onPress) return;

    setIsPressed(false);

    // Reset animations
    Animated.parallel([
      Animated.timing(scaleValue, {
        toValue: 1,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(opacityValue, {
        toValue: 1,
        duration: 100,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const handlePress = () => {
    if (disabled || loading || !onPress) return;
    onPress();
  };

  const handleLongPress = () => {
    if (disabled || loading || !onLongPress) return;
    
    // Heavy haptic feedback for long press
    hapticFeedback.heavy();
    onLongPress();
  };

  const getCardStyle = (): ViewStyle => {
    const baseStyle: ViewStyle = {
      ...styles.card,
      ...styles[`${variant}Card`],
      ...styles[`${size}Card`],
    };

    if (disabled) {
      baseStyle.opacity = 0.5;
    }

    if (isPressed) {
      baseStyle.transform = [{ scale: 0.98 }];
    }

    return baseStyle;
  };

  const getContentStyle = (): ViewStyle => {
    return {
      ...styles.content,
      ...styles[`${size}Content`],
      ...contentStyle,
    };
  };

  const renderHeader = () => {
    if (!title && !subtitle && !icon) return null;

    return (
      <View style={styles.header}>
        <View style={styles.headerContent}>
          {icon && (
            <View style={styles.iconContainer}>
              <Ionicons name={icon as keyof typeof Ionicons.glyphMap} size={FONT_SIZE.xl} color={iconColor} /> {/* 20 -> FONT_SIZE.xl */}
            </View>
          )}
          <View style={styles.textContainer}>
            {title && <Text style={styles.title}>{title}</Text>}
            {subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
          </View>
        </View>
        {onPress && (
          <Ionicons 
            name="chevron-forward" 
            size={FONT_SIZE.lg} // 16 -> FONT_SIZE.lg
            color={COLORS.text.tertiary} // '#9ca3af' -> COLORS.text.tertiary
          />
        )}
      </View>
    );
  };

  const CardComponent = onPress ? Pressable : View;

  return (
    <CardComponent
      onPress={onPress ? handlePress : undefined}
      onPressIn={onPress ? handlePressIn : undefined}
      onPressOut={onPress ? handlePressOut : undefined}
      onLongPress={onLongPress ? handleLongPress : undefined}
      disabled={disabled || loading}
      style={({ pressed }) => [
        getCardStyle(),
        style,
        pressed && onPress && !disabled && !loading && styles.pressed,
      ]}
      testID={testID}
    >
      <Animated.View
        style={[
          getContentStyle(),
          {
            transform: [{ scale: scaleValue }],
            opacity: opacityValue,
          },
        ]}
      >
        {renderHeader()}
        {children}
      </Animated.View>
    </CardComponent>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: COMMON_STYLES.standardRadius,
    backgroundColor: COMMON_STYLES.cardBackground,
    // Ensure minimum touch target size
    minHeight: touchUtils.MIN_TOUCH_TARGET_SIZE,
  },
  content: {
    padding: SPACING.lg, // 16 -> SPACING.lg
  },
  pressed: {
    opacity: 0.9,
  },

  // Variants
  defaultCard: {
    ...SHADOWS.small, // Replaced individual shadow properties with SHADOWS.small
  },
  elevatedCard: {
    ...SHADOWS.medium, // Replaced individual shadow properties with SHADOWS.medium
  },
  outlinedCard: {
    borderWidth: 1,
    borderColor: COLORS.border.light, // '#e5e7eb' -> COLORS.border.light
    ...SHADOWS.none, // Replaced individual shadow properties with SHADOWS.none
  },
  filledCard: {
    backgroundColor: COMMON_STYLES.secondaryBackground,
    borderWidth: 1,
    borderColor: COLORS.border.light, // '#e5e7eb' -> COLORS.border.light
    ...SHADOWS.none, // Replaced individual shadow properties with SHADOWS.none
  },

  // Sizes
  smallCard: {
    minHeight: 60,
  },
  smallContent: {
    padding: SPACING.md, // 12 -> SPACING.md
  },
  mediumCard: {
    minHeight: 80,
  },
  mediumContent: {
    padding: SPACING.lg, // 16 -> SPACING.lg
  },
  largeCard: {
    minHeight: 100,
  },
  largeContent: {
    padding: SPACING.xl, // 20 -> SPACING.xl
  },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: SPACING.md, // 12 -> SPACING.md
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  iconContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: COLORS.background.tertiary, // '#f3f4f6' -> COLORS.background.tertiary
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: SPACING.md, // 12 -> SPACING.md
  },
  textContainer: {
    flex: 1,
  },
  title: {
    fontSize: FONT_SIZE.lg, // 16 -> FONT_SIZE.lg
    fontWeight: FONT_WEIGHT.semibold, // '600' -> FONT_WEIGHT.semibold
    color: COLORS.text.primary, // '#1f2937' -> COLORS.text.primary
    marginBottom: 2, // Keep as is for precise spacing
  },
  subtitle: {
    fontSize: FONT_SIZE.md, // 14 -> FONT_SIZE.md
    color: COLORS.text.secondary, // '#6b7280' -> COLORS.text.secondary
  },
});
