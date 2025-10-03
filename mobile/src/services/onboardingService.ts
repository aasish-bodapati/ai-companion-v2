import AsyncStorage from '@react-native-async-storage/async-storage';
import { apiClient } from './api';

export interface HealthData {
  age: string;
  height: string;
  weight: string;
  gender: 'male' | 'female' | 'other' | '';
  activityLevel: 'sedentary' | 'light' | 'moderate' | 'active' | 'very_active';
  ffm?: string; // Fat-Free Mass (optional)
  smm?: string; // Skeletal Muscle Mass (optional)
  bodyFat?: string; // Body Fat Percentage (optional)
}

export interface OnboardingData {
  healthData: HealthData;
  bodyTypeGoal: string;
  preferences: {
    notifications: boolean;
    reminders: boolean;
    dataSharing: boolean;
  };
}

const ONBOARDING_DATA_KEY = 'onboarding_data';

export const onboardingService = {
  // Save onboarding data locally
  saveOnboardingData: async (data: OnboardingData): Promise<void> => {
    try {
      await AsyncStorage.setItem(ONBOARDING_DATA_KEY, JSON.stringify(data));
    } catch (error) {
      // Silent error handling - no console logging to prevent Expo Go notifications
      throw error;
    }
  },

  // Load onboarding data from local storage
  loadOnboardingData: async (): Promise<OnboardingData | null> => {
    try {
      const data = await AsyncStorage.getItem(ONBOARDING_DATA_KEY);
      return data ? JSON.parse(data) : null;
    } catch (error) {
      // Silent error handling - no console logging to prevent Expo Go notifications
      return null;
    }
  },

  // Update specific health data
  updateHealthData: async (healthData: Partial<HealthData>): Promise<void> => {
    try {
      const currentData = await onboardingService.loadOnboardingData();
      if (currentData) {
        const updatedData = {
          ...currentData,
          healthData: { ...currentData.healthData, ...healthData },
        };
        await onboardingService.saveOnboardingData(updatedData);
      }
    } catch (error) {
      // Silent error handling - no console logging to prevent Expo Go notifications
      throw error;
    }
  },

  // Update goals
  updateGoals: async (goals: string[]): Promise<void> => {
    try {
      const currentData = await onboardingService.loadOnboardingData();
      if (currentData) {
        const updatedData = {
          ...currentData,
          goals,
        };
        await onboardingService.saveOnboardingData(updatedData);
      }
    } catch (error) {
      // Silent error handling - no console logging to prevent Expo Go notifications
      throw error;
    }
  },

  // Update preferences
  updatePreferences: async (preferences: Partial<OnboardingData['preferences']>): Promise<void> => {
    try {
      const currentData = await onboardingService.loadOnboardingData();
      if (currentData) {
        const updatedData = {
          ...currentData,
          preferences: { ...currentData.preferences, ...preferences },
        };
        await onboardingService.saveOnboardingData(updatedData);
      }
    } catch (error) {
      // Silent error handling - no console logging to prevent Expo Go notifications
      throw error;
    }
  },

  // Sync with backend (when available)
  syncWithBackend: async (data: OnboardingData): Promise<void> => {
    try {
      // This would typically sync with your backend API
      // For now, we'll just log it
      // Example API call (uncomment when backend is ready):
      // await apiClient.post('/users/onboarding-data', data);
    } catch (error) {
      throw error;
    }
  },

  // Clear onboarding data
  clearOnboardingData: async (): Promise<void> => {
    try {
      await AsyncStorage.removeItem(ONBOARDING_DATA_KEY);
    } catch (error) {
      // Silent error handling - no console logging to prevent Expo Go notifications
      throw error;
    }
  },

  // Get default onboarding data
  getDefaultOnboardingData: (): OnboardingData => ({
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
    preferences: {
      notifications: true,
      reminders: true,
      dataSharing: false,
    },
  }),
};
