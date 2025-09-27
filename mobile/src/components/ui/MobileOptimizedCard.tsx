import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  ViewStyle,
  Pressable,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { hapticFeedback, touchUtils } from '../../utils/haptics';

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
  iconColor = '#3b82f6',
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
              <Ionicons name={icon as any} size={20} color={iconColor} />
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
            size={16} 
            color="#9ca3af" 
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
    borderRadius: 12,
    backgroundColor: '#ffffff',
    // Ensure minimum touch target size
    minHeight: touchUtils.MIN_TOUCH_TARGET_SIZE,
  },
  content: {
    padding: 16,
  },
  pressed: {
    opacity: 0.9,
  },

  // Variants
  defaultCard: {
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  elevatedCard: {
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  outlinedCard: {
    borderWidth: 1,
    borderColor: '#e5e7eb',
    shadowColor: 'transparent',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0,
    shadowRadius: 0,
    elevation: 0,
  },
  filledCard: {
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    shadowColor: 'transparent',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0,
    shadowRadius: 0,
    elevation: 0,
  },

  // Sizes
  smallCard: {
    minHeight: 60,
  },
  smallContent: {
    padding: 12,
  },
  mediumCard: {
    minHeight: 80,
  },
  mediumContent: {
    padding: 16,
  },
  largeCard: {
    minHeight: 100,
  },
  largeContent: {
    padding: 20,
  },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
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
    backgroundColor: '#f3f4f6',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  textContainer: {
    flex: 1,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 2,
  },
  subtitle: {
    fontSize: 14,
    color: '#6b7280',
  },
});
