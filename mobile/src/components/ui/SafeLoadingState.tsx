/**
 * Safe loading state component
 * Can be used alongside existing loading components without breaking changes
 */

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { hapticFeedback } from '../../utils/haptics';
import { COLORS, SPACING, FONT_SIZE, BORDER_RADIUS } from '../../theme/constants';
import { isFeatureEnabled } from '../../config/featureFlags';

interface SafeLoadingStateProps {
  loading: boolean;
  message?: string;
  subMessage?: string;
  children: React.ReactNode;
  variant?: 'default' | 'overlay' | 'inline' | 'skeleton';
  size?: 'small' | 'medium' | 'large';
  showRetry?: boolean;
  onRetry?: () => void;
  retryText?: string;
  icon?: string;
  color?: string;
  style?: any;
  testID?: string;
}

export const SafeLoadingState = ({
  loading,
  message = 'Loading...',
  subMessage,
  children,
  variant = 'default',
  size = 'medium',
  showRetry = false,
  onRetry,
  retryText = 'Try Again',
  icon,
  color = COLORS.primary.main,
  style,
  testID,
}: SafeLoadingStateProps) => {
  const handleRetry = () => {
    hapticFeedback.light();
    onRetry?.();
  };

  const getSizeStyles = () => {
    switch (size) {
      case 'small':
        return {
          spinnerSize: 'small' as const,
          fontSize: FONT_SIZE.small,
          padding: SPACING.medium,
        };
      case 'large':
        return {
          spinnerSize: 'large' as const,
          fontSize: FONT_SIZE.large,
          padding: SPACING.xl,
        };
      default:
        return {
          spinnerSize: 'large' as const,
          fontSize: FONT_SIZE.medium,
          padding: SPACING.large,
        };
    }
  };

  const sizeStyles = getSizeStyles();

  const renderContent = () => (
    <View style={styles.content}>
      {icon ? (
        <Ionicons
          name={icon as any}
          size={size === 'small' ? 24 : size === 'large' ? 48 : 32}
          color={color}
          style={styles.icon}
        />
      ) : (
        <ActivityIndicator
          size={sizeStyles.spinnerSize}
          color={color}
          style={styles.spinner}
        />
      )}
      
      <Text style={[styles.message, { fontSize: sizeStyles.fontSize }]}>
        {message}
      </Text>
      
      {subMessage && (
        <Text style={styles.subMessage}>
          {subMessage}
        </Text>
      )}
      
      {showRetry && onRetry && (
        <TouchableOpacity
          style={styles.retryButton}
          onPress={handleRetry}
          testID={`${testID}-retry-button`}
        >
          <Ionicons name="refresh" size={16} color={COLORS.primary.main} />
          <Text style={styles.retryText}>{retryText}</Text>
        </TouchableOpacity>
      )}
    </View>
  );

  const getVariantStyles = () => {
    switch (variant) {
      case 'overlay':
        return {
          ...styles.overlay,
          backgroundColor: COLORS.background.primary + '90',
        };
      case 'inline':
        return styles.inline;
      case 'skeleton':
        return styles.skeleton;
      default:
        return styles.default;
    }
  };

  const containerStyle = [
    getVariantStyles(),
    { padding: sizeStyles.padding },
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
  content: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  icon: {
    marginBottom: SPACING.medium,
  },
  spinner: {
    marginBottom: SPACING.medium,
  },
  message: {
    color: COLORS.text.primary,
    fontWeight: '500',
    textAlign: 'center',
    marginBottom: SPACING.xs,
  },
  subMessage: {
    color: COLORS.text.secondary,
    fontSize: FONT_SIZE.small,
    textAlign: 'center',
    marginBottom: SPACING.medium,
  },
  retryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: SPACING.small,
    paddingHorizontal: SPACING.medium,
    backgroundColor: COLORS.primary.main + '20',
    borderRadius: BORDER_RADIUS.medium,
    borderWidth: 1,
    borderColor: COLORS.primary.main,
    gap: SPACING.xs,
  },
  retryText: {
    color: COLORS.primary.main,
    fontSize: FONT_SIZE.small,
    fontWeight: '500',
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
