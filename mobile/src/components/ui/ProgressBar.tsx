import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  ViewStyle,
  TextStyle,
  Easing,
} from 'react-native';
import { COLORS, SPACING, FONT_SIZE, FONT_WEIGHT, BORDER_RADIUS } from '../../theme/constants';

export type ProgressBarVariant = 'default' | 'minimal' | 'filled' | 'outlined' | 'gradient' | 'circular';
export type ProgressBarSize = 'small' | 'medium' | 'large';
export type ProgressBarShape = 'rectangular' | 'rounded' | 'pill' | 'circular';

export interface ProgressBarProps {
  // Core props
  progress: number; // 0-100
  max?: number; // Maximum value (default: 100)

  // Styling
  variant?: ProgressBarVariant;
  size?: ProgressBarSize;
  shape?: ProgressBarShape;

  // Configuration
  animated?: boolean;
  animationDuration?: number;
  showPercentage?: boolean;
  showLabel?: boolean;
  showValue?: boolean;

  // Colors
  color?: string;
  backgroundColor?: string;
  textColor?: string;
  borderColor?: string;

  // Labels
  label?: string;
  valueLabel?: string;
  unit?: string;

  // Callbacks
  onComplete?: () => void;
  onProgressChange?: (progress: number) => void;

  // Styling overrides
  containerStyle?: ViewStyle;
  progressStyle?: ViewStyle;
  labelStyle?: TextStyle;
  valueStyle?: TextStyle;
  percentageStyle?: TextStyle;

  // Accessibility
  testID?: string;
  accessibilityLabel?: string;
  accessibilityRole?: 'progressbar' | 'none';
  accessibilityValue?: {
    min: number;
    max: number;
    now: number;
    text?: string;
  };
}

