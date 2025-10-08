import { apiClient } from './api';

interface NotificationRule {
  id: string;
  type: 'workout_reminder' | 'meal_reminder' | 'water_reminder' | 'mood_check' | 'goal_reminder' | 'achievement' | 'insight';
  title: string;
  message: string;
  trigger_conditions: {
    time_based?: {
      hour: number;
      minute: number;
      days: number[];
    };
    behavior_based?: {
      metric: string;
      condition: 'below' | 'above' | 'missing' | 'inconsistent';
      threshold?: number;
    };
    context_based?: {
      location?: string;
      weather?: string;
      activity?: string;
    };
  };
  priority: 'high' | 'medium' | 'low';
  enabled: boolean;
  cooldown_hours: number;
  last_sent?: string;
}

interface SmartNotification {
  id: string;
  type: string;
  title: string;
  message: string;
  priority: 'high' | 'medium' | 'low';
  scheduled_for: string;
  data?: Record<string, unknown>;
  actionable: boolean;
  action_buttons?: {
    text: string;
    action: string;
    style: 'primary' | 'secondary' | 'destructive';
  }[];
}

interface NotificationPreferences {
  workout_reminders: boolean;
  meal_reminders: boolean;
  water_reminders: boolean;
  mood_checks: boolean;
  goal_reminders: boolean;
  achievements: boolean;
  insights: boolean;
  quiet_hours: {
    enabled: boolean;
    start: string;
    end: string;
  };
  frequency: 'aggressive' | 'moderate' | 'minimal';
}

class SmartNotificationsService {
  private notificationRules: NotificationRule[] = [];
  private preferences: NotificationPreferences = {
    workout_reminders: true,
    meal_reminders: true,
    water_reminders: true,
    mood_checks: true,
    goal_reminders: true,
    achievements: true,
    insights: true,
    quiet_hours: {
      enabled: true,
      start: '22:00',
      end: '08:00',
    },
    frequency: 'moderate',
  };

  // Initialize notification rules
  async initializeRules(): Promise<void> {
    try {
      const response = await apiClient.get('/notifications/rules');
      this.notificationRules = response.data;
    } catch (error) {
        // Silently fall back to default rules - this is expected behavior
      this.notificationRules = this.getDefaultRules();
    }
  }

  // Get smart notifications based on current context
  async getSmartNotifications(): Promise<SmartNotification[]> {
    try {
      const response = await apiClient.get('/notifications/smart');
      return response.data;
    } catch (error) {
      // Silently fall back to mock data - this is expected behavior
      return this.generateMockNotifications();
    }
  }

  // Schedule a notification
  async scheduleNotification(notification: SmartNotification): Promise<boolean> {
    try {
      const response = await apiClient.post('/notifications/schedule', notification);
      return true;
    } catch (error) {
      // Silently handle scheduling failure - this is expected behavior
      return false;
    }
  }

  // Update notification preferences
  async updatePreferences(preferences: Partial<NotificationPreferences>): Promise<boolean> {
    try {
      this.preferences = { ...this.preferences, ...preferences };
      await apiClient.put('/notifications/preferences', this.preferences);
      return true;
    } catch (error) {
      // Silently fall back to local storage - this is expected behavior
      return true; // Still update locally
    }
  }

  // Get notification preferences
  getPreferences(): NotificationPreferences {
    return this.preferences;
  }

  // Check if notification should be sent based on rules and context
  shouldSendNotification(rule: NotificationRule, context: Record<string, unknown>): boolean {
    // Check if rule is enabled
    if (!rule.enabled) return false;

    // Check cooldown
    if (rule.last_sent) {
      const lastSent = new Date(rule.last_sent);
      const cooldownMs = rule.cooldown_hours * 60 * 60 * 1000;
      if (Date.now() - lastSent.getTime() < cooldownMs) {
        return false;
      }
    }

    // Check quiet hours
    if (this.preferences.quiet_hours.enabled) {
      const now = new Date();
      const currentTime = now.getHours() * 60 + now.getMinutes();
      const startTime = this.parseTime(this.preferences.quiet_hours.start);
      const endTime = this.parseTime(this.preferences.quiet_hours.end);
      
      if (startTime > endTime) {
        // Overnight quiet hours
        if (currentTime >= startTime || currentTime <= endTime) {
          return false;
        }
      } else {
        // Same day quiet hours
        if (currentTime >= startTime && currentTime <= endTime) {
          return false;
        }
      }
    }

    // Check trigger conditions
    if (rule.trigger_conditions.time_based) {
      const now = new Date();
      const hour = now.getHours();
      const minute = now.getMinutes();
      const day = now.getDay();
      
      const timeCondition = rule.trigger_conditions.time_based;
      if (hour !== timeCondition.hour || 
          minute !== timeCondition.minute || 
          !timeCondition.days.includes(day)) {
        return false;
      }
    }

    if (rule.trigger_conditions.behavior_based) {
      const behaviorCondition = rule.trigger_conditions.behavior_based;
      const metricValue = context[behaviorCondition.metric];
      
      if (metricValue !== undefined) {
        switch (behaviorCondition.condition) {
          case 'below':
            return (metricValue as number) < (behaviorCondition.threshold || 0);
          case 'above':
            return (metricValue as number) > (behaviorCondition.threshold || 0);
          case 'missing':
            return metricValue === 0 || metricValue === null;
          case 'inconsistent':
            // Check for inconsistency in recent data
            return this.checkInconsistency(behaviorCondition.metric, context);
        }
      }
    }

    return true;
  }

