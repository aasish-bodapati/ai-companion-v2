/**
 * Consolidated UI Hook
 * 
 * Combines:
 * - useResponsive (responsive design)
 * - useLoadingState (loading state management)
 * - useAuth (authentication state)
 * - useAuthActions (authentication actions)
 * - useOnboarding (onboarding state)
 * - useHealthLogger (health logging)
 */

import React, { useState, useCallback, useContext } from 'react';
import { Dimensions, Platform } from 'react-native';
import { AuthContext } from '../contexts/AuthContext';
import { DebugUtils } from '../utils/debugUtils';

// ===== TYPES =====

export interface ResponsiveBreakpoints {
  isSmall: boolean;
  isMedium: boolean;
  isLarge: boolean;
  isXLarge: boolean;
  width: number;
  height: number;
  orientation: 'portrait' | 'landscape';
}

export interface LoadingState {
  isLoading: boolean;
  loadingMessage: string | null;
  progress: number | null;
}

export interface HealthLoggerOptions {
  type: 'workout' | 'meal' | 'water' | 'mood' | 'steps';
  onSuccess?: (data: any) => void;
  onError?: (error: string) => void;
}

export interface OnboardingState {
  needsOnboarding: boolean;
  currentStep: number;
  totalSteps: number;
  isCompleting: boolean;
}

// ===== CONSOLIDATED UI HOOK =====

export function useResponsive(): ResponsiveBreakpoints {
  const [dimensions, setDimensions] = useState(() => {
    const { width, height } = Dimensions.get('window');
    return { width, height };
  });

  const updateDimensions = useCallback(() => {
    const { width, height } = Dimensions.get('window');
    setDimensions({ width, height });
  }, []);

  // Listen for dimension changes
  React.useEffect(() => {
    const subscription = Dimensions.addEventListener('change', updateDimensions);
    return () => subscription?.remove();
  }, [updateDimensions]);

  const { width, height } = dimensions;
  const orientation = width > height ? 'landscape' : 'portrait';

  return {
    isSmall: width < 375,
    isMedium: width >= 375 && width < 414,
    isLarge: width >= 414 && width < 768,
    isXLarge: width >= 768,
    width,
    height,
    orientation
  };
}

export function useLoadingState(): LoadingState & {
  setLoading: (loading: boolean, message?: string, progress?: number) => void;
  clearLoading: () => void;
  updateProgress: (progress: number) => void;
} {
  const [state, setState] = useState<LoadingState>({
    isLoading: false,
    loadingMessage: null,
    progress: null
  });

  const setLoading = useCallback((loading: boolean, message?: string, progress?: number) => {
    setState({
      isLoading: loading,
      loadingMessage: message || null,
      progress: progress || null
    });
  }, []);

  const clearLoading = useCallback(() => {
    setState({
      isLoading: false,
      loadingMessage: null,
      progress: null
    });
  }, []);

  const updateProgress = useCallback((progress: number) => {
    setState(prev => ({
      ...prev,
      progress: Math.max(0, Math.min(100, progress))
    }));
  }, []);

  return {
    ...state,
    setLoading,
    clearLoading,
    updateProgress
  };
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

export function useAuthActions() {
  const { login, register, logout, deleteAccount } = useAuth();
  
  return {
    login,
    register,
    logout,
    deleteAccount
  };
}

export function useOnboarding(): OnboardingState & {
  completeOnboarding: (data?: any) => Promise<void>;
  rerunOnboarding: () => void;
  checkOnboardingStatus: () => Promise<boolean>;
  setCurrentStep: (step: number) => void;
  nextStep: () => void;
  previousStep: () => void;
} {
  const { needsOnboarding, setNeedsOnboarding } = useAuth();
  const [currentStep, setCurrentStep] = useState(0);
  const [isCompleting, setIsCompleting] = useState(false);

  const totalSteps = 4; // Adjust based on your onboarding flow

  const completeOnboarding = useCallback(async (data?: any) => {
    DebugUtils.log('🎉 useOnboarding completeOnboarding called with data:', data);
    setIsCompleting(true);
    
    try {
      // Use provided data or default values
      const onboardingData = data || {
        age: 25,
        gender: 'male',
        height_cm: 175,
        current_weight_kg: 70,
        activity_level: 'moderate'
      };

      // Call backend API to complete onboarding
      const response = await fetch('/api/v1/health/onboarding/complete', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(onboardingData)
      });

      if (!response.ok) {
        throw new Error('Failed to complete onboarding');
      }

      DebugUtils.log('🎉 Backend onboarding completion response:', response);
      setNeedsOnboarding(false);
      setCurrentStep(0);
      DebugUtils.log('🎉 useOnboarding completeOnboarding completed - needsOnboarding set to false');
    } catch (error) {
      DebugUtils.error('🎉 useOnboarding completeOnboarding error:', error);
      // Still mark as completed locally to prevent infinite onboarding loop
      setNeedsOnboarding(false);
      setCurrentStep(0);
    } finally {
      setIsCompleting(false);
    }
  }, [setNeedsOnboarding]);

  const rerunOnboarding = useCallback(() => {
    DebugUtils.log('🔄 useOnboarding rerunOnboarding called');
    setNeedsOnboarding(true);
    setCurrentStep(0);
    DebugUtils.log('🔄 useOnboarding rerunOnboarding completed - needsOnboarding set to true');
  }, [setNeedsOnboarding]);

  const checkOnboardingStatus = useCallback(async (): Promise<boolean> => {
    try {
      const response = await fetch('/api/v1/health/onboarding/status');
      const data = await response.json();
      const completed = data.completed;
      
      DebugUtils.log('🔍 useOnboarding checkOnboardingStatus - completed:', completed);
      setNeedsOnboarding(!completed);
      return completed;
    } catch (error) {
      DebugUtils.error('🔍 useOnboarding checkOnboardingStatus error:', error);
      setNeedsOnboarding(true);
      return false;
    }
  }, [setNeedsOnboarding]);

  const nextStep = useCallback(() => {
    setCurrentStep(prev => Math.min(prev + 1, totalSteps - 1));
  }, [totalSteps]);

  const previousStep = useCallback(() => {
    setCurrentStep(prev => Math.max(prev - 1, 0));
  }, []);

  return {
    needsOnboarding,
    currentStep,
    totalSteps,
    isCompleting,
    completeOnboarding,
    rerunOnboarding,
    checkOnboardingStatus,
    setCurrentStep,
    nextStep,
    previousStep
  };
}

