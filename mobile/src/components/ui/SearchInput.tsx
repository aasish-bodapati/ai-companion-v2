import React, { useState, useCallback, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  ViewStyle,
  TextStyle,
  KeyboardTypeOptions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SPACING, FONT_SIZE, BORDER_RADIUS, SHADOWS } from '../../theme/constants';

export type SearchInputSize = 'small' | 'medium' | 'large';
export type SearchInputVariant = 'default' | 'minimal' | 'filled' | 'outlined';
export type SearchInputState = 'default' | 'focused' | 'error' | 'success';

interface SearchInputProps {
  // Core props
  value: string;
  onChangeText: (text: string) => void;
  onSearch?: (query: string) => void;
  onClear?: () => void;
  onFocus?: () => void;
  onBlur?: () => void;

  // Configuration
  placeholder?: string;
  size?: SearchInputSize;
  variant?: SearchInputVariant;
  state?: SearchInputState;
  disabled?: boolean;
  autoFocus?: boolean;
  clearable?: boolean;
  searchable?: boolean;

  // Styling
  containerStyle?: ViewStyle;
  inputStyle?: TextStyle;
  placeholderTextColor?: string;
  iconColor?: string;

  // Customization
  leftIcon?: keyof typeof Ionicons.glyphMap;
  rightIcon?: keyof typeof Ionicons.glyphMap;
  customLeftIcon?: React.ReactNode;
  customRightIcon?: React.ReactNode;

  // Behavior
  debounceMs?: number;
  minLength?: number;
  maxLength?: number;
  keyboardType?: KeyboardTypeOptions;
  returnKeyType?: 'search' | 'done' | 'go' | 'next';

  // Accessibility
  accessibilityLabel?: string;
  accessibilityHint?: string;
  testID?: string;
}

