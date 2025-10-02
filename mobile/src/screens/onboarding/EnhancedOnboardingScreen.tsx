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

// Helper function to check if health data actually has meaningful values
const hasActualHealthData = (healthData: any): boolean => {
  if (!healthData) return false;
  
  // Check if any of the main health fields have actual values
  const hasAge = healthData.age && healthData.age.trim() !== '';
  const hasHeight = healthData.height && healthData.height.trim() !== '';
  const hasWeight = healthData.weight && healthData.weight.trim() !== '';
  const hasGender = healthData.gender && healthData.gender.trim() !== '';
  
  // Return true if at least one main field has data
  return hasAge || hasHeight || hasWeight || hasGender;
};

interface HealthData {
  age: string;
  height: string;
  weight: string;
  gender: 'male' | 'female' | 'other' | '';
  activityLevel: 'sedentary' | 'light' | 'moderate' | 'active' | 'very_active';
  ffm?: string; // Fat-Free Mass (optional)
  smm?: string; // Skeletal Muscle Mass (optional)
  bodyFat?: string; // Body Fat Percentage (optional)
}

interface OnboardingData {
  healthData: HealthData;
  bodyTypeGoal: string;
  editedBodyTypeGoal?: any; // Store the edited goal details
  preferences: {
    notifications: boolean;
    reminders: boolean;
    dataSharing: boolean;
  };
}

// Dynamic onboarding steps based on whether user has existing data
const getOnboardingSteps = (hasExistingData: boolean) => [
  {
    id: 'welcome',
    title: hasExistingData ? 'Update Your Profile' : 'Welcome to HealthLog!',
    subtitle: hasExistingData ? 'Edit Your Health Data and Goals' : 'Let\'s Set Up Your Health Profile',
    description: hasExistingData 
      ? 'Review and update your health information, body type goals, and preferences. Your existing data has been pre-filled for easy editing.'
      : 'We\'ll help you set up your health profile with your basic information, goals, and preferences to get you started.',
    icon: hasExistingData ? 'create-outline' : 'rocket-outline',
    variant: 'centered' as const,
  },
  {
    id: 'health_data',
    title: hasExistingData ? 'Update Your Health Info' : 'Your Health Information',
    subtitle: hasExistingData ? 'Review and Edit Your Health Data' : 'Tell Us About Yourself',
    description: hasExistingData 
      ? 'Review and update your health information. Your existing data has been pre-filled for easy editing.'
      : 'Please provide your basic health information so we can personalize your experience.',
    icon: 'person-outline',
    variant: 'minimal' as const,
  },
  {
    id: 'body_type_goal',
    title: hasExistingData ? 'Update Your Body Type Goal' : 'Your Body Type Goal',
    subtitle: hasExistingData ? 'Review and Edit Your Body Type Goal' : 'What\'s Your Goal?',
    description: hasExistingData 
      ? 'Review and update your body type goal. Your current selection has been pre-filled for easy editing.'
      : 'Choose your body type goal to help us create personalized recommendations for you.',
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
      gender: '', // No pre-selection for new users
      activityLevel: 'moderate',
      ffm: '',
      smm: '',
      bodyFat: '',
    },
    bodyTypeGoal: '',
    preferences: {
      notifications: true,
      reminders: true,
      dataSharing: false,
    },
  });
  const [loading, setLoading] = useState(false);
  const [isCompleting, setIsCompleting] = useState(false);
  const [dataLoaded, setDataLoaded] = useState(false);
  const [hasExistingData, setHasExistingData] = useState(false);
  const { completeOnboarding } = useAuth();
  const completionRef = useRef(false);

  // Load existing profile data to pre-populate onboarding
  const loadExistingProfileData = useCallback(async () => {
    try {
      setLoading(true);
      
      const profileData = await profileService.getUserProfile();
      
      if (profileData && profileData.health_data && hasActualHealthData(profileData.health_data)) {
        // Convert backend data to onboarding format
        const existingData = profileService.convertToOnboardingData(profileData);
        
        // Pre-populate the form with existing data
        setOnboardingData(existingData);
        setHasExistingData(true);
      } else {
        // For new users, don't pre-select gender
        setHasExistingData(false);
      }
    } catch (error) {
      // Keep default values if no existing data
      setHasExistingData(false);
    } finally {
      setLoading(false);
      setDataLoaded(true);
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

  const onboardingSteps = getOnboardingSteps(hasExistingData);
  const currentStepData = onboardingSteps[currentStep];
  const isLastStep = currentStep === onboardingSteps.length - 1;
  const isFirstStep = currentStep === 0;
  
  console.log('📊 Step info - currentStep:', currentStep, 'totalSteps:', onboardingSteps.length, 'isLastStep:', isLastStep, 'currentStepData:', currentStepData?.id);

  const handlePrevious = useCallback(() => {
    if (currentStep > 0) {
      hapticFeedback.light();
      setCurrentStep(prev => prev - 1);
    }
  }, [currentStep]);

  const handleNext = useCallback(() => {
    console.log('🔄 handleNext called - currentStep:', currentStep, 'isLastStep:', isLastStep, 'totalSteps:', onboardingSteps.length, 'isCompleting:', isCompleting, 'hasCompleted:', hasCompleted);
    
    if (hasCompleted || completionRef.current) {
      console.log('⚠️ Onboarding already completed, skipping navigation');
      return;
    }
    
    if (isCompleting) {
      console.log('⚠️ Already completing onboarding, skipping');
      return;
    }
    
    if (currentStep < onboardingSteps.length - 1) {
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
        activity_level: onboardingData.healthData.activityLevel,
        smm: onboardingData.healthData.smm ? parseFloat(onboardingData.healthData.smm) : null,
        body_fat_percentage: onboardingData.healthData.bodyFat ? parseFloat(onboardingData.healthData.bodyFat) : null,
        ffm: onboardingData.healthData.ffm ? parseFloat(onboardingData.healthData.ffm) : null,
        bodyTypeGoal: onboardingData.bodyTypeGoal
      };
      
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

  const handleBodyTypeChange = useCallback((bodyTypeGoal: string, editedGoal?: any) => {
    console.log('🔍 handleBodyTypeChange called with:', { bodyTypeGoal, editedGoal });
    setOnboardingData(prev => ({ 
      ...prev, 
      bodyTypeGoal,
      editedBodyTypeGoal: editedGoal
    }));
  }, []);

  const canGoNext = () => {
    switch (currentStepData.id) {
      case 'health_data':
        const { age, height, weight } = onboardingData.healthData;
        return age && height && weight && !isNaN(Number(age)) && !isNaN(Number(height)) && !isNaN(Number(weight));
      case 'body_type_goal':
        return onboardingData.bodyTypeGoal.length > 0;
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
            isPrePopulated={dataLoaded}
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
              gender: onboardingData.healthData.gender,
              activityLevel: onboardingData.healthData.activityLevel,
              ffm: onboardingData.healthData.ffm ? parseFloat(onboardingData.healthData.ffm) : undefined,
              smm: onboardingData.healthData.smm ? parseFloat(onboardingData.healthData.smm) : undefined,
              bodyFat: onboardingData.healthData.bodyFat ? parseFloat(onboardingData.healthData.bodyFat) : undefined,
            }}
            isPrePopulated={dataLoaded}
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

  // Show loading while data is being loaded
  if (loading && !dataLoaded) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="light-content" backgroundColor="#1a1a1a" />
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading your data...</Text>
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
          totalSteps={onboardingSteps.length}
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
