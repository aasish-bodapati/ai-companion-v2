import React, { useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SPACING, BORDER_RADIUS, FONT_WEIGHT, SHADOWS } from '../../theme/constants';
import { STYLE_PRESETS } from '../../theme/duplicateStyles';

export type ToastType = 'success' | 'error' | 'info' | 'warning';

interface ToastProps {
  visible: boolean;
  message: string;
  type: ToastType;
  duration?: number;
  onHide: () => void;
  queueCount?: number;
}

const Toast: React.FC<ToastProps> = ({
  visible,
  message,
  type,
  duration = 3000,
  onHide,
  queueCount = 0,
}) => {
  const translateY = useRef(new Animated.Value(-100)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      // Show toast
      Animated.parallel([
        Animated.timing(translateY, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();

      // Auto hide after duration
      const timer = setTimeout(() => {
        hideToast();
      }, duration);

      return () => clearTimeout(timer);
    }
  }, [visible, duration, hideToast, opacity, translateY]);

  const hideToast = useCallback(() => {
    Animated.parallel([
      Animated.timing(translateY, {
        toValue: -100,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(opacity, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start(() => {
      onHide();
    });
  }, [translateY, opacity, onHide]);

  if (!visible) return null;

  const getToastConfig = () => {
    switch (type) {
      case 'success':
        return {
          backgroundColor: COLORS.success,
          icon: 'checkmark-circle' as const,
          iconColor: COLORS.text.inverse,
        };
      case 'error':
        return {
          backgroundColor: COLORS.danger,
          icon: 'close-circle' as const,
          iconColor: COLORS.text.inverse,
        };
      case 'warning':
        return {
          backgroundColor: COLORS.warning,
          icon: 'warning' as const,
          iconColor: COLORS.text.inverse,
        };
      case 'info':
        return {
          backgroundColor: COLORS.info,
          icon: 'information-circle' as const,
          iconColor: COLORS.text.inverse,
        };
      default:
        return {
          backgroundColor: COLORS.gray[500],
          icon: 'information-circle' as const,
          iconColor: COLORS.text.inverse,
        };
    }
  };

  const config = getToastConfig();

  return (
    <Animated.View
      style={[
        styles.container,
        {
          transform: [{ translateY }],
          opacity,
          backgroundColor: config.backgroundColor,
        },
      ]}
    >
      <TouchableOpacity
        style={styles.content}
        onPress={hideToast}
        activeOpacity={0.8}
      >
        <Ionicons name={config.icon} size={20} color={config.iconColor} />
        <Text style={styles.message}>{message}</Text>
        <View style={styles.rightSection}>
          {queueCount > 0 && (
            <View style={styles.queueBadge}>
              <Text style={styles.queueText}>+{queueCount}</Text>
            </View>
          )}
          <TouchableOpacity onPress={hideToast} style={styles.closeButton}>
            <Ionicons name="close" size={16} color={config.iconColor} />
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 120,
    left: SPACING.md,
    right: SPACING.md,
    zIndex: 1000,
    borderRadius: BORDER_RADIUS.sm,
    ...SHADOWS.medium,
  },
  content: {
    ...STYLE_PRESETS.row,
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.md,
  },
  message: {
    flex: 1,
    ...STYLE_PRESETS.textSecondary,
    color: COLORS.text.inverse,
    fontWeight: FONT_WEIGHT.medium,
    marginLeft: SPACING.xs,
  },
  rightSection: {
    ...STYLE_PRESETS.row,
  },
  queueBadge: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: BORDER_RADIUS.round,
    paddingHorizontal: SPACING.xs,
    paddingVertical: 2,
    marginRight: SPACING.xs,
  },
  queueText: {
    color: COLORS.text.inverse,
    ...STYLE_PRESETS.textCaption,
    fontWeight: FONT_WEIGHT.semibold,
  },
  closeButton: {
    padding: SPACING.xxs,
  },
});

export default Toast;
