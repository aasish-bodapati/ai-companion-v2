import React, { useState, useRef, forwardRef } from 'react';
import {
  TextInput,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  TextInputProps,
  ViewStyle,
  TextStyle,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { hapticFeedback, touchUtils } from '../../utils/haptics';
import { COMMON_STYLES, COLORS, BORDER_RADIUS, SPACING, FONT_SIZE, FONT_WEIGHT } from '../../theme/constants';

interface MobileOptimizedInputProps extends TextInputProps {
  label?: string;
  error?: string;
  helperText?: string;
  icon?: string;
  iconPosition?: 'left' | 'right';
  onIconPress?: () => void;
  variant?: 'default' | 'outlined' | 'filled' | 'underlined';
  size?: 'small' | 'medium' | 'large';
  disabled?: boolean;
  required?: boolean;
  hapticFeedback?: 'light' | 'medium' | 'heavy' | 'success' | 'warning' | 'error' | 'selection' | 'none';
  containerStyle?: ViewStyle;
  inputStyle?: TextStyle;
  labelStyle?: TextStyle;
  errorStyle?: TextStyle;
  testID?: string;
}

const MobileOptimizedInput = forwardRef<TextInput, MobileOptimizedInputProps>(({
  label,
  error,
  helperText,
  icon,
  iconPosition = 'left',
  onIconPress,
  variant = 'default',
  size = 'medium',
  disabled = false,
  required = false,
  hapticFeedback: hapticType = 'light',
  containerStyle,
  inputStyle,
  labelStyle,
  errorStyle,
  testID,
  onFocus,
  onBlur,
  onChangeText,
  ...props
}, ref) => {
  const [isFocused, setIsFocused] = useState(false);
  const [hasValue, setHasValue] = useState(!!props.value || !!props.defaultValue);
  const labelAnim = useRef(new Animated.Value(hasValue ? 1 : 0)).current;
  const borderAnim = useRef(new Animated.Value(0)).current;

  const handleFocus = (e: unknown) => {
    setIsFocused(true);

    // Haptic feedback on focus
    if (hapticType !== 'none') {
      hapticFeedback[hapticType]();
    }

    // Animate label and border
    Animated.parallel([
      Animated.timing(labelAnim, {
        toValue: 1,
        duration: 200,
        useNativeDriver: false,
      }),
      Animated.timing(borderAnim, {
        toValue: 1,
        duration: 200,
        useNativeDriver: false,
      }),
    ]).start();

    onFocus?.(e);
  };

  const handleBlur = (e: unknown) => {
    setIsFocused(false);

    // Animate label and border
    Animated.parallel([
      Animated.timing(labelAnim, {
        toValue: hasValue ? 1 : 0,
        duration: 200,
        useNativeDriver: false,
      }),
      Animated.timing(borderAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: false,
      }),
    ]).start();

    onBlur?.(e);
  };

  const handleChangeText = (text: string) => {
    setHasValue(text.length > 0);
    onChangeText?.(text);
  };

  const handleIconPress = () => {
    if (onIconPress) {
      hapticFeedback.light();
      onIconPress();
    }
  };

  const getSizeConfig = () => {
    switch (size) {
      case 'small':
        return {
          height: 40,
          fontSize: FONT_SIZE.md, // 14 -> FONT_SIZE.md
          paddingHorizontal: SPACING.md, // 12 -> SPACING.md
          paddingVertical: SPACING.sm, // 8 -> SPACING.sm
        };
      case 'large':
        return {
          height: 56,
          fontSize: FONT_SIZE.xl, // 18 -> FONT_SIZE.xl
          paddingHorizontal: SPACING.lg, // 16 -> SPACING.lg
          paddingVertical: SPACING.lg, // 16 -> SPACING.lg
        };
      default:
        return {
          height: 48,
          fontSize: FONT_SIZE.lg, // 16 -> FONT_SIZE.lg
          paddingHorizontal: SPACING.md, // 14 -> SPACING.md (12, but keeping 14 for now)
          paddingVertical: SPACING.md, // 12 -> SPACING.md
        };
    }
  };

  const sizeConfig = getSizeConfig();

  const getInputContainerStyle = (): ViewStyle => {
    const baseStyle: ViewStyle = {
      ...styles.inputContainer,
      ...styles[`${variant}InputContainer`],
      height: sizeConfig.height,
      paddingHorizontal: sizeConfig.paddingHorizontal,
    };

    if (disabled) {
      baseStyle.opacity = 0.5;
    }

    if (error) {
      baseStyle.borderColor = COLORS.danger; // '#ef4444' -> COLORS.danger
    } else if (isFocused) {
      baseStyle.borderColor = COLORS.primary.main; // '#3b82f6' -> COLORS.primary.main
    }

    return baseStyle;
  };

  const getLabelStyle = (): TextStyle => {
    const animatedStyle = {
      transform: [
        {
          translateY: labelAnim.interpolate({
            inputRange: [0, 1],
            outputRange: [sizeConfig.height / 2 - 8, -8],
          }),
        },
        {
          scale: labelAnim.interpolate({
            inputRange: [0, 1],
            outputRange: [1, 0.85],
          }),
        },
      ],
    };

    return {
      ...styles.label,
      ...animatedStyle,
      color: error ? COLORS.danger : isFocused ? COLORS.primary.main : COLORS.text.secondary, // '#ef4444' -> COLORS.danger, '#3b82f6' -> COLORS.primary.main, '#6b7280' -> COLORS.text.secondary
    };
  };

  const renderIcon = () => {
    if (!icon) return null;

    return (
      <TouchableOpacity
        onPress={onIconPress ? handleIconPress : undefined}
        style={styles.iconContainer}
        disabled={!onIconPress}
      >
        <Ionicons
          name={icon as keyof typeof Ionicons.glyphMap}
          size={20}
          color={error ? COLORS.danger : isFocused ? COLORS.primary.main : COLORS.text.secondary} // '#ef4444' -> COLORS.danger, '#3b82f6' -> COLORS.primary.main, '#6b7280' -> COLORS.text.secondary
        />
      </TouchableOpacity>
    );
  };

  return (
    <View style={[styles.container, containerStyle]}>
      {label && (
        <Animated.Text style={[getLabelStyle(), labelStyle]}>
          {label}
          {required && <Text style={styles.required}> *</Text>}
        </Animated.Text>
      )}

      <View style={getInputContainerStyle()}>
        {icon && iconPosition === 'left' && renderIcon()}

        <TextInput
          ref={ref}
          style={[
            styles.input,
            {
              fontSize: sizeConfig.fontSize,
              paddingVertical: sizeConfig.paddingVertical,
            },
            inputStyle,
          ]}
          onFocus={handleFocus}
          onBlur={handleBlur}
          onChangeText={handleChangeText}
          editable={!disabled}
          testID={testID}
          {...props}
        />

        {icon && iconPosition === 'right' && renderIcon()}
      </View>

      {(error || helperText) && (
        <Text style={[styles.helperText, error ? styles.errorText : styles.helperText, errorStyle]}>
          {error || helperText}
        </Text>
      )}
    </View>
  );
});