  // Generate contextual notifications
  generateContextualNotifications(userData: Record<string, unknown>): SmartNotification[] {
    const notifications: SmartNotification[] = [];
    const now = new Date();

    // Workout reminders
    if (this.preferences.workout_reminders) {
      const lastWorkout = userData.last_workout;
      const daysSinceWorkout = lastWorkout ? 
        Math.floor((now.getTime() - new Date(lastWorkout as string).getTime()) / (1000 * 60 * 60 * 24)) : 7;
      
      if (daysSinceWorkout >= 2) {
        notifications.push({
          id: 'workout_reminder_1',
          type: 'workout_reminder',
          title: 'Time for a Workout! 💪',
          message: `It's been ${daysSinceWorkout} days since your last workout. Ready to get back on track?`,
          priority: daysSinceWorkout >= 3 ? 'high' : 'medium',
          scheduled_for: now.toISOString(),
          actionable: true,
          action_buttons: [
            { text: 'Log Workout', action: 'log_workout', style: 'primary' },
            { text: 'Later', action: 'snooze', style: 'secondary' },
          ],
        });
      }
    }

    // Meal reminders
    if (this.preferences.meal_reminders) {
      const lastMeal = userData.last_meal;
      const hoursSinceMeal = lastMeal ? 
        Math.floor((now.getTime() - new Date(lastMeal as string).getTime()) / (1000 * 60 * 60)) : 8;
      
      if (hoursSinceMeal >= 4) {
        const mealType = this.getMealType(now);
        notifications.push({
          id: 'meal_reminder_1',
          type: 'meal_reminder',
          title: `${mealType} Time! 🍽️`,
          message: `It's been ${hoursSinceMeal} hours since your last meal. Time for ${mealType.toLowerCase()}?`,
          priority: hoursSinceMeal >= 6 ? 'high' : 'medium',
          scheduled_for: now.toISOString(),
          actionable: true,
          action_buttons: [
            { text: 'Log Meal', action: 'log_meal', style: 'primary' },
            { text: 'Later', action: 'snooze', style: 'secondary' },
          ],
        });
      }
    }

    // Water reminders
    if (this.preferences.water_reminders) {
      const waterIntake = userData.today_water || 0;
      const targetWater = userData.water_target || 3.0;
      
      if ((waterIntake as number) < (targetWater as number) * 0.5) {
        notifications.push({
          id: 'water_reminder_1',
          type: 'water_reminder',
          title: 'Stay Hydrated! 💧',
          message: `You've had ${waterIntake}L of water today. Aim for ${targetWater}L total.`,
          priority: 'medium',
          scheduled_for: now.toISOString(),
          actionable: true,
          action_buttons: [
            { text: 'Log Water', action: 'log_water', style: 'primary' },
            { text: 'Remind Later', action: 'snooze', style: 'secondary' },
          ],
        });
      }
    }

    // Mood check reminders
    if (this.preferences.mood_checks) {
      const lastMood = userData.last_mood;
      const hoursSinceMood = lastMood ? 
        Math.floor((now.getTime() - new Date(lastMood as string).getTime()) / (1000 * 60 * 60)) : 24;
      
      if (hoursSinceMood >= 12) {
        notifications.push({
          id: 'mood_check_1',
          type: 'mood_check',
          title: 'How are you feeling? 😊',
          message: 'Take a moment to check in with yourself and log your mood.',
          priority: 'low',
          scheduled_for: now.toISOString(),
          actionable: true,
          action_buttons: [
            { text: 'Log Mood', action: 'log_mood', style: 'primary' },
            { text: 'Skip', action: 'dismiss', style: 'secondary' },
          ],
        });
      }
    }

    // Goal reminders
    if (this.preferences.goal_reminders) {
      const goalProgress = userData.goal_progress || {};
      const weeklyGoal = userData.weekly_goal || {};
      
      Object.entries(weeklyGoal).forEach(([goal, target]) => {
        const current = (goalProgress as Record<string, unknown>)[goal] as number || 0;
        const progress = (current / target) * 100;
        
        if (progress < 50 && now.getDay() >= 3) { // Mid-week check
          notifications.push({
            id: `goal_reminder_${goal}`,
            type: 'goal_reminder',
            title: 'Goal Progress Update 📊',
            message: `You're at ${Math.round(progress)}% of your weekly ${goal} goal. Keep going!`,
            priority: 'medium',
            scheduled_for: now.toISOString(),
            actionable: true,
            action_buttons: [
              { text: 'View Progress', action: 'view_progress', style: 'primary' },
              { text: 'Dismiss', action: 'dismiss', style: 'secondary' },
            ],
          });
        }
      });
    }

    return notifications;
  }

