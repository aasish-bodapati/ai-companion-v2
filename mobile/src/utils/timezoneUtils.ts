import * as Location from 'expo-location';

/**
 * Get timezone from coordinates using reverse geocoding
 */
export async function getTimezoneFromLocation(): Promise<string> {
  try {
    console.log('🌍 Requesting location permission...');
    // Request location permission
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') {
      console.log('🌍 Location permission denied');
      throw new Error('Location permission not granted');
    }

    console.log('🌍 Getting current location...');
    // Get current location
    const location = await Location.getCurrentPositionAsync({});
    const { latitude, longitude } = location.coords;
    console.log('🌍 Location coordinates:', { latitude, longitude });

    console.log('🌍 Reverse geocoding...');
    // Use reverse geocoding to get timezone
    const reverseGeocode = await Location.reverseGeocodeAsync({
      latitude,
      longitude,
    });
    console.log('🌍 Reverse geocode result:', reverseGeocode);

    if (reverseGeocode.length > 0) {
      const locationData = reverseGeocode[0];
      console.log('🌍 Location data:', locationData);
      
      // Try to get timezone from region/city
      if (locationData.region) {
        console.log('🌍 Region found:', locationData.region);
        // Map common regions to timezones
        const timezoneMap: { [key: string]: string } = {
          'California': 'America/Los_Angeles',
          'New York': 'America/New_York',
          'Texas': 'America/Chicago',
          'Florida': 'America/New_York',
          'Illinois': 'America/Chicago',
          'Pennsylvania': 'America/New_York',
          'Ohio': 'America/New_York',
          'Georgia': 'America/New_York',
          'North Carolina': 'America/New_York',
          'Michigan': 'America/New_York',
          'New Jersey': 'America/New_York',
          'Virginia': 'America/New_York',
          'Washington': 'America/Los_Angeles',
          'Arizona': 'America/Phoenix',
          'Massachusetts': 'America/New_York',
          'Tennessee': 'America/Chicago',
          'Indiana': 'America/New_York',
          'Missouri': 'America/Chicago',
          'Maryland': 'America/New_York',
          'Wisconsin': 'America/Chicago',
          'Colorado': 'America/Denver',
          'Minnesota': 'America/Chicago',
          'South Carolina': 'America/New_York',
          'Alabama': 'America/Chicago',
          'Louisiana': 'America/Chicago',
          'Kentucky': 'America/New_York',
          'Oregon': 'America/Los_Angeles',
          'Oklahoma': 'America/Chicago',
          'Connecticut': 'America/New_York',
          'Utah': 'America/Denver',
          'Iowa': 'America/Chicago',
          'Nevada': 'America/Los_Angeles',
          'Arkansas': 'America/Chicago',
          'Mississippi': 'America/Chicago',
          'Kansas': 'America/Chicago',
          'New Mexico': 'America/Denver',
          'Nebraska': 'America/Chicago',
          'West Virginia': 'America/New_York',
          'Idaho': 'America/Denver',
          'Hawaii': 'Pacific/Honolulu',
          'Alaska': 'America/Anchorage',
          'Maine': 'America/New_York',
          'New Hampshire': 'America/New_York',
          'Rhode Island': 'America/New_York',
          'Montana': 'America/Denver',
          'Delaware': 'America/New_York',
          'South Dakota': 'America/Chicago',
          'North Dakota': 'America/Chicago',
          'Vermont': 'America/New_York',
          'Wyoming': 'America/Denver',
        };

        const timezone = timezoneMap[locationData.region];
        if (timezone) {
          console.log('🌍 Found timezone from region:', timezone);
          return timezone;
        } else {
          console.log('🌍 Region not found in timezone map:', locationData.region);
        }
      }

      // Fallback: try to determine timezone from coordinates
      console.log('🌍 Using coordinate-based timezone detection...');
      const timezone = getTimezoneFromCoordinates(latitude, longitude);
      console.log('🌍 Coordinate-based timezone:', timezone);
      return timezone;
    }

    // Ultimate fallback
    console.log('🌍 No location data found, using UTC');
    return 'UTC';
  } catch (error) {
    console.error('🌍 Error getting timezone from location:', error);
    return 'UTC';
  }
}