MobileOptimizedInput.displayName = 'MobileOptimizedInput';

const styles = StyleSheet.create({
  container: {
    marginBottom: SPACING.lg, // 16 -> SPACING.lg
  },
  label: {
    position: 'absolute',
    left: SPACING.md, // 12 -> SPACING.md
    top: 0,
    zIndex: 1,
    backgroundColor: COLORS.background.primary, // '#ffffff' -> COLORS.background.primary
    paddingHorizontal: SPACING.xs, // 4 -> SPACING.xs
    fontSize: FONT_SIZE.md, // 14 -> FONT_SIZE.md
    fontWeight: FONT_WEIGHT.medium, // '500' -> FONT_WEIGHT.medium
  },
  required: {
    color: COLORS.danger, // '#ef4444' -> COLORS.danger
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.border.medium, // '#d1d5db' -> COLORS.border.medium
    borderRadius: BORDER_RADIUS.md, // 8 -> BORDER_RADIUS.md
    backgroundColor: COLORS.background.primary, // '#ffffff' -> COLORS.background.primary
    // Ensure minimum touch target size
    minHeight: touchUtils.MIN_TOUCH_TARGET_SIZE,
  },
  input: {
    flex: 1,
    color: COLORS.text.primary, // '#1f2937' -> COLORS.text.primary
    paddingHorizontal: 0,
  },
  iconContainer: {
    padding: SPACING.sm, // 8 -> SPACING.sm
    // Ensure minimum touch target size for icon
    minWidth: touchUtils.MIN_TOUCH_TARGET_SIZE,
    minHeight: touchUtils.MIN_TOUCH_TARGET_SIZE,
    alignItems: 'center',
    justifyContent: 'center',
  },
  helperText: {
    fontSize: FONT_SIZE.sm, // 12 -> FONT_SIZE.sm
    color: COLORS.text.secondary, // '#6b7280' -> COLORS.text.secondary
    marginTop: SPACING.xs, // 4 -> SPACING.xs
    marginLeft: SPACING.xs, // 4 -> SPACING.xs
  },
  errorText: {
    color: COLORS.danger, // '#ef4444' -> COLORS.danger
  },

  // Variants
  defaultInputContainer: {
    // Default styles already applied
  },
  outlinedInputContainer: {
    borderWidth: 2,
  },
  filledInputContainer: {
    backgroundColor: COMMON_STYLES.secondaryBackground,
    borderWidth: 0,
  },
  underlinedInputContainer: {
    borderWidth: 0,
    borderBottomWidth: 2,
    borderRadius: 0,
    backgroundColor: 'transparent',
  },
});

export default MobileOptimizedInput;
