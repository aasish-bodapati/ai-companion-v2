import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import TouchOptimizedButton from '../ui/TouchOptimizedButton';
import { hapticFeedback } from '../../utils/haptics';

interface OnboardingNavigationProps {
  currentStep: number;
  totalSteps: number;
  onNext: () => void;
  onPrevious: () => void;
  onComplete: () => void;
  onSkip?: () => void;
  canGoNext?: boolean;
  canGoPrevious?: boolean;
  nextText?: string;
  previousText?: string;
  completeText?: string;
  skipText?: string;
  showSkip?: boolean;
  showPrevious?: boolean;
  loading?: boolean;
}

const { width: screenWidth } = Dimensions.get('window');

export default function OnboardingNavigation({
  currentStep,
  totalSteps,
  onNext,
  onPrevious,
  onComplete,
  onSkip,
  canGoNext = true,
  canGoPrevious = true,
  nextText = 'Next',
  previousText = 'Previous',
  completeText = 'Get Started',
  skipText = 'Skip',
  showSkip = true,
  showPrevious = true,
  loading = false,
}: OnboardingNavigationProps) {
  const insets = useSafeAreaInsets();
  const isLastStep = currentStep === totalSteps - 1;
  const isFirstStep = currentStep === 0;

  const handleNext = () => {
    hapticFeedback.medium();
    if (isLastStep) {
      onComplete();
    } else {
      onNext();
    }
  };

  const handlePrevious = () => {
    hapticFeedback.light();
    onPrevious();
  };

  const handleSkip = () => {
    hapticFeedback.light();
    onSkip?.();
  };

  const getNextButtonText = () => {
    if (isLastStep) return completeText;
    return nextText;
  };

  const getNextButtonVariant = () => {
    if (isLastStep) return 'primary' as const;
    return 'primary' as const;
  };

  return (
    <View style={[styles.container, { paddingBottom: Math.max(insets.bottom, 12) }]}>
      {/* Progress Indicator */}
      <View style={styles.progressContainer}>
        <View style={styles.progressBar}>
          <View
            style={[
              styles.progressFill,
              { width: `${((currentStep + 1) / totalSteps) * 100}%` },
            ]}
          />
        </View>
        <View style={styles.stepText}>
          <Text style={styles.stepTextContent}>
            {currentStep + 1} of {totalSteps}
          </Text>
        </View>
      </View>

      {/* Navigation Buttons */}
      <View style={styles.buttonContainer}>
        {/* Left Side - Skip or Previous */}
        <View style={styles.leftButton}>
          {showSkip && !isFirstStep && (
            <TouchOptimizedButton
              title={skipText}
              onPress={handleSkip}
              variant="ghost"
              size="medium"
              hapticFeedback="light"
              style={styles.skipButton}
            />
          )}
          
          {showPrevious && !isFirstStep && !showSkip && (
            <TouchOptimizedButton
              title={previousText}
              onPress={handlePrevious}
              variant="outline"
              size="medium"
              hapticFeedback="light"
              disabled={!canGoPrevious}
              style={styles.previousButton}
            />
          )}
        </View>

        {/* Right Side - Next or Complete */}
        <View style={styles.rightButton}>
          <TouchOptimizedButton
            title={getNextButtonText()}
            onPress={handleNext}
            variant={getNextButtonVariant()}
            size="large"
            hapticFeedback={isLastStep ? 'success' : 'medium'}
            disabled={!canGoNext || loading}
            loading={loading}
            style={styles.nextButton}
          />
        </View>
      </View>

      {/* Step Dots */}
      <View style={styles.dotsContainer}>
        {Array.from({ length: totalSteps }, (_, index) => (
          <View
            key={index}
            style={[
              styles.dot,
              index === currentStep && styles.dotActive,
              index < currentStep && styles.dotCompleted,
            ]}
          />
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 20,
    paddingVertical: 12,
    backgroundColor: '#ffffff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: -4,
    },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 8,
  },
  progressContainer: {
    marginBottom: 12,
  },
  progressBar: {
    height: 4,
    backgroundColor: '#e5e7eb',
    borderRadius: 2,
    overflow: 'hidden',
    marginBottom: 8,
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#3b82f6',
    borderRadius: 2,
  },
  stepText: {
    // Container style
  },
  stepTextContent: {
    fontSize: 12,
    color: '#6b7280',
    textAlign: 'center',
    fontWeight: '500',
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  leftButton: {
    flex: 1,
    alignItems: 'flex-start',
  },
  rightButton: {
    flex: 1,
    alignItems: 'flex-end',
  },
  skipButton: {
    paddingHorizontal: 16,
  },
  previousButton: {
    paddingHorizontal: 16,
  },
  nextButton: {
    paddingHorizontal: 24,
    minWidth: 120,
  },
  dotsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#d1d5db',
    marginHorizontal: 4,
  },
  dotActive: {
    backgroundColor: '#3b82f6',
    width: 24,
  },
  dotCompleted: {
    backgroundColor: '#10b981',
  },
});
