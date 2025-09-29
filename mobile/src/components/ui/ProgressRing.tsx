import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const { width } = Dimensions.get('window');

interface ProgressRingProps {
  progress: number; // 0-1
  goal: number;
  current: number;
  label: string;
  color: string;
  animated?: boolean;
  size?: number;
  strokeWidth?: number;
  showIcon?: boolean;
  iconName?: string;
  onPress?: () => void;
}

export default function ProgressRing({
  progress,
  goal,
  current,
  label,
  color,
  animated = true,
  size = 120,
  strokeWidth = 8,
  showIcon = true,
  iconName = 'checkmark',
  onPress,
}: ProgressRingProps) {
  const animatedValue = useRef(new Animated.Value(0)).current;
  const scaleValue = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (animated) {
      Animated.timing(animatedValue, {
        toValue: progress,
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
    } else {
      animatedValue.setValue(progress);
    }
  }, [progress, animated]);

  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDasharray = circumference;
  const strokeDashoffset = animatedValue.interpolate({
    inputRange: [0, 1],
    outputRange: [circumference, 0],
  });

  const getProgressColor = () => {
    if (progress >= 1) return '#10b981'; // Green when complete
    if (progress >= 0.7) return '#f59e0b'; // Orange when close
    return color; // Default color
  };

  const getMotivationalText = () => {
    if (progress >= 1) return 'Complete! 🎉';
    if (progress >= 0.8) return 'Almost there! 💪';
    if (progress >= 0.5) return 'Great progress! 🌟';
    if (progress > 0) return 'Keep going! 🚀';
    return 'Let\'s start! 💫';
  };

  return (
    <Animated.View 
      style={[
        styles.container,
        { 
          width: size, 
          height: size,
          transform: [{ scale: scaleValue }]
        }
      ]}
    >
      {/* Background Circle */}
      <View style={[styles.circle, { width: size, height: size }]}>
        <View
          style={[
            styles.backgroundCircle,
            {
              width: size - strokeWidth,
              height: size - strokeWidth,
              borderRadius: radius,
              borderWidth: strokeWidth,
              borderColor: '#e5e7eb',
            },
          ]}
        />
      </View>

      {/* Progress Circle */}
      <View style={[styles.circle, { width: size, height: size }]}>
        <Animated.View
          style={[
            styles.progressCircle,
            {
              width: size - strokeWidth,
              height: size - strokeWidth,
              borderRadius: radius,
              borderWidth: strokeWidth,
              borderColor: getProgressColor(),
              borderTopColor: getProgressColor(),
              borderRightColor: progress > 0.25 ? getProgressColor() : 'transparent',
              borderBottomColor: progress > 0.5 ? getProgressColor() : 'transparent',
              borderLeftColor: progress > 0.75 ? getProgressColor() : 'transparent',
              transform: [{ rotate: '-90deg' }],
            },
          ]}
        />
      </View>

      {/* Center Content */}
      <View style={styles.centerContent}>
        {showIcon && (
          <View style={[styles.iconContainer, { backgroundColor: getProgressColor() + '20' }]}>
            <Ionicons 
              name={progress >= 1 ? 'checkmark' : iconName as any} 
              size={size * 0.15} 
              color={getProgressColor()} 
            />
          </View>
        )}
        <Text style={[styles.currentValue, { fontSize: size * 0.2 }]}>
          {current}
        </Text>
        <Text style={[styles.goalValue, { fontSize: size * 0.12 }]}>
          / {goal}
        </Text>
        <Text style={[styles.label, { fontSize: size * 0.1 }]}>
          {label}
        </Text>
        <Text style={[styles.motivation, { fontSize: size * 0.08 }]}>
          {getMotivationalText()}
        </Text>
      </View>
    </Animated.View>
  );
}

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
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  currentValue: {
    fontWeight: 'bold',
    color: '#1f2937',
    lineHeight: 1.2,
    fontSize: 20,
  },
  goalValue: {
    color: '#6b7280',
    lineHeight: 1.2,
    fontSize: 14,
  },
  label: {
    color: '#6b7280',
    textAlign: 'center',
    marginTop: 4,
    lineHeight: 1.2,
    fontSize: 12,
    fontWeight: '500',
  },
  motivation: {
    color: '#10b981',
    textAlign: 'center',
    marginTop: 4,
    fontWeight: '600',
    lineHeight: 1.2,
    fontSize: 10,
  },
});
