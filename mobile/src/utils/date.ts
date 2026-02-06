const DEFAULT_LOCALE = 'fr-FR';
const FALLBACK_LOCALE = 'en-US';

const clampDate = (date: Date) => {
  const copy = new Date(date.getTime());
  copy.setHours(0, 0, 0, 0);
  return copy;
};

export const parseISO = (value: string) => new Date(value);

export const startOfWeek = (date: Date, options?: { weekStartsOn?: number }) => {
  const weekStartsOn = options?.weekStartsOn ?? 0;
  const result = clampDate(date);
  const day = result.getDay();
  const diff = (day < weekStartsOn ? 7 : 0) + day - weekStartsOn;
  result.setDate(result.getDate() - diff);
  return result;
};

export const addDays = (date: Date, amount: number) => {
  const result = new Date(date.getTime());
  result.setDate(result.getDate() + amount);
  return result;
};

export const addWeeks = (date: Date, amount: number) => addDays(date, amount * 7);

export const subWeeks = (date: Date, amount: number) => addWeeks(date, -amount);

export const isSameDay = (left: Date, right: Date) => {
  return (
    left.getFullYear() === right.getFullYear() &&
    left.getMonth() === right.getMonth() &&
    left.getDate() === right.getDate()
  );
};

export const format = (date: Date, pattern: string): string => {
  switch (pattern) {
    case 'MMMM yyyy':
      return new Intl.DateTimeFormat(DEFAULT_LOCALE, {
        month: 'long',
        year: 'numeric',
      }).format(date);
    case 'EEE':
      return new Intl.DateTimeFormat(DEFAULT_LOCALE, {
        weekday: 'short',
      }).format(date);
    case 'd':
      return `${date.getDate()}`;
    case 'MMM dd, yyyy':
      return new Intl.DateTimeFormat(FALLBACK_LOCALE, {
        month: 'short',
        day: '2-digit',
        year: 'numeric',
      }).format(date);
    case 'hh:mm a':
      return new Intl.DateTimeFormat(FALLBACK_LOCALE, {
        hour: '2-digit',
        minute: '2-digit',
        hour12: true,
      }).format(date);
    default:
      return date.toLocaleDateString(DEFAULT_LOCALE);
  }
};

export const formatDistanceToNow = (
  date: Date,
  options?: { addSuffix?: boolean },
): string => {
  const now = Date.now();
  const diff = date.getTime() - now;
  const absDiff = Math.abs(diff);

  const minute = 60 * 1000;
  const hour = 60 * minute;
  const day = 24 * hour;
  const week = 7 * day;
  const month = 30 * day;
  const year = 365 * day;

  let value: number;
  let unit: Intl.RelativeTimeFormatUnit;

  if (absDiff < minute) {
    value = Math.round(diff / 1000);
    unit = 'second';
  } else if (absDiff < hour) {
    value = Math.round(diff / minute);
    unit = 'minute';
  } else if (absDiff < day) {
    value = Math.round(diff / hour);
    unit = 'hour';
  } else if (absDiff < week) {
    value = Math.round(diff / day);
    unit = 'day';
  } else if (absDiff < month) {
    value = Math.round(diff / week);
    unit = 'week';
  } else if (absDiff < year) {
    value = Math.round(diff / month);
    unit = 'month';
  } else {
    value = Math.round(diff / year);
    unit = 'year';
  }

  const formatter = new Intl.RelativeTimeFormat(DEFAULT_LOCALE, { numeric: 'auto' });
  const formatted = formatter.format(value, unit);

  if (options?.addSuffix === false) {
    return formatted.replace(/il y a |dans /i, '').trim();
  }

  return formatted;
};
