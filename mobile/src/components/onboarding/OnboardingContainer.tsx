import React, { useState, useRef } from 'react';
import {
  View,
  StyleSheet,
  Dimensions,
  Animated,
  Text,
} from 'react-native';
import { PanGestureHandler, State } from 'react-native-gesture-handler';
import { Ionicons } from '@expo/vector-icons';
import { hapticFeedback } from '../../utils/haptics';
import { COMMON_STYLES } from '../../theme/constants';

import { DebugUtils } from '../../utils/debugUtils';

interface OnboardingContainerProps {
  children: React.ReactNode;
  currentStep: number;
  totalSteps: number;
  onNext: () => void;
  onPrevious: () => void;
  onComplete: () => void;
  canGoNext?: boolean;
  canGoPrevious?: boolean;
  enableSwipe?: boolean;
  isLastStep?: boolean;
}

const { width: screenWidth } = Dimensions.get('window');

export default function OnboardingContainer({
  children,
  currentStep,
  totalSteps,
  onNext,
  onPrevious,
  onComplete,
  canGoNext = true,
  canGoPrevious = true,
  enableSwipe = true,
  isLastStep = false,
}: OnboardingContainerProps) {
  const [isAnimating, setIsAnimating] = useState(false);
  const translateX = useRef(new Animated.Value(0)).current;

  const handleSwipeGesture = (event: Record<string, unknown>) => {
    if (!enableSwipe || isAnimating) return;

    const { translationX, velocityX, state } = event.nativeEvent;

    if (state === State.ACTIVE) {
      translateX.setValue(translationX);
    } else if (state === State.END) {
      const threshold = screenWidth * 0.3;
      const shouldSwipeNext = translationX < -threshold || velocityX < -500;
      const shouldSwipePrevious = translationX > threshold || velocityX > 500;

      DebugUtils.log('🎬 Swipe gesture - shouldSwipeNext:', shouldSwipeNext, 'canGoNext:', canGoNext, 'shouldSwipePrevious:', shouldSwipePrevious, 'canGoPrevious:', canGoPrevious, 'isLastStep:', isLastStep);

      if (shouldSwipeNext && canGoNext) {
        DebugUtils.log('🎬 Swipe next allowed - calling handleNext');
        handleNext();
      } else if (shouldSwipePrevious && canGoPrevious) {
        DebugUtils.log('🎬 Swipe previous allowed - calling handlePrevious');
        handlePrevious();
      } else {
        DebugUtils.log('🎬 Swipe not allowed - snapping back');
        // Snap back
        Animated.spring(translateX, {
          toValue: 0,
          tension: 100,
          friction: 8,
          useNativeDriver: true,
        }).start();
      }
    }
  };

  const handleNext = () => {
    DebugUtils.log('🎬 OnboardingContainer handleNext - canGoNext:', canGoNext, 'isAnimating:', isAnimating);

    if (!canGoNext || isAnimating) {
      DebugUtils.log('❌ OnboardingContainer handleNext blocked - canGoNext:', canGoNext, 'isAnimating:', isAnimating);
      return;
    }

    DebugUtils.log('✅ OnboardingContainer handleNext proceeding');

    hapticFeedback.light();

    // Check if this is the last step - if so, complete immediately without animation
    if (isLastStep) {
      DebugUtils.log('🎬 OnboardingContainer - last step, completing immediately');
      onNext();
      return;
    }

    setIsAnimating(true);

    // Animate out
    Animated.timing(translateX, {
      toValue: -screenWidth,
      duration: 300,
      useNativeDriver: true,
    }).start(() => {
      DebugUtils.log('🎬 OnboardingContainer calling onNext()');
      onNext();
      translateX.setValue(screenWidth);

      // Animate in
      Animated.timing(translateX, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }).start(() => {
        setIsAnimating(false);
      });
    });
  };

  const handlePrevious = () => {
    if (!canGoPrevious || isAnimating) return;

    hapticFeedback.light();
    setIsAnimating(true);

    // Animate out
    Animated.timing(translateX, {
      toValue: screenWidth,
      duration: 300,
      useNativeDriver: true,
    }).start(() => {
      onPrevious();
      translateX.setValue(-screenWidth);

      // Animate in
      Animated.timing(translateX, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }).start(() => {
        setIsAnimating(false);
      });
    });
  };

  const content = (
    <Animated.View
      style={[
        styles.content,
        {
          transform: [{ translateX }],
        },
      ]}
    >
      {children}
    </Animated.View>
  );

  return (
    <View style={styles.container}>
      {enableSwipe ? (
        <PanGestureHandler 
          onHandlerStateChange={handleSwipeGesture}
          activeOffsetX={[-10, 10]}
          activeOffsetY={[-5, 5]}
        >
          {content}
        </PanGestureHandler>
      ) : (
        content
      )}

      {/* Swipe Instruction */}
      {enableSwipe && (
        <View style={styles.swipeInstruction}>
          <Ionicons name="chevron-back" size={16} color="#9ca3af" />
          <Text style={styles.swipeText}>Swipe to navigate</Text>
          <Ionicons name="chevron-forward" size={16} color="#9ca3af" />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COMMON_STYLES.secondaryBackground,
  },
  content: {
    flex: 1,
  },
  swipeInstruction: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: '#f8fafc',
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
  },
  swipeText: {
    fontSize: 14,
    color: '#9ca3af',
    marginHorizontal: 8,
    fontWeight: '500',
  },
});
