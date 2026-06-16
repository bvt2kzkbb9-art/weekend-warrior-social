/**
 * Format a date as time (e.g., "16:30", "Yesterday", "Jun 15")
 */
export function formatTime(date) {
  if (!date) return '';

  const now = new Date();
  const then = date instanceof Date ? date : date.toDate();

  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const thenStart = new Date(then.getFullYear(), then.getMonth(), then.getDate());

  const diffDays = Math.floor((todayStart - thenStart) / (1000 * 60 * 60 * 24));

  if (diffDays === 0) {
    // Today: show time
    return then.toLocaleTimeString('pl-PL', { hour: '2-digit', minute: '2-digit' });
  } else if (diffDays === 1) {
    // Yesterday
    return 'Wczoraj';
  } else if (diffDays < 7) {
    // This week: show day name
    return then.toLocaleDateString('pl-PL', { weekday: 'short' });
  } else {
    // Older: show date
    return then.toLocaleDateString('pl-PL', { month: 'short', day: 'numeric' });
  }
}

/**
 * Format a date as full date string (e.g., "15 czerwca 2026")
 */
export function formatDate(date) {
  if (!date) return '';

  const d = date instanceof Date ? date : date.toDate();
  return d.toLocaleDateString('pl-PL', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
}

/**
 * Get initials from a name (e.g., "Jan Kowalski" → "JK")
 */
export function getInitials(name) {
  if (!name) return '?';
  return name
    .split(' ')
    .slice(0, 2)
    .map(part => part.charAt(0).toUpperCase())
    .join('');
}

/**
 * Truncate text to a maximum length
 */
export function truncate(text, maxLength = 50) {
  if (!text) return '';
  return text.length > maxLength ? text.substring(0, maxLength) + '...' : text;
}

/**
 * Pluralize a word based on a count
 */
export function pluralize(count, singular, plural) {
  return count === 1 ? singular : plural;
}

/**
 * Format a number as a shortened string (e.g., 1200 → "1.2K")
 */
export function formatNumber(num) {
  if (num >= 1000000) {
    return (num / 1000000).toFixed(1) + 'M';
  } else if (num >= 1000) {
    return (num / 1000).toFixed(1) + 'K';
  }
  return num.toString();
}

/**
 * Debounce a function
 */
export function debounce(func, delay) {
  let timeout;
  return function (...args) {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), delay);
  };
}

/**
 * Throttle a function
 */
export function throttle(func, limit) {
  let inThrottle;
  return function (...args) {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => (inThrottle = false), limit);
    }
  };
}