export function useHealthLogger({ type, onSuccess, onError }: HealthLoggerOptions) {
  const [isLogging, setIsLogging] = useState(false);

  const logHealthData = useCallback(async (data: Record<string, unknown>) => {
    setIsLogging(true);
    
    try {
      const endpoint = `/api/v1/health/logging/${type}`;
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data)
      });

      if (!response.ok) {
        throw new Error(`Failed to log ${type}`);
      }

      const result = await response.json();
      onSuccess?.(result);
      DebugUtils.log(`✅ Health data logged successfully: ${type}`, result);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      onError?.(errorMessage);
      DebugUtils.error(`❌ Failed to log health data: ${type}`, error);
    } finally {
      setIsLogging(false);
    }
  }, [type, onSuccess, onError]);

  return {
    isLogging,
    logHealthData
  };
}

// ===== UTILITY HOOKS =====

export function usePlatform() {
  return {
    isIOS: Platform.OS === 'ios',
    isAndroid: Platform.OS === 'android',
    platform: Platform.OS
  };
}

export function useOrientation() {
  const { width, height } = useResponsive();
  return width > height ? 'landscape' : 'portrait';
}

export function useSafeArea() {
  const { isSmall, isMedium, isLarge, isXLarge } = useResponsive();
  
  return {
    top: isSmall ? 20 : isMedium ? 25 : isLarge ? 30 : 35,
    bottom: isSmall ? 15 : isMedium ? 20 : isLarge ? 25 : 30,
    left: isSmall ? 10 : isMedium ? 15 : isLarge ? 20 : 25,
    right: isSmall ? 10 : isMedium ? 15 : isLarge ? 20 : 25
  };
}

export function useKeyboard() {
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  const [isKeyboardVisible, setIsKeyboardVisible] = useState(false);

  // This would typically use Keyboard API from React Native
  // For now, we'll provide a basic implementation
  const showKeyboard = useCallback((height: number) => {
    setKeyboardHeight(height);
    setIsKeyboardVisible(true);
  }, []);

  const hideKeyboard = useCallback(() => {
    setKeyboardHeight(0);
    setIsKeyboardVisible(false);
  }, []);

  return {
    keyboardHeight,
    isKeyboardVisible,
    showKeyboard,
    hideKeyboard
  };
}

// ===== SPECIALIZED UI HOOKS =====

export function useToast() {
  // This would integrate with your toast context
  const { showToast } = useContext(AuthContext); // Assuming toast is in AuthContext
  return { showToast };
}

export function useHaptic() {
  const triggerHaptic = useCallback((type: 'light' | 'medium' | 'heavy' = 'light') => {
    // This would integrate with your haptic feedback utility
    DebugUtils.log(`Haptic feedback triggered: ${type}`);
  }, []);

  return { triggerHaptic };
}

export function useTheme() {
  // This would integrate with your theme context
  return {
    colors: {
      primary: '#3b82f6',
      secondary: '#10b981',
      error: '#ef4444',
      warning: '#f59e0b',
      success: '#10b981',
      background: '#ffffff',
      surface: '#f8fafc',
      text: '#0f172a',
      textSecondary: '#64748b'
    },
    spacing: {
      xs: 4,
      sm: 8,
      md: 16,
      lg: 24,
      xl: 32
    },
    borderRadius: {
      sm: 4,
      md: 8,
      lg: 12,
      xl: 16
    }
  };
}