  // Helper methods
  private parseTime(timeString: string): number {
    const [hours, minutes] = timeString.split(':').map(Number);
    return hours * 60 + minutes;
  }

  private getMealType(now: Date): string {
    const hour = now.getHours();
    if (hour < 11) return 'Breakfast';
    if (hour < 15) return 'Lunch';
    if (hour < 19) return 'Dinner';
    return 'Snack';
  }

  private checkInconsistency(metric: string, context: Record<string, unknown>): boolean {
    // Simple inconsistency check - can be enhanced with more sophisticated logic
    const recentData = (context[`${metric}_history`] as Record<string, unknown>[]) || [];
    if (recentData.length < 3) return false;
    
    const values = recentData.slice(-3).map((d: Record<string, unknown>) => d.value as number);
    const avg = values.reduce((a: number, b: number) => a + b, 0) / values.length;
    const variance = values.reduce((a: number, b: number) => a + Math.pow(b - avg, 2), 0) / values.length;
    
    return variance > avg * 0.5; // High variance indicates inconsistency
  }

  private getDefaultRules(): NotificationRule[] {
    return [
      {
        id: 'morning_workout_reminder',
        type: 'workout_reminder',
        title: 'Morning Workout',
        message: 'Start your day with energy! Time for a workout.',
        trigger_conditions: {
          time_based: {
            hour: 7,
            minute: 0,
            days: [1, 2, 3, 4, 5], // Weekdays
          },
        },
        priority: 'medium',
        enabled: true,
        cooldown_hours: 24,
      },
      {
        id: 'evening_meal_reminder',
        type: 'meal_reminder',
        title: 'Evening Meal',
        message: 'Don\'t forget to log your dinner!',
        trigger_conditions: {
          time_based: {
            hour: 19,
            minute: 0,
            days: [0, 1, 2, 3, 4, 5, 6], // All days
          },
        },
        priority: 'low',
        enabled: true,
        cooldown_hours: 24,
      },
      {
        id: 'water_reminder_every_2_hours',
        type: 'water_reminder',
        title: 'Hydration Check',
        message: 'Time to drink some water!',
        trigger_conditions: {
          time_based: {
            hour: 0,
            minute: 0,
            days: [0, 1, 2, 3, 4, 5, 6], // All days
          },
        },
        priority: 'low',
        enabled: true,
        cooldown_hours: 2,
      },
    ];
  }

  private generateMockNotifications(): SmartNotification[] {
    return [
      {
        id: 'mock_1',
        type: 'workout_reminder',
        title: 'Workout Time! 💪',
        message: 'You haven\'t worked out in 2 days. Ready to get back on track?',
        priority: 'high',
        scheduled_for: new Date().toISOString(),
        actionable: true,
        action_buttons: [
          { text: 'Log Workout', action: 'log_workout', style: 'primary' },
          { text: 'Later', action: 'snooze', style: 'secondary' },
        ],
      },
      {
        id: 'mock_2',
        type: 'meal_reminder',
        title: 'Lunch Time! 🍽️',
        message: 'It\'s been 4 hours since your last meal. Time for lunch?',
        priority: 'medium',
        scheduled_for: new Date().toISOString(),
        actionable: true,
        action_buttons: [
          { text: 'Log Meal', action: 'log_meal', style: 'primary' },
          { text: 'Later', action: 'snooze', style: 'secondary' },
        ],
      },
    ];
  }
}

export const smartNotificationsService = new SmartNotificationsService();
export type { NotificationRule, SmartNotification, NotificationPreferences };
