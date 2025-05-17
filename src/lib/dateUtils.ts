import { format, parseISO } from 'date-fns';

/**
 * Formats a date string or Date object to a user-friendly format
 */
export const formatDate = (dateString: string | Date): string => {
  try {
    const date = typeof dateString === 'string' ? parseISO(dateString) : dateString;
    return format(date, 'MMM d, yyyy');
  } catch (error) {
    console.error('Error formatting date:', error);
    return 'Invalid date';
  }
};

/**
 * Formats a time string to a user-friendly format with AM/PM
 */
export const formatTime = (timeString: string): string => {
  try {
    // If it's a full ISO timestamp, parse it first
    if (timeString.includes('T') || timeString.includes('+')) {
      const date = parseISO(timeString);
      return format(date, 'h:mm a');
    }
    
    // Otherwise, try to parse it as a time string (HH:MM format)
    const [hours, minutes] = timeString.split(':').map(Number);
    const date = new Date();
    date.setHours(hours);
    date.setMinutes(minutes);
    return format(date, 'h:mm a');
  } catch (error) {
    console.error('Error formatting time:', error);
    return timeString; // Return the original if parsing fails
  }
};

/**
 * Formats a full date range for schedule display
 */
export const formatScheduleTimeRange = (date: string, startTime: string, endTime: string): string => {
  try {
    const formattedDate = formatDate(date);
    const formattedStartTime = formatTime(startTime);
    const formattedEndTime = formatTime(endTime);
    
    return `${formattedDate} — ${formattedStartTime} to ${formattedEndTime}`;
  } catch (error) {
    console.error('Error formatting schedule time range:', error);
    return `${date} — ${startTime} to ${endTime}`;
  }
};
