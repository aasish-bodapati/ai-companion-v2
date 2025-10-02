import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
} from 'react-native';
import { COLORS, SPACING, FONT_SIZE, BORDER_RADIUS, SHADOWS } from '../../theme/constants';

interface ProgressIndicatorProps {
  progress: number; // 0-100
  size?: 'small' | 'medium' | 'large';
  variant?: 'linear' | 'circular';
  showPercentage?: boolean;
  showLabel?: boolean;
  label?: string;
  color?: string;
  backgroundColor?: string;
  animated?: boolean;
  style?: any;
  testID?: string;
}

export default function ProgressIndicator({
  progress,
  size = 'medium',
  variant = 'linear',
  showPercentage = true,
  showLabel = false,
  label,
  color = COLORS.primary,
  backgroundColor = COLORS.border.light,
  animated = true,
  style,
  testID,
}: ProgressIndicatorProps) {
  const [animatedProgress] = React.useState(new Animated.Value(0));

  React.useEffect(() => {
    if (animated) {
      Animated.timing(animatedProgress, {
        toValue: Math.max(0, Math.min(100, progress)),
        duration: 500,
        useNativeDriver: false,
      }).start();
    } else {
      animatedProgress.setValue(Math.max(0, Math.min(100, progress)));
    }
  }, [progress, animated, animatedProgress]);

  const getSizeStyles = () => {
    switch (size) {
      case 'small':
        return {
          height: 4,
          fontSize: FONT_SIZE.xs,
        };
      case 'large':
        return {
          height: 12,
          fontSize: FONT_SIZE.medium,
        };
      default:
        return {
          height: 8,
          fontSize: FONT_SIZE.small,
        };
    }
  };

  const sizeStyles = getSizeStyles();

  const renderLinearProgress = () => {
    const progressWidth = animatedProgress.interpolate({
      inputRange: [0, 100],
      outputRange: ['0%', '100%'],
      extrapolate: 'clamp',
    });

    return (
      <View style={[styles.linearContainer, { height: sizeStyles.height }]}>
        <View style={[styles.linearBackground, { backgroundColor }]} />
        <Animated.View
          style={[
            styles.linearProgress,
            {
              backgroundColor: color,
              width: progressWidth,
            },
          ]}
        />
      </View>
    );
  };

  const renderCircularProgress = () => {
    const radius = size === 'small' ? 20 : size === 'large' ? 40 : 30;
    const strokeWidth = size === 'small' ? 3 : size === 'large' ? 6 : 4;
    const circumference = 2 * Math.PI * radius;
    const strokeDashoffset = circumference - (progress / 100) * circumference;

    return (
      <View style={styles.circularContainer}>
        <View style={[styles.circularBackground, { width: radius * 2, height: radius * 2 }]}>
          <View style={styles.circularContent}>
            {showPercentage && (
              <Text style={[styles.percentageText, { fontSize: sizeStyles.fontSize }]}>
                {Math.round(progress)}%
              </Text>
            )}
          </View>
        </View>
      </View>
    );
  };

  const renderLabel = () => {
    if (!showLabel && !label) return null;

    return (
      <View style={styles.labelContainer}>
        <Text style={[styles.label, { fontSize: sizeStyles.fontSize }]}>
          {label || `${Math.round(progress)}%`}
        </Text>
      </View>
    );
  };

  return (
    <View style={[styles.container, style]} testID={testID}>
      {variant === 'linear' ? renderLinearProgress() : renderCircularProgress()}
      {renderLabel()}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    // Container styles
  },
  linearContainer: {
    position: 'relative',
    borderRadius: BORDER_RADIUS.small,
    overflow: 'hidden',
  },
  linearBackground: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    opacity: 0.2,
  },
  linearProgress: {
    position: 'absolute',
    top: 0,
    left: 0,
    bottom: 0,
    borderRadius: BORDER_RADIUS.small,
  },
  circularContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  circularBackground: {
    borderRadius: 50,
    backgroundColor: COLORS.background.secondary,
    alignItems: 'center',
    justifyContent: 'center',
    ...SHADOWS.small,
  },
  circularContent: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  percentageText: {
    fontWeight: '600',
    color: COLORS.text.primary,
  },
  labelContainer: {
    marginTop: SPACING.xs,
    alignItems: 'center',
  },
  label: {
    color: COLORS.text.secondary,
    fontWeight: '500',
  },
});
