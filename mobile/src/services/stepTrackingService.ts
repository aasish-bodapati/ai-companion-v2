import { Pedometer } from 'expo-sensors';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface StepData {
  steps: number;
  date: string;
  timestamp: number;
}

class StepTrackingService {
  private isTracking = false;
  private subscription: any = null;
  private currentSteps = 0;
  private lastUpdateTime = 0;
  private readonly STORAGE_KEY = 'step_tracking_data';
  private readonly UPDATE_INTERVAL = 60000; // Update every minute

  async startTracking(): Promise<boolean> {
    try {
      // Check if pedometer is available
      const isAvailable = await Pedometer.isAvailableAsync();
      if (!isAvailable) {
        console.log('🚶 Step tracking not available on this device');
        return false;
      }

      if (this.isTracking) {
        console.log('🚶 Step tracking already active');
        return true;
      }

      console.log('🚶 Starting step tracking...');
      this.isTracking = true;

      // Get initial step count for today
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const startOfDay = today.getTime();

      // Start pedometer subscription
      this.subscription = Pedometer.watchStepCount((result) => {
        this.currentSteps = result.steps;
        this.lastUpdateTime = Date.now();
        
        // Save to storage
        this.saveStepData({
          steps: this.currentSteps,
          date: today.toISOString().split('T')[0],
          timestamp: Date.now()
        });

        console.log('🚶 Steps updated:', this.currentSteps);
      });

      return true;
    } catch (error) {
      console.error('🚶 Error starting step tracking:', error);
      this.isTracking = false;
      return false;
    }
  }

  async stopTracking(): Promise<void> {
    try {
      if (this.subscription) {
        this.subscription.remove();
        this.subscription = null;
      }
      this.isTracking = false;
      console.log('🚶 Step tracking stopped');
    } catch (error) {
      console.error('🚶 Error stopping step tracking:', error);
    }
  }

  async getTodaySteps(): Promise<number> {
    try {
      const today = new Date().toISOString().split('T')[0];
      const stepData = await this.getStepData(today);
      return stepData?.steps || 0;
    } catch (error) {
      console.error('🚶 Error getting today steps:', error);
      return 0;
    }
  }

  async getStepData(date: string): Promise<StepData | null> {
    try {
      const data = await AsyncStorage.getItem(this.STORAGE_KEY);
      if (data) {
        const allData = JSON.parse(data);
        return allData[date] || null;
      }
      return null;
    } catch (error) {
      console.error('🚶 Error getting step data:', error);
      return null;
    }
  }

  private async saveStepData(stepData: StepData): Promise<void> {
    try {
      const data = await AsyncStorage.getItem(this.STORAGE_KEY);
      const allData = data ? JSON.parse(data) : {};
      allData[stepData.date] = stepData;
      await AsyncStorage.setItem(this.STORAGE_KEY, JSON.stringify(allData));
    } catch (error) {
      console.error('🚶 Error saving step data:', error);
    }
  }

  async getWeeklySteps(): Promise<StepData[]> {
    try {
      const data = await AsyncStorage.getItem(this.STORAGE_KEY);
      if (!data) return [];

      const allData = JSON.parse(data);
      const today = new Date();
      const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
      
      const weeklyData: StepData[] = [];
      for (let i = 0; i < 7; i++) {
        const date = new Date(weekAgo.getTime() + i * 24 * 60 * 60 * 1000);
        const dateString = date.toISOString().split('T')[0];
        const stepData = allData[dateString];
        if (stepData) {
          weeklyData.push(stepData);
        }
      }
      
      return weeklyData;
    } catch (error) {
      console.error('🚶 Error getting weekly steps:', error);
      return [];
    }
  }

  async isAvailable(): Promise<boolean> {
    try {
      return await Pedometer.isAvailableAsync();
    } catch (error) {
      console.error('🚶 Error checking pedometer availability:', error);
      return false;
    }
  }

  getCurrentSteps(): number {
    return this.currentSteps;
  }

  isCurrentlyTracking(): boolean {
    return this.isTracking;
  }
}

export default new StepTrackingService();
