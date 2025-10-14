/**
 * SimpleOnboardingScreen - Streamlined onboarding for busy professionals
 * Reduced from 4 complex steps to 2 simple steps
 */

import React, { useState, useCallback, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  StatusBar,
  TouchableOpacity,
  Alert,
  Animated,
  Dimensions,
} from 'react-native';
import { PanGestureHandler, State } from 'react-native-gesture-handler';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';
import QuickHealthDataStep from '../../components/onboarding/QuickHealthDataStep';
import SimpleGoalsStep from '../../components/onboarding/SimpleGoalsStep';
import { COLORS, SPACING, FONT_SIZE, FONT_WEIGHT, BORDER_RADIUS } from '../../theme/constants';
import { hapticFeedback } from '../../utils/haptics';

const { width: screenWidth } = Dimensions.get('window');

interface SimpleOnboardingData {
  // Essential health data only
  age: string;
  height: string;
  weight: string;
  gender: 'male' | 'female' | 'other' | '';
  activityLevel: 'sedentary' | 'light' | 'moderate' | 'active' | 'very_active' | '';
  
  // Simple goals
  primaryGoal: 'lose_weight' | 'gain_weight' | 'maintain_weight' | 'build_muscle' | 'get_fitter' | '';
  experienceLevel: 'beginner' | 'intermediate' | 'advanced' | '';
}

const SIMPLE_STEPS = [
  {
    id: 'health',
    title: 'Quick Health Info',
    subtitle: 'Just the basics',
    description: 'We need a few details to personalize your experience',
    icon: 'person-outline',
  },
  {
    id: 'goals',
    title: 'Your Goals',
    subtitle: 'What do you want to achieve?',
    description: 'Help us understand what you\'re working towards',
    icon: 'flag-outline',
  },
];

