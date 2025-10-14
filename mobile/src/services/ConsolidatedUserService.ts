/**
 * Consolidated User Service
 * 
 * Combines:
 * - ProfileService (user profile management)
 * - OnboardingService (onboarding data)
 * - TimezoneDetectionService (timezone handling)
 */

import { api } from './api';
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

export interface OnboardingData {
  healthData: {
    age: string;
    height: string;
    weight: string;
    gender: 'male' | 'female' | 'other';
    activityLevel: 'sedentary' | 'light' | 'active' | 'very_active';
    ffm?: string;
    smm?: string;
    bodyFat?: string;
    workoutDays?: string;
  };
  bodyTypeGoal: string;
  goals: string[];
  timezone: string;
  preferences: {
    notifications: boolean;
    reminders: boolean;
    dataSharing: boolean;
  };
}

export interface UserSettings {
  notifications: {
    workout_reminders: boolean;
    meal_reminders: boolean;
    water_reminders: boolean;
    mood_check_reminders: boolean;
    weekly_reports: boolean;
  };
  privacy: {
    data_sharing: boolean;
    analytics_tracking: boolean;
    crash_reporting: boolean;
  };
  display: {
    theme: 'light' | 'dark' | 'auto';
    units: 'metric' | 'imperial';
    language: string;
  };
}

// ===== CONSOLIDATED USER SERVICE =====

class ConsolidatedUserService {
  // ===== USER PROFILE MANAGEMENT =====

  async getUserProfile(): Promise<UserProfile> {
    try {
      const response = await api.get('/api/v1/health/profile');
      return response;
    } catch (error) {
      DebugUtils.error('Failed to fetch user profile:', error);
      throw error;
    }
  }

  async updateUserProfile(profileData: Partial<UserProfile>): Promise<UserProfile> {
    try {
      const response = await api.put('/api/v1/health/profile', profileData);
      DebugUtils.log('User profile updated successfully:', response);
      return response;
    } catch (error) {
      DebugUtils.error('Failed to update user profile:', error);
      throw error;
    }
  }

  async updateUserSettings(settings: Partial<UserSettings>): Promise<UserSettings> {
    try {
      const response = await api.put('/api/v1/users/settings', settings);
      DebugUtils.log('User settings updated successfully:', response);
      return response;
    } catch (error) {
      DebugUtils.error('Failed to update user settings:', error);
      throw error;
    }
  }

  async getUserSettings(): Promise<UserSettings> {
    try {
      const response = await api.get('/api/v1/users/settings');
      return response;
    } catch (error) {
      DebugUtils.error('Failed to fetch user settings:', error);
      throw error;
    }
  }

  // ===== ONBOARDING MANAGEMENT =====

  async saveOnboardingData(data: OnboardingData): Promise<void> {
    try {
      await api.post('/api/v1/health/onboarding/complete', data);
      DebugUtils.log('Onboarding data saved successfully');
    } catch (error) {
      DebugUtils.error('Failed to save onboarding data:', error);
      throw error;
    }
  }

  async loadOnboardingData(): Promise<OnboardingData | null> {
    try {
      const response = await api.get('/api/v1/health/onboarding/data');
      return response;
    } catch (error) {
      if (error.response?.status === 404) {
        return null; // No onboarding data found
      }
      DebugUtils.error('Failed to load onboarding data:', error);
      throw error;
    }
  }

  async checkOnboardingStatus(): Promise<boolean> {
    try {
      const response = await api.get('/api/v1/health/onboarding/status');
      return response.completed;
    } catch (error) {
      DebugUtils.error('Failed to check onboarding status:', error);
      return false; // Assume not completed if error
    }
  }

  async resetOnboarding(): Promise<void> {
    try {
      await api.delete('/api/v1/health/onboarding/reset');
      DebugUtils.log('Onboarding reset successfully');
    } catch (error) {
      DebugUtils.error('Failed to reset onboarding:', error);
      throw error;
    }
  }

  // ===== TIMEZONE MANAGEMENT =====