export default function SearchInput({
  value,
  onChangeText,
  onSearch,
  onClear,
  onFocus,
  onBlur,
  placeholder = 'Search...',
  size = 'medium',
  variant = 'default',
  state = 'default',
  disabled = false,
  autoFocus = false,
  clearable = true,
  searchable = true,
  containerStyle,
  inputStyle,
  placeholderTextColor = COLORS.text.placeholder,
  iconColor = COLORS.text.secondary,
  leftIcon = 'search-outline',
  rightIcon,
  customLeftIcon,
  customRightIcon,
  debounceMs = 300,
  minLength = 0,
  maxLength,
  keyboardType = 'default',
  returnKeyType = 'search',
  accessibilityLabel,
  accessibilityHint,
  testID,
}: SearchInputProps) {
  const [isFocused, setIsFocused] = useState(false);
  const [internalValue, setInternalValue] = useState(value);
  const debounceRef = useRef<NodeJS.Timeout | null>(null);
  const inputRef = useRef<TextInput>(null);

  // Sync internal value with external value
  useEffect(() => {
    setInternalValue(value);
  }, [value]);

  // Debounced search
  useEffect(() => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    if (onSearch && internalValue.length >= minLength) {
      debounceRef.current = setTimeout(() => {
        onSearch(internalValue);
      }, debounceMs);
    }

    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, [internalValue, onSearch, debounceMs, minLength]);

  const handleTextChange = useCallback((text: string) => {
    setInternalValue(text);
    onChangeText(text);
  }, [onChangeText]);

  const handleFocus = useCallback(() => {
    setIsFocused(true);
    onFocus?.();
  }, [onFocus]);

  const handleBlur = useCallback(() => {
    setIsFocused(false);
    onBlur?.();
  }, [onBlur]);

  const handleClear = useCallback(() => {
    setInternalValue('');
    onChangeText('');
    onClear?.();
    inputRef.current?.focus();
  }, [onChangeText, onClear]);

  const handleSearch = useCallback(() => {
    if (onSearch && internalValue.length >= minLength) {
      onSearch(internalValue);
    }
  }, [onSearch, internalValue, minLength]);

  const getContainerStyles = (): ViewStyle[] => {
    const baseStyles = [styles.container];

    // Size-based styles
    switch (size) {
      case 'small':
        baseStyles.push(styles.containerSmall);
        break;
      case 'medium':
        baseStyles.push(styles.containerMedium);
        break;
      case 'large':
        baseStyles.push(styles.containerLarge);
        break;
    }

    // Variant-based styles
    switch (variant) {
      case 'minimal':
        baseStyles.push(styles.containerMinimal);
        break;
      case 'filled':
        baseStyles.push(styles.containerFilled);
        break;
      case 'outlined':
        baseStyles.push(styles.containerOutlined);
        break;
      default:
        baseStyles.push(styles.containerDefault);
        break;
    }

    // State-based styles
    switch (state) {
      case 'focused':
        baseStyles.push(styles.containerFocused);
        break;
      case 'error':
        baseStyles.push(styles.containerError);
        break;
      case 'success':
        baseStyles.push(styles.containerSuccess);
        break;
    }

    // Focus state
    if (isFocused) {
      baseStyles.push(styles.containerFocused);
    }

    // Disabled state
    if (disabled) {
      baseStyles.push(styles.containerDisabled);
    }

    if (containerStyle) baseStyles.push(containerStyle);

    return baseStyles;
  };

  const getInputStyles = (): TextStyle[] => {
    const baseStyles = [styles.input];

    // Size-based input styles
    switch (size) {
      case 'small':
        baseStyles.push(styles.inputSmall);
        break;
      case 'medium':
        baseStyles.push(styles.inputMedium);
        break;
      case 'large':
        baseStyles.push(styles.inputLarge);
        break;
    }

    // State-based styles
    switch (state) {
      case 'error':
        baseStyles.push(styles.inputError);
        break;
      case 'success':
        baseStyles.push(styles.inputSuccess);
        break;
    }

    if (inputStyle) baseStyles.push(inputStyle);

    return baseStyles;
  };

  const showClearButton = clearable && internalValue.length > 0 && !disabled;
  const showSearchButton = searchable && internalValue.length >= minLength && !disabled;

  return (
    <View style={getContainerStyles()} testID={testID}>
      {/* Left Icon */}
      {(leftIcon || customLeftIcon) && (
        <View style={styles.leftIconContainer}>
          {customLeftIcon || (
            <Ionicons
              name={leftIcon}
              size={getIconSize()}
              color={getIconColor()}
            />
          )}
        </View>
      )}

      {/* Input */}
      <TextInput
        ref={inputRef}
        style={getInputStyles()}
        value={internalValue}
        onChangeText={handleTextChange}
        onFocus={handleFocus}
        onBlur={handleBlur}
        onSubmitEditing={handleSearch}
        placeholder={placeholder}
        placeholderTextColor={placeholderTextColor}
        keyboardType={keyboardType}
        returnKeyType={returnKeyType}
        editable={!disabled}
        autoFocus={autoFocus}
        maxLength={maxLength}
        accessibilityLabel={accessibilityLabel || placeholder}
        accessibilityHint={accessibilityHint}
        testID={`${testID}-input`}
      />

      {/* Right Icons */}
      <View style={styles.rightIconsContainer}>
        {/* Clear Button */}
        {showClearButton && (
          <TouchableOpacity
            style={styles.iconButton}
            onPress={handleClear}
            accessibilityLabel="Clear search"
            accessibilityHint="Tap to clear the search text"
            testID={`${testID}-clear`}
          >
            <Ionicons
              name="close-circle"
              size={getIconSize()}
              color={iconColor}
            />
          </TouchableOpacity>
        )}

        {/* Search Button */}
        {showSearchButton && (
          <TouchableOpacity
            style={styles.iconButton}
            onPress={handleSearch}
            accessibilityLabel="Search"
            accessibilityHint="Tap to search"
            testID={`${testID}-search`}
          >
            <Ionicons
              name="search"
              size={getIconSize()}
              color={COLORS.primary.main}
            />
          </TouchableOpacity>
        )}

        {/* Custom Right Icon */}
        {rightIcon && !showClearButton && !showSearchButton && (
          <View style={styles.iconButton}>
            <Ionicons
              name={rightIcon}
              size={getIconSize()}
              color={iconColor}
            />
          </View>
        )}

        {/* Custom Right Icon Component */}
        {customRightIcon && !showClearButton && !showSearchButton && (
          <View style={styles.iconButton}>
            {customRightIcon}
          </View>
        )}
      </View>
    </View>
  );

  function getIconSize(): number {
    switch (size) {
      case 'small': return 16;
      case 'medium': return 20;
      case 'large': return 24;
      default: return 20;
    }
  }

  function getIconColor(): string {
    if (disabled) return COLORS.text.disabled;
    if (state === 'error') return COLORS.error.main;
    if (state === 'success') return COLORS.success.main;
    if (isFocused) return COLORS.primary.main;
    return iconColor;
  }
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.background.primary,
    borderRadius: BORDER_RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.border.primary,
  },
  containerDefault: {
    backgroundColor: COLORS.background.primary,
    borderColor: COLORS.border.primary,
  },
  containerMinimal: {
    backgroundColor: 'transparent',
    borderWidth: 0,
    borderBottomWidth: 1,
    borderRadius: 0,
  },
  containerFilled: {
    backgroundColor: COLORS.background.secondary,
    borderColor: COLORS.border.light,
  },
  containerOutlined: {
    backgroundColor: 'transparent',
    borderColor: COLORS.border.primary,
  },
  containerSmall: {
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
    minHeight: 36,
  },
  containerMedium: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    minHeight: 44,
  },
  containerLarge: {
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    minHeight: 52,
  },
  containerFocused: {
    borderColor: COLORS.primary.main,
    ...SHADOWS.small,
  },
  containerError: {
    borderColor: COLORS.error.main,
  },
  containerSuccess: {
    borderColor: COLORS.success.main,
  },
  containerDisabled: {
    backgroundColor: COLORS.background.disabled,
    borderColor: COLORS.border.disabled,
  },
  leftIconContainer: {
    marginRight: SPACING.sm,
  },
  input: {
    flex: 1,
    fontSize: FONT_SIZE.md,
    color: COLORS.text.primary,
    padding: 0,
  },
  inputSmall: {
    fontSize: FONT_SIZE.sm,
  },
  inputMedium: {
    fontSize: FONT_SIZE.md,
  },
  inputLarge: {
    fontSize: FONT_SIZE.lg,
  },
  inputError: {
    color: COLORS.error.main,
  },
  inputSuccess: {
    color: COLORS.success.main,
  },
  rightIconsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: SPACING.sm,
  },
  iconButton: {
    padding: SPACING.xs,
    marginLeft: SPACING.xs,
  },
});