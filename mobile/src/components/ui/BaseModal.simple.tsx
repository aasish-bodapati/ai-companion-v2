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
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SPACING, FONT_SIZE, FONT_WEIGHT, BORDER_RADIUS, SHADOWS } from '../../theme/constants';

export type ModalSize = 'small' | 'medium' | 'large' | 'fullscreen';
export type ModalPosition = 'center' | 'bottom' | 'top';

interface BaseModalProps {
  // Core props
  visible: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;

  // Modal configuration
  size?: ModalSize;
  position?: ModalPosition;
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

export default function BaseModal({
  visible,
  onClose,
  title,
  children,
  size = 'medium',
  position = 'center',
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
}: BaseModalProps) {
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

  // Handle backdrop press
  const handleBackdropPress = () => {
    if (closeOnBackdrop) {
      onBackdropPress?.() || onClose();
    }
  };

  // Get modal dimensions based on size
  const getModalDimensions = () => {
    switch (size) {
      case 'small':
        return { width: screenWidth * 0.8, maxHeight: screenHeight * 0.4 };
      case 'medium':
        return { width: screenWidth * 0.9, maxHeight: screenHeight * 0.7 };
      case 'large':
        return { width: screenWidth * 0.95, maxHeight: screenHeight * 0.85 };
      case 'fullscreen':
        return { width: screenWidth, height: screenHeight };
      default:
        return { width: screenWidth * 0.9, maxHeight: screenHeight * 0.7 };
    }
  };

  // Get modal position styles
  const getPositionStyles = () => {
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
      <View style={[styles.modalContent, modalDimensions, contentStyle]}>
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
      </TouchableOpacity>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContainer: {
    flex: 1,
  },
  keyboardAvoidingView: {
    flex: 1,
  },
  modalContent: {
    backgroundColor: COLORS.background.primary,
    borderRadius: BORDER_RADIUS.lg,
    ...SHADOWS.large,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border.primary,
  },
  title: {
    fontSize: FONT_SIZE.lg,
    fontWeight: FONT_WEIGHT.semibold,
    color: COLORS.text.primary,
    flex: 1,
    marginRight: SPACING.md,
  },
  closeButton: {
    padding: SPACING.xs,
    borderRadius: BORDER_RADIUS.sm,
  },
  body: {
    flex: 1,
    padding: SPACING.lg,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: SPACING.lg,
  },
});
