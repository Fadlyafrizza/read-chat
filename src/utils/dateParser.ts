/**
 * Parse WhatsApp date string to Date object
 */
export function parseWhatsAppDate(
  dateString: string,
  format: string
): Date | null {
  try {
    // Remove brackets if present
    const cleaned = dateString.replace(/[\[\]]/g, '').trim();
    
    // Split date and time
    const [datePart, timePart] = cleaned.split(',').map(s => s.trim());
    
    if (!datePart || !timePart) return null;
    
    // Parse based on format
    const delimiter = datePart.includes('/') ? '/' : datePart.includes('.') ? '.' : '-';
    const parts = datePart.split(delimiter);
    
    if (parts.length < 3) return null;
    
    let day: number, month: number, year: number;
    
    if (format.startsWith('DD')) {
      day = parseInt(parts[0]);
      month = parseInt(parts[1]) - 1; // JS months are 0-indexed
      year = parseInt(parts[2]);
    } else if (format.startsWith('MM')) {
      month = parseInt(parts[0]) - 1;
      day = parseInt(parts[1]);
      year = parseInt(parts[2]);
    } else if (format.startsWith('YYYY')) {
      year = parseInt(parts[0]);
      month = parseInt(parts[1]) - 1;
      day = parseInt(parts[2]);
    } else {
      return null;
    }
    
    // Handle 2-digit years
    if (year < 100) {
      year += 2000;
    }
    
    // Parse time
    const timeMatch = timePart.match(/(\d{1,2})[:.:](\d{2})(?:[:.:](\d{2}))?\s*(AM|PM)?/i);
    if (!timeMatch) return null;
    
    let hour = parseInt(timeMatch[1]);
    const minute = parseInt(timeMatch[2]);
    const second = timeMatch[3] ? parseInt(timeMatch[3]) : 0;
    const period = timeMatch[4];
    
    // Handle AM/PM
    if (period) {
      if (period.toUpperCase() === 'PM' && hour !== 12) {
        hour += 12;
      } else if (period.toUpperCase() === 'AM' && hour === 12) {
        hour = 0;
      }
    }
    
    return new Date(year, month, day, hour, minute, second);
  } catch (error) {
    console.error('Error parsing date:', error);
    return null;
  }
}

/**
 * Format date for display
 */
export function formatDate(date: Date): string {
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  
  if (isSameDay(date, today)) {
    return 'Today';
  } else if (isSameDay(date, yesterday)) {
    return 'Yesterday';
  } else {
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  }
}

function isSameDay(date1: Date, date2: Date): boolean {
  return (
    date1.getFullYear() === date2.getFullYear() &&
    date1.getMonth() === date2.getMonth() &&
    date1.getDate() === date2.getDate()
  );
}
