/**
 * Unified LoadingState component
 * Combines functionality from LoadingState, EnhancedLoadingState, and ProgressIndicator
 * Uses feature flags to maintain backward compatibility
 */

import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
  Animated,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
// Removed deprecationUtils import
import { COLORS, SPACING, FONT_SIZE, BORDER_RADIUS } from '../../theme/constants';

// Combined interface supporting all loading variants
interface UnifiedLoadingStateProps {
  // Basic loading props
  loading?: boolean;
  message?: string;
  subMessage?: string;
  children?: React.ReactNode;

  // Variant props
  variant?: 'default' | 'overlay' | 'inline' | 'skeleton' | 'spinner' | 'progress' | 'ring';
  size?: 'small' | 'medium' | 'large';

  // Progress props
  showProgress?: boolean;
  progress?: number;

  // Interactive props
  showRetry?: boolean;
  onRetry?: () => void;
  retryText?: string;

  // Visual props
  icon?: string;
  color?: string;
  backgroundColor?: string;
  animated?: boolean;

  // Style props
  style?: object;
  testID?: string;

  // Legacy props for backward compatibility
  duration?: number;
  onHide?: () => void;
  queueCount?: number;
}

export const UnifiedLoadingState = ({
  loading = true,
  message = 'Loading...',
  subMessage,
  children,
  variant = 'default',
  size = 'medium',
  showProgress = false,
  progress = 0,
  showRetry = false,
  onRetry,
  retryText = 'Try Again',
  icon,
  color = COLORS.primary,
  backgroundColor,
  animated = true,
  style,
  testID,
  // Legacy props
  duration,
  onHide,
  queueCount,
}: UnifiedLoadingStateProps) => {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.8)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const progressAnim = useRef(new Animated.Value(0)).current;

  // Show deprecation warnings
  // Removed deprecation warnings

  useEffect(() => {
    if (animated && loading) {
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
  }, [animated, loading, progress, showProgress, fadeAnim, scaleAnim, pulseAnim, progressAnim]);

  const getSizeConfig = () => {
    switch (size) {
      case 'small':
        return {
          iconSize: 20,
          fontSize: 14,
          spacing: 8,
          spinnerSize: 'small' as const,
        };
      case 'large':
        return {
          iconSize: 40,
          fontSize: 18,
          spacing: 16,
          spinnerSize: 'large' as const,
        };
      default:
        return {
          iconSize: 32,
          fontSize: 16,
          spacing: 12,
          spinnerSize: 'large' as const,
        };
    }
  };

  const sizeConfig = getSizeConfig();

  const handleRetry = () => {
    onRetry?.();
  };

  const renderContent = () => (
    <Animated.View
      style={[
        styles.content,
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
        {icon ? (
          <Ionicons
            name={icon as keyof typeof Ionicons.glyphMap}
            size={sizeConfig.iconSize}
            color={color}
          />
        ) : (
          <ActivityIndicator
            size={sizeConfig.spinnerSize}
            color={color}
          />
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

      {showRetry && onRetry && (
        <TouchableOpacity
          style={styles.retryButton}
          onPress={handleRetry}
          testID={`${testID}-retry-button`}
        >
          <Ionicons name="refresh" size={16} color={color} />
          <Text style={[styles.retryText, { color }]}>{retryText}</Text>
        </TouchableOpacity>
      )}

      {queueCount && queueCount > 0 && (
        <View style={styles.queueBadge}>
          <Text style={styles.queueText}>+{queueCount}</Text>
        </View>
      )}
    </Animated.View>
  );

  const getVariantStyles = () => {
    switch (variant) {
      case 'overlay':
        return {
          ...styles.overlay,
          backgroundColor: backgroundColor || COLORS.background.primary + '90',
        };
      case 'inline':
        return styles.inline;
      case 'skeleton':
        return styles.skeleton;
      case 'spinner':
        return styles.spinner;
      case 'progress':
        return styles.progress;
      case 'ring':
        return styles.ring;
      default:
        return styles.default;
    }
  };

  const containerStyle = [
    getVariantStyles(),
    { padding: sizeConfig.spacing },
    style,
  ];

  if (variant === 'skeleton') {
    return (
      <View style={containerStyle} testID={testID}>
        <View style={styles.skeletonContent}>
          <View style={styles.skeletonLine} />
          <View style={[styles.skeletonLine, styles.skeletonLineShort]} />
          <View style={[styles.skeletonLine, styles.skeletonLineMedium]} />
        </View>
      </View>
    );
  }

  if (variant === 'inline') {
    return (
      <View style={[styles.inlineContainer, style]} testID={testID}>
        <ActivityIndicator size="small" color={color} />
        <Text style={[styles.inlineText, { marginLeft: 8 }]}>{message}</Text>
      </View>
    );
  }

  if (loading) {
    return (
      <View style={containerStyle} testID={testID}>
        {renderContent()}
      </View>
    );
  }

  return <>{children}</>;
};

const styles = StyleSheet.create({
  default: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.background.primary,
  },
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
  },
  inline: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.background.secondary,
    borderRadius: BORDER_RADIUS.medium,
    margin: SPACING.small,
  },
  skeleton: {
    backgroundColor: COLORS.background.secondary,
    borderRadius: BORDER_RADIUS.medium,
    margin: SPACING.small,
  },
  spinner: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SPACING.large,
  },
  progress: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SPACING.large,
  },
  ring: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SPACING.large,
  },
  inlineContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
  },
  content: {
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
    color: COLORS.text.primary,
    textAlign: 'center',
    marginBottom: 4,
  },
  subMessage: {
    color: COLORS.text.secondary,
    textAlign: 'center',
    lineHeight: 20,
  },
  progressContainer: {
    width: '100%',
    maxWidth: 200,
    marginBottom: 16,
  },
  progressBar: {
    height: 4,
    backgroundColor: COLORS.border.light,
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
    color: COLORS.text.secondary,
    textAlign: 'center',
  },
  inlineText: {
    fontSize: 14,
    color: COLORS.text.secondary,
  },
  retryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: SPACING.small,
    paddingHorizontal: SPACING.medium,
    backgroundColor: COLORS.primary + '20',
    borderRadius: BORDER_RADIUS.medium,
    borderWidth: 1,
    borderColor: COLORS.primary,
    gap: SPACING.xs,
  },
  retryText: {
    fontSize: FONT_SIZE.small,
    fontWeight: '500',
  },
  queueBadge: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 10,
    paddingHorizontal: 6,
    paddingVertical: 2,
    marginTop: 8,
  },
  queueText: {
    color: COLORS.text.primary,
    fontSize: 12,
    fontWeight: '600',
  },
  skeletonContent: {
    gap: SPACING.small,
  },
  skeletonLine: {
    height: 16,
    backgroundColor: COLORS.border.light,
    borderRadius: BORDER_RADIUS.small,
  },
  skeletonLineShort: {
    width: '60%',
  },
  skeletonLineMedium: {
    width: '80%',
  },
});

// Export default for backward compatibility
export default UnifiedLoadingState;
