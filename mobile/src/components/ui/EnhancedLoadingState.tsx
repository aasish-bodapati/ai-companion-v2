import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  Dimensions,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface EnhancedLoadingStateProps {
  message?: string;
  subMessage?: string;
  showProgress?: boolean;
  progress?: number;
  variant?: 'default' | 'minimal' | 'overlay' | 'inline';
  size?: 'small' | 'medium' | 'large';
  color?: string;
  animated?: boolean;
}

const { width } = Dimensions.get('window');

export default function EnhancedLoadingState({
  message = 'Loading...',
  subMessage,
  showProgress = false,
  progress = 0,
  variant = 'default',
  size = 'medium',
  color = '#3b82f6',
  animated = true,
}: EnhancedLoadingStateProps) {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.8)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const progressAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (animated) {
      // Fade in animation
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }).start();

      // Scale animation
      Animated.spring(scaleAnim, {
        toValue: 1,
        tension: 100,
        friction: 8,
        useNativeDriver: true,
      }).start();

      // Pulse animation for loading indicator
      const pulseAnimation = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.2,
            duration: 1000,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 1000,
            useNativeDriver: true,
          }),
        ])
      );
      pulseAnimation.start();

      // Progress animation
      if (showProgress) {
        Animated.timing(progressAnim, {
          toValue: progress,
          duration: 500,
          useNativeDriver: false,
        }).start();
      }
    }
  }, [animated, progress, showProgress]);

  const getSizeConfig = () => {
    switch (size) {
      case 'small':
        return {
          iconSize: 20,
          fontSize: 14,
          spacing: 8,
        };
      case 'large':
        return {
          iconSize: 40,
          fontSize: 18,
          spacing: 16,
        };
      default:
        return {
          iconSize: 32,
          fontSize: 16,
          spacing: 12,
        };
    }
  };

  const sizeConfig = getSizeConfig();

  const renderContent = () => (
    <Animated.View
      style={[
        styles.container,
        styles[`${variant}Container`],
        {
          opacity: fadeAnim,
          transform: [{ scale: scaleAnim }],
        },
      ]}
    >
      <Animated.View
        style={[
          styles.iconContainer,
          {
            transform: [{ scale: pulseAnim }],
          },
        ]}
      >
        {animated ? (
          <ActivityIndicator size={sizeConfig.iconSize} color={color} />
        ) : (
          <Ionicons name="refresh" size={sizeConfig.iconSize} color={color} />
        )}
      </Animated.View>

      <View style={styles.textContainer}>
        <Text style={[styles.message, { fontSize: sizeConfig.fontSize }]}>
          {message}
        </Text>
        {subMessage && (
          <Text style={[styles.subMessage, { fontSize: sizeConfig.fontSize - 2 }]}>
            {subMessage}
          </Text>
        )}
      </View>

      {showProgress && (
        <View style={styles.progressContainer}>
          <View style={styles.progressBar}>
            <Animated.View
              style={[
                styles.progressFill,
                {
                  width: progressAnim.interpolate({
                    inputRange: [0, 100],
                    outputRange: ['0%', '100%'],
                  }),
                  backgroundColor: color,
                },
              ]}
            />
          </View>
          <Text style={styles.progressText}>{Math.round(progress)}%</Text>
        </View>
      )}
    </Animated.View>
  );

  if (variant === 'overlay') {
    return (
      <View style={styles.overlay}>
        {renderContent()}
      </View>
    );
  }

  if (variant === 'inline') {
    return (
      <View style={styles.inlineContainer}>
        <ActivityIndicator size="small" color={color} />
        <Text style={[styles.inlineText, { marginLeft: 8 }]}>{message}</Text>
      </View>
    );
  }

  return renderContent();
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  defaultContainer: {
    flex: 1,
    paddingHorizontal: 32,
  },
  minimalContainer: {
    paddingVertical: 20,
    paddingHorizontal: 16,
  },
  overlayContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    zIndex: 1000,
  },
  inlineContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
  },
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    zIndex: 1000,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconContainer: {
    marginBottom: 12,
  },
  textContainer: {
    alignItems: 'center',
    marginBottom: 16,
  },
  message: {
    fontWeight: '600',
    color: '#1f2937',
    textAlign: 'center',
    marginBottom: 4,
  },
  subMessage: {
    color: '#6b7280',
    textAlign: 'center',
    lineHeight: 20,
  },
  progressContainer: {
    width: '100%',
    maxWidth: 200,
  },
  progressBar: {
    height: 4,
    backgroundColor: '#f3f4f6',
    borderRadius: 2,
    overflow: 'hidden',
    marginBottom: 8,
  },
  progressFill: {
    height: '100%',
    borderRadius: 2,
  },
  progressText: {
    fontSize: 12,
    color: '#6b7280',
    textAlign: 'center',
  },
  inlineText: {
    fontSize: 14,
    color: '#6b7280',
  },
});
