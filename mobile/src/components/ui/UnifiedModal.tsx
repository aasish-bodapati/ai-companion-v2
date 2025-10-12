import React, { useEffect, useRef } from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Animated,
} from 'react-native';
import { PanGestureHandler, State } from 'react-native-gesture-handler';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SPACING, BORDER_RADIUS, SHADOWS } from '../../theme/constants';
import { STYLE_PRESETS } from '../../theme/duplicateStyles';

export type ModalSize = 'small' | 'medium' | 'large' | 'fullscreen';
export type ModalPosition = 'center' | 'bottom' | 'top';
export type ModalVariant = 'default' | 'simple' | 'bottomSheet';

interface UnifiedModalProps {
  // Core props
  visible: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;

  // Modal configuration
  size?: ModalSize;
  position?: ModalPosition;
  variant?: ModalVariant;
  showCloseButton?: boolean;
  closeOnBackdrop?: boolean;
  closeOnSwipe?: boolean;

  // Content configuration
  scrollable?: boolean;
  keyboardAvoiding?: boolean;
  showHeader?: boolean;

  // Styling
  containerStyle?: any;
  contentStyle?: any;
  headerStyle?: any;
  titleStyle?: any;

  // Animation
  animationType?: 'fade' | 'slide' | 'none';
  animationDuration?: number;

  // Callbacks
  onShow?: () => void;
  onHide?: () => void;
  onBackdropPress?: () => void;

  // Accessibility
  accessibilityLabel?: string;
  accessibilityHint?: string;
}

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

