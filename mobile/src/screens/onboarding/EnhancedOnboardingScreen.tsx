import React, { useState, useCallback, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  StatusBar,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../../contexts/AuthContext';
import OnboardingContainer from '../../components/onboarding/OnboardingContainer';
import OnboardingStep from '../../components/onboarding/OnboardingStep';
import HealthDataStep from '../../components/onboarding/HealthDataStep';
import BodyTypeGoalsStep from '../../components/onboarding/BodyTypeGoalsStep';
import { hapticFeedback } from '../../utils/haptics';
import { showToast } from '../../utils/toast';
import { profileService } from '../../services/profileService';

interface HealthData {
  age: string;
  height: string;
  weight: string;
  gender: 'male' | 'female' | 'other' | '' | 'Please select your gender';
  activityLevel: 'sedentary' | 'light' | 'moderate' | 'active' | 'very_active';
  ffm?: string; // Fat-Free Mass (optional)
  smm?: string; // Skeletal Muscle Mass (optional)
  bodyFat?: string; // Body Fat Percentage (optional)
}

interface OnboardingData {
  healthData: HealthData;
  bodyTypeGoal: string;
  editedBodyTypeGoal?: any; // Store the edited goal details
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
      activityLevel: 'moderate',
      ffm: '',
      smm: '',
      bodyFat: '',
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
    } catch (error) {
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
      console.log('🔄 Component mounted but completion already in progress, preventing reset');
    }
  }, [loadExistingProfileData]);

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
    
    if (isCompleting) {
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
      
      console.log('🎯 Starting onboarding completion process');
      hapticFeedback.success();
      
      // Convert onboarding data to backend format
      const backendData = {
        age: parseInt(onboardingData.healthData.age) || 25,
        gender: onboardingData.healthData.gender === 'Please select your gender' ? 'male' : onboardingData.healthData.gender as 'male' | 'female' | 'other',
        height_cm: parseInt(onboardingData.healthData.height) || 175,
        current_weight_kg: parseInt(onboardingData.healthData.weight) || 70,
        activity_level: onboardingData.healthData.activityLevel,
        smm: onboardingData.healthData.smm ? parseFloat(onboardingData.healthData.smm) : null,
        body_fat_percentage: onboardingData.healthData.bodyFat ? parseFloat(onboardingData.healthData.bodyFat) : null,
        ffm: onboardingData.healthData.ffm ? parseFloat(onboardingData.healthData.ffm) : null,
        bodyTypeGoal: onboardingData.bodyTypeGoal,
        timezone: onboardingData.timezone
      };
      
      await completeOnboarding(backendData);
      
      showToast.success('Welcome!', 'Your profile has been set up successfully');
    } catch (error) {
      // Silent error handling - no console logging to prevent Expo Go notifications
      showToast.error('Error', 'Failed to complete setup. Please try again.');
      // Reset flags on error
      completionRef.current = false;
      if (typeof window !== 'undefined') {
        (window as any).__onboardingCompleted = false;
      }
      setHasCompleted(false);
      setIsCompleting(false);
    } finally {
      setIsCompleting(false);
    }
  }, [onboardingData, completeOnboarding, currentStep, isLastStep, isCompleting, hasCompleted]);

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

  const handleBodyTypeChange = useCallback((bodyTypeGoal: string, editedGoal?: any) => {
    console.log('🔍 handleBodyTypeChange called with:', { bodyTypeGoal, editedGoal });
    setOnboardingData(prev => ({ 
      ...prev, 
      bodyTypeGoal,
      editedBodyTypeGoal: editedGoal
    }));
  }, []);

  const handleBodyTypeValidationChange = useCallback((isValid: boolean) => {
    // Update validation state for this step
    console.log('Body type validation changed:', isValid);
  }, []);


  const canGoNext = () => {
    switch (currentStepData.id) {
      case 'health_data':
        const { age, height, weight } = onboardingData.healthData;
        return age && height && weight && !isNaN(Number(age)) && !isNaN(Number(height)) && !isNaN(Number(weight));
      case 'body_type_goal':
        // Check if body type goal is one of the valid options (using actual UUIDs)
        const validBodyTypeIds = [
          'e5a3f772-4d59-434e-bf06-da04e64ff756', // Sleek & Graceful
          'eda6cd66-d5f8-44a9-8891-7d4ef4f4e5ec', // Strong & Steady
          '76f3a745-02b9-4040-b90e-a1f94d9b91cf'  // Big & Bold
        ];
        const isValid = !!(onboardingData.bodyTypeGoal && 
                       onboardingData.bodyTypeGoal.length > 0 && 
                       validBodyTypeIds.includes(onboardingData.bodyTypeGoal));
        console.log('🔍 Body type validation check:', { 
          bodyTypeGoal: onboardingData.bodyTypeGoal, 
          length: onboardingData.bodyTypeGoal?.length, 
          isValid,
          validBodyTypeIds
        });
        return isValid;
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
      case 'body_type_goal':
        return (
          <BodyTypeGoalsStep
            onBodyTypeChange={handleBodyTypeChange}
            initialBodyType={onboardingData.bodyTypeGoal}
            userData={{
              age: parseInt(onboardingData.healthData.age) || 25,
              height: parseInt(onboardingData.healthData.height) || 175,
              weight: parseInt(onboardingData.healthData.weight) || 70,
              gender: onboardingData.healthData.gender === 'Please select your gender' ? 'male' : onboardingData.healthData.gender as 'male' | 'female' | 'other',
              activityLevel: onboardingData.healthData.activityLevel,
              ffm: onboardingData.healthData.ffm ? parseFloat(onboardingData.healthData.ffm) : undefined,
              smm: onboardingData.healthData.smm ? parseFloat(onboardingData.healthData.smm) : undefined,
              bodyFat: onboardingData.healthData.bodyFat ? parseFloat(onboardingData.healthData.bodyFat) : undefined,
            }}
            onValidationChange={handleBodyTypeValidationChange}
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
          canGoNext={!!canGoNext()}
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
    backgroundColor: '#1a1a1a',
  },
  loadingText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#ffffff',
    textAlign: 'center',
  },
  completionLoadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
    backgroundColor: '#f8fafc',
  },
  completionLoadingText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#3b82f6',
    textAlign: 'center',
  },
});
