import React, { useState, useRef } from 'react';
import {
  View,
  StyleSheet,
  Dimensions,
  Animated,
} from 'react-native';
import { PanGestureHandler, State } from 'react-native-gesture-handler';
import { hapticFeedback } from '../../utils/haptics';
import { COMMON_STYLES } from '../../theme/constants';

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

  const handleSwipeGesture = (event: any) => {
    if (!enableSwipe || isAnimating) return;

    const { translationX, velocityX, state } = event.nativeEvent;

    if (state === State.ACTIVE) {
      translateX.setValue(translationX);
    } else if (state === State.END) {
      const threshold = screenWidth * 0.3;
      const shouldSwipeNext = translationX < -threshold || velocityX < -500;
      const shouldSwipePrevious = translationX > threshold || velocityX > 500;

      if (shouldSwipeNext && canGoNext) {
        handleNext();
      } else if (shouldSwipePrevious && canGoPrevious) {
        handlePrevious();
      } else {
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
    console.log('🎬 OnboardingContainer handleNext - canGoNext:', canGoNext, 'isAnimating:', isAnimating);
    
    if (!canGoNext || isAnimating) {
      console.log('❌ OnboardingContainer handleNext blocked');
      return;
    }

    hapticFeedback.light();
    
    // Check if this is the last step - if so, complete immediately without animation
    if (isLastStep) {
      console.log('🎬 OnboardingContainer - last step, completing immediately');
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
      console.log('🎬 OnboardingContainer calling onNext()');
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
        <PanGestureHandler onHandlerStateChange={handleSwipeGesture}>
          {content}
        </PanGestureHandler>
      ) : (
        content
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
});
