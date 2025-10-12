
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ViewStyle,
  TextStyle,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import React from 'react';

import BaseModal from './BaseModal';
import { COLORS, SPACING, FONT_SIZE, FONT_WEIGHT, BORDER_RADIUS } from '../../theme/constants';

export type ConfirmationVariant = 'default' | 'danger' | 'warning' | 'info' | 'success';
export type ConfirmationSize = 'small' | 'medium' | 'large';

interface ConfirmationDialogProps {
  // Core props
  visible: boolean;
  onClose: () => void;
  onConfirm: () => void;
  onCancel?: () => void;

  // Content
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;

  // Configuration
  variant?: ConfirmationVariant;
  size?: ConfirmationSize;
  showCancel?: boolean;
  showCloseButton?: boolean;
  closeOnBackdrop?: boolean;

  // Styling
  containerStyle?: ViewStyle;
  titleStyle?: TextStyle;
  messageStyle?: TextStyle;
  confirmButtonStyle?: ViewStyle;
  cancelButtonStyle?: ViewStyle;
  confirmTextStyle?: TextStyle;
  cancelTextStyle?: TextStyle;

  // Customization
  confirmIcon?: keyof typeof Ionicons.glyphMap;
  cancelIcon?: keyof typeof Ionicons.glyphMap;
  customIcon?: React.ReactNode;

  // Accessibility
  accessibilityLabel?: string;
  accessibilityHint?: string;
}

