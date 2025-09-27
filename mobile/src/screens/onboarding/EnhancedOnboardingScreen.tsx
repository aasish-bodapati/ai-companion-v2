import React, { useState, useCallback, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  Alert,
} from 'react-native';
import { useAuth } from '../../contexts/AuthContext';
import OnboardingContainer from '../../components/onboarding/OnboardingContainer';
import OnboardingStep from '../../components/onboarding/OnboardingStep';
import HealthDataStep from '../../components/onboarding/HealthDataStep';
import HealthGoalsStep from '../../components/onboarding/HealthGoalsStep';
import { hapticFeedback } from '../../utils/haptics';
import { showToast } from '../../utils/toast';

interface HealthData {
  age: string;
  height: string;
  weight: string;
  gender: 'male' | 'female' | 'other';
  activityLevel: 'sedentary' | 'light' | 'moderate' | 'active' | 'very_active';
}

interface OnboardingData {
  healthData: HealthData;
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
    title: 'Welcome to AI Companion',
    subtitle: 'Your Personal Health Assistant',
    description: 'Track your fitness, nutrition, and wellness journey with AI-powered insights and personalized recommendations. Monitor workouts, log meals, track mood, and analyze patterns. Our AI analyzes your data to provide personalized recommendations and help you make informed health decisions.',
    icon: 'sparkles-outline',
    variant: 'centered' as const,
  },
  {
    id: 'health_data',
    title: 'Tell Us About Yourself',
    subtitle: 'Help Us Personalize Your Experience',
    description: 'Share your basic health information so we can provide accurate recommendations and track your progress effectively.',
    icon: 'person-outline',
    variant: 'minimal' as const,
  },
  {
    id: 'goals',
    title: 'Set Your Health Goals',
    subtitle: 'What Do You Want to Achieve?',
    description: 'Choose your health and wellness goals. We\'ll create a personalized plan to help you achieve them.',
    icon: 'flag-outline',
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
  console.log('🚀 EnhancedOnboardingScreen mounted/re-rendered');
  const [currentStep, setCurrentStep] = useState(0);
  const [hasCompleted, setHasCompleted] = useState(false);
  const [onboardingData, setOnboardingData] = useState<OnboardingData>({
    healthData: {
      age: '',
      height: '',
      weight: '',
      gender: 'male',
      activityLevel: 'moderate',
    },
    goals: [],
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

  // Reset state when component mounts (for rerun onboarding)
  useEffect(() => {
    console.log('🔄 EnhancedOnboardingScreen mounted - resetting state');
    if (!completionRef.current) {
      setHasCompleted(false);
      setIsCompleting(false);
      setLoading(false);
      setCurrentStep(0);
    } else {
      console.log('🔄 Component mounted but completion already in progress, preventing reset');
    }
  }, []);

  // Check if we should prevent rendering (but don't return early to avoid hooks violation)
  const shouldPreventRender = hasCompleted || isCompleting || completionRef.current || 
    (typeof window !== 'undefined' && (window as any).__onboardingCompleted);
  
  if (shouldPreventRender) {
    console.log('🔄 Onboarding completed/completing, preventing re-render');
  }

  // Check if onboarding should be completed and redirect
  useEffect(() => {
    if (hasCompleted && !isCompleting) {
      console.log('🔄 Onboarding completed, component should unmount soon');
    }
  }, [hasCompleted, isCompleting]);

  // Cleanup global flag on unmount
  useEffect(() => {
    return () => {
      if (typeof window !== 'undefined') {
        (window as any).__onboardingCompleted = false;
      }
    };
  }, []);

  useEffect(() => {
    console.log('🔄 EnhancedOnboardingScreen useEffect - currentStep:', currentStep);
    
    return () => {
      console.log('🧹 EnhancedOnboardingScreen cleanup - currentStep:', currentStep);
    };
  }, [currentStep]);

  const currentStepData = ONBOARDING_STEPS[currentStep];
  const isLastStep = currentStep === ONBOARDING_STEPS.length - 1;
  const isFirstStep = currentStep === 0;
  
  console.log('📊 Step info - currentStep:', currentStep, 'totalSteps:', ONBOARDING_STEPS.length, 'isLastStep:', isLastStep, 'currentStepData:', currentStepData?.id);

  const handlePrevious = useCallback(() => {
    if (currentStep > 0) {
      hapticFeedback.light();
      setCurrentStep(prev => prev - 1);
    }
  }, [currentStep]);

  const handleNext = useCallback(() => {
    console.log('🔄 handleNext called - currentStep:', currentStep, 'isLastStep:', isLastStep, 'totalSteps:', ONBOARDING_STEPS.length, 'isCompleting:', isCompleting, 'hasCompleted:', hasCompleted);
    
    if (hasCompleted || completionRef.current) {
      console.log('⚠️ Onboarding already completed, skipping navigation');
      return;
    }
    
    if (isCompleting) {
      console.log('⚠️ Already completing onboarding, skipping');
      return;
    }
    
    if (currentStep < ONBOARDING_STEPS.length - 1) {
      console.log('➡️ Moving to next step');
      hapticFeedback.medium();
      setCurrentStep(prev => prev + 1);
    } else if (isLastStep) {
      console.log('✅ On last step, completing onboarding immediately');
      // Set completion ref immediately to prevent any re-mounting
      completionRef.current = true;
      // If on the last step, complete onboarding immediately without animation
      handleComplete();
    }
  }, [currentStep, isLastStep, isCompleting, hasCompleted]);

  const handleComplete = useCallback(async () => {
    console.log('🎯 handleComplete called - currentStep:', currentStep, 'isLastStep:', isLastStep, 'isCompleting:', isCompleting, 'hasCompleted:', hasCompleted);
    
    if (hasCompleted) {
      console.log('⚠️ Onboarding already completed, skipping');
      return;
    }
    
    if (isCompleting || loading) {
      console.log('⚠️ handleComplete already in progress, skipping');
      return;
    }
    
    try {
      // Set completion flags immediately to prevent double calls
      completionRef.current = true;
      if (typeof window !== 'undefined') {
        (window as any).__onboardingCompleted = true;
      }
      setHasCompleted(true);
      setIsCompleting(true);
      setLoading(true);
      
      console.log('🎯 Starting onboarding completion process');
      hapticFeedback.success();
      
      // Convert onboarding data to backend format
      const backendData = {
        age: parseInt(onboardingData.healthData.age) || 25,
        gender: onboardingData.healthData.gender,
        height_cm: parseInt(onboardingData.healthData.height) || 175,
        current_weight_kg: parseInt(onboardingData.healthData.weight) || 70,
        activity_level: onboardingData.healthData.activityLevel
      };
      
      console.log('Onboarding data:', onboardingData);
      console.log('Backend data:', backendData);
      
      console.log('🎯 Calling completeOnboarding from AuthContext');
      await completeOnboarding(backendData);
      
      showToast.success('Welcome!', 'Your profile has been set up successfully');
    } catch (error) {
      console.error('Failed to complete onboarding:', error);
      showToast.error('Error', 'Failed to complete setup. Please try again.');
      // Reset flags on error
      completionRef.current = false;
      if (typeof window !== 'undefined') {
        (window as any).__onboardingCompleted = false;
      }
      setHasCompleted(false);
      setIsCompleting(false);
    } finally {
      setLoading(false);
      setIsCompleting(false);
    }
  }, [onboardingData, completeOnboarding, loading, currentStep, isLastStep, isCompleting, hasCompleted]);

  const handleSkip = useCallback(() => {
    Alert.alert(
      'Skip Onboarding',
      'Are you sure you want to skip the setup? You can always complete it later in settings.',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Skip',
          style: 'destructive',
          onPress: () => {
            hapticFeedback.light();
            completeOnboarding();
          },
        },
      ]
    );
  }, [completeOnboarding]);

  const handleHealthDataChange = useCallback((healthData: HealthData) => {
    setOnboardingData(prev => ({ ...prev, healthData }));
  }, []);

  const handleGoalsChange = useCallback((goals: string[]) => {
    setOnboardingData(prev => ({ ...prev, goals }));
  }, []);

  const canGoNext = () => {
    switch (currentStepData.id) {
      case 'health_data':
        const { age, height, weight } = onboardingData.healthData;
        return age && height && weight && !isNaN(Number(age)) && !isNaN(Number(height)) && !isNaN(Number(weight));
      case 'goals':
        return onboardingData.goals.length > 0;
      default:
        return true;
    }
  };

  const renderStepContent = () => {
    switch (currentStepData.id) {
      case 'health_data':
        return (
          <HealthDataStep
            onDataChange={handleHealthDataChange}
            initialData={onboardingData.healthData}
          />
        );
      case 'goals':
        return (
          <HealthGoalsStep
            onGoalsChange={handleGoalsChange}
            initialGoals={onboardingData.goals}
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

  // Show loading state during completion
  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="dark-content" backgroundColor="#f8fafc" />
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Setting up your profile...</Text>
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
          canGoNext={canGoNext() || false}
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
    backgroundColor: '#f8fafc',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  loadingText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#3b82f6',
    textAlign: 'center',
  },
});
