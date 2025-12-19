import { format, parseISO } from 'date-fns';

/**
 * Converts 24-hour format time string to 12-hour format display
 * Example: "14:30" -> "2:30 PM"
 */
export const format24To12 = (time24: string): string => {
  try {
    const [hoursStr, minutesStr] = time24.split(':');
    const hours = parseInt(hoursStr, 10);
    const minutes = parseInt(minutesStr, 10);

    if (isNaN(hours) || isNaN(minutes)) {
      return time24;
    }

    const period = hours >= 12 ? 'PM' : 'AM';
    const hours12 = hours % 12 || 12; // Convert 0 to 12 for 12 AM

    return `${hours12}:${minutesStr.padStart(2, '0')} ${period}`;
  } catch (error) {
    console.error('Error converting time format:', error);
    return time24;
  }
};

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
    // If it's a full ISO timestamp with timezone (like 2025-05-17T14:30:00+00:00)
    if (timeString.includes('T') && (timeString.includes('+') || timeString.includes('Z'))) {
      const date = parseISO(timeString);
      // Check if seconds are needed (for real-time updates)
      if (timeString.includes(':') && timeString.split(':').length > 2) {
        return format(date, 'h:mm:ss a'); // e.g., "2:30:15 PM"
      }
      return format(date, 'h:mm a'); // e.g., "2:30 PM"
    }

    // If it's a partial ISO timestamp (like 2025-05-17T14:30:00)
    if (timeString.includes('T')) {
      const date = parseISO(timeString);
      // Check if seconds are needed (for real-time updates)
      if (timeString.includes(':') && timeString.split(':').length > 2) {
        return format(date, 'h:mm:ss a'); // e.g., "2:30:15 PM"
      }
      return format(date, 'h:mm a');
    }

    // If it's just a time string (like 14:30 or 14:30:00)
    if (timeString.includes(':')) {
      const timeParts = timeString.split(':');
      const hours = parseInt(timeParts[0], 10);
      const minutes = parseInt(timeParts[1], 10);

      if (!isNaN(hours) && !isNaN(minutes)) {
        const date = new Date();
        date.setHours(hours);
        date.setMinutes(minutes);

        // If there are seconds in the time string (like 14:30:45)
        if (timeParts.length > 2 && !isNaN(parseInt(timeParts[2], 10))) {
          date.setSeconds(parseInt(timeParts[2], 10));
          return format(date, 'h:mm:ss a'); // e.g., "2:30:45 PM"
        }

        return format(date, 'h:mm a'); // e.g., "2:30 PM"
      }
    }

    // If all parsing attempts fail, return the original
    return timeString;
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

/**
 * Formats an ISO timestamp to a user-friendly date and time format
 * Example: "2025-05-17T14:30:00+00:00" -> "May 17, 2025 at 2:30 PM"
 */
export const formatISOTimestamp = (timestamp: string): string => {
  try {
    if (!timestamp) return 'N/A';

    const date = parseISO(timestamp);
    return format(date, 'MMM d, yyyy \'at\' h:mm a');
  } catch (error) {
    console.error('Error formatting ISO timestamp:', error);
    return timestamp;
  }
};

/**
 * Formats a scheduling conflict message with human-readable date and time
 * Takes a schedule object and returns a formatted conflict message
 */
export const formatConflictMessage = (
  title: string,
  date: string,
  startTime: string,
  endTime: string
): string => {
  try {
    // Extract date from ISO format if needed
    let scheduleDate = date;
    if (startTime.includes('T')) {
      // If startTime is a full ISO timestamp, extract the date part
      scheduleDate = startTime.split('T')[0];
      startTime = startTime.split('T')[1];
    }
    if (endTime.includes('T')) {
      endTime = endTime.split('T')[1];
    }

    // Format the date and times
    const formattedDate = formatDate(scheduleDate);
    const formattedStartTime = formatTime(startTime);
    const formattedEndTime = formatTime(endTime);

    return `Scheduling conflict with: ${title} (${formattedDate}, ${formattedStartTime} - ${formattedEndTime})`;
  } catch (error) {
    console.error('Error formatting conflict message:', error);
    // Fallback to a basic format if there's an error
    return `Scheduling conflict with: ${title} (${date}, ${startTime} - ${endTime})`;
  }
};
