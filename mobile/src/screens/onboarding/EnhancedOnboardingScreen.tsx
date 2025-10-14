import React, { useState, useCallback, useEffect, useRef, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../../contexts/AuthContext';
import OnboardingContainer from '../../components/onboarding/OnboardingContainer';
import OnboardingStep from '../../components/onboarding/OnboardingStep';
import HealthDataStep from '../../components/onboarding/HealthDataStep';
import BodyTypeGoalsStep from '../../components/onboarding/BodyTypeGoalsStep';
import { hapticFeedback } from '../../utils/haptics';
import { showToast } from '../../utils/toast';
import { profileService } from '../../services/api';

import { COLORS, SPACING, FONT_SIZE } from '../../theme/constants';
import { STYLE_PRESETS } from '../../theme/duplicateStyles';

import { DebugUtils } from '../../utils/debugUtils';

interface HealthData {
  age: string;
  height: string;
  weight: string;
  gender: 'male' | 'female' | 'other' | '' | 'Please select your gender';
  activityLevel: 'sedentary' | 'light' | 'active' | 'very_active' | '';
}

interface OnboardingData {
  healthData: HealthData;
  bodyTypeGoal: string;
  editedBodyTypeGoal?: Record<string, unknown>; // Store the edited goal details
  timezone: string;
  goals: string[];
  preferences: {
    notifications: boolean;
    reminders: boolean;
    dataSharing: boolean;
  };
}

const ONBOARDING_STEPS = [
  {
    id: 'welcome',
    title: 'Welcome to AI Companion!',
    subtitle: 'Let\'s Set Up Your Health Profile',
    description: 'We\'ll help you create a personalized health profile to track your fitness journey and achieve your goals.',
    icon: 'heart-outline',
    variant: 'centered' as const,
  },
  {
    id: 'health_data',
    title: 'Your Health Information',
    subtitle: 'Tell Us About Yourself',
    description: 'Help us understand your current health status by providing some basic information about yourself.',
    icon: 'person-outline',
    variant: 'minimal' as const,
  },
  {
    id: 'body_type_goal',
    title: 'Choose Your Body Type Goal',
    subtitle: 'What Do You Want to Achieve?',
    description: 'Select the body type goal that best matches what you want to achieve with your fitness journey.',
    icon: 'body-outline',
    variant: 'minimal' as const,
  },
  {
    id: 'complete',
    title: 'You\'re All Set!',
    subtitle: 'Ready to Start Your Journey',
    description: 'Welcome to your personalized health companion. Let\'s begin your journey to better health and wellness!',
    icon: 'checkmark-circle-outline',
    variant: 'centered' as const,
  },
];

export default function EnhancedOnboardingScreen() {
  const [currentStep, setCurrentStep] = useState(0);
  const [hasCompleted, setHasCompleted] = useState(false);
  const [onboardingData, setOnboardingData] = useState<OnboardingData>({
    healthData: {
      age: '',
      height: '',
      weight: '',
      gender: '',
      activityLevel: '',
    },
    bodyTypeGoal: '',
    goals: [],
    timezone: 'UTC', // Default timezone, will be detected independently
    preferences: {
      notifications: true,
      reminders: true,
      dataSharing: false,
    },
  });
  const [loading, setLoading] = useState(false);
  const [isCompleting, setIsCompleting] = useState(false);
  const { completeOnboarding } = useAuth();
  const completionRef = useRef(false);

  // Load existing profile data to pre-populate onboarding
  const loadExistingProfileData = useCallback(async () => {
    try {
      setLoading(true);

      const profileData = await profileService.getUserProfile();

      if (profileData) {
        // Convert backend data to onboarding format
        const existingData = profileService.convertToOnboardingData(profileData);

        // Pre-populate the form with existing data
        setOnboardingData(existingData);
      }
    } catch {
      // Keep default values if no existing data
    } finally {
      setLoading(false);
    }
  }, []);

  // Reset state when component mounts (for rerun onboarding)
  useEffect(() => {
    if (!completionRef.current) {
      setHasCompleted(false);
      setIsCompleting(false);
      setCurrentStep(0);
      // Load existing data to pre-populate the form
      loadExistingProfileData();
    } else {
      DebugUtils.log('🔄 Component mounted but completion already in progress, preventing reset');
    }
  }, []); // Remove loadExistingProfileData from dependencies to prevent infinite re-renders

  // Check if we should prevent rendering (but don't return early to avoid hooks violation)
  const shouldPreventRender = hasCompleted || isCompleting || completionRef.current ||
    (typeof window !== 'undefined' && (window as unknown as { __onboardingCompleted?: boolean }).__onboardingCompleted);

  if (shouldPreventRender) {
    DebugUtils.log('🔄 Onboarding completed/completing, preventing re-render');
  }

  // Check if onboarding should be completed and redirect
  useEffect(() => {
    if (hasCompleted && !isCompleting) {
      DebugUtils.log('🔄 Onboarding completed, component should unmount soon');
    }
  }, [hasCompleted, isCompleting]);

  // Cleanup global flag on unmount
  useEffect(() => {
    return () => {
      if (typeof window !== 'undefined') {
        (window as unknown as { __onboardingCompleted?: boolean }).__onboardingCompleted = false;
      }
    };
  }, []);

  useEffect(() => {
    if (__DEV__) {
      DebugUtils.log('🔄 EnhancedOnboardingScreen useEffect - currentStep:', currentStep);
    }

    return () => {
      if (__DEV__) {
        DebugUtils.log('🧹 EnhancedOnboardingScreen cleanup - currentStep:', currentStep);
      }
    };
  }, [currentStep]);

  const currentStepData = ONBOARDING_STEPS[currentStep];
  const isLastStep = currentStep === ONBOARDING_STEPS.length - 1;
  const isFirstStep = currentStep === 0;

  // Safety check for currentStepData - reset to last valid step if out of bounds
  if (!currentStepData) {
    DebugUtils.error('❌ [ONBOARDING] currentStepData is undefined for currentStep:', currentStep, 'maxSteps:', ONBOARDING_STEPS.length);
    // Reset to last valid step instead of returning null to avoid hooks issues
    const lastValidStep = ONBOARDING_STEPS.length - 1;
    if (currentStep > lastValidStep) {
      setCurrentStep(lastValidStep);
    }
    // Use the last step as fallback
    const fallbackStepData = ONBOARDING_STEPS[lastValidStep];
    if (!fallbackStepData) {
      DebugUtils.error('❌ [ONBOARDING] No valid step data available');
      return null;
    }
    // Continue with fallback data - this will be handled by the next render
    return null;
  }

  if (__DEV__) {
    DebugUtils.log('📊 Step info - currentStep:', currentStep, 'totalSteps:', ONBOARDING_STEPS.length, 'isLastStep:', isLastStep, 'currentStepData:', currentStepData?.id);
  }

  const handlePrevious = useCallback(() => {
    setCurrentStep(prev => {
      if (prev > 0) {
        hapticFeedback.light();
        return prev - 1;
      }
      return prev;
    });
  }, []); // Remove currentStep from dependencies to prevent infinite re-renders

  const handleNext = useCallback(() => {
    if (__DEV__) {
      DebugUtils.log('🔄 handleNext called - currentStep:', currentStep, 'isLastStep:', isLastStep, 'totalSteps:', ONBOARDING_STEPS.length, 'isCompleting:', isCompleting, 'hasCompleted:', hasCompleted);
    }

    if (hasCompleted || completionRef.current) {
      if (__DEV__) {
        DebugUtils.log('⚠️ Onboarding already completed, skipping navigation');
      }
      return;
    }

    if (isCompleting) {
      if (__DEV__) {
        DebugUtils.log('⚠️ Already completing onboarding, skipping');
      }
      return;
    }

    if (currentStep < ONBOARDING_STEPS.length - 1) {
      if (__DEV__) {
        DebugUtils.log('➡️ Moving to next step');
      }
      hapticFeedback.medium();
      setCurrentStep(prev => {
        const nextStep = prev + 1;
        // Ensure we don't go out of bounds
        return nextStep < ONBOARDING_STEPS.length ? nextStep : prev;
      });
    } else if (isLastStep) {
      if (__DEV__) {
        DebugUtils.log('✅ On last step, completing onboarding immediately');
      }
      // Set completion ref immediately to prevent any re-mounting
      completionRef.current = true;
      // If on the last step, complete onboarding immediately without animation
      handleComplete();
    }
  }, []); // Remove all dependencies to prevent infinite re-renders

  const handleComplete = useCallback(async () => {
    DebugUtils.log('🎯 handleComplete called - currentStep:', currentStep, 'isLastStep:', isLastStep, 'isCompleting:', isCompleting, 'hasCompleted:', hasCompleted);

    if (hasCompleted) {
      DebugUtils.log('⚠️ Onboarding already completed, skipping');
      return;
    }

    if (isCompleting) {
      DebugUtils.log('⚠️ handleComplete already in progress, skipping');
      return;
    }

    try {
      // Set completion flags immediately to prevent double calls
      completionRef.current = true;
      if (typeof window !== 'undefined') {
        (window as unknown as { __onboardingCompleted?: boolean }).__onboardingCompleted = true;
      }
      setHasCompleted(true);
      setIsCompleting(true);

      DebugUtils.log('🎯 Starting onboarding completion process');
      hapticFeedback.success();

      // Convert onboarding data to backend format
      const backendData = {
        age: parseInt(onboardingData.healthData.age) || 25,
        gender: onboardingData.healthData.gender === 'Please select your gender' ? 'male' : onboardingData.healthData.gender as 'male' | 'female' | 'other',
        height_cm: parseInt(onboardingData.healthData.height) || 175,
        current_weight_kg: parseInt(onboardingData.healthData.weight) || 70,
        activity_level: onboardingData.healthData.activityLevel || 'moderate',
        // Removed advanced metrics - smm, body_fat_percentage, ffm
        bodyTypeGoal: onboardingData.bodyTypeGoal,
        timezone: onboardingData.timezone
      };

      await completeOnboarding(backendData);

      showToast.success('Welcome!', 'Your profile has been set up successfully');
    } catch {
      // Silent error handling - no console logging to prevent Expo Go notifications
      showToast.error('Error', 'Failed to complete setup. Please try again.');
      // Reset flags on error
      completionRef.current = false;
      if (typeof window !== 'undefined') {
        (window as unknown as { __onboardingCompleted?: boolean }).__onboardingCompleted = false;
      }
      setHasCompleted(false);
      setIsCompleting(false);
    } finally {
      setIsCompleting(false);
    }
  }, []); // Remove all dependencies to prevent infinite re-renders

  const handleHealthDataChange = useCallback((healthData: HealthData) => {
    setOnboardingData(prev => ({ ...prev, healthData }));
  }, []);

  const handleBodyTypeChange = useCallback((bodyTypeGoal: string, editedGoal?: Record<string, unknown>) => {
    DebugUtils.log('🔍 handleBodyTypeChange called with:', { bodyTypeGoal, editedGoal });
    setOnboardingData(prev => ({
      ...prev,
      bodyTypeGoal,
      editedBodyTypeGoal: editedGoal
    }));
  }, []);

  const handleBodyTypeValidationChange = useCallback((isValid: boolean) => {
    // Update validation state for this step
    DebugUtils.log('Body type validation changed:', isValid);
  }, []);

  const canGoNext = useMemo(() => {
    if (!currentStepData?.id) return false;
    switch (currentStepData.id) {
      case 'health_data':
        const { age, height, weight, gender, activityLevel } = onboardingData.healthData;
        return age && height && weight && gender && activityLevel && 
               !isNaN(Number(age)) && !isNaN(Number(height)) && !isNaN(Number(weight));
      case 'body_type_goal':
        // Check if body type goal is set (either recommended or specific goal)
        const isValid = !!(onboardingData.bodyTypeGoal &&
                       onboardingData.bodyTypeGoal.length > 0);
        DebugUtils.log('🔍 Body type validation check:', {
          bodyTypeGoal: onboardingData.bodyTypeGoal,
          length: onboardingData.bodyTypeGoal?.length,
          isValid
        });
        return isValid;
      default:
        return true;
    }
  }, [currentStepData.id, onboardingData.healthData, onboardingData.bodyTypeGoal]);

  // Memoize userData for body type goal step
  const userData = useMemo(() => ({
    age: parseInt(onboardingData.healthData.age) || 25,
    height: parseInt(onboardingData.healthData.height) || 175,
    weight: parseInt(onboardingData.healthData.weight) || 70,
    gender: onboardingData.healthData.gender === 'Please select your gender' ? 'male' : onboardingData.healthData.gender as 'male' | 'female',
    activityLevel: onboardingData.healthData.activityLevel as 'sedentary' | 'light' | 'active' | 'very_active',
  }), [
    onboardingData.healthData.age,
    onboardingData.healthData.height,
    onboardingData.healthData.weight,
    onboardingData.healthData.gender,
    onboardingData.healthData.activityLevel
  ]);

  const renderStepContent = () => {
    if (!currentStepData?.id) return null;
    switch (currentStepData.id) {
      case 'health_data':
        return (
          <HealthDataStep
            onDataChange={handleHealthDataChange}
            initialData={onboardingData.healthData}
          />
        );
      case 'body_type_goal':
        return (
          <BodyTypeGoalsStep
            onBodyTypeChange={handleBodyTypeChange}
            initialBodyType={onboardingData.bodyTypeGoal}
            userData={userData}
            onValidationChange={handleBodyTypeValidationChange}
          />
        );
      case 'complete':
        return (
          <OnboardingStep
            icon={currentStepData.icon}
            title={currentStepData.title}
            subtitle={currentStepData.subtitle}
            description={currentStepData.description}
            variant={currentStepData.variant}
            showCompletionButton={true}
            onComplete={handleComplete}
            isCompleting={isCompleting}
          />
        );
      default:
        return (
          <OnboardingStep
            icon={currentStepData.icon}
            title={currentStepData.title}
            subtitle={currentStepData.subtitle}
            description={currentStepData.description}
            variant={currentStepData.variant}
          />
        );
    }
  };

  // Show loading state while data is being loaded
  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="light-content" backgroundColor="#1a1a1a" />
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Preparing your setup...</Text>
        </View>
      </SafeAreaView>
    );
  }

  // Show loading state during completion
  if (isCompleting) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="dark-content" backgroundColor="#f8fafc" />
        <View style={styles.completionLoadingContainer}>
          <Text style={styles.completionLoadingText}>Setting up your profile...</Text>
        </View>
      </SafeAreaView>
    );
  }

  // If we should prevent rendering, return null but only after all hooks
  if (shouldPreventRender) {
    return null;
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#f8fafc" />

        <OnboardingContainer
          currentStep={currentStep}
          totalSteps={ONBOARDING_STEPS.length}
          onNext={handleNext}
          onPrevious={handlePrevious}
          onComplete={handleComplete}
          canGoNext={canGoNext}
          canGoPrevious={!isFirstStep}
          enableSwipe={true}
          isLastStep={isLastStep}
        >
        {renderStepContent()}
      </OnboardingContainer>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background.secondary,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: SPACING.xl,
    backgroundColor: '#1a1a1a',
  },
  loadingText: {
    fontSize: FONT_SIZE.xl,
    fontWeight: '600',
    color: COLORS.text.inverse,
    textAlign: 'center',
  },
  completionLoadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: SPACING.xl,
    backgroundColor: COLORS.background.secondary,
  },
  completionLoadingText: {
    fontSize: FONT_SIZE.xl,
    fontWeight: '600',
    color: '#3b82f6',
    textAlign: 'center',
  },
});
