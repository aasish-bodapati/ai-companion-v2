/**
 * FloatingActionButton - Quick access button optimized for thumb zone
 * Perfect for one-handed operation and quick actions
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { hapticFeedback } from '../../utils/haptics';
import { COLORS, SPACING, FONT_SIZE, FONT_WEIGHT, BORDER_RADIUS } from '../../theme/constants';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface FloatingActionButtonProps {
  onPress: () => void;
  icon?: keyof typeof Ionicons.glyphMap;
  label?: string;
  variant?: 'primary' | 'secondary' | 'success' | 'danger';
  size?: 'small' | 'medium' | 'large';
  position?: 'bottom-right' | 'bottom-left' | 'bottom-center';
  style?: any;
}

export default function FloatingActionButton({
  onPress,
  icon = 'add',
  label,
  variant = 'primary',
  size = 'large',
  position = 'bottom-right',
  style,
}: FloatingActionButtonProps) {
  const [pressed, setPressed] = useState(false);
  const scaleAnim = new Animated.Value(1);

  const handlePressIn = () => {
    setPressed(true);
    hapticFeedback.light();
    Animated.spring(scaleAnim, {
      toValue: 0.95,
      useNativeDriver: true,
    }).start();
  };

  const handlePressOut = () => {
    setPressed(false);
    Animated.spring(scaleAnim, {
      toValue: 1,
      useNativeDriver: true,
    }).start();
  };

  const handlePress = () => {
    hapticFeedback.medium();
    onPress();
  };

  const getPositionStyle = () => {
    const baseStyle = {
      position: 'absolute' as const,
      bottom: SPACING.xl,
    };

    switch (position) {
      case 'bottom-left':
        return { ...baseStyle, left: SPACING.large };
      case 'bottom-center':
        return { ...baseStyle, left: SCREEN_WIDTH / 2 - 28 }; // Center the button
      case 'bottom-right':
      default:
        return { ...baseStyle, right: SPACING.large };
    }
  };

  const getSizeStyle = () => {
    switch (size) {
      case 'small':
        return { width: 48, height: 48, borderRadius: 24 };
      case 'medium':
        return { width: 56, height: 56, borderRadius: 28 };
      case 'large':
      default:
        return { width: 64, height: 64, borderRadius: 32 };
    }
  };

  const getVariantStyle = () => {
    switch (variant) {
      case 'secondary':
        return { backgroundColor: COLORS.background, borderWidth: 1, borderColor: COLORS.border };
      case 'success':
        return { backgroundColor: COLORS.success };
      case 'danger':
        return { backgroundColor: COLORS.error };
      case 'primary':
      default:
        return { backgroundColor: COLORS.primary };
    }
  };

  const getIconSize = () => {
    switch (size) {
      case 'small':
        return 20;
      case 'medium':
        return 24;
      case 'large':
      default:
        return 28;
    }
  };

  return (
    <Animated.View
      style={[
        styles.container,
        getPositionStyle(),
        getSizeStyle(),
        getVariantStyle(),
        style,
        { transform: [{ scale: scaleAnim }] },
      ]}
    >
      <TouchableOpacity
        style={styles.button}
        onPress={handlePress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        activeOpacity={0.8}
      >
        <Ionicons 
          name={icon} 
          size={getIconSize()} 
          color={COLORS.white} 
        />
      </TouchableOpacity>
      
      {label && (
        <View style={styles.labelContainer}>
          <Text style={styles.labelText}>{label}</Text>
        </View>
      )}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
    zIndex: 1000,
  },
  button: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  labelContainer: {
    position: 'absolute',
    top: -40,
    left: -20,
    right: -20,
    alignItems: 'center',
  },
  labelText: {
    fontSize: FONT_SIZE.small,
    fontWeight: FONT_WEIGHT.medium,
    color: COLORS.text.primary,
    backgroundColor: COLORS.white,
    paddingHorizontal: SPACING.small,
    paddingVertical: SPACING.xs,
    borderRadius: BORDER_RADIUS.small,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
});
