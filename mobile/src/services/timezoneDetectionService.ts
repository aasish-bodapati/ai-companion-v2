import { getTimezoneFromLocation, getCurrentTimezone } from '../utils/timezoneUtils';

import { onboardingService } from './api';

import { DebugUtils } from '../utils/debugUtils';

/**
 * Independent timezone detection service
 * Runs in the background and updates timezone when possible
 */
class TimezoneDetectionService {
  private isDetecting = false;
  private lastDetectionTime = 0;
  private readonly DETECTION_INTERVAL = 5 * 60 * 1000; // 5 minutes

  /**
   * Detect timezone and update user data
   */
  async detectAndUpdateTimezone(): Promise<string> {
    // Prevent multiple simultaneous detections
    if (this.isDetecting) {
      DebugUtils.log('🌍 Timezone detection already in progress, skipping...');
      return getCurrentTimezone();
    }

    // Rate limiting - don't detect too frequently
    const now = Date.now();
    if (now - this.lastDetectionTime < this.DETECTION_INTERVAL) {
      DebugUtils.log('🌍 Timezone detection rate limited, using cached result');
      return getCurrentTimezone();
    }

    this.isDetecting = true;
    this.lastDetectionTime = now;

    try {
      DebugUtils.log('🌍 Starting independent timezone detection...');

      // Try location-based detection first
      const detectedTimezone = await getTimezoneFromLocation();
      DebugUtils.log('🌍 Independent timezone detection successful:', detectedTimezone);

      // Update the user's timezone in local storage
      await this.updateUserTimezone(detectedTimezone);

      return detectedTimezone;
    } catch (error) {
      DebugUtils.log('🌍 Independent timezone detection failed:', error);

      // Fallback to browser timezone
      const fallbackTimezone = getCurrentTimezone();
      DebugUtils.log('🌍 Using fallback timezone:', fallbackTimezone);

      // Update with fallback timezone
      await this.updateUserTimezone(fallbackTimezone);

      return fallbackTimezone;
    } finally {
      this.isDetecting = false;
    }
  }

  /**
   * Update user timezone in local storage
   */
  private async updateUserTimezone(timezone: string): Promise<void> {
    try {
      // Load current onboarding data
      const currentData = await onboardingService.loadOnboardingData();

      if (currentData) {
        // Update timezone
        const updatedData = {
          ...currentData,
          timezone: timezone
        };

        // Save updated data
        await onboardingService.saveOnboardingData(updatedData);
        DebugUtils.log('🌍 Updated user timezone to:', timezone);
      }
    } catch (error) {
      DebugUtils.error('🌍 Failed to update user timezone:', error);
    }
  }

  /**
   * Get current timezone from stored data or fallback
   */
  async getCurrentUserTimezone(): Promise<string> {
    try {
      const data = await onboardingService.loadOnboardingData();
      return data?.timezone || getCurrentTimezone();
    } catch (error) {
      DebugUtils.error('🌍 Failed to get current user timezone:', error);
      return getCurrentTimezone();
    }
  }

  /**
   * Start background timezone detection
   * Call this when the app starts
   */
  startBackgroundDetection(): void {
    DebugUtils.log('🌍 Starting background timezone detection...');

    // Detect immediately
    this.detectAndUpdateTimezone();

    // Set up periodic detection (every 30 minutes)
    setInterval(() => {
      this.detectAndUpdateTimezone();
    }, 30 * 60 * 1000);
  }
}

// Export singleton instance
export const timezoneDetectionService = new TimezoneDetectionService();
