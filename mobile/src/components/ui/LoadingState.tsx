import React from 'react';
import {
  View,
  Text,
  ActivityIndicator,
  StyleSheet,
  ViewStyle,
  TextStyle,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SPACING, FONT_SIZE, FONT_WEIGHT, BORDER_RADIUS } from '../../theme/constants';

export type LoadingSize = 'small' | 'medium' | 'large';
export type LoadingVariant = 'default' | 'overlay' | 'inline' | 'button';

interface LoadingStateProps {
  // Core props
  loading: boolean;
  message?: string;
  
  // Configuration
  size?: LoadingSize;
  variant?: LoadingVariant;
  showSpinner?: boolean;
  showMessage?: boolean;
  
  // Styling
  containerStyle?: ViewStyle;
  messageStyle?: TextStyle;
  spinnerColor?: string;
  
  // Customization
  customSpinner?: React.ReactNode;
  customMessage?: React.ReactNode;
  
  // Accessibility
  accessibilityLabel?: string;
  accessibilityHint?: string;
}

export default function LoadingState({
  loading,
  message = 'Loading...',
  size = 'medium',
  variant = 'default',
  showSpinner = true,
  showMessage = true,
  containerStyle,
  messageStyle,
  spinnerColor = COLORS.primary.main,
  customSpinner,
  customMessage,
  accessibilityLabel,
  accessibilityHint,
}: LoadingStateProps) {
  if (!loading) return null;

  const getSpinnerSize = () => {
    switch (size) {
      case 'small':
        return 'small';
      case 'medium':
        return 'large';
      case 'large':
        return 'large';
      default:
        return 'large';
    }
  };

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
      case 'overlay':
        baseStyles.push(styles.containerOverlay);
        break;
      case 'inline':
        baseStyles.push(styles.containerInline);
        break;
      case 'button':
        baseStyles.push(styles.containerButton);
        break;
      default:
        baseStyles.push(styles.containerDefault);
        break;
    }
    
    if (containerStyle) baseStyles.push(containerStyle);
    
    return baseStyles;
  };

  const getMessageStyles = (): TextStyle[] => {
    const baseStyles = [styles.message];
    
    // Size-based message styles
    switch (size) {
      case 'small':
        baseStyles.push(styles.messageSmall);
        break;
      case 'medium':
        baseStyles.push(styles.messageMedium);
        break;
      case 'large':
        baseStyles.push(styles.messageLarge);
        break;
    }
    
    if (messageStyle) baseStyles.push(messageStyle);
    
    return baseStyles;
  };

  return (
    <View
      style={getContainerStyles()}
      accessibilityLabel={accessibilityLabel || 'Loading'}
      accessibilityHint={accessibilityHint || 'Content is being loaded'}
    >
      {showSpinner && (
        <View style={styles.spinnerContainer}>
          {customSpinner || (
            <ActivityIndicator
              size={getSpinnerSize()}
              color={spinnerColor}
            />
          )}
        </View>
      )}
      
      {showMessage && message && (
        <View style={styles.messageContainer}>
          {customMessage || (
            <Text style={getMessageStyles()}>
              {message}
            </Text>
          )}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  containerDefault: {
    padding: SPACING.lg,
  },
  containerOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    zIndex: 1000,
  },
  containerInline: {
    padding: SPACING.sm,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  containerButton: {
    padding: SPACING.sm,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.primary.light,
    borderRadius: BORDER_RADIUS.sm,
    minHeight: 40,
  },
  containerSmall: {
    padding: SPACING.sm,
  },
  containerMedium: {
    padding: SPACING.lg,
  },
  containerLarge: {
    padding: SPACING.xl,
  },
  spinnerContainer: {
    marginBottom: SPACING.sm,
  },
  messageContainer: {
    alignItems: 'center',
  },
  message: {
    fontSize: FONT_SIZE.md,
    color: COLORS.text.secondary,
    textAlign: 'center',
  },
  messageSmall: {
    fontSize: FONT_SIZE.sm,
  },
  messageMedium: {
    fontSize: FONT_SIZE.md,
  },
  messageLarge: {
    fontSize: FONT_SIZE.lg,
  },
});
