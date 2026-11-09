export function pad(value: number): string {
  return String(value).padStart(2, '0');
}

export function formatTimeOfDay(minutes: number): string {
  const hours = Math.floor(minutes / 60) % 24;
  const mins = ((minutes % 60) + 60) % 60;
  return `${pad(hours)}:${pad(mins)}`;
}

export function formatClock(date: Date, withSeconds = false): string {
  const base = `${pad(date.getHours())}:${pad(date.getMinutes())}`;
  return withSeconds ? `${base}:${pad(date.getSeconds())}` : base;
}

const DAYS = ['SUNDAY', 'MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY'];
const MONTHS = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];

export function formatDateLine(date: Date): string {
  return `${DAYS[date.getDay()]} ${date.getDate()} ${MONTHS[date.getMonth()]}`;
}

export function formatCountdown(ms: number): string {
  if (ms <= 0) return '00:00';
  const total = Math.ceil(ms / 1000);
  const hours = Math.floor(total / 3600);
  const minutes = Math.floor((total % 3600) / 60);
  const seconds = total % 60;
  const clock = `${pad(minutes)}:${pad(seconds)}`;
  return hours > 0 ? `${hours}:${clock}` : clock;
}

export function formatDuration(minutes: number): string {
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  if (rest === 0) return hours === 1 ? '1 hour' : `${hours} hours`;
  return `${hours}h ${rest}m`;
}

export function formatDurationCompact(minutes: number): string {
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  return rest === 0 ? `${hours}h` : `${hours}h ${rest}m`;
}

const SHORT_DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const DISPLAY_ORDER = [1, 2, 3, 4, 5, 6, 0];

export function formatDays(days: number[]): string {
  const set = new Set(days);
  if (set.size === 7) return 'every day';
  const weekdays = [1, 2, 3, 4, 5];
  if (set.size === 5 && weekdays.every((day) => set.has(day))) return 'weekdays';
  if (set.size === 2 && set.has(0) && set.has(6)) return 'weekends';
  return DISPLAY_ORDER.filter((day) => set.has(day))
    .map((day) => SHORT_DAYS[day])
    .join(' ');
}
