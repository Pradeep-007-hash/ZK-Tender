/**
 * Utility functions for parsing tender deadlines and checking expiration status.
 */

/**
 * Safely parses various tender deadline formats (ISO 8601, "DD Mon YYYY", numeric timestamps)
 * @param {string|number|Date} dateVal
 * @returns {number|null} Timestamp in milliseconds or null if unparseable
 */
export function parseDeadlineDate(dateVal) {
  if (!dateVal) return null;
  if (typeof dateVal === 'number') {
    return dateVal < 1e11 ? dateVal * 1000 : dateVal;
  }
  const str = String(dateVal).trim();
  const parsed = new Date(str);
  if (!isNaN(parsed.getTime())) {
    // If string has date without explicit time (no colon), allow until end of day (23:59:59.999)
    if (!str.includes(':')) {
      parsed.setHours(23, 59, 59, 999);
    }
    return parsed.getTime();
  }

  // Handle format: "30 Sep 2026", "05 Oct 2026", "1-10-2026"
  const match = str.match(/^(\d{1,2})[\s\-\/]([A-Za-z]{3,9}|\d{1,2})[\s\-\/](\d{4})/);
  if (match) {
    const day = parseInt(match[1], 10);
    const monthStr = match[2];
    const year = parseInt(match[3], 10);
    const months = {
      jan: 0, january: 0,
      feb: 1, february: 1,
      mar: 2, march: 2,
      apr: 3, april: 3,
      may: 4,
      jun: 5, june: 5,
      jul: 6, july: 6,
      aug: 7, august: 7,
      sep: 8, september: 8,
      oct: 9, october: 9,
      nov: 10, november: 10,
      dec: 11, december: 11
    };
    const month = isNaN(monthStr) ? months[monthStr.toLowerCase()] : parseInt(monthStr, 10) - 1;
    if (month !== undefined && month >= 0 && month <= 11) {
      const d = new Date(year, month, day, 23, 59, 59, 999);
      if (!isNaN(d.getTime())) return d.getTime();
    }
  }

  return null;
}

/**
 * Checks whether a tender's deadline has concluded or if its status is closed.
 * Accepts either a tender object or a date string / timestamp directly.
 * @param {object|string|number|Date} tenderOrDate
 * @returns {boolean} True if deadline is over
 */
export function isTenderDeadlineOver(tenderOrDate) {
  if (!tenderOrDate) return false;
  if (typeof tenderOrDate === 'object' && !(tenderOrDate instanceof Date)) {
    const statusUpper = String(tenderOrDate.status || '').toUpperCase();
    if (
      statusUpper === 'CLOSED' ||
      statusUpper === 'CANCELLED' ||
      statusUpper === 'AWARDED' ||
      statusUpper === 'UNDER EVALUATION' ||
      statusUpper === 'DEADLINE OVER'
    ) {
      return true;
    }
  }

  const raw = (typeof tenderOrDate === 'object' && !(tenderOrDate instanceof Date))
    ? (tenderOrDate.rawClosingDate || tenderOrDate.submissionDeadline || tenderOrDate.closingDate || tenderOrDate.bidDeadline || tenderOrDate.deadline)
    : tenderOrDate;

  const deadlineTime = parseDeadlineDate(raw);
  if (!deadlineTime) return false;
  return Date.now() > deadlineTime;
}

/**
 * Formats a tender deadline date for clean user-facing display.
 * @param {string|number|Date|object} dateVal
 * @returns {string} Formatted date string (e.g. "30 Sep 2026")
 */
export function formatDeadlineDisplay(dateVal) {
  if (!dateVal) return 'N/A';
  if (typeof dateVal === 'object' && dateVal !== null && !(dateVal instanceof Date)) {
    dateVal = dateVal.submissionDeadline || dateVal.closingDate || dateVal.rawClosingDate || dateVal.deadline;
  }
  const timestamp = parseDeadlineDate(dateVal);
  if (!timestamp) return String(dateVal);
  return new Date(timestamp).toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric'
  });
}

/**
 * Returns human-readable time remaining string or "Deadline Passed"
 * @param {string|number|Date} dateVal
 * @returns {string}
 */
export function getTenderTimeRemaining(dateVal) {
  const deadlineTime = parseDeadlineDate(dateVal);
  if (!deadlineTime) return 'Active';
  const diff = deadlineTime - Date.now();
  if (diff <= 0) return 'Deadline Ended';

  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));

  if (days > 1) return `${days} days left`;
  if (days === 1) return `1 day, ${hours}h left`;
  if (hours > 0) return `${hours}h left`;
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  return `${minutes}m left`;
}
