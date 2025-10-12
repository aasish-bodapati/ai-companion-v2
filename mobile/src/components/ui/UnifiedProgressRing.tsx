/**
 * Unified ProgressRing component
 * Combines functionality from both shared/ProgressRing and ui/ProgressRing
 * Uses feature flags to maintain backward compatibility
 */

import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { getStatusColor, getStatusText, getMotivationalText } from '../../utils/componentUtils';
import { COLORS, BORDER_RADIUS } from '../../theme/constants';

// Removed deprecationUtils import

// Combined interface supporting both old and new props
interface UnifiedProgressRingProps {
  // Props from shared/ProgressRing
  value?: number;
  target?: number;
  size?: number;
  strokeWidth?: number;
  color?: string;
  backgroundColor?: string;
  icon?: string;
  label?: string;
  unit?: string;
  showPercentage?: boolean;
  onPress?: () => void;

  // Props from ui/ProgressRing
  progress?: number; // 0-1
  goal?: number;
  current?: number;
  animated?: boolean;
  showIcon?: boolean;
  iconName?: string;

  // Additional unified props
  variant?: 'shared' | 'ui' | 'auto';
  testID?: string;
}

export const UnifiedProgressRing = ({
  // Shared props
  value,
  target,
  size = 80,
  strokeWidth = 6,
  color = '#3b82f6',
  backgroundColor = '#e5e7eb',
  icon,
  label,
  unit = '',
  showPercentage = true,
  onPress,

  // UI props
  progress,
  goal,
  current,
  animated = true,
  showIcon = true,
  iconName = 'checkmark',

  // Unified props
  variant = 'auto',
  testID,
}: UnifiedProgressRingProps) => {
  const animatedValue = useRef(new Animated.Value(0)).current;
  const scaleValue = useRef(new Animated.Value(1)).current;

  // Determine which variant to use
  const useSharedVariant = variant === 'shared' || (variant === 'auto' && value !== undefined && target !== undefined);
  const useUIVariant = variant === 'ui' || (variant === 'auto' && progress !== undefined && goal !== undefined && current !== undefined);

  // Show deprecation warning if using old components
  useEffect(() => {
    // Removed deprecation warnings
  }, [useSharedVariant, useUIVariant]);

  // Calculate values based on variant
  const calculatedProgress = useSharedVariant
    ? Math.min((value! / target!) * 100, 100) / 100
    : progress!;

  const calculatedCurrent = useSharedVariant ? value! : current!;
  const calculatedGoal = useSharedVariant ? target! : goal!;
  const calculatedLabel = useSharedVariant ? label! : label!;
  // const calculatedColor = useSharedVariant ? color! : color!;
  const calculatedSize = useSharedVariant ? size! : size!;
  const calculatedStrokeWidth = useSharedVariant ? strokeWidth! : strokeWidth!;

  useEffect(() => {
    if (animated) {
      Animated.timing(animatedValue, {
        toValue: calculatedProgress,
        duration: 1000,
        useNativeDriver: false,
      }).start();

      // Add a subtle scale animation when progress changes
      Animated.sequence([
        Animated.timing(scaleValue, {
          toValue: 1.05,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(scaleValue, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [calculatedProgress, animated, animatedValue, scaleValue]);

  const radius = (calculatedSize - calculatedStrokeWidth) / 2;

  const statusColor = getStatusColor(calculatedProgress * 100);
  const statusText = getStatusText(calculatedProgress * 100);
  const motivationalText = getMotivationalText(calculatedProgress);

  const renderContent = () => (
    <Animated.View
      style={[
        styles.container,
        {
          width: calculatedSize,
          height: calculatedSize,
          transform: [{ scale: scaleValue }],
        },
      ]}
      testID={testID}
    >
      {/* Background Circle */}
      <View style={[styles.circle, { width: calculatedSize, height: calculatedSize }]}>
        <View
          style={[
            styles.backgroundCircle,
            {
              width: calculatedSize - calculatedStrokeWidth,
              height: calculatedSize - calculatedStrokeWidth,
              borderRadius: radius,
              borderWidth: calculatedStrokeWidth,
              borderColor: backgroundColor,
            },
          ]}
        />
      </View>

      {/* Progress Circle */}
      <View style={[styles.circle, { width: calculatedSize, height: calculatedSize }]}>
        <Animated.View
          style={[
            styles.progressCircle,
            {
              width: calculatedSize - calculatedStrokeWidth,
              height: calculatedSize - calculatedStrokeWidth,
              borderRadius: radius,
              borderWidth: calculatedStrokeWidth,
              borderColor: 'transparent',
              borderTopColor: statusColor,
              borderRightColor: calculatedProgress > 0.25 ? statusColor : 'transparent',
              borderBottomColor: calculatedProgress > 0.5 ? statusColor : 'transparent',
              borderLeftColor: calculatedProgress > 0.75 ? statusColor : 'transparent',
              transform: [{ rotate: '-90deg' }],
            },
          ]}
        />
      </View>

      {/* Center Content */}
      <View style={styles.centerContent}>
        {(showIcon || icon) && (
          <View style={[styles.iconContainer, { backgroundColor: statusColor + '20' }]}>
            <Ionicons
              name={calculatedProgress >= 1 ? 'checkmark' : (iconName as keyof typeof Ionicons.glyphMap) || (icon as keyof typeof Ionicons.glyphMap)}
              size={calculatedSize * 0.15}
              color={statusColor}
            />
          </View>
        )}

        <Text style={[styles.currentValue, { fontSize: calculatedSize * 0.2 }]}>
          {calculatedCurrent}
        </Text>

        <Text style={[styles.goalValue, { fontSize: calculatedSize * 0.12 }]}>
          / {calculatedGoal}
        </Text>

        <Text style={[styles.label, { fontSize: calculatedSize * 0.1 }]}>
          {calculatedLabel}
        </Text>

        {showPercentage && (
          <Text style={[styles.percentage, { fontSize: calculatedSize * 0.08 }]}>
            {Math.round(calculatedProgress * 100)}%
          </Text>
        )}

        {useUIVariant && (
          <Text style={[styles.motivation, { fontSize: calculatedSize * 0.08 }]}>
            {motivationalText}
          </Text>
        )}

        {useSharedVariant && (
          <Text style={[styles.status, { fontSize: calculatedSize * 0.08 }]}>
            {statusText}
          </Text>
        )}
      </View>
    </Animated.View>
  );

  if (onPress) {
    return (
      <TouchableOpacity
        onPress={onPress}
        activeOpacity={0.7}
        testID={`${testID}-touchable`}
      >
        {renderContent()}
      </TouchableOpacity>
    );
  }

  return renderContent();
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  circle: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
  backgroundCircle: {
    borderStyle: 'solid',
  },
  progressCircle: {
    borderStyle: 'solid',
  },
  centerContent: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconContainer: {
    width: 32,
    height: 32,
    borderRadius: BORDER_RADIUS.lg,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  currentValue: {
    fontWeight: 'bold',
    color: COLORS.text.primary,
    lineHeight: 1.2,
  },
  goalValue: {
    color: COLORS.text.secondary,
    lineHeight: 1.2,
  },
  label: {
    color: COLORS.text.secondary,
    textAlign: 'center',
    marginTop: 4,
    lineHeight: 1.2,
    fontWeight: '500',
  },
  percentage: {
    color: '#3b82f6',
    textAlign: 'center',
    marginTop: 2,
    fontWeight: '600',
    lineHeight: 1.2,
  },
  status: {
    color: COLORS.text.secondary,
    textAlign: 'center',
    marginTop: 2,
    fontWeight: '600',
    lineHeight: 1.2,
  },
  motivation: {
    color: '#10b981',
    textAlign: 'center',
    marginTop: 4,
    fontWeight: '600',
    lineHeight: 1.2,
  },
});

// Export default for backward compatibility
export default UnifiedProgressRing;
