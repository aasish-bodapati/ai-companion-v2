/**
 * Timezone utility functions for consistent timezone handling across the app
 * All timezone operations should use the user's timezone from the backend
 */

/**
 * Get the user's timezone from context or default to UTC+5:30
 * This should be replaced with actual user timezone from backend
 */
export function getUserTimezone(): string {
  // For now, return UTC+5:30 as specified
  // TODO: Get this from user context when available
  // This should be fetched from the user's profile/context
  return 'Asia/Kolkata'; // UTC+5:30
}

/**
 * Format a UTC datetime string for display in user's timezone
 */
export function formatTimeInUserTimezone(dateString: string, options?: Intl.DateTimeFormatOptions): string {
  if (!dateString) return 'Unknown Time';
  
  try {
    const date = new Date(dateString);
    const userTimezone = getUserTimezone();
    
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
      timeZone: userTimezone,
      ...options
    });
  } catch (error) {
    return 'Invalid Time';
  }
}

/**
 * Format a UTC datetime string for display in user's timezone (date only)
 */
export function formatDateInUserTimezone(dateString: string, options?: Intl.DateTimeFormatOptions): string {
  if (!dateString) return 'Unknown Date';
  
  try {
    const date = new Date(dateString);
    const userTimezone = getUserTimezone();
    
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      timeZone: userTimezone,
      ...options
    });
  } catch (error) {
    return 'Invalid Date';
  }
}

/**
 * Format a UTC datetime string for display in user's timezone (date and time)
 */
export function formatDateTimeInUserTimezone(dateString: string, options?: Intl.DateTimeFormatOptions): string {
  if (!dateString) return 'Unknown Date';
  
  try {
    const date = new Date(dateString);
    const userTimezone = getUserTimezone();
    
    return date.toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
      timeZone: userTimezone,
      ...options
    });
  } catch (error) {
    return 'Invalid Date';
  }
}

/**
 * Get today's date in YYYY-MM-DD format in user's timezone for API calls
 * This ensures the date range query matches the user's local date
 */
export function getTodayInUserTimezone(): string {
  const now = new Date();
  const userTimezone = getUserTimezone();
  
  // Use Intl.DateTimeFormat to get date components in user's timezone
  const formatter = new Intl.DateTimeFormat('en-CA', {
    timeZone: userTimezone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  });
  
  return formatter.format(now);
}

/**
 * Get a date in YYYY-MM-DD format in user's timezone for API calls
 */
export function getDateInUserTimezone(date: Date): string {
  const userTimezone = getUserTimezone();
  
  // Use Intl.DateTimeFormat to get date components in user's timezone
  const formatter = new Intl.DateTimeFormat('en-CA', {
    timeZone: userTimezone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  });
  
  return formatter.format(date);
}

/**
 * Check if a UTC date string falls on a specific date in user's timezone
 */
export function isDateInUserTimezone(utcDateString: string, targetDate: Date): boolean {
  try {
    const utcDate = new Date(utcDateString);
    const userTimezone = getUserTimezone();
    
    // Use Intl.DateTimeFormat to get date components in user's timezone
    const formatter = new Intl.DateTimeFormat('en-CA', {
      timeZone: userTimezone,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    });
    
    const utcDateStr = formatter.format(utcDate);
    const targetDateStr = formatter.format(targetDate);
    
    return utcDateStr === targetDateStr;
  } catch (error) {
    return false;
  }
}
