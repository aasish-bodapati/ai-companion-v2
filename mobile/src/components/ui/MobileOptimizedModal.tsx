import React, { useEffect, useRef } from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Dimensions,
  StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { PanGestureHandler, State } from 'react-native-gesture-handler';
import { Ionicons } from '@expo/vector-icons';
import { hapticFeedback, touchUtils } from '../../utils/haptics';
import { COMMON_STYLES } from '../../theme/constants';

interface MobileOptimizedModalProps {
  visible: boolean;
  onClose: () => void;
  title?: string;
  subtitle?: string;
  children: React.ReactNode;
  variant?: 'default' | 'bottomSheet' | 'fullScreen' | 'centered';
  size?: 'small' | 'medium' | 'large' | 'full';
  showCloseButton?: boolean;
  closeOnBackdrop?: boolean;
  closeOnSwipe?: boolean;
  hapticFeedback?: boolean;
  animationType?: 'slide' | 'fade' | 'none';
  presentationStyle?: 'pageSheet' | 'formSheet' | 'fullScreen' | 'overFullScreen';
  testID?: string;
}

const { height: screenHeight } = Dimensions.get('window');

export default function MobileOptimizedModal({
  visible,
  onClose,
  title,
  subtitle,
  children,
  variant = 'default',
  size = 'medium',
  showCloseButton = true,
  closeOnBackdrop = true,
  closeOnSwipe = true,
  hapticFeedback: enableHaptic = true,
  animationType = 'slide',
  presentationStyle = 'pageSheet',
  testID,
}: MobileOptimizedModalProps) {
  const slideAnim = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.8)).current;
  const translateY = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      // Haptic feedback on open
      if (enableHaptic) {
        hapticFeedback.light();
      }

      // Animate in
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.spring(scaleAnim, {
          toValue: 1,
          tension: 100,
          friction: 8,
          useNativeDriver: true,
        }),
        Animated.timing(slideAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      // Animate out
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(scaleAnim, {
          toValue: 0.8,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [visible, enableHaptic]);

  const handleClose = () => {
    if (enableHaptic) {
      hapticFeedback.light();
    }
    onClose();
  };

  const handleBackdropPress = () => {
    if (closeOnBackdrop) {
      handleClose();
    }
  };

  const handleSwipeGesture = (event: Record<string, unknown>) => {
    if (!closeOnSwipe) return;

    const { translationY, velocityY, state } = event.nativeEvent;

    if (state === State.ACTIVE) {
      translateY.setValue(translationY);
    } else if (state === State.END) {
      if (translationY > 100 || velocityY > 500) {
        // Swipe down to close
        Animated.timing(translateY, {
          toValue: screenHeight,
          duration: 200,
          useNativeDriver: true,
        }).start(() => {
          handleClose();
          translateY.setValue(0);
        });
      } else {
        // Snap back
        Animated.spring(translateY, {
          toValue: 0,
          tension: 100,
          friction: 8,
          useNativeDriver: true,
        }).start();
      }
    }
  };

  const getModalStyle = () => {
    const baseStyle = {
      ...styles.modal,
      ...styles[`${variant}Modal`],
    };

    // Don't apply maxHeight constraints for fullScreen variant
    if (variant === 'fullScreen') {
      return baseStyle;
    }

    switch (size) {
      case 'small':
        return { ...baseStyle, maxHeight: screenHeight * 0.4 };
      case 'medium':
        return { ...baseStyle, maxHeight: screenHeight * 0.6 };
      case 'large':
        return { ...baseStyle, maxHeight: screenHeight * 0.8 };
      case 'full':
        return { ...baseStyle, maxHeight: screenHeight };
      default:
        return baseStyle;
    }
  };

  const getAnimationStyle = () => {
    const animatedStyle: Record<string, unknown> = {
      opacity: fadeAnim,
    };

    switch (variant) {
      case 'bottomSheet':
        return {
          ...animatedStyle,
          transform: [
            {
              translateY: slideAnim.interpolate({
                inputRange: [0, 1],
                outputRange: [screenHeight, 0],
              }),
            },
            { translateY },
          ],
        };
      case 'centered':
        return {
          ...animatedStyle,
          transform: [
            { scale: scaleAnim },
            { translateY },
          ],
        };
      default:
        return animatedStyle;
    }
  };

  const renderHeader = () => {
    if (!title && !subtitle && !showCloseButton) return null;

    return (
      <View style={styles.header}>
        <View style={styles.headerContent}>
          {title && <Text style={styles.title}>{title}</Text>}
          {subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
        </View>
        {showCloseButton && (
          <TouchableOpacity
            style={styles.closeButton}
            onPress={handleClose}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            testID={`${testID}-close-button`}
          >
            <Ionicons name="close" size={24} color="#6b7280" />
          </TouchableOpacity>
        )}
      </View>
    );
  };

  const renderContent = () => (
    <Animated.View
      style={[
        getModalStyle(),
        getAnimationStyle(),
      ]}
    >
      {renderHeader()}
      <View style={[
        styles.content,
        variant === 'fullScreen' && styles.fullScreenContent
      ]}>
        {children}
      </View>
    </Animated.View>
  );

  if (!visible) return null;

  return (
    <Modal
      visible={visible}
      transparent={variant !== 'fullScreen'}
      animationType={animationType}
      presentationStyle={presentationStyle}
      onRequestClose={handleClose}
      testID={testID}
    >
      <StatusBar
        backgroundColor={variant === 'fullScreen' ? '#ffffff' : 'rgba(0, 0, 0, 0.5)'}
        barStyle="dark-content"
      />
      
      {variant === 'fullScreen' ? (
        <SafeAreaView style={styles.fullScreenContainer}>
          {renderContent()}
        </SafeAreaView>
      ) : (
        <View style={styles.overlay}>
          <TouchableOpacity
            style={styles.backdrop}
            activeOpacity={1}
            onPress={handleBackdropPress}
            testID={`${testID}-backdrop`}
          />
          
          {closeOnSwipe && variant === 'bottomSheet' ? (
            <PanGestureHandler onHandlerStateChange={handleSwipeGesture}>
              {renderContent()}
            </PanGestureHandler>
          ) : (
            renderContent()
          )}
        </View>
      )}
    </Modal>
  );
}

const styles = StyleSheet.create({
  modal: {
    backgroundColor: COMMON_STYLES.cardBackground,
    borderRadius: COMMON_STYLES.standardRadius,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 8,
  },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  backdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  fullScreenContainer: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  
  // Variants
  defaultModal: {
    margin: 20,
    maxHeight: '80%',
  },
  bottomSheetModal: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    borderBottomLeftRadius: 0,
    borderBottomRightRadius: 0,
    marginTop: 'auto',
    maxHeight: '90%',
  },
  fullScreenModal: {
    flex: 1,
    borderRadius: 0,
    margin: 0,
  },
  centeredModal: {
    margin: 40,
    alignSelf: 'center',
    maxHeight: '80%',
  },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  headerContent: {
    flex: 1,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 2,
  },
  subtitle: {
    fontSize: 14,
    color: '#6b7280',
  },
  closeButton: {
    padding: 4,
    borderRadius: 20,
    backgroundColor: '#f3f4f6',
    // Ensure minimum touch target size
    minWidth: touchUtils.MIN_TOUCH_TARGET_SIZE,
    minHeight: touchUtils.MIN_TOUCH_TARGET_SIZE,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Content
  content: {
    flex: 1,
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  fullScreenContent: {
    flex: 1,
    paddingHorizontal: 0,
    paddingVertical: 0,
  },
});
