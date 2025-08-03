/**
 * Timezone utilities for frontend
 * Handles conversion between UTC and local timezone
 */

export interface TimezoneInfo {
  timezone: string;
  offset: number; // in minutes
  offsetString: string; // e.g., "+05:30"
}

/**
 * Get the user's local timezone information
 */
export function getUserTimezone(): TimezoneInfo {
  const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
  const now = new Date();
  const offset = now.getTimezoneOffset(); // in minutes, negative for ahead of UTC
  const offsetHours = Math.abs(Math.floor(offset / 60));
  const offsetMinutes = Math.abs(offset % 60);
  const offsetString = `${offset <= 0 ? '+' : '-'}${offsetHours.toString().padStart(2, '0')}:${offsetMinutes.toString().padStart(2, '0')}`;
  
  return {
    timezone,
    offset,
    offsetString
  };
}

/**
 * Send user's timezone to backend for proper timezone handling
 */
export async function syncUserTimezone(): Promise<void> {
  try {
    const timezoneInfo = getUserTimezone();
    console.log('Detected user timezone:', timezoneInfo.timezone, 'offset:', timezoneInfo.offsetString);
    
    await fetch('/api/user/timezone', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        timezone: timezoneInfo.timezone,
        offset: timezoneInfo.offset
      })
    });
  } catch (error) {
    console.warn('Failed to sync timezone with backend:', error);
  }
}

/**
 * Convert UTC datetime string to local datetime
 */
export function utcToLocal(utcString: string): Date {
  return new Date(utcString);
}

/**
 * Convert local datetime to UTC string
 */
export function localToUtc(date: Date): string {
  return date.toISOString();
}

/**
 * Format datetime for display in user's local timezone
 */
export function formatDateTime(date: string | Date, options?: Intl.DateTimeFormatOptions): string {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  
  const defaultOptions: Intl.DateTimeFormatOptions = {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  };
  
  // The date from backend is in UTC, so we need to convert it to local time
  // JavaScript's Date constructor automatically handles UTC to local conversion
  return dateObj.toLocaleString(undefined, { ...defaultOptions, ...options });
}

/**
 * Format date for display in user's local timezone
 */
export function formatDate(date: string | Date, options?: Intl.DateTimeFormatOptions): string {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  
  const defaultOptions: Intl.DateTimeFormatOptions = {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  };
  
  return dateObj.toLocaleDateString(undefined, { ...defaultOptions, ...options });
}

/**
 * Format time for display in user's local timezone
 */
export function formatTime(date: string | Date, options?: Intl.DateTimeFormatOptions): string {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  
  const defaultOptions: Intl.DateTimeFormatOptions = {
    hour: '2-digit',
    minute: '2-digit'
  };
  
  return dateObj.toLocaleTimeString(undefined, { ...defaultOptions, ...options });
}

/**
 * Get relative time (e.g., "2 hours ago", "yesterday")
 */
export function getRelativeTime(date: string | Date): string {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - dateObj.getTime()) / 1000);
  
  if (diffInSeconds < 60) {
    return 'just now';
  }
  
  const diffInMinutes = Math.floor(diffInSeconds / 60);
  if (diffInMinutes < 60) {
    return `${diffInMinutes} minute${diffInMinutes !== 1 ? 's' : ''} ago`;
  }
  
  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) {
    return `${diffInHours} hour${diffInHours !== 1 ? 's' : ''} ago`;
  }
  
  const diffInDays = Math.floor(diffInHours / 24);
  if (diffInDays === 1) {
    return 'yesterday';
  }
  if (diffInDays < 7) {
    return `${diffInDays} days ago`;
  }
  
  const diffInWeeks = Math.floor(diffInDays / 7);
  if (diffInWeeks < 4) {
    return `${diffInWeeks} week${diffInWeeks !== 1 ? 's' : ''} ago`;
  }
  
  const diffInMonths = Math.floor(diffInDays / 30);
  if (diffInMonths < 12) {
    return `${diffInMonths} month${diffInMonths !== 1 ? 's' : ''} ago`;
  }
  
  const diffInYears = Math.floor(diffInDays / 365);
  return `${diffInYears} year${diffInYears !== 1 ? 's' : ''} ago`;
}

/**
 * Check if a date is today
 */
export function isToday(date: string | Date): boolean {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  const today = new Date();
  
  return dateObj.toDateString() === today.toDateString();
}

/**
 * Check if a date is yesterday
 */
export function isYesterday(date: string | Date): boolean {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  
  return dateObj.toDateString() === yesterday.toDateString();
}

/**
 * Get the start of day in user's timezone
 */
export function getStartOfDay(date: string | Date): Date {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  const startOfDay = new Date(dateObj);
  startOfDay.setHours(0, 0, 0, 0);
  return startOfDay;
}

/**
 * Get the end of day in user's timezone
 */
export function getEndOfDay(date: string | Date): Date {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  const endOfDay = new Date(dateObj);
  endOfDay.setHours(23, 59, 59, 999);
  return endOfDay;
} 