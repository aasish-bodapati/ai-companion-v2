import { memoryContextService, type MemoryContextData } from './memoryContextService';

export interface NotificationItem {
  id: string;
  type: 'reminder' | 'suggestion' | 'achievement' | 'warning';
  title: string;
  message: string;
  priority: 'low' | 'medium' | 'high';
  category: 'workout' | 'nutrition' | 'sleep' | 'general' | 'routine';
  timestamp: Date;
  read: boolean;
  actionable: boolean;
  actionText?: string;
  actionUrl?: string;
  icon: string;
}

export interface NotificationPreferences {
  workout: boolean;
  nutrition: boolean;
  sleep: boolean;
  routine: boolean;
  general: boolean;
  quietHours: {
    enabled: boolean;
    start: string; // HH:MM
    end: string;   // HH:MM
  };
}

class NotificationService {
  private notifications: NotificationItem[] = [];
  private preferences: NotificationPreferences = {
    workout: true,
    nutrition: true,
    sleep: true,
    routine: true,
    general: true,
    quietHours: {
      enabled: true,
      start: '22:00',
      end: '06:00'
    }
  };

  // Load preferences from localStorage
  constructor() {
    this.loadPreferences();
  }

  private loadPreferences(): void {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('notification-preferences');
      if (saved) {
        try {
          this.preferences = { ...this.preferences, ...JSON.parse(saved) };
        } catch (error) {
          console.error('Failed to load notification preferences:', error);
        }
      }
    }
  }

  private savePreferences(): void {
    if (typeof window !== 'undefined') {
      localStorage.setItem('notification-preferences', JSON.stringify(this.preferences));
    }
  }

  // Check if we're in quiet hours
  private isInQuietHours(): boolean {
    if (!this.preferences.quietHours.enabled) return false;
    
    const now = new Date();
    const currentTime = now.getHours() * 60 + now.getMinutes();
    
    const [startHour, startMin] = this.preferences.quietHours.start.split(':').map(Number);
    const [endHour, endMin] = this.preferences.quietHours.end.split(':').map(Number);
    
    const startTime = startHour * 60 + startMin;
    const endTime = endHour * 60 + endMin;
    
    // Handle overnight quiet hours
    if (startTime > endTime) {
      return currentTime >= startTime || currentTime <= endTime;
    } else {
      return currentTime >= startTime && currentTime <= endTime;
    }
  }

  // Generate smart notifications based on user data and time
  async generateSmartNotifications(): Promise<NotificationItem[]> {
    if (this.isInQuietHours()) {
      return [];
    }

    try {
      const memoryData = await memoryContextService.getMemoryContext();
      const notifications: NotificationItem[] = [];
      const now = new Date();
      const hour = now.getHours();
      const minute = now.getMinutes();
      const currentTime = hour * 60 + minute;

      // Time-based routine notifications
      if (this.preferences.routine) {
        notifications.push(...this.generateRoutineNotifications(memoryData, currentTime));
      }

      // Goal-based notifications
      if (this.preferences.nutrition) {
        notifications.push(...this.generateNutritionNotifications(memoryData));
      }

      if (this.preferences.workout) {
        notifications.push(...this.generateWorkoutNotifications(memoryData, currentTime));
      }

      if (this.preferences.sleep) {
        notifications.push(...this.generateSleepNotifications(memoryData, currentTime));
      }

      // General wellness notifications
      if (this.preferences.general) {
        notifications.push(...this.generateWellnessNotifications(memoryData, hour));
      }

      // Sort by priority and timestamp
      return notifications.sort((a, b) => {
        const priorityOrder = { high: 3, medium: 2, low: 1 };
        const priorityDiff = priorityOrder[b.priority] - priorityOrder[a.priority];
        if (priorityDiff !== 0) return priorityDiff;
        return b.timestamp.getTime() - a.timestamp.getTime();
      });

    } catch (error) {
      console.error('Failed to generate notifications:', error);
      return [];
    }
  }

  private generateRoutineNotifications(memoryData: MemoryContextData, currentTime: number): NotificationItem[] {
    const notifications: NotificationItem[] = [];
    const now = new Date();

    // Check upcoming routines
    memoryData.routines.forEach((routine, index) => {
      const [hours, minutes] = routine.time.split(':').map(Number);
      const routineTime = hours * 60 + minutes;
      const timeUntilRoutine = routineTime - currentTime;

      // Notify 15 minutes before routine
      if (timeUntilRoutine > 0 && timeUntilRoutine <= 15) {
        notifications.push({
          id: `routine-${index}-${now.getTime()}`,
          type: 'reminder',
          title: 'Upcoming Routine',
          message: `${routine.activity} starts in ${timeUntilRoutine} minutes`,
          priority: 'medium',
          category: 'routine',
          timestamp: now,
          read: false,
          actionable: true,
          actionText: 'View Routine',
          actionUrl: '/today',
          icon: routine.icon
        });
      }

      // Notify if routine is overdue
      if (timeUntilRoutine < -30 && routine.status === 'upcoming') {
        notifications.push({
          id: `routine-overdue-${index}-${now.getTime()}`,
          type: 'warning',
          title: 'Routine Overdue',
          message: `${routine.activity} was scheduled for ${routine.time}. Consider rescheduling or skipping.`,
          priority: 'high',
          category: 'routine',
          timestamp: now,
          read: false,
          actionable: true,
          actionText: 'Update Routine',
          actionUrl: '/today',
          icon: '⏰'
        });
      }
    });

    return notifications;
  }

  private generateNutritionNotifications(memoryData: MemoryContextData): NotificationItem[] {
    const notifications: NotificationItem[] = [];
    const now = new Date();

    // Protein goal tracking
    const proteinProgress = memoryData.goals.protein.current / memoryData.goals.protein.target;
    
    if (proteinProgress < 0.5) {
      notifications.push({
        id: `protein-low-${now.getTime()}`,
        type: 'suggestion',
        title: 'Protein Goal',
        message: `You're at ${memoryData.goals.protein.current}g protein. Need ${memoryData.goals.protein.target - memoryData.goals.protein.current}g more to reach your daily goal.`,
        priority: 'medium',
        category: 'nutrition',
        timestamp: now,
        read: false,
        actionable: true,
        actionText: 'Log Meal',
        actionUrl: '/trackers',
        icon: '🥗'
      });
    } else if (proteinProgress >= 1.0) {
      notifications.push({
        id: `protein-achieved-${now.getTime()}`,
        type: 'achievement',
        title: 'Protein Goal Achieved! 🎉',
        message: `Congratulations! You've hit your ${memoryData.goals.protein.target}g protein goal for today.`,
        priority: 'low',
        category: 'nutrition',
        timestamp: now,
        read: false,
        actionable: false,
        icon: '🎯'
      });
    }

    // Meal timing suggestions
    const hour = now.getHours();
    if (hour === 8 && memoryData.goals.protein.current < 30) {
      notifications.push({
        id: `breakfast-protein-${now.getTime()}`,
        type: 'suggestion',
        title: 'Breakfast Protein',
        message: 'Start your day strong! Consider adding protein to your breakfast to reach your daily goal.',
        priority: 'medium',
        category: 'nutrition',
        timestamp: now,
        read: false,
        actionable: true,
        actionText: 'View Options',
        actionUrl: '/trackers',
        icon: '🍳'
      });
    }

    return notifications;
  }

  private generateWorkoutNotifications(memoryData: MemoryContextData, currentTime: number): NotificationItem[] {
    const notifications: NotificationItem[] = [];
    const now = new Date();
    const hour = now.getHours();

    // Workout time reminders
    const [workoutHour, workoutMin] = memoryData.userProfile.workoutTime.split(':').map(Number);
    const workoutTime = workoutHour * 60 + workoutMin;
    const timeUntilWorkout = workoutTime - currentTime;

    if (timeUntilWorkout > 0 && timeUntilWorkout <= 30) {
      notifications.push({
        id: `workout-reminder-${now.getTime()}`,
        type: 'reminder',
        title: 'Workout Time',
        message: `Your ${memoryData.userProfile.workoutTime} workout is coming up. Time to prepare!`,
        priority: 'high',
        category: 'workout',
        timestamp: now,
        read: false,
        actionable: true,
        actionText: 'View Workout',
        actionUrl: '/today',
        icon: '💪'
      });
    }

    // Post-workout hydration reminder
    if (hour >= workoutHour + 1 && hour <= workoutHour + 3) {
      notifications.push({
        id: `post-workout-hydration-${now.getTime()}`,
        type: 'suggestion',
        title: 'Post-Workout Hydration',
        message: 'Great job on your workout! Remember to rehydrate and refuel.',
        priority: 'medium',
        category: 'workout',
        timestamp: now,
        read: false,
        actionable: true,
        actionText: 'Log Hydration',
        actionUrl: '/trackers',
        icon: '💧'
      });
    }

    return notifications;
  }

  private generateSleepNotifications(memoryData: MemoryContextData, currentTime: number): NotificationItem[] {
    const notifications: NotificationItem[] = [];
    const now = new Date();
    const hour = now.getHours();

    // Bedtime reminder
    const [bedHour, bedMin] = memoryData.userProfile.bedtime.split(':').map(Number);
    const bedtime = bedHour * 60 + bedMin;
    const timeUntilBed = bedtime - currentTime;

    if (timeUntilBed > 0 && timeUntilBed <= 60) {
      notifications.push({
        id: `bedtime-reminder-${now.getTime()}`,
        type: 'reminder',
        title: 'Bedtime Approaching',
        message: `Your bedtime is in ${Math.floor(timeUntilBed / 60)} hour${Math.floor(timeUntilBed / 60) !== 1 ? 's' : ''}. Time to wind down.`,
        priority: 'medium',
        category: 'sleep',
        timestamp: now,
        read: false,
        actionable: false,
        icon: '😴'
      });
    }

    // Sleep quality check-in
    if (hour === 7) {
      notifications.push({
        id: `sleep-checkin-${now.getTime()}`,
        type: 'suggestion',
        title: 'How Did You Sleep?',
        message: 'Take a moment to reflect on your sleep quality and energy levels this morning.',
        priority: 'low',
        category: 'sleep',
        timestamp: now,
        read: false,
        actionable: true,
        actionText: 'Log Mood',
        actionUrl: '/trackers',
        icon: '🌅'
      });
    }

    return notifications;
  }

  private generateWellnessNotifications(memoryData: MemoryContextData, hour: number): NotificationItem[] {
    const notifications: NotificationItem[] = [];
    const now = new Date();

    // Mid-morning energy check
    if (hour === 10) {
      notifications.push({
        id: `energy-check-${now.getTime()}`,
        type: 'suggestion',
        title: 'Energy Check-in',
        message: 'This is your peak focus time! How are you feeling? Ready to tackle important tasks?',
        priority: 'low',
        category: 'general',
        timestamp: now,
        read: false,
        actionable: true,
        actionText: 'Log Mood',
        actionUrl: '/trackers',
        icon: '⚡'
      });
    }

    // Afternoon slump prevention
    if (hour === 15) {
      notifications.push({
        id: `afternoon-boost-${now.getTime()}`,
        type: 'suggestion',
        title: 'Afternoon Energy',
        message: 'Feeling the afternoon slump? Consider a short walk or healthy snack to boost your energy.',
        priority: 'low',
        category: 'general',
        timestamp: now,
        read: false,
        actionable: true,
        actionText: 'View Tips',
        actionUrl: '/today',
        icon: '☕'
      });
    }

    // Evening reflection
    if (hour === 19) {
      notifications.push({
        id: `evening-reflection-${now.getTime()}`,
        type: 'suggestion',
        title: 'Evening Reflection',
        message: 'Take a moment to reflect on your day. What went well? What could you improve tomorrow?',
        priority: 'low',
        category: 'general',
        timestamp: now,
        read: false,
        actionable: true,
        actionText: 'Journal Entry',
        actionUrl: '/trackers',
        icon: '📝'
      });
    }

    return notifications;
  }

  // Get all notifications
  async getNotifications(): Promise<NotificationItem[]> {
    const smartNotifications = await this.generateSmartNotifications();
    return [...this.notifications, ...smartNotifications];
  }

  // Mark notification as read
  markAsRead(id: string): void {
    const notification = this.notifications.find(n => n.id === id);
    if (notification) {
      notification.read = true;
    }
  }

  // Dismiss notification
  dismissNotification(id: string): void {
    this.notifications = this.notifications.filter(n => n.id !== id);
  }

  // Update preferences
  updatePreferences(newPreferences: Partial<NotificationPreferences>): void {
    this.preferences = { ...this.preferences, ...newPreferences };
    this.savePreferences();
  }

  // Get current preferences
  getPreferences(): NotificationPreferences {
    return { ...this.preferences };
  }

  // Clear all notifications
  clearAllNotifications(): void {
    this.notifications = [];
  }

  // Get unread count
  getUnreadCount(): number {
    return this.notifications.filter(n => !n.read).length;
  }
}

export const notificationService = new NotificationService();
export default notificationService;

