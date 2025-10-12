import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import MobileOptimizedModal from './MobileOptimizedModal';
import { COLORS, SPACING, FONT_SIZE, MIXINS } from '../../theme/constants';
import { hapticFeedback } from '../../utils/haptics';

interface FormModalProps {
  visible: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  children: React.ReactNode;

  // Action buttons
  primaryAction?: {
    label: string;
    onPress: () => void | Promise<void>;
    disabled?: boolean;
    variant?: 'primary' | 'success' | 'warning' | 'danger';
  };
  secondaryAction?: {
    label: string;
    onPress: () => void;
    variant?: 'outline' | 'ghost';
  };

  // Modal configuration
  variant?: 'default' | 'bottomSheet' | 'fullScreen' | 'centered';
  size?: 'small' | 'medium' | 'large' | 'full';
  showCloseButton?: boolean;
  closeOnBackdrop?: boolean;

  // Form state
  loading?: boolean;
  isFormValid?: boolean;
  scrollEnabled?: boolean;

  // Custom styling
  contentStyle?: Record<string, unknown>;
  headerStyle?: Record<string, unknown>;
  footerStyle?: Record<string, unknown>;

  testID?: string;
}

export default function FormModal({
  visible,
  onClose,
  title,
  subtitle,
  children,
  primaryAction,
  secondaryAction,
  variant = 'bottomSheet',
  size = 'large',
  showCloseButton = true,
  closeOnBackdrop = true,
  loading = false,
  isFormValid = true,
  scrollEnabled = true,
  contentStyle,
  headerStyle,
  footerStyle,
  testID,
}: FormModalProps) {
  const [actionLoading, setActionLoading] = useState(false);

  const handlePrimaryAction = async () => {
    if (!primaryAction || actionLoading || loading) return;

    try {
      setActionLoading(true);
      hapticFeedback.light();

      const result = primaryAction.onPress();
      if (result instanceof Promise) {
        await result;
      }
    } catch {
      // Silent error handling - no console logging to prevent Expo Go notifications
      hapticFeedback.error();
    } finally {
      setActionLoading(false);
    }
  };

  const handleSecondaryAction = () => {
    if (!secondaryAction || actionLoading || loading) return;

    hapticFeedback.light();
    secondaryAction.onPress();
  };

  const isPrimaryDisabled = () => {
    return (
      !primaryAction ||
      primaryAction.disabled ||
      !isFormValid ||
      actionLoading ||
      loading
    );
  };

  const getPrimaryButtonStyle = () => {
    const variant = primaryAction?.variant || 'primary';
    const disabled = isPrimaryDisabled();

    let backgroundColor = COLORS.primary.main;
    let textColor = COLORS.text.inverse;

    switch (variant) {
      case 'success':
        backgroundColor = COLORS.success;
        break;
      case 'warning':
        backgroundColor = COLORS.warning;
        break;
      case 'danger':
        backgroundColor = COLORS.danger;
        break;
      default:
        backgroundColor = COLORS.primary.main;
    }

    return {
      button: [
        styles.primaryButton,
        { backgroundColor },
        disabled && styles.disabledButton,
      ],
      text: [
        styles.primaryButtonText,
        { color: textColor },
        disabled && styles.disabledButtonText,
      ],
    };
  };

  const getSecondaryButtonStyle = () => {
    const variant = secondaryAction?.variant || 'outline';

    if (variant === 'ghost') {
      return {
        button: styles.ghostButton,
        text: styles.ghostButtonText,
      };
    }

    return {
      button: styles.secondaryButton,
      text: styles.secondaryButtonText,
    };
  };

  const renderFooter = () => {
    if (!primaryAction && !secondaryAction) return null;

    return (
      <View style={[styles.footer, footerStyle]}>
        <View style={styles.actionButtons}>
          {secondaryAction && (
            <TouchableOpacity
              style={[styles.actionButton, getSecondaryButtonStyle().button]}
              onPress={handleSecondaryAction}
              disabled={actionLoading || loading}
            >
              <Text style={getSecondaryButtonStyle().text}>
                {secondaryAction.label}
              </Text>
            </TouchableOpacity>
          )}

          {primaryAction && (
            <TouchableOpacity
              style={[styles.actionButton, getPrimaryButtonStyle().button]}
              onPress={handlePrimaryAction}
              disabled={isPrimaryDisabled()}
            >
              {actionLoading ? (
                <ActivityIndicator
                  size="small"
                  color={COLORS.text.inverse}
                  style={styles.buttonLoader}
                />
              ) : null}
              <Text style={getPrimaryButtonStyle().text}>
                {actionLoading ? 'Processing...' : primaryAction.label}
              </Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    );
  };

  return (
    <MobileOptimizedModal
      visible={visible}
      onClose={onClose}
      title={title}
      subtitle={subtitle}
      variant={variant}
      size={size}
      showCloseButton={showCloseButton}
      closeOnBackdrop={closeOnBackdrop && !actionLoading}
      hapticFeedback={true}
      testID={testID}
    >
      <View style={styles.container}>
        <ScrollView
          style={[styles.scrollView, contentStyle]}
          showsVerticalScrollIndicator={true}
          keyboardShouldPersistTaps="handled"
          scrollEnabled={scrollEnabled}
          bounces={true}
          nestedScrollEnabled={true}
          contentContainerStyle={styles.scrollContentContainer}
          keyboardDismissMode="interactive"
          alwaysBounceVertical={true}
          scrollEventThrottle={16}
          automaticallyAdjustKeyboardInsets={false}
          decelerationRate="normal"
        >
          {children}
        </ScrollView>
        {renderFooter()}
      </View>
    </MobileOptimizedModal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    maxHeight: '100%',
  },
  scrollView: {
    flex: 1,
  },
  scrollContentContainer: {
    paddingHorizontal: SPACING.lg,
    paddingBottom: '50%', // 50% empty space below content for scrolling
  },
  footer: {
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    borderTopWidth: 1,
    borderTopColor: COLORS.border.light,
    backgroundColor: COLORS.background.primary,
    minHeight: 80, // Ensure footer has minimum height for better scrolling
    marginTop: SPACING.lg,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: SPACING.md,
  },
  actionButton: {
    flex: 1,
    ...MIXINS.buttonBase,
    minHeight: 48,
  },

  // Primary button styles
  primaryButton: {
    backgroundColor: COLORS.primary.main,
  },
  primaryButtonText: {
    color: COLORS.text.inverse,
    fontWeight: '600',
    fontSize: FONT_SIZE.lg,
  },

  // Secondary button styles
  secondaryButton: {
    backgroundColor: COLORS.background.primary,
    borderWidth: 1,
    borderColor: COLORS.border.medium,
  },
  secondaryButtonText: {
    color: COLORS.text.primary,
    fontWeight: '500',
    fontSize: FONT_SIZE.lg,
  },

  // Ghost button styles
  ghostButton: {
    backgroundColor: 'transparent',
    borderWidth: 0,
  },
  ghostButtonText: {
    color: COLORS.text.secondary,
    fontWeight: '500',
    fontSize: FONT_SIZE.lg,
  },

  // Disabled states
  disabledButton: {
    opacity: 0.5,
  },
  disabledButtonText: {
    color: COLORS.text.tertiary,
  },

  buttonLoader: {
    marginRight: SPACING.sm,
  },
});
