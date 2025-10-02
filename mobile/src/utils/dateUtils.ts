/**
 * Date utility functions for consistent date handling across the app
 */

/**
 * Get today's date in YYYY-MM-DD format using local timezone
 */
export function getTodayLocal(): string {
  const now = new Date();
  return now.getFullYear() + '-' + 
    String(now.getMonth() + 1).padStart(2, '0') + '-' + 
    String(now.getDate()).padStart(2, '0');
}

/**
 * Get a date in YYYY-MM-DD format using local timezone
 */
export function getDateLocal(date: Date): string {
  return date.getFullYear() + '-' + 
    String(date.getMonth() + 1).padStart(2, '0') + '-' + 
    String(date.getDate()).padStart(2, '0');
}

/**
 * Get a date N days ago in YYYY-MM-DD format using local timezone
 */
export function getDaysAgoLocal(days: number): string {
  const date = new Date();
  date.setDate(date.getDate() - days);
  return getDateLocal(date);
}