export default function ConfirmationDialog({
  visible,
  onClose,
  onConfirm,
  onCancel,
  title,
  message,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  variant = 'default',
  size = 'medium',
  showCancel = true,
  showCloseButton = true,
  closeOnBackdrop = true,
  containerStyle,
  titleStyle,
  messageStyle,
  confirmButtonStyle,
  cancelButtonStyle,
  confirmTextStyle,
  cancelTextStyle,
  confirmIcon,
  cancelIcon,
  customIcon,
  accessibilityLabel,
  accessibilityHint,
}: ConfirmationDialogProps) {
  const handleCancel = () => {
    onCancel?.() || onClose();
  };

  const handleConfirm = () => {
    onConfirm();
    onClose();
  };

  const getVariantStyles = () => {
    switch (variant) {
      case 'danger':
        return {
          confirmButton: styles.confirmButtonDanger,
          confirmText: styles.confirmTextDanger,
          icon: 'warning-outline',
          iconColor: COLORS.error.main,
        };
      case 'warning':
        return {
          confirmButton: styles.confirmButtonWarning,
          confirmText: styles.confirmTextWarning,
          icon: 'warning-outline',
          iconColor: COLORS.warning.main,
        };
      case 'info':
        return {
          confirmButton: styles.confirmButtonInfo,
          confirmText: styles.confirmTextInfo,
          icon: 'information-circle-outline',
          iconColor: COLORS.info.main,
        };
      case 'success':
        return {
          confirmButton: styles.confirmButtonSuccess,
          confirmText: styles.confirmTextSuccess,
          icon: 'checkmark-circle-outline',
          iconColor: COLORS.success.main,
        };
      default:
        return {
          confirmButton: styles.confirmButtonDefault,
          confirmText: styles.confirmTextDefault,
          icon: 'help-circle-outline',
          iconColor: COLORS.primary.main,
        };
    }
  };

  const getSizeStyles = () => {
    switch (size) {
      case 'small':
        return {
          container: styles.containerSmall,
          title: styles.titleSmall,
          message: styles.messageSmall,
          button: styles.buttonSmall,
          buttonText: styles.buttonTextSmall,
        };
      case 'medium':
        return {
          container: styles.containerMedium,
          title: styles.titleMedium,
          message: styles.messageMedium,
          button: styles.buttonMedium,
          buttonText: styles.buttonTextMedium,
        };
      case 'large':
        return {
          container: styles.containerLarge,
          title: styles.titleLarge,
          message: styles.messageLarge,
          button: styles.buttonLarge,
          buttonText: styles.buttonTextLarge,
        };
      default:
        return {
          container: styles.containerMedium,
          title: styles.titleMedium,
          message: styles.messageMedium,
          button: styles.buttonMedium,
          buttonText: styles.buttonTextMedium,
        };
    }
  };

  const variantStyles = getVariantStyles();
  const sizeStyles = getSizeStyles();

  return (
    <BaseModal
      visible={visible}
      onClose={onClose}
      size="small"
      position="center"
      showCloseButton={showCloseButton}
      closeOnBackdrop={closeOnBackdrop}
      animationType="fade"
      accessibilityLabel={accessibilityLabel}
      accessibilityHint={accessibilityHint}
    >
      <View style={[styles.container, sizeStyles.container, containerStyle]}>
        {/* Icon */}
        {customIcon || (
          <View style={styles.iconContainer}>
            <Ionicons
              name={variantStyles.icon as keyof typeof Ionicons.glyphMap}
              size={32}
              color={variantStyles.iconColor}
            />
          </View>
        )}

        {/* Title */}
        <Text style={[styles.title, sizeStyles.title, titleStyle]}>
          {title}
        </Text>

        {/* Message */}
        <Text style={[styles.message, sizeStyles.message, messageStyle]}>
          {message}
        </Text>

        {/* Buttons */}
        <View style={styles.buttonsContainer}>
          {showCancel && (
            <TouchableOpacity
              style={[
                styles.cancelButton,
                sizeStyles.button,
                cancelButtonStyle,
              ]}
              onPress={handleCancel}
              accessibilityLabel={cancelText}
              accessibilityHint="Tap to cancel the action"
            >
              {cancelIcon && (
                <Ionicons
                  name={cancelIcon}
                  size={16}
                  color={COLORS.text.secondary}
                  style={styles.buttonIcon}
                />
              )}
              <Text style={[styles.cancelText, sizeStyles.buttonText, cancelTextStyle]}>
                {cancelText}
              </Text>
            </TouchableOpacity>
          )}

          <TouchableOpacity
            style={[
              styles.confirmButton,
              variantStyles.confirmButton,
              sizeStyles.button,
              confirmButtonStyle,
            ]}
            onPress={handleConfirm}
            accessibilityLabel={confirmText}
            accessibilityHint="Tap to confirm the action"
          >
            {confirmIcon && (
              <Ionicons
                name={confirmIcon}
                size={16}
                color={COLORS.background.primary}
                style={styles.buttonIcon}
              />
            )}
            <Text style={[
              styles.confirmText,
              variantStyles.confirmText,
              sizeStyles.buttonText,
              confirmTextStyle,
            ]}>
              {confirmText}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </BaseModal>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    padding: SPACING.lg,
  },
  containerSmall: {
    padding: SPACING.md,
  },
  containerMedium: {
    padding: SPACING.lg,
  },
  containerLarge: {
    padding: SPACING.xl,
  },
  iconContainer: {
    marginBottom: SPACING.md,
  },
  title: {
    fontSize: FONT_SIZE.lg,
    fontWeight: FONT_WEIGHT.semibold,
    color: COLORS.text.primary,
    textAlign: 'center',
    marginBottom: SPACING.sm,
  },
  titleSmall: {
    fontSize: FONT_SIZE.md,
  },
  titleMedium: {
    fontSize: FONT_SIZE.lg,
  },
  titleLarge: {
    fontSize: FONT_SIZE.xl,
  },
  message: {
    fontSize: FONT_SIZE.md,
    color: COLORS.text.secondary,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: SPACING.lg,
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
  buttonsContainer: {
    flexDirection: 'row',
    gap: SPACING.md,
    width: '100%',
  },
  cancelButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.background.secondary,
    borderRadius: BORDER_RADIUS.md,
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.lg,
    borderWidth: 1,
    borderColor: COLORS.border.primary,
  },
  confirmButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: BORDER_RADIUS.md,
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.lg,
  },
  confirmButtonDefault: {
    backgroundColor: COLORS.primary.main,
  },
  confirmButtonDanger: {
    backgroundColor: COLORS.error.main,
  },
  confirmButtonWarning: {
    backgroundColor: COLORS.warning.main,
  },
  confirmButtonInfo: {
    backgroundColor: COLORS.info.main,
  },
  confirmButtonSuccess: {
    backgroundColor: COLORS.success.main,
  },
  buttonSmall: {
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.md,
  },
  buttonMedium: {
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.lg,
  },
  buttonLarge: {
    paddingVertical: SPACING.lg,
    paddingHorizontal: SPACING.xl,
  },
  buttonIcon: {
    marginRight: SPACING.sm,
  },
  cancelText: {
    fontSize: FONT_SIZE.md,
    fontWeight: FONT_WEIGHT.medium,
    color: COLORS.text.secondary,
  },
  confirmText: {
    fontSize: FONT_SIZE.md,
    fontWeight: FONT_WEIGHT.medium,
    color: COLORS.background.primary,
  },
  confirmTextDefault: {
    color: COLORS.background.primary,
  },
  confirmTextDanger: {
    color: COLORS.background.primary,
  },
  confirmTextWarning: {
    color: COLORS.background.primary,
  },
  confirmTextInfo: {
    color: COLORS.background.primary,
  },
  confirmTextSuccess: {
    color: COLORS.background.primary,
  },
  buttonTextSmall: {
    fontSize: FONT_SIZE.sm,
  },
  buttonTextMedium: {
    fontSize: FONT_SIZE.md,
  },
  buttonTextLarge: {
    fontSize: FONT_SIZE.lg,
  },
});