  async detectAndUpdateTimezone(): Promise<string> {
    try {
      // Get current timezone from device
      const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
      
      // Update user's timezone
      await this.updateUserProfile({ timezone });
      
      DebugUtils.log('Timezone detected and updated:', timezone);
      return timezone;
    } catch (error) {
      DebugUtils.error('Failed to detect and update timezone:', error);
      // Return fallback timezone
      return 'UTC';
    }
  }

  async getCurrentTimezone(): Promise<string> {
    try {
      const profile = await this.getUserProfile();
      return profile.timezone;
    } catch (error) {
      DebugUtils.error('Failed to get current timezone:', error);
      return 'UTC';
    }
  }

  // ===== DATA CONVERSION UTILITIES =====

  convertToOnboardingData(profile: UserProfile): OnboardingData {
    return {
      healthData: {
        age: profile.health_data.age.toString(),
        height: profile.health_data.height.toString(),
        weight: profile.health_data.weight.toString(),
        gender: profile.health_data.gender,
        activityLevel: profile.health_data.activity_level,
        ffm: profile.health_data.ffm?.toString() || '',
        smm: profile.health_data.smm?.toString() || '',
        bodyFat: profile.health_data.body_fat_percentage?.toString() || '',
        workoutDays: profile.health_data.workout_days_per_week?.toString() || '',
      },
      bodyTypeGoal: profile.bodyTypeGoal,
      goals: profile.goals,
      timezone: profile.timezone,
      preferences: profile.preferences,
    };
  }

  convertFromOnboardingData(data: OnboardingData): Partial<UserProfile> {
    return {
      health_data: {
        age: parseInt(data.healthData.age) || 25,
        height: parseInt(data.healthData.height) || 175,
        weight: parseInt(data.healthData.weight) || 70,
        gender: data.healthData.gender,
        activity_level: data.healthData.activityLevel,
        ffm: data.healthData.ffm ? parseFloat(data.healthData.ffm) : undefined,
        smm: data.healthData.smm ? parseFloat(data.healthData.smm) : undefined,
        body_fat_percentage: data.healthData.bodyFat ? parseFloat(data.healthData.bodyFat) : undefined,
        workout_days_per_week: data.healthData.workoutDays ? parseInt(data.healthData.workoutDays) : undefined,
      },
      bodyTypeGoal: data.bodyTypeGoal,
      goals: data.goals,
      timezone: data.timezone,
      preferences: data.preferences,
    };
  }

  // ===== ACCOUNT MANAGEMENT =====

  async deleteAccount(): Promise<{ success: boolean; message: string }> {
    try {
      await api.delete('/api/v1/users/account');
      DebugUtils.log('Account deleted successfully');
      return { success: true, message: 'Account deleted successfully' };
    } catch (error) {
      DebugUtils.error('Failed to delete account:', error);
      return { success: false, message: 'Failed to delete account' };
    }
  }

  async exportUserData(): Promise<{
    profile: UserProfile;
    health_data: any[];
    workout_logs: any[];
    meal_logs: any[];
    mood_logs: any[];
    export_date: string;
  }> {
    try {
      const response = await api.get('/api/v1/users/export-data');
      return response;
    } catch (error) {
      DebugUtils.error('Failed to export user data:', error);
      throw error;
    }
  }

  // ===== PREFERENCES MANAGEMENT =====

  async updateNotificationPreferences(notifications: UserSettings['notifications']): Promise<void> {
    try {
      await api.put('/api/v1/users/notifications', notifications);
      DebugUtils.log('Notification preferences updated successfully');
    } catch (error) {
      DebugUtils.error('Failed to update notification preferences:', error);
      throw error;
    }
  }

  async updatePrivacyPreferences(privacy: UserSettings['privacy']): Promise<void> {
    try {
      await api.put('/api/v1/users/privacy', privacy);
      DebugUtils.log('Privacy preferences updated successfully');
    } catch (error) {
      DebugUtils.error('Failed to update privacy preferences:', error);
      throw error;
    }
  }

  async updateDisplayPreferences(display: UserSettings['display']): Promise<void> {
    try {
      await api.put('/api/v1/users/display', display);
      DebugUtils.log('Display preferences updated successfully');
    } catch (error) {
      DebugUtils.error('Failed to update display preferences:', error);
      throw error;
    }
  }
}

// Export singleton instance
export const userService = new ConsolidatedUserService();
export default userService;
