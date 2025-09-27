import React, { useState } from 'react';
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  ViewStyle,
  TextStyle,
  ActivityIndicator,
  Animated,
  Pressable,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { hapticFeedback, touchUtils } from '../../utils/haptics';

interface TouchOptimizedButtonProps {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
  size?: 'small' | 'medium' | 'large';
  icon?: string;
  iconPosition?: 'left' | 'right';
  loading?: boolean;
  disabled?: boolean;
  hapticFeedback?: 'light' | 'medium' | 'heavy' | 'success' | 'warning' | 'error' | 'selection' | 'none';
  style?: ViewStyle;
  textStyle?: TextStyle;
  fullWidth?: boolean;
  testID?: string;
}

export default function TouchOptimizedButton({
  title,
  onPress,
  variant = 'primary',
  size = 'medium',
  icon,
  iconPosition = 'left',
  loading = false,
  disabled = false,
  hapticFeedback: hapticType = 'medium',
  style,
  textStyle,
  fullWidth = false,
  testID,
}: TouchOptimizedButtonProps) {
  const [scaleValue] = useState(new Animated.Value(1));
  const [opacityValue] = useState(new Animated.Value(1));

  const handlePressIn = () => {
    if (disabled || loading) return;

    // Haptic feedback on press
    if (hapticType !== 'none') {
      hapticFeedback[hapticType]();
    }

    // Scale animation
    Animated.parallel([
      Animated.timing(scaleValue, {
        toValue: 0.95,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(opacityValue, {
        toValue: 0.8,
        duration: 100,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const handlePressOut = () => {
    if (disabled || loading) return;

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
    if (disabled || loading) return;
    onPress();
  };

  const getButtonStyle = (): ViewStyle => {
    const baseStyle: ViewStyle = {
      ...styles.button,
      ...styles[`${variant}Button`],
      ...styles[`${size}Button`],
    };

    if (fullWidth) {
      baseStyle.width = '100%';
    }

    if (disabled) {
      baseStyle.opacity = 0.5;
    }

    return baseStyle;
  };

  const getTextStyle = (): TextStyle => {
    return {
      ...styles.text,
      ...styles[`${variant}Text`],
      ...styles[`${size}Text`],
    };
  };

  const renderContent = () => {
    if (loading) {
      return (
        <>
          <ActivityIndicator 
            size="small" 
            color={variant === 'primary' ? '#ffffff' : '#3b82f6'} 
          />
          <Text style={[getTextStyle(), { marginLeft: 8 }]}>
            Loading...
          </Text>
        </>
      );
    }

    if (icon) {
      const iconElement = (
        <Ionicons
          name={icon as any}
          size={size === 'small' ? 16 : size === 'large' ? 24 : 20}
          color={variant === 'primary' ? '#ffffff' : '#3b82f6'}
        />
      );

      return (
        <>
          {iconPosition === 'left' && iconElement}
          <Text style={[getTextStyle(), icon && { marginHorizontal: 8 }]}>
            {title}
          </Text>
          {iconPosition === 'right' && iconElement}
        </>
      );
    }

    return <Text style={getTextStyle()}>{title}</Text>;
  };

  return (
    <Pressable
      onPress={handlePress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      disabled={disabled || loading}
      style={({ pressed }) => [
        getButtonStyle(),
        style,
        pressed && !disabled && !loading && styles.pressed,
      ]}
      testID={testID}
    >
      <Animated.View
        style={[
          styles.content,
          {
            transform: [{ scale: scaleValue }],
            opacity: opacityValue,
          },
        ]}
      >
        {renderContent()}
      </Animated.View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 8,
    borderWidth: 1,
    // Ensure minimum touch target size
    minHeight: touchUtils.MIN_TOUCH_TARGET_SIZE,
    minWidth: touchUtils.MIN_TOUCH_TARGET_SIZE,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: {
    fontWeight: '600',
    textAlign: 'center',
  },
  pressed: {
    opacity: 0.8,
  },

  // Variants
  primaryButton: {
    backgroundColor: '#3b82f6',
    borderColor: '#3b82f6',
  },
  primaryText: {
    color: '#ffffff',
  },

  secondaryButton: {
    backgroundColor: '#f3f4f6',
    borderColor: '#d1d5db',
  },
  secondaryText: {
    color: '#374151',
  },

  outlineButton: {
    backgroundColor: 'transparent',
    borderColor: '#3b82f6',
  },
  outlineText: {
    color: '#3b82f6',
  },

  ghostButton: {
    backgroundColor: 'transparent',
    borderColor: 'transparent',
  },
  ghostText: {
    color: '#3b82f6',
  },

  dangerButton: {
    backgroundColor: '#ef4444',
    borderColor: '#ef4444',
  },
  dangerText: {
    color: '#ffffff',
  },

  // Sizes
  smallButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    minHeight: 36,
  },
  smallText: {
    fontSize: 14,
  },

  mediumButton: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    minHeight: 44,
  },
  mediumText: {
    fontSize: 16,
  },

  largeButton: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    minHeight: 52,
  },
  largeText: {
    fontSize: 18,
  },
});