export default function SimpleOnboardingScreen() {
  const { completeOnboarding } = useAuth();
  const { showToast } = useToast();
  const [currentStep, setCurrentStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [onboardingData, setOnboardingData] = useState<SimpleOnboardingData>({
    age: '',
    height: '',
    weight: '',
    gender: '',
    activityLevel: 'moderate',
    primaryGoal: '',
    experienceLevel: 'beginner',
  });

  // Animation refs
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;
  const scaleAnim = useRef(new Animated.Value(0.9)).current;

  const isLastStep = currentStep === SIMPLE_STEPS.length - 1;
  const isFirstStep = currentStep === 0;

  // Animation effect
  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 600,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        tension: 100,
        friction: 8,
        useNativeDriver: true,
      }),
    ]).start();
  }, [currentStep, fadeAnim, slideAnim, scaleAnim]);

  const handleNext = useCallback(() => {
    hapticFeedback.medium();
    if (isLastStep) {
      handleComplete();
    } else {
      setCurrentStep(prev => prev + 1);
    }
  }, [isLastStep]);

  const handlePrevious = useCallback(() => {
    if (!isFirstStep) {
      hapticFeedback.light();
      setCurrentStep(prev => prev - 1);
    }
  }, [isFirstStep]);

  const handleSkip = useCallback(() => {
    Alert.alert(
      'Skip Onboarding?',
      'You can always complete your profile later in settings. We\'ll use smart defaults for now.',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Skip', 
          style: 'destructive',
          onPress: () => handleComplete(true)
        }
      ]
    );
  }, []);

  const handleComplete = useCallback(async (skipped = false) => {
    try {
      setLoading(true);

      // Use smart defaults if skipped
      const dataToSave = skipped ? {
        age: '25',
        height: '175',
        weight: '70',
        gender: 'other' as const,
        activityLevel: 'moderate' as const,
        primaryGoal: 'get_fitter' as const,
        experienceLevel: 'beginner' as const,
      } : onboardingData;

      await completeOnboarding(dataToSave);
      showToast.success(skipped ? 'Welcome! You can complete your profile later.' : 'Profile created successfully!');
    } catch (error) {
      showToast.error('Failed to complete setup', 'Please try again');
    } finally {
      setLoading(false);
    }
  }, [onboardingData, completeOnboarding, showToast]);

  const canProceed = () => {
    switch (currentStep) {
      case 0: // Health data
        return onboardingData.age && onboardingData.height && onboardingData.weight && onboardingData.gender;
      case 1: // Goals
        return onboardingData.primaryGoal;
      default:
        return false;
    }
  };

  const handleHealthDataChange = useCallback((data: Partial<OnboardingData>) => {
    setOnboardingData(prev => ({ ...prev, ...data }));
  }, []);

  const handleGoalsDataChange = useCallback((data: Partial<OnboardingData>) => {
    setOnboardingData(prev => ({ ...prev, ...data }));
  }, []);

  const renderStepContent = () => {
    switch (currentStep) {
      case 0:
        return (
          <QuickHealthDataStep
            onDataChange={handleHealthDataChange}
            initialData={onboardingData}
          />
        );
      case 1:
        return (
          <SimpleGoalsStep
            onDataChange={handleGoalsDataChange}
            initialData={onboardingData}
          />
        );
      default:
        return null;
    }
  };

  const currentStepData = SIMPLE_STEPS[currentStep];

  const handleSwipeGesture = (event: any) => {
    const { translationX, velocityX, state } = event.nativeEvent;

    if (state === State.ACTIVE) {
      // Handle active gesture if needed
    } else if (state === State.END) {
      const threshold = screenWidth * 0.3;
      const shouldSwipeNext = translationX < -threshold || velocityX < -500;
      const shouldSwipePrevious = translationX > threshold || velocityX > 500;

      if (shouldSwipeNext && !isFirstStep) {
        handleNext();
      } else if (shouldSwipePrevious && !isFirstStep) {
        handlePrevious();
      }
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.background.primary} />
      
      <PanGestureHandler onHandlerStateChange={handleSwipeGesture}>
        <View style={styles.container}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.progressContainer}>
              <View style={styles.progressBar}>
                <View 
                  style={[
                    styles.progressFill, 
                    { width: `${((currentStep + 1) / SIMPLE_STEPS.length) * 100}%` }
                  ]} 
                />
              </View>
              <Text style={styles.progressText}>
                {currentStep + 1} of {SIMPLE_STEPS.length}
              </Text>
            </View>

            <TouchableOpacity onPress={handleSkip} style={styles.skipButton}>
              <Text style={styles.skipText}>Skip</Text>
            </TouchableOpacity>
          </View>

          {/* Step Content */}
          <View style={styles.content}>
            <View style={styles.stepHeader}>
              <Text style={styles.stepTitle}>{currentStepData.title}</Text>
              <Text style={styles.stepSubtitle}>{currentStepData.subtitle}</Text>
            </View>

            <View style={styles.stepContent}>
              {renderStepContent()}
            </View>
          </View>

          {/* Swipe Instruction */}
          <View style={styles.swipeInstruction}>
            <Ionicons name="chevron-back" size={16} color={COLORS.primary.light} />
            <Text style={styles.swipeText}>Swipe to navigate</Text>
            <Ionicons name="chevron-forward" size={16} color={COLORS.primary.light} />
          </View>
        </View>
      </PanGestureHandler>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background.primary,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: SPACING.xl,
    paddingTop: SPACING.large,
    paddingBottom: SPACING.medium,
    backgroundColor: COLORS.background.primary,
  },
  progressContainer: {
    flex: 1,
    marginRight: SPACING.large,
  },
  progressBar: {
    height: 4,
    backgroundColor: COLORS.primary.light,
    borderRadius: 2,
    marginBottom: SPACING.xs,
  },
  progressFill: {
    height: '100%',
    backgroundColor: COLORS.primary.main,
    borderRadius: 2,
  },
  progressText: {
    fontSize: FONT_SIZE.small,
    color: COLORS.primary.light,
  },
  skipButton: {
    padding: SPACING.small,
  },
  skipText: {
    fontSize: FONT_SIZE.medium,
    color: COLORS.primary.light,
    fontWeight: FONT_WEIGHT.medium,
  },
  stepHeader: {
    marginBottom: SPACING.large,
  },
  stepTitle: {
    fontSize: FONT_SIZE.xxl,
    fontWeight: FONT_WEIGHT.bold,
    color: COLORS.primary.light,
    marginBottom: SPACING.small,
    letterSpacing: -0.3,
  },
  stepSubtitle: {
    fontSize: FONT_SIZE.medium,
    fontWeight: FONT_WEIGHT.medium,
    color: COLORS.primary.light,
    letterSpacing: -0.1,
  },
  content: {
    flex: 1,
    paddingHorizontal: SPACING.xl,
    paddingBottom: SPACING.large,
    backgroundColor: COLORS.background.primary,
  },
  stepContent: {
    flex: 1,
  },
  swipeInstruction: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SPACING.medium,
    paddingHorizontal: SPACING.large,
    backgroundColor: COLORS.background.primary,
    borderTopWidth: 1,
    borderTopColor: COLORS.border.light,
    gap: SPACING.small,
  },
  swipeText: {
    fontSize: FONT_SIZE.small,
    color: COLORS.primary.light,
    fontWeight: FONT_WEIGHT.medium,
  },
});