export default function UnifiedModal({
  visible,
  onClose,
  title,
  children,
  size = 'medium',
  position = 'center',
  variant = 'default',
  showCloseButton = true,
  closeOnBackdrop = true,
  closeOnSwipe = false,
  scrollable = false,
  keyboardAvoiding = true,
  showHeader = true,
  containerStyle,
  contentStyle,
  headerStyle,
  titleStyle,
  animationType = 'fade',
  animationDuration = 300,
  onShow,
  onHide,
  onBackdropPress,
  accessibilityLabel,
  accessibilityHint,
}: UnifiedModalProps) {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(screenHeight)).current;
  const scaleAnim = useRef(new Animated.Value(0.8)).current;

  // Handle modal show/hide animations
  useEffect(() => {
    if (visible) {
      onShow?.();
      showModal();
    } else {
      hideModal();
    }
  }, [visible]);

  const showModal = () => {
    const animations = [];

    if (animationType === 'fade' || animationType === 'slide') {
      animations.push(
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: animationDuration,
          useNativeDriver: true,
        })
      );
    }

    if (animationType === 'slide') {
      animations.push(
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: animationDuration,
          useNativeDriver: true,
        })
      );
    }

    if (animationType === 'fade') {
      animations.push(
        Animated.timing(scaleAnim, {
          toValue: 1,
          duration: animationDuration,
          useNativeDriver: true,
        })
      );
    }

    Animated.parallel(animations).start();
  };

  const hideModal = () => {
    const animations = [];

    if (animationType === 'fade' || animationType === 'slide') {
      animations.push(
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: animationDuration,
          useNativeDriver: true,
        })
      );
    }

    if (animationType === 'slide') {
      animations.push(
        Animated.timing(slideAnim, {
          toValue: screenHeight,
          duration: animationDuration,
          useNativeDriver: true,
        })
      );
    }

    if (animationType === 'fade') {
      animations.push(
        Animated.timing(scaleAnim, {
          toValue: 0.8,
          duration: animationDuration,
          useNativeDriver: true,
        })
      );
    }

    Animated.parallel(animations).start(() => {
      onHide?.();
    });
  };

  const handleBackdropPress = () => {
    if (closeOnBackdrop) {
      onBackdropPress?.() || onClose();
    }
  };

  // Get modal dimensions based on size and variant
  const getModalDimensions = () => {
    if (variant === 'simple') {
      // Simple variant uses smaller, fixed dimensions
      switch (size) {
        case 'small': return { width: screenWidth * 0.8, maxHeight: screenHeight * 0.4 };
        case 'medium': return { width: screenWidth * 0.9, maxHeight: screenHeight * 0.6 };
        case 'large': return { width: screenWidth * 0.95, maxHeight: screenHeight * 0.8 };
        default: return { width: screenWidth * 0.9, maxHeight: screenHeight * 0.6 };
      }
    }

    if (variant === 'bottomSheet') {
      return { width: screenWidth, maxHeight: screenHeight * 0.9 };
    }

    // Default variant
    switch (size) {
      case 'small': return { width: screenWidth * 0.8, maxHeight: screenHeight * 0.5 };
      case 'medium': return { width: screenWidth * 0.9, maxHeight: screenHeight * 0.7 };
      case 'large': return { width: screenWidth * 0.95, maxHeight: screenHeight * 0.85 };
      case 'fullscreen': return { width: screenWidth, height: screenHeight };
      default: return { width: screenWidth * 0.9, maxHeight: screenHeight * 0.7 };
    }
  };

  // Get modal position styles
  const getPositionStyles = () => {
    if (variant === 'bottomSheet') {
      return {
        justifyContent: 'flex-end',
        alignItems: 'center',
      };
    }

    switch (position) {
      case 'bottom':
        return {
          justifyContent: 'flex-end',
          alignItems: 'center',
        };
      case 'top':
        return {
          justifyContent: 'flex-start',
          alignItems: 'center',
        };
      case 'center':
      default:
        return {
          justifyContent: 'center',
          alignItems: 'center',
        };
    }
  };

  const modalDimensions = getModalDimensions();
  const positionStyles = getPositionStyles();

  // Render modal content
  const renderContent = () => {
    return (
      <View style={[
        styles.modalContent,
        modalDimensions,
        contentStyle,
        variant === 'bottomSheet' && styles.bottomSheetContent,
        variant === 'simple' && styles.simpleContent,
      ]}>
        {/* Header */}
        {showHeader && (title || showCloseButton) && (
          <View style={[styles.header, headerStyle]}>
            {title && (
              <Text style={[styles.title, titleStyle]} numberOfLines={1}>
                {title}
              </Text>
            )}
            {showCloseButton && (
              <TouchableOpacity
                onPress={onClose}
                style={styles.closeButton}
                accessibilityLabel="Close modal"
                accessibilityHint="Tap to close this modal"
              >
                <Ionicons name="close" size={24} color={COLORS.text.primary} />
              </TouchableOpacity>
            )}
          </View>
        )}

        {/* Body */}
        {scrollable ? (
          <ScrollView
            style={styles.scrollView}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            {children}
          </ScrollView>
        ) : (
          <View style={styles.body}>
            {children}
          </View>
        )}
      </View>
    );
  };

  // Render with or without gesture handler based on variant
  const renderModalContent = () => {
    if (variant === 'simple' || !closeOnSwipe) {
      // Simple variant or no swipe - render without gesture handler
      return (
        <Animated.View
          style={[
            styles.modalContainer,
            {
              opacity: fadeAnim,
              transform: [
                { translateY: slideAnim },
                { scale: scaleAnim },
              ],
            },
          ]}
        >
          {keyboardAvoiding ? (
            <KeyboardAvoidingView
              behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
              style={styles.keyboardAvoidingView}
            >
              {renderContent()}
            </KeyboardAvoidingView>
          ) : (
            renderContent()
          )}
        </Animated.View>
      );
    }

    // Default variant with gesture support
    return (
      <PanGestureHandler
        onHandlerStateChange={(event) => {
          if (event.nativeEvent.state === State.END) {
            const { translationY, velocityY } = event.nativeEvent;
            if (translationY > 100 || velocityY > 500) {
              onClose();
            }
          }
        }}
      >
        <Animated.View
          style={[
            styles.modalContainer,
            {
              opacity: fadeAnim,
              transform: [
                { translateY: slideAnim },
                { scale: scaleAnim },
              ],
            },
          ]}
        >
          {keyboardAvoiding ? (
            <KeyboardAvoidingView
              behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
              style={styles.keyboardAvoidingView}
            >
              {renderContent()}
            </KeyboardAvoidingView>
          ) : (
            renderContent()
          )}
        </Animated.View>
      </PanGestureHandler>
    );
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={onClose}
      statusBarTranslucent
      accessibilityLabel={accessibilityLabel}
      accessibilityHint={accessibilityHint}
    >
      <TouchableOpacity
        style={[styles.backdrop, positionStyles]}
        activeOpacity={1}
        onPress={handleBackdropPress}
      >
        {renderModalContent()}
      </TouchableOpacity>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: COLORS.overlay,
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  keyboardAvoidingView: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: COLORS.background.primary,
    borderRadius: BORDER_RADIUS.lg,
    ...SHADOWS.large,
  },
  bottomSheetContent: {
    borderTopLeftRadius: BORDER_RADIUS.xxl,
    borderTopRightRadius: BORDER_RADIUS.xxl,
    borderBottomLeftRadius: 0,
    borderBottomRightRadius: 0,
  },
  simpleContent: {
    borderRadius: BORDER_RADIUS.md,
    ...SHADOWS.medium,
  },
  header: {
    ...STYLE_PRESETS.rowSpaceBetween,
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border.light,
  },
  title: {
    ...STYLE_PRESETS.textHeading,
    flex: 1,
    marginRight: SPACING.md,
  },
  closeButton: {
    padding: SPACING.xs,
    borderRadius: BORDER_RADIUS.sm,
  },
  body: {
    padding: SPACING.lg,
  },
  scrollView: {
    maxHeight: 400,
  },
  scrollContent: {
    padding: SPACING.lg,
  },
});

// Export presets for common modal configurations
export const modalPresets = {
  simple: {
    variant: 'simple' as const,
    size: 'medium' as const,
    showCloseButton: true,
    closeOnBackdrop: true,
    closeOnSwipe: false,
  },
  bottomSheet: {
    variant: 'bottomSheet' as const,
    position: 'bottom' as const,
    showCloseButton: true,
    closeOnBackdrop: true,
    closeOnSwipe: true,
  },
  fullscreen: {
    variant: 'default' as const,
    size: 'fullscreen' as const,
    showCloseButton: true,
    closeOnBackdrop: false,
    closeOnSwipe: false,
  },
  alert: {
    variant: 'simple' as const,
    size: 'small' as const,
    showCloseButton: true,
    closeOnBackdrop: true,
    closeOnSwipe: false,
  },
};
