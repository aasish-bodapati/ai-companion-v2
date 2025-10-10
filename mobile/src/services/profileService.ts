import { apiClient } from './api';

export interface HealthProfile {
  age?: string;
  height?: string;
  weight?: string;
  gender?: string;
  activity_level?: string;
  smm?: string; // Skeletal Muscle Mass
  body_fat_percentage?: string; // Body Fat Percentage
  ffm?: string; // Fat-Free Mass
  workout_days_per_week?: string; // Workout days per week
}

export interface UserProfile {
  user_id: number;
  email: string;
  full_name?: string;
  timezone?: string;
  health_data?: HealthProfile;
  goals: string[];
  bodyTypeGoal?: string;
  bodyTypeGoals?: Record<string, unknown>[]; // User's body type goals
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
      const response = await apiClient.get('/profile');
      return response.data;
    } catch {
      // Silent error handling - no console logging to prevent Expo Go notifications
      return null;
    }
  },

  // Update user profile on backend
  updateUserProfile: async (profileData: Partial<UserProfile>): Promise<UserProfile | null> => {
    try {
      const response = await apiClient.put('/profile', profileData);
      return response.data;
    } catch {
      // Silent error handling - no console logging to prevent Expo Go notifications
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
        gender: profile.health_data.gender as 'male' | 'female' | 'other' || '',
        activityLevel: profile.health_data.activity_level as 'sedentary' | 'light' | 'moderate' | 'active' | 'very_active' || 'moderate',
        ffm: profile.health_data.ffm || '',
        smm: profile.health_data.smm || '',
        bodyFat: profile.health_data.body_fat_percentage || '',
        workoutDays: profile.health_data.workout_days_per_week || '',
      } : {
        age: '',
        height: '',
        weight: '',
        gender: '' as const,
        activityLevel: 'moderate' as const,
        ffm: '',
        smm: '',
        bodyFat: '',
        workoutDays: '',
      },
      bodyTypeGoal: profile.bodyTypeGoal || '',
      goals: profile.goals || [],
      timezone: profile.timezone || 'UTC',
      preferences: profile.preferences || {
        notifications: true,
        reminders: true,
        dataSharing: false,
      },
    };
  },

  // Convert onboarding data to backend profile format
  convertToProfileData: (onboardingData: Record<string, unknown>): Partial<UserProfile> => {
    return {
      health_data: onboardingData.healthData ? {
        age: onboardingData.healthData.age,
        height: onboardingData.healthData.height,
        weight: onboardingData.healthData.weight,
        gender: onboardingData.healthData.gender,
        activity_level: onboardingData.healthData.activityLevel,
        ffm: onboardingData.healthData.ffm,
        smm: onboardingData.healthData.smm,
        body_fat_percentage: onboardingData.healthData.bodyFat,
        workout_days_per_week: onboardingData.healthData.workoutDays,
      } : undefined,
      bodyTypeGoal: onboardingData.bodyTypeGoal || '',
      goals: onboardingData.goals || [],
      preferences: onboardingData.preferences || {
        notifications: true,
        reminders: true,
        dataSharing: false,
      },
    };
  },
};
