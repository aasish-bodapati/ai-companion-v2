/**
 * BaseModal - Standardized modal component for consistent UI
 * Reduces complexity by providing a reusable base for all modals
 */

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
  ViewStyle,
  TextStyle,
} from 'react-native';
import { PanGestureHandler, State } from 'react-native-gesture-handler';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SPACING, FONT_SIZE, FONT_WEIGHT, BORDER_RADIUS, SHADOWS } from '../../theme/constants';

export type ModalSize = 'small' | 'medium' | 'large' | 'fullscreen';
export type ModalPosition = 'center' | 'bottom' | 'top';

export interface BaseModalProps {
  visible: boolean;
  onClose: () => void;
  title?: string;
  subtitle?: string;
  children: React.ReactNode;
  size?: ModalSize;
  position?: ModalPosition;
  showCloseButton?: boolean;
  showHeader?: boolean;
  closeOnBackdrop?: boolean;
  closeOnSwipe?: boolean;
  style?: ViewStyle;
  headerStyle?: ViewStyle;
  titleStyle?: TextStyle;
  subtitleStyle?: TextStyle;
  contentStyle?: ViewStyle;
  animationType?: 'slide' | 'fade' | 'none';
  keyboardAvoidingView?: boolean;
  scrollable?: boolean;
  maxHeight?: number;
}

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

export default function BaseModal({
  visible,
  onClose,
  title,
  subtitle,
  children,
  size = 'medium',
  position = 'center',
  showCloseButton = true,
  showHeader = true,
  closeOnBackdrop = true,
  closeOnSwipe = true,
  style,
  headerStyle,
  titleStyle,
  subtitleStyle,
  contentStyle,
  animationType = 'slide',
  keyboardAvoidingView = true,
  scrollable = false,
  maxHeight,
}: BaseModalProps) {
  const translateY = useRef(new Animated.Value(0)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      if (animationType === 'slide') {
        Animated.parallel([
          Animated.timing(translateY, {
            toValue: 0,
            duration: 300,
            useNativeDriver: true,
          }),
          Animated.timing(opacity, {
            toValue: 1,
            duration: 300,
            useNativeDriver: true,
          }),
        ]).start();
      } else if (animationType === 'fade') {
        Animated.timing(opacity, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }).start();
      }
    } else {
      if (animationType === 'slide') {
        Animated.parallel([
          Animated.timing(translateY, {
            toValue: SCREEN_HEIGHT,
            duration: 300,
            useNativeDriver: true,
          }),
          Animated.timing(opacity, {
            toValue: 0,
            duration: 300,
            useNativeDriver: true,
          }),
        ]).start();
      } else if (animationType === 'fade') {
        Animated.timing(opacity, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }).start();
      }
    }
  }, [visible, animationType, translateY, opacity]);

  const getModalStyle = (): ViewStyle => {
    const baseStyle: ViewStyle = {
      backgroundColor: COLORS.white,
      borderRadius: BORDER_RADIUS.large,
      ...SHADOWS.large,
    };

    // Size variants
    const sizeStyles = {
      small: {
        width: '80%',
        maxHeight: SCREEN_HEIGHT * 0.4,
      },
      medium: {
        width: '90%',
        maxHeight: SCREEN_HEIGHT * 0.6,
      },
      large: {
        width: '95%',
        maxHeight: SCREEN_HEIGHT * 0.8,
      },
      fullscreen: {
        width: '100%',
        height: '100%',
        borderRadius: 0,
      },
    };

    // Position variants
    const positionStyles = {
      center: {
        alignSelf: 'center',
        marginVertical: 'auto',
      },
      bottom: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        borderBottomLeftRadius: 0,
        borderBottomRightRadius: 0,
      },
      top: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        borderTopLeftRadius: 0,
        borderTopRightRadius: 0,
      },
    };

    return {
      ...baseStyle,
      ...sizeStyles[size],
      ...positionStyles[position],
      ...(maxHeight && { maxHeight }),
      ...style,
    };
  };

  const getHeaderStyle = (): ViewStyle => {
    return {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: SPACING.large,
      paddingVertical: SPACING.medium,
      borderBottomWidth: 1,
      borderBottomColor: COLORS.border,
      ...headerStyle,
    };
  };

  const getTitleStyle = (): TextStyle => {
    return {
      fontSize: FONT_SIZE.large,
      fontWeight: FONT_WEIGHT.semibold,
      color: COLORS.text.primary,
      flex: 1,
      ...titleStyle,
    };
  };

  const getSubtitleStyle = (): TextStyle => {
    return {
      fontSize: FONT_SIZE.small,
      fontWeight: FONT_WEIGHT.regular,
      color: COLORS.text.secondary,
      marginTop: SPACING.xs,
      ...subtitleStyle,
    };
  };

  const getContentStyle = (): ViewStyle => {
    return {
      paddingHorizontal: SPACING.large,
      paddingVertical: SPACING.medium,
      ...contentStyle,
    };
  };

  const handleBackdropPress = () => {
    if (closeOnBackdrop) {
      onClose();
    }
  };

  const handleSwipeGesture = (event: any) => {
    if (closeOnSwipe && event.nativeEvent.state === State.END) {
      const { translationY, velocityY } = event.nativeEvent;
      if (translationY > 100 || velocityY > 500) {
        onClose();
      }
    }
  };

  const renderHeader = () => {
    if (!showHeader) return null;

    return (
      <View style={getHeaderStyle()}>
        <View style={styles.headerContent}>
          {title && <Text style={getTitleStyle()}>{title}</Text>}
          {subtitle && <Text style={getSubtitleStyle()}>{subtitle}</Text>}
        </View>
        {showCloseButton && (
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Ionicons name="close" size={24} color={COLORS.text.secondary} />
          </TouchableOpacity>
        )}
      </View>
    );
  };

  const renderContent = () => {
    if (scrollable) {
      return (
        <ScrollView
          style={getContentStyle()}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {children}
        </ScrollView>
      );
    }

    return <View style={getContentStyle()}>{children}</View>;
  };

  const ModalContent = () => (
    <Animated.View
      style={[
        getModalStyle(),
        {
          transform: [{ translateY }],
          opacity,
        },
      ]}
    >
      {renderHeader()}
      {renderContent()}
    </Animated.View>
  );

  if (closeOnSwipe && position === 'bottom') {
    return (
      <Modal
        visible={visible}
        transparent
        animationType="none"
        onRequestClose={onClose}
      >
        <TouchableOpacity
          style={styles.backdrop}
          activeOpacity={1}
          onPress={handleBackdropPress}
        >
          <PanGestureHandler onHandlerStateChange={handleSwipeGesture}>
            <View style={styles.modalContainer}>
              <ModalContent />
            </View>
          </PanGestureHandler>
        </TouchableOpacity>
      </Modal>
    );
  }

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={onClose}
    >
      <TouchableOpacity
        style={styles.backdrop}
        activeOpacity={1}
        onPress={handleBackdropPress}
      >
        <View style={styles.modalContainer}>
          {keyboardAvoidingView ? (
            <KeyboardAvoidingView
              behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
              style={styles.keyboardAvoidingView}
            >
              <ModalContent />
            </KeyboardAvoidingView>
          ) : (
            <ModalContent />
          )}
        </View>
      </TouchableOpacity>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
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
  headerContent: {
    flex: 1,
  },
  closeButton: {
    padding: SPACING.xs,
    marginLeft: SPACING.small,
  },
});