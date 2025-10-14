/**
 * Consolidated Notifications Service
 * 
 * Combines:
 * - SmartNotificationsService (smart notifications)
 * - WeatherService (weather notifications)
 */

import { api } from './api';
import { DebugUtils } from '../utils/debugUtils';

// ===== TYPES =====

export interface NotificationSettings {
  workout_reminders: boolean;
  meal_reminders: boolean;
  water_reminders: boolean;
  mood_check_reminders: boolean;
  weekly_reports: boolean;
  weather_alerts: boolean;
  goal_reminders: boolean;
  achievement_notifications: boolean;
  quiet_hours: {
    enabled: boolean;
    start_time: string; // HH:MM format
    end_time: string; // HH:MM format
  };
  frequency: 'high' | 'medium' | 'low';
}

export interface Notification {
  id: string;
  type: 'workout' | 'meal' | 'water' | 'mood' | 'weather' | 'goal' | 'achievement' | 'general';
  title: string;
  message: string;
  priority: 'high' | 'medium' | 'low';
  scheduled_for?: string;
  sent_at?: string;
  read: boolean;
  action_url?: string;
  metadata?: Record<string, any>;
}

export interface WeatherData {
  location: string;
  temperature: number;
  condition: string;
  humidity: number;
  wind_speed: number;
  uv_index: number;
  country: string;
}

export interface WeatherAlert {
  id: string;
  type: 'temperature' | 'rain' | 'wind' | 'uv' | 'air_quality';
  severity: 'low' | 'medium' | 'high' | 'extreme';
  title: string;
  message: string;
  valid_until: string;
  action_required: boolean;
}

export interface SmartNotification {
  id: string;
  type: 'adaptive' | 'contextual' | 'predictive';
  title: string;
  message: string;
  priority: 'high' | 'medium' | 'low';
  triggers: string[];
  conditions: Record<string, any>;
  scheduled_for?: string;
  sent_at?: string;
  read: boolean;
}

// ===== CONSOLIDATED NOTIFICATIONS SERVICE =====

class ConsolidatedNotificationsService {
  // ===== NOTIFICATION SETTINGS =====

  async getNotificationSettings(): Promise<NotificationSettings> {
    try {
      const response = await api.get('/api/v1/notifications/settings');
      return response;
    } catch (error) {
      DebugUtils.error('Failed to fetch notification settings:', error);
      throw error;
    }
  }

  async updateNotificationSettings(settings: Partial<NotificationSettings>): Promise<NotificationSettings> {
    try {
      const response = await api.put('/api/v1/notifications/settings', settings);
      DebugUtils.log('Notification settings updated successfully:', response);
      return response;
    } catch (error) {
      DebugUtils.error('Failed to update notification settings:', error);
      throw error;
    }
  }

  // ===== NOTIFICATION MANAGEMENT =====

  async getNotifications(limit: number = 50, unread_only: boolean = false): Promise<Notification[]> {
    try {
      const params = { limit, unread_only };
      const response = await api.get('/api/v1/notifications', { params });
      return response;
    } catch (error) {
      DebugUtils.error('Failed to fetch notifications:', error);
      throw error;
    }
  }

  async markNotificationAsRead(id: string): Promise<void> {
    try {
      await api.put(`/api/v1/notifications/${id}/read`);
      DebugUtils.log('Notification marked as read');
    } catch (error) {
      DebugUtils.error(`Failed to mark notification ${id} as read:`, error);
      throw error;
    }
  }

  async markAllNotificationsAsRead(): Promise<void> {
    try {
      await api.put('/api/v1/notifications/read-all');
      DebugUtils.log('All notifications marked as read');
    } catch (error) {
      DebugUtils.error('Failed to mark all notifications as read:', error);
      throw error;
    }
  }

  async deleteNotification(id: string): Promise<void> {
    try {
      await api.delete(`/api/v1/notifications/${id}`);
      DebugUtils.log('Notification deleted successfully');
    } catch (error) {
      DebugUtils.error(`Failed to delete notification ${id}:`, error);
      throw error;
    }
  }

  // ===== SMART NOTIFICATIONS =====

  async getSmartNotifications(): Promise<SmartNotification[]> {
    try {
      const response = await api.get('/api/v1/notifications/smart');
      return response;
    } catch (error) {
      DebugUtils.error('Failed to fetch smart notifications:', error);
      throw error;
    }
  }

  async createSmartNotification(notification: Omit<SmartNotification, 'id' | 'sent_at' | 'read'>): Promise<SmartNotification> {
    try {
      const response = await api.post('/api/v1/notifications/smart', notification);
      DebugUtils.log('Smart notification created successfully:', response);
      return response;
    } catch (error) {
      DebugUtils.error('Failed to create smart notification:', error);
      throw error;
    }
  }

  async updateSmartNotification(id: string, notification: Partial<SmartNotification>): Promise<SmartNotification> {
    try {
      const response = await api.put(`/api/v1/notifications/smart/${id}`, notification);
      DebugUtils.log('Smart notification updated successfully:', response);
      return response;
    } catch (error) {
      DebugUtils.error(`Failed to update smart notification ${id}:`, error);
      throw error;
    }
  }

  // ===== WEATHER NOTIFICATIONS =====

  async getCurrentWeather(): Promise<WeatherData> {
    try {
      const response = await api.get('/api/v1/notifications/weather/current');
      return response;
    } catch (error) {
      DebugUtils.error('Failed to fetch current weather:', error);
      throw error;
    }
  }

  async getWeatherAlerts(): Promise<WeatherAlert[]> {
    try {
      const response = await api.get('/api/v1/notifications/weather/alerts');
      return response;
    } catch (error) {
      DebugUtils.error('Failed to fetch weather alerts:', error);
      throw error;
    }
  }

