import { apiClient } from './api';

export interface HealthProfile {
  age?: string;
  height?: string;
  weight?: string;
  gender?: string;
  activity_level?: string;
}

export interface UserProfile {
  user_id: number;
  email: string;
  full_name?: string;
  timezone?: string;
  health_data?: HealthProfile;
  goals: string[];
  preferences: {
    notifications: boolean;
    reminders: boolean;
    dataSharing: boolean;
  };
  onboarding_completed: boolean;
}

export const profileService = {
  // Get user profile from backend
  getUserProfile: async (): Promise<UserProfile | null> => {
    try {
      console.log('🔍 ProfileService: Making request to /profile (base URL already includes /api/v1)');
      const response = await apiClient.get('/profile');
      console.log('✅ ProfileService: Successfully got profile data:', response.data);
      return response.data;
    } catch (error) {
      console.error('❌ ProfileService: Failed to get user profile:', error);
      if (error.response) {
        console.error('Response status:', error.response.status);
        console.error('Response data:', error.response.data);
      }
      return null;
    }
  },

  // Update user profile on backend
  updateUserProfile: async (profileData: Partial<UserProfile>): Promise<UserProfile | null> => {
    try {
      const response = await apiClient.put('/profile', profileData);
      return response.data;
    } catch (error) {
      console.error('Failed to update user profile:', error);
      return null;
    }
  },

  // Convert backend profile to onboarding data format
  convertToOnboardingData: (profile: UserProfile) => {
    return {
      healthData: profile.health_data ? {
        age: profile.health_data.age || '',
        height: profile.health_data.height || '',
        weight: profile.health_data.weight || '',
        gender: profile.health_data.gender as 'male' | 'female' | 'other' || 'male',
        activityLevel: profile.health_data.activity_level as 'sedentary' | 'light' | 'moderate' | 'active' | 'very_active' || 'moderate',
      } : {
        age: '',
        height: '',
        weight: '',
        gender: 'male' as const,
        activityLevel: 'moderate' as const,
      },
      goals: profile.goals || [],
      preferences: profile.preferences || {
        notifications: true,
        reminders: true,
        dataSharing: false,
      },
    };
  },

  // Convert onboarding data to backend profile format
  convertToProfileData: (onboardingData: any): Partial<UserProfile> => {
    return {
      health_data: onboardingData.healthData ? {
        age: onboardingData.healthData.age,
        height: onboardingData.healthData.height,
        weight: onboardingData.healthData.weight,
        gender: onboardingData.healthData.gender,
        activity_level: onboardingData.healthData.activityLevel,
      } : undefined,
      goals: onboardingData.goals || [],
      preferences: onboardingData.preferences || {
        notifications: true,
        reminders: true,
        dataSharing: false,
      },
    };
  },
};
