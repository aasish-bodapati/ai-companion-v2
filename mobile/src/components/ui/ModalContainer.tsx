import React from 'react';
import { Modal, View, Text, TouchableOpacity, StyleSheet, ViewStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COMMON_STYLES, COLORS, SPACING, FONT_SIZE } from '../../theme/constants';

interface ModalContainerProps {
  visible: boolean;
  onClose: () => void;
  title?: string;
  subtitle?: string;
  children: React.ReactNode;
  variant?: 'default' | 'fullScreen' | 'bottomSheet' | 'centered';
  size?: 'small' | 'medium' | 'large' | 'full';
  showCloseButton?: boolean;
  closeOnBackdrop?: boolean;
  style?: ViewStyle;
  headerStyle?: ViewStyle;
  contentStyle?: ViewStyle;
  animationType?: 'slide' | 'fade' | 'none';
  testID?: string;
}

/**
 * Generic modal container component that handles common modal patterns
 * Provides consistent styling and behavior across different modal types
 */
export const ModalContainer: React.FC<ModalContainerProps> = ({
  visible,
  onClose,
  title,
  subtitle,
  children,
  variant = 'default',
  size = 'medium',
  showCloseButton = true,
  closeOnBackdrop = true,
  style,
  headerStyle,
  contentStyle,
  animationType = 'slide',
  testID,
}) => {
  const getModalStyles = () => {
    const baseOverlay = COMMON_STYLES.modalOverlayCenter;
    const baseContent = COMMON_STYLES.modalContentCenter;

    switch (variant) {
      case 'fullScreen':
        return {
          overlay: {
            ...baseOverlay,
            backgroundColor: COLORS.background.primary,
          },
          content: {
            ...baseContent,
            width: '100%',
            height: '100%',
            borderRadius: 0,
            padding: 0,
            margin: 0,
          },
        };
      case 'bottomSheet':
        return {
          overlay: {
            ...baseOverlay,
            justifyContent: 'flex-end',
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
          },
          content: {
            ...baseContent,
            width: '100%',
            borderBottomLeftRadius: 0,
            borderBottomRightRadius: 0,
            margin: 0,
          },
        };
      case 'centered':
        return {
          overlay: baseOverlay,
          content: {
            ...baseContent,
            width: getSizeWidth(),
            maxHeight: '80%',
          },
        };
      case 'default':
      default:
        return {
          overlay: baseOverlay,
          content: {
            ...baseContent,
            width: getSizeWidth(),
          },
        };
    }
  };

  const getSizeWidth = () => {
    switch (size) {
      case 'small':
        return '70%';
      case 'medium':
        return '85%';
      case 'large':
        return '95%';
      case 'full':
        return '100%';
      default:
        return '85%';
    }
  };

  const { overlay, content } = getModalStyles();

  const handleBackdropPress = () => {
    if (closeOnBackdrop) {
      onClose();
    }
  };

  return (
    <Modal
      visible={visible}
      animationType={animationType}
      transparent
      onRequestClose={onClose}
      testID={testID}
    >
      <View style={[overlay, style] as any}>
        <TouchableOpacity
          style={styles.backdrop}
          activeOpacity={1}
          onPress={handleBackdropPress}
        />
        <View style={[content, contentStyle] as any}>
          {(title || subtitle || showCloseButton) && (
            <View style={[styles.header, headerStyle]}>
              <View style={styles.headerContent}>
                {title && <Text style={styles.title}>{title}</Text>}
                {subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
              </View>
              {showCloseButton && (
                <TouchableOpacity
                  onPress={onClose}
                  style={styles.closeButton}
                  testID={`${testID}-close-button`}
                >
                  <Ionicons name="close" size={24} color={COLORS.text.secondary} />
                </TouchableOpacity>
              )}
            </View>
          )}
          <View style={styles.body}>
            {children}
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    padding: SPACING.lg,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border.light,
  },
  headerContent: {
    flex: 1,
    marginRight: SPACING.md,
  },
  title: {
    fontSize: FONT_SIZE.xl,
    fontWeight: 'bold',
    color: COLORS.text.primary,
    marginBottom: SPACING.xs,
  },
  subtitle: {
    fontSize: FONT_SIZE.md,
    color: COLORS.text.secondary,
    lineHeight: 20,
  },
  closeButton: {
    padding: SPACING.xs,
    borderRadius: COMMON_STYLES.smallRadius,
  },
  body: {
    flex: 1,
    padding: SPACING.lg,
  },
});

export default ModalContainer;
