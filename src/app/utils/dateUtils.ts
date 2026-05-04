/**
 * Date formatting utilities for chat messages and timestamps
 */

export interface DateFormatOptions {
  showTime?: boolean;
  showDate?: boolean;
  relative?: boolean;
  short?: boolean;
}

/**
 * Format a timestamp for display in chat messages
 * 
 * @param timestamp - The timestamp to format (Date object or ISO string)
 * @param options - Formatting options
 * @returns Formatted date string
 */
export function formatMessageTime(
  timestamp: Date | string, 
  options: DateFormatOptions = {}
): string {
  const date = typeof timestamp === 'string' ? new Date(timestamp) : timestamp;
  
  if (isNaN(date.getTime())) {
    return 'Invalid date';
  }

  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const messageDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  
  const isToday = messageDate.getTime() === today.getTime();
  const isYesterday = messageDate.getTime() === today.getTime() - (24 * 60 * 60 * 1000);
  const isThisYear = date.getFullYear() === now.getFullYear();

  // Default options
  const { showTime = true, showDate = true, relative = false, short = false } = options;

  if (relative) {
    return getRelativeTime(date, now);
  }

  let timeString = '';
  let dateString = '';

  // Format time
  if (showTime) {
    if (short) {
      timeString = date.toLocaleTimeString('en-US', { 
        hour: 'numeric', 
        minute: '2-digit',
        hour12: true 
      });
    } else {
      timeString = date.toLocaleTimeString('en-US', { 
        hour: '2-digit', 
        minute: '2-digit',
        hour12: true 
      });
    }
  }

  // Format date
  if (showDate) {
    if (isToday) {
      dateString = 'Today';
    } else if (isYesterday) {
      dateString = 'Yesterday';
    } else if (isThisYear) {
      if (short) {
        dateString = date.toLocaleDateString('en-US', { 
          month: 'short', 
          day: 'numeric' 
        });
      } else {
        dateString = date.toLocaleDateString('en-US', { 
          month: 'short', 
          day: 'numeric' 
        });
      }
    } else {
      if (short) {
        dateString = date.toLocaleDateString('en-US', { 
          month: 'short', 
          day: 'numeric',
          year: 'numeric'
        });
      } else {
        dateString = date.toLocaleDateString('en-US', { 
          month: 'short', 
          day: 'numeric',
          year: 'numeric'
        });
      }
    }
  }

  // Combine date and time
  if (showDate && showTime) {
    return `${dateString} at ${timeString}`;
  } else if (showDate) {
    return dateString;
  } else if (showTime) {
    return timeString;
  } else {
    return date.toLocaleDateString('en-US');
  }
}

/**
 * Get relative time format (e.g., "2 hours ago", "Yesterday")
 */
function getRelativeTime(date: Date, now: Date): string {
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMins < 1) {
    return 'Just now';
  } else if (diffMins < 60) {
    return `${diffMins} minute${diffMins > 1 ? 's' : ''} ago`;
  } else if (diffHours < 24) {
    return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
  } else if (diffDays === 1) {
    return 'Yesterday';
  } else if (diffDays < 7) {
    return `${diffDays} days ago`;
  } else {
    return formatMessageTime(date, { showDate: true, showTime: false });
  }
}

/**
 * Format timestamp for message hover or detailed view
 */
export function formatFullTimestamp(timestamp: Date | string): string {
  const date = typeof timestamp === 'string' ? new Date(timestamp) : timestamp;
  
  if (isNaN(date.getTime())) {
    return 'Invalid date';
  }

  return date.toLocaleString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: true
  });
}

/**
 * Check if a message was sent today
 */
export function isMessageToday(timestamp: Date | string): boolean {
  const date = typeof timestamp === 'string' ? new Date(timestamp) : timestamp;
  const now = new Date();
  
  return (
    date.getDate() === now.getDate() &&
    date.getMonth() === now.getMonth() &&
    date.getFullYear() === now.getFullYear()
  );
}

/**
 * Check if a message was sent yesterday
 */
export function isMessageYesterday(timestamp: Date | string): boolean {
  const messageDate = typeof timestamp === 'string' ? new Date(timestamp) : timestamp;
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  
  return (
    messageDate.getDate() === yesterday.getDate() &&
    messageDate.getMonth() === yesterday.getMonth() &&
    messageDate.getFullYear() === yesterday.getFullYear()
  );
}

/**
 * Get date divider text for message groups
 */
export function getDateDividerText(timestamp: Date | string): string {
  const date = typeof timestamp === 'string' ? new Date(timestamp) : timestamp;
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const messageDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  
  const isToday = messageDate.getTime() === today.getTime();
  const isYesterday = messageDate.getTime() === today.getTime() - (24 * 60 * 60 * 1000);
  const isThisYear = date.getFullYear() === now.getFullYear();

  if (isToday) {
    return 'Today';
  } else if (isYesterday) {
    return 'Yesterday';
  } else if (isThisYear) {
    return date.toLocaleDateString('en-US', { 
      weekday: 'long',
      month: 'long', 
      day: 'numeric' 
    });
  } else {
    return date.toLocaleDateString('en-US', { 
      weekday: 'long',
      month: 'long', 
      day: 'numeric',
      year: 'numeric'
    });
  }
}
