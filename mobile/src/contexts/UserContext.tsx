/**
 * UserContext - User profile and onboarding management
 * 
 * Responsibilities:
 * - User profile management
 * - Onboarding state and flow
 * - User preferences and settings
 * - Profile data synchronization
 */

import React, { createContext, useContext, useState, useEffect, ReactNode, useMemo, useCallback } from 'react';
import { api } from '../services/api';
import { userService, OnboardingData } from '../services/ConsolidatedUserService';
import { DebugUtils } from '../utils/debugUtils';

// ===== TYPES =====

export interface UserProfile {
  id: number;
  email: string;
  full_name: string;
  is_active: boolean;
  timezone: string;
  health_data: {
    age: number;
    height: number;
    weight: number;
    gender: 'male' | 'female' | 'other';
    activity_level: 'sedentary' | 'light' | 'active' | 'very_active';
    ffm?: number;
    smm?: number;
    body_fat_percentage?: number;
    workout_days_per_week?: number;
  };
  bodyTypeGoal: string;
  goals: string[];
  preferences: {
    notifications: boolean;
    reminders: boolean;
    dataSharing: boolean;
  };
  created_at: string;
  updated_at: string;
}

export interface OnboardingState {
  needsOnboarding: boolean;
  currentStep: number;
  totalSteps: number;
  isCompleting: boolean;
  onboardingData: OnboardingData | null;
}

export interface UserContextType {
  // Profile state
  profile: UserProfile | null;
  profileLoading: boolean;
  profileError: string | null;
  
  // Onboarding state
  onboarding: OnboardingState;
  
  // Profile actions
  loadProfile: () => Promise<void>;
  updateProfile: (profileData: Partial<UserProfile>) => Promise<void>;
  refreshProfile: () => Promise<void>;
  
  // Onboarding actions
  completeOnboarding: (data?: OnboardingData) => Promise<void>;
  rerunOnboarding: () => void;
  updateOnboardingData: (data: Partial<OnboardingData>) => void;
  setOnboardingStep: (step: number) => void;
  nextOnboardingStep: () => void;
  previousOnboardingStep: () => void;
  
  // Settings actions
  updatePreferences: (preferences: Partial<UserProfile['preferences']>) => Promise<void>;
  updateHealthData: (healthData: Partial<UserProfile['health_data']>) => Promise<void>;
}

// ===== CONTEXT =====

const UserContext = createContext<UserContextType | undefined>(undefined);

interface UserProviderProps {
  children: ReactNode;
}

// ===== PROVIDER =====