  async setWeatherLocation(latitude: number, longitude: number): Promise<void> {
    try {
      await api.post('/api/v1/notifications/weather/location', {
        latitude,
        longitude
      });
      DebugUtils.log('Weather location set successfully');
    } catch (error) {
      DebugUtils.error('Failed to set weather location:', error);
      throw error;
    }
  }

  // ===== WEATHER UTILITIES =====

  getWeatherIcon(iconCode: string): string {
    // Map OpenWeatherMap icon codes to Ionicons
    const iconMap: { [key: string]: string } = {
      '01d': 'sunny',
      '01n': 'moon',
      '02d': 'partly-sunny',
      '02n': 'cloudy-night',
      '03d': 'cloudy',
      '03n': 'cloudy',
      '04d': 'cloudy',
      '04n': 'cloudy',
      '09d': 'rainy',
      '09n': 'rainy',
      '10d': 'rainy',
      '10n': 'rainy',
      '11d': 'thunderstorm',
      '11n': 'thunderstorm',
      '13d': 'snow',
      '13n': 'snow',
      '50d': 'partly-sunny',
      '50n': 'cloudy-night',
    };
    return iconMap[iconCode] || 'partly-sunny';
  }

  getWeatherColor(iconCode: string): string {
    // Map weather conditions to colors
    const colorMap: { [key: string]: string } = {
      '01d': '#f59e0b', // sunny
      '01n': '#6366f1', // clear night
      '02d': '#f97316', // partly cloudy day
      '02n': '#8b5cf6', // partly cloudy night
      '03d': '#6b7280', // cloudy
      '03n': '#6b7280', // cloudy
      '04d': '#6b7280', // overcast
      '04n': '#6b7280', // overcast
      '09d': '#3b82f6', // rain
      '09n': '#3b82f6', // rain
      '10d': '#3b82f6', // rain
      '10n': '#3b82f6', // rain
      '11d': '#7c3aed', // thunderstorm
      '11n': '#7c3aed', // thunderstorm
      '13d': '#e5e7eb', // snow
      '13n': '#e5e7eb', // snow
      '50d': '#9ca3af', // mist
      '50n': '#9ca3af', // mist
    };
    return colorMap[iconCode] || '#6b7280';
  }

  // ===== NOTIFICATION SCHEDULING =====

  async scheduleNotification(notification: {
    type: Notification['type'];
    title: string;
    message: string;
    priority: Notification['priority'];
    scheduled_for: string;
    action_url?: string;
    metadata?: Record<string, any>;
  }): Promise<Notification> {
    try {
      const response = await api.post('/api/v1/notifications/schedule', notification);
      DebugUtils.log('Notification scheduled successfully:', response);
      return response;
    } catch (error) {
      DebugUtils.error('Failed to schedule notification:', error);
      throw error;
    }
  }

  async cancelScheduledNotification(id: string): Promise<void> {
    try {
      await api.delete(`/api/v1/notifications/schedule/${id}`);
      DebugUtils.log('Scheduled notification cancelled successfully');
    } catch (error) {
      DebugUtils.error(`Failed to cancel scheduled notification ${id}:`, error);
      throw error;
    }
  }

  // ===== NOTIFICATION ANALYTICS =====

  async getNotificationAnalytics(period: 'week' | 'month' | 'quarter' = 'month'): Promise<{
    total_sent: number;
    total_read: number;
    read_rate: number;
    click_rate: number;
    engagement_score: number;
    top_notification_types: Array<{
      type: string;
      count: number;
      read_rate: number;
    }>;
    user_preferences: {
      most_engaged_time: string;
      preferred_frequency: string;
      most_clicked_types: string[];
    };
  }> {
    try {
      const response = await api.get(`/api/v1/notifications/analytics/${period}`);
      return response;
    } catch (error) {
      DebugUtils.error(`Failed to fetch ${period} notification analytics:`, error);
      throw error;
    }
  }

  // ===== NOTIFICATION TESTING =====

  async sendTestNotification(type: Notification['type']): Promise<void> {
    try {
      await api.post('/api/v1/notifications/test', { type });
      DebugUtils.log('Test notification sent successfully');
    } catch (error) {
      DebugUtils.error('Failed to send test notification:', error);
      throw error;
    }
  }

  // ===== NOTIFICATION PREFERENCES =====

  async updateNotificationPreferences(preferences: {
    workout_reminders?: boolean;
    meal_reminders?: boolean;
    water_reminders?: boolean;
    mood_check_reminders?: boolean;
    weekly_reports?: boolean;
    weather_alerts?: boolean;
    goal_reminders?: boolean;
    achievement_notifications?: boolean;
  }): Promise<void> {
    try {
      await api.put('/api/v1/notifications/preferences', preferences);
      DebugUtils.log('Notification preferences updated successfully');
    } catch (error) {
      DebugUtils.error('Failed to update notification preferences:', error);
      throw error;
    }
  }

  // ===== NOTIFICATION CLEANUP =====

  async cleanupOldNotifications(days_old: number = 30): Promise<{
    deleted_count: number;
    cleaned_at: string;
  }> {
    try {
      const response = await api.post('/api/v1/notifications/cleanup', { days_old });
      DebugUtils.log('Old notifications cleaned up successfully:', response);
      return response;
    } catch (error) {
      DebugUtils.error('Failed to cleanup old notifications:', error);
      throw error;
    }
  }
}

// Export singleton instance
export const notificationsService = new ConsolidatedNotificationsService();
export default notificationsService;