const ProgressBar: React.FC<ProgressBarProps> = ({
  progress,
  max = 100,
  variant = 'default',
  size = 'medium',
  shape = 'rounded',
  animated = true,
  animationDuration = 300,
  showPercentage = true,
  showLabel = false,
  showValue = false,
  color = COLORS.primary.main,
  backgroundColor = COLORS.background.secondary,
  textColor = COLORS.text.primary,
  borderColor = COLORS.border.medium,
  label,
  valueLabel,
  unit = '',
  onComplete,
  onProgressChange,
  containerStyle,
  progressStyle,
  labelStyle,
  valueStyle,
  percentageStyle,
  testID = 'progress-bar',
  accessibilityLabel,
  accessibilityRole = 'progressbar',
  accessibilityValue,
}) => {
  const animatedValue = useRef(new Animated.Value(0)).current;
  const progressPercentage = Math.min(Math.max((progress / max) * 100, 0), 100);

  useEffect(() => {
    if (animated) {
      Animated.timing(animatedValue, {
        toValue: progressPercentage,
        duration: animationDuration,
        easing: Easing.out(Easing.quad),
        useNativeDriver: false,
      }).start(() => {
        if (progressPercentage >= 100 && onComplete) {
          onComplete();
        }
        if (onProgressChange) {
          onProgressChange(progressPercentage);
        }
      });
    } else {
      animatedValue.setValue(progressPercentage);
      if (onProgressChange) {
        onProgressChange(progressPercentage);
      }
    }
  }, [progressPercentage, animated, animationDuration, onComplete, onProgressChange, animatedValue]);

  const getSizeStyles = () => {
    switch (size) {
      case 'small':
        return {
          height: 8,
          fontSize: FONT_SIZE.xs,
          padding: SPACING.xs,
        };
      case 'medium':
        return {
          height: 12,
          fontSize: FONT_SIZE.sm,
          padding: SPACING.sm,
        };
      case 'large':
        return {
          height: 16,
          fontSize: FONT_SIZE.md,
          padding: SPACING.md,
        };
      default:
        return {
          height: 12,
          fontSize: FONT_SIZE.sm,
          padding: SPACING.sm,
        };
    }
  };

  const getShapeStyles = () => {
    switch (shape) {
      case 'rectangular':
        return { borderRadius: 0 };
      case 'rounded':
        return { borderRadius: BORDER_RADIUS.sm };
      case 'pill':
        return { borderRadius: BORDER_RADIUS.pill };
      case 'circular':
        return { borderRadius: BORDER_RADIUS.pill };
      default:
        return { borderRadius: BORDER_RADIUS.sm };
    }
  };

  const getVariantStyles = () => {
    switch (variant) {
      case 'minimal':
        return {
          backgroundColor: 'transparent',
          borderWidth: 0,
        };
      case 'filled':
        return {
          backgroundColor: COLORS.background.tertiary,
          borderWidth: 0,
        };
      case 'outlined':
        return {
          backgroundColor: 'transparent',
          borderWidth: 2,
          borderColor: borderColor,
        };
      case 'gradient':
        return {
          backgroundColor: backgroundColor,
          borderWidth: 0,
        };
      default:
        return {
          backgroundColor: backgroundColor,
          borderWidth: 1,
          borderColor: borderColor,
        };
    }
  };

  const sizeStyles = getSizeStyles();
  const shapeStyles = getShapeStyles();
  const variantStyles = getVariantStyles();

  const renderCircularProgress = () => {
    if (shape !== 'circular') return null;

    const radius = sizeStyles.height * 2;
    const circumference = 2 * Math.PI * radius;
    const strokeDashoffset = circumference - (progressPercentage / 100) * circumference;

    return (
      <View style={[styles.circularContainer, { width: radius * 2, height: radius * 2 }]}>
        <View style={[styles.circularBackground, { width: radius * 2, height: radius * 2 }]}>
          <View style={[styles.circularProgress, { width: radius * 2, height: radius * 2 }]} />
        </View>
        {(showPercentage || showValue) && (
          <View style={styles.circularTextContainer}>
            {showPercentage && (
              <Text style={[styles.percentage, { color: textColor, fontSize: sizeStyles.fontSize }, percentageStyle]}>
                {Math.round(progressPercentage)}%
              </Text>
            )}
            {showValue && (
              <Text style={[styles.value, { color: textColor, fontSize: sizeStyles.fontSize * 0.8 }, valueStyle]}>
                {progress}{unit}
              </Text>
            )}
          </View>
        )}
      </View>
    );
  };

  const renderLinearProgress = () => {
    if (shape === 'circular') return null;

    return (
      <View style={styles.linearContainer}>
        <View
          style={[
            styles.progressBackground,
            {
              height: sizeStyles.height,
              backgroundColor: variantStyles.backgroundColor,
              borderWidth: variantStyles.borderWidth,
              borderColor: variantStyles.borderColor,
              ...shapeStyles,
            },
            containerStyle,
          ]}
        >
          <Animated.View
            style={[
              styles.progressFill,
              {
                height: sizeStyles.height,
                backgroundColor: color,
                ...shapeStyles,
              },
              {
                width: animatedValue.interpolate({
                  inputRange: [0, 100],
                  outputRange: ['0%', '100%'],
                  extrapolate: 'clamp',
                }),
              },
              progressStyle,
            ]}
          />
        </View>

        {(showLabel || showValue || showPercentage) && (
          <View style={styles.labelsContainer}>
            {showLabel && label && (
              <Text style={[styles.label, { color: textColor, fontSize: sizeStyles.fontSize }, labelStyle]}>
                {label}
              </Text>
            )}

            <View style={styles.valuesContainer}>
              {showValue && (
                <Text style={[styles.value, { color: textColor, fontSize: sizeStyles.fontSize }, valueStyle]}>
                  {valueLabel || `${progress}${unit}`}
                </Text>
              )}
              {showPercentage && (
                <Text style={[styles.percentage, { color: textColor, fontSize: sizeStyles.fontSize }, percentageStyle]}>
                  {Math.round(progressPercentage)}%
                </Text>
              )}
            </View>
          </View>
        )}
      </View>
    );
  };

  const getAccessibilityValue = () => {
    if (accessibilityValue) return accessibilityValue;

    return {
      min: 0,
      max: max,
      now: progress,
      text: `${Math.round(progressPercentage)}%`,
    };
  };

  return (
    <View
      style={[styles.container, { padding: sizeStyles.padding }]}
      testID={testID}
      accessibilityLabel={accessibilityLabel || label || 'Progress bar'}
      accessibilityRole={accessibilityRole}
      accessibilityValue={getAccessibilityValue()}
    >
      {shape === 'circular' ? renderCircularProgress() : renderLinearProgress()}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
  },
  linearContainer: {
    width: '100%',
  },
  progressBackground: {
    width: '100%',
    overflow: 'hidden',
  },
  progressFill: {
    position: 'absolute',
    top: 0,
    left: 0,
    bottom: 0,
  },
  labelsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: SPACING.xs,
  },
  label: {
    fontWeight: FONT_WEIGHT.medium,
    flex: 1,
  },
  valuesContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  value: {
    fontWeight: FONT_WEIGHT.semibold,
  },
  percentage: {
    fontWeight: FONT_WEIGHT.semibold,
  },
  circularContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  circularBackground: {
    position: 'absolute',
    borderRadius: BORDER_RADIUS.pill,
    backgroundColor: COLORS.background.secondary,
  },
  circularProgress: {
    position: 'absolute',
    borderRadius: BORDER_RADIUS.pill,
    backgroundColor: COLORS.primary.main,
  },
  circularTextContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export default ProgressBar;