export function UserProvider({ children }: UserProviderProps) {
  // Profile state
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [profileLoading, setProfileLoading] = useState(false);
  const [profileError, setProfileError] = useState<string | null>(null);
  
  // Onboarding state
  const [onboarding, setOnboarding] = useState<OnboardingState>({
    needsOnboarding: false,
    currentStep: 0,
    totalSteps: 4,
    isCompleting: false,
    onboardingData: null
  });

  // ===== PROFILE FUNCTIONS =====

  const loadProfile = useCallback(async () => {
    setProfileLoading(true);
    setProfileError(null);
    
    try {
      DebugUtils.log('👤 [USER CONTEXT] Loading user profile...');
      const profileData = await userService.getUserProfile();
      
      if (profileData) {
        setProfile(profileData);
        DebugUtils.log('👤 [USER CONTEXT] Profile loaded successfully');
        
        // Check onboarding status
        const needsOnboarding = !profileData.health_data || !profileData.bodyTypeGoal;
        setOnboarding(prev => ({
          ...prev,
          needsOnboarding
        }));
      } else {
        throw new Error('No profile data received');
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to load profile';
      setProfileError(errorMessage);
      DebugUtils.error('👤 [USER CONTEXT] Error loading profile:', error);
    } finally {
      setProfileLoading(false);
    }
  }, []);

  const updateProfile = useCallback(async (profileData: Partial<UserProfile>) => {
    try {
      DebugUtils.log('👤 [USER CONTEXT] Updating profile...');
      const updatedProfile = await userService.updateUserProfile(profileData);
      
      if (updatedProfile) {
        setProfile(updatedProfile);
        DebugUtils.log('👤 [USER CONTEXT] Profile updated successfully');
      }
    } catch (error) {
      DebugUtils.error('👤 [USER CONTEXT] Error updating profile:', error);
      throw error;
    }
  }, []);

  const refreshProfile = useCallback(async () => {
    await loadProfile();
  }, [loadProfile]);

  // ===== ONBOARDING FUNCTIONS =====

  const completeOnboarding = useCallback(async (data?: OnboardingData) => {
    setOnboarding(prev => ({ ...prev, isCompleting: true }));
    
    try {
      DebugUtils.log('🎉 [USER CONTEXT] Completing onboarding...');
      
      const onboardingData = data || onboarding.onboardingData;
      if (!onboardingData) {
        throw new Error('No onboarding data provided');
      }
      
      await userService.saveOnboardingData(onboardingData);
      
      // Update profile with onboarding data
      const profileUpdate = userService.convertFromOnboardingData(onboardingData);
      await updateProfile(profileUpdate);
      
      setOnboarding(prev => ({
        ...prev,
        needsOnboarding: false,
        isCompleting: false,
        currentStep: 0
      }));
      
      DebugUtils.log('🎉 [USER CONTEXT] Onboarding completed successfully');
    } catch (error) {
      DebugUtils.error('🎉 [USER CONTEXT] Error completing onboarding:', error);
      setOnboarding(prev => ({ ...prev, isCompleting: false }));
      throw error;
    }
  }, [onboarding.onboardingData, updateProfile]);

  const rerunOnboarding = useCallback(() => {
    DebugUtils.log('🔄 [USER CONTEXT] Rerunning onboarding...');
    setOnboarding(prev => ({
      ...prev,
      needsOnboarding: true,
      currentStep: 0,
      onboardingData: null
    }));
  }, []);

  const updateOnboardingData = useCallback((data: Partial<OnboardingData>) => {
    setOnboarding(prev => ({
      ...prev,
      onboardingData: {
        ...prev.onboardingData,
        ...data
      } as OnboardingData
    }));
  }, []);

  const setOnboardingStep = useCallback((step: number) => {
    setOnboarding(prev => ({
      ...prev,
      currentStep: Math.max(0, Math.min(step, prev.totalSteps - 1))
    }));
  }, []);

  const nextOnboardingStep = useCallback(() => {
    setOnboarding(prev => ({
      ...prev,
      currentStep: Math.min(prev.currentStep + 1, prev.totalSteps - 1)
    }));
  }, []);

  const previousOnboardingStep = useCallback(() => {
    setOnboarding(prev => ({
      ...prev,
      currentStep: Math.max(prev.currentStep - 1, 0)
    }));
  }, []);

  // ===== SETTINGS FUNCTIONS =====

  const updatePreferences = useCallback(async (preferences: Partial<UserProfile['preferences']>) => {
    if (!profile) return;
    
    try {
      await updateProfile({
        preferences: {
          ...profile.preferences,
          ...preferences
        }
      });
    } catch (error) {
      DebugUtils.error('👤 [USER CONTEXT] Error updating preferences:', error);
      throw error;
    }
  }, [profile, updateProfile]);

  const updateHealthData = useCallback(async (healthData: Partial<UserProfile['health_data']>) => {
    if (!profile) return;
    
    try {
      await updateProfile({
        health_data: {
          ...profile.health_data,
          ...healthData
        }
      });
    } catch (error) {
      DebugUtils.error('👤 [USER CONTEXT] Error updating health data:', error);
      throw error;
    }
  }, [profile, updateProfile]);

  // ===== EFFECTS =====

  // Load profile on mount
  useEffect(() => {
    loadProfile();
  }, [loadProfile]);

  // ===== CONTEXT VALUE =====

  const value: UserContextType = useMemo(() => ({
    // Profile state
    profile,
    profileLoading,
    profileError,
    
    // Onboarding state
    onboarding,
    
    // Profile actions
    loadProfile,
    updateProfile,
    refreshProfile,
    
    // Onboarding actions
    completeOnboarding,
    rerunOnboarding,
    updateOnboardingData,
    setOnboardingStep,
    nextOnboardingStep,
    previousOnboardingStep,
    
    // Settings actions
    updatePreferences,
    updateHealthData,
  }), [
    profile,
    profileLoading,
    profileError,
    onboarding,
    loadProfile,
    updateProfile,
    refreshProfile,
    completeOnboarding,
    rerunOnboarding,
    updateOnboardingData,
    setOnboardingStep,
    nextOnboardingStep,
    previousOnboardingStep,
    updatePreferences,
    updateHealthData,
  ]);

  return (
    <UserContext.Provider value={value}>
      {children}
    </UserContext.Provider>
  );
}

// ===== HOOK =====

export function useUser() {
  const context = useContext(UserContext);
  if (context === undefined) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
}