/**
 * Get timezone from coordinates using a simple approximation
 */
function getTimezoneFromCoordinates(latitude: number, longitude: number): string {
  // Simple timezone approximation based on longitude
  // This is not 100% accurate but works for most cases
  
  const timezoneOffset = Math.round(longitude / 15);
  
  // Map offset to common timezones
  const timezoneMap: { [key: number]: string } = {
    [-12]: 'Pacific/Midway',
    [-11]: 'Pacific/Honolulu',
    [-10]: 'Pacific/Honolulu',
    [-9]: 'America/Anchorage',
    [-8]: 'America/Los_Angeles',
    [-7]: 'America/Denver',
    [-6]: 'America/Chicago',
    [-5]: 'America/New_York',
    [-4]: 'America/Caracas',
    [-3]: 'America/Sao_Paulo',
    [-2]: 'Atlantic/South_Georgia',
    [-1]: 'Atlantic/Azores',
    0: 'UTC',
    1: 'Europe/London',
    2: 'Europe/Paris',
    3: 'Europe/Moscow',
    4: 'Asia/Dubai',
    5: 'Asia/Karachi',
    6: 'Asia/Dhaka',
    7: 'Asia/Bangkok',
    8: 'Asia/Shanghai',
    9: 'Asia/Tokyo',
    10: 'Australia/Sydney',
    11: 'Pacific/Norfolk',
    12: 'Pacific/Auckland',
  };

  return timezoneMap[timezoneOffset] || 'UTC';
}

/**
 * Get user's current timezone using Intl API as fallback
 */
export function getCurrentTimezone(): string {
  try {
    const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    return timezone;
  } catch (error) {
    console.error('🌍 Error getting current timezone:', error);
    return 'UTC';
  }
}

/**
 * Get user's timezone (alias for getCurrentTimezone for compatibility)
 */
export function getUserTimezone(): string {
  return getCurrentTimezone();
}

/**
 * Format a date string in the user's timezone
 */
export function formatDateInUserTimezone(
  dateString: string, 
  options?: Intl.DateTimeFormatOptions
): string {
  try {
    const date = new Date(dateString);
    const timezone = getCurrentTimezone();
    
    const defaultOptions: Intl.DateTimeFormatOptions = {
      year: 'numeric',
      month: 'short',
      day: '2-digit',
      ...options
    };
    
    return date.toLocaleDateString('en-US', {
      ...defaultOptions,
      timeZone: timezone
    });
  } catch (error) {
    console.error('🌍 Error formatting date:', error);
    return dateString;
  }
}

/**
 * Format a time string in the user's timezone
 */
export function formatTimeInUserTimezone(
  dateString: string, 
  options?: Intl.DateTimeFormatOptions
): string {
  try {
    const date = new Date(dateString);
    const timezone = getCurrentTimezone();
    
    const defaultOptions: Intl.DateTimeFormatOptions = {
      hour: '2-digit',
      minute: '2-digit',
      ...options
    };
    
    return date.toLocaleTimeString('en-US', {
      ...defaultOptions,
      timeZone: timezone
    });
  } catch (error) {
    console.error('🌍 Error formatting time:', error);
    return dateString;
  }
}

/**
 * Get date string in user's timezone
 */
export function getDateInUserTimezone(date: Date): string {
  try {
    const timezone = getCurrentTimezone();
    return date.toLocaleDateString("en-CA", { timeZone: timezone });
  } catch (error) {
    console.error('🌍 Error getting date in user timezone:', error);
    return date.toISOString().split('T')[0];
  }
}

/**
 * Check if a date is in user's timezone (placeholder function)
 */
export function isDateInUserTimezone(date: Date): boolean {
  // This is a placeholder function - in practice, all dates should be handled
  // in the user's timezone, so this always returns true
  return true;
}