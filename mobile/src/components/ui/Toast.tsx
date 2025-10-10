import React, { useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../../theme/constants';

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
          backgroundColor: '#06b6d4',
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
    left: 16,
    right: 16,
    zIndex: 1000,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  message: {
    flex: 1,
    color: COLORS.text.inverse,
    fontSize: 14,
    fontWeight: '500',
    marginLeft: 8,
  },
  rightSection: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  queueBadge: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 10,
    paddingHorizontal: 6,
    paddingVertical: 2,
    marginRight: 8,
  },
  queueText: {
    color: COLORS.text.inverse,
    fontSize: 12,
    fontWeight: '600',
  },
  closeButton: {
    padding: 4,
  },
});

export default Toast;
