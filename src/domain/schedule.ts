import { formatClock, formatDays, formatDuration, formatTimeOfDay } from './format';
import type { BlockWindow, Schedule } from './types';
import { MAX_DURATION_MINUTES, MIN_DURATION_MINUTES } from './types';

export function startOfDay(date: Date): Date {
  const next = new Date(date);
  next.setHours(0, 0, 0, 0);
  return next;
}

export function addDays(date: Date, days: number): Date {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}

export function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

export function sanitizeSchedule(input: Schedule): Schedule | null {
  if (!input.appId || typeof input.appId !== 'string') return null;
  if (!Number.isFinite(input.startMinutes) || !Number.isFinite(input.durationMinutes)) return null;
  const days = [
    ...new Set(input.days.filter((day) => Number.isInteger(day) && day >= 0 && day <= 6)),
  ].sort((a, b) => a - b);
  if (days.length === 0) return null;
  return {
    appId: input.appId,
    days,
    startMinutes: clamp(Math.round(input.startMinutes), 0, 23 * 60 + 59),
    durationMinutes: clamp(
      Math.round(input.durationMinutes),
      MIN_DURATION_MINUTES,
      MAX_DURATION_MINUTES,
    ),
  };
}

/** A block that covers the current hour, every day, for one hour. */
export function defaultSchedule(appId: string, now: Date): Schedule {
  return {
    appId,
    days: [0, 1, 2, 3, 4, 5, 6],
    startMinutes: now.getHours() * 60,
    durationMinutes: 60,
  };
}

export function windowOnDay(schedule: Schedule, day: Date): BlockWindow | null {
  const dayStart = startOfDay(day);
  if (!schedule.days.includes(dayStart.getDay())) return null;
  const start = new Date(dayStart);
  start.setHours(Math.floor(schedule.startMinutes / 60), schedule.startMinutes % 60, 0, 0);
  const end = new Date(start.getTime() + schedule.durationMinutes * 60_000);
  return { start, end };
}

export function activeWindow(schedule: Schedule, now: Date): BlockWindow | null {
  const today = startOfDay(now);
  for (const day of [addDays(today, -1), today]) {
    const window = windowOnDay(schedule, day);
    if (!window) continue;
    const time = now.getTime();
    if (time >= window.start.getTime() && time < window.end.getTime()) return window;
  }
  return null;
}

export function upcomingWindow(schedule: Schedule, now: Date): BlockWindow | null {
  const today = startOfDay(now);
  for (let offset = 0; offset < 8; offset += 1) {
    const window = windowOnDay(schedule, addDays(today, offset));
    if (window && window.start.getTime() > now.getTime()) return window;
  }
  return null;
}

export function remainingMs(schedule: Schedule, now: Date): number {
  const window = activeWindow(schedule, now);
  if (!window) return 0;
  return Math.max(0, window.end.getTime() - now.getTime());
}

export function progressRemaining(schedule: Schedule, now: Date): number {
  const window = activeWindow(schedule, now);
  if (!window) return 0;
  const total = schedule.durationMinutes * 60_000;
  if (total <= 0) return 0;
  return clamp((window.end.getTime() - now.getTime()) / total, 0, 1);
}

const WEEKDAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

export function formatWhen(start: Date, now: Date): string {
  const time = formatClock(start);
  const day = startOfDay(start).getTime();
  const today = startOfDay(now).getTime();
  if (day === today) return `today at ${time}`;
  if (day === startOfDay(addDays(new Date(today), 1)).getTime()) return `tomorrow at ${time}`;
  return `${WEEKDAYS[start.getDay()]} at ${time}`;
}

export function formatUntil(end: Date, now: Date): string {
  const time = formatClock(end);
  if (startOfDay(end).getTime() === startOfDay(now).getTime()) return `until ${time}`;
  return `until ${time} tomorrow`;
}

export function describeSchedule(schedule: Schedule, now: Date): { summary: string; status: string } {
  const summary = `Blocked from ${formatTimeOfDay(schedule.startMinutes)} for ${formatDuration(schedule.durationMinutes)}, ${formatDays(schedule.days)}.`;
  const active = activeWindow(schedule, now);
  if (active) {
    const minutes = Math.max(1, Math.ceil(remainingMs(schedule, now) / 60_000));
    const left = minutes === 1 ? '1 minute' : `${minutes} minutes`;
    return { summary, status: `Blocked right now, ${left} left.` };
  }
  const next = upcomingWindow(schedule, now);
  if (!next) return { summary, status: 'This block does not come up this week.' };
  return { summary, status: `Next block is ${formatWhen(next.start, now)}.` };
}

export function stepHours(startMinutes: number, delta: number): number {
  const minutes = startMinutes % 60;
  const hours = (Math.floor(startMinutes / 60) + delta + 24) % 24;
  return hours * 60 + minutes;
}

export function stepMinuteMarks(startMinutes: number, deltaMarks: number): number {
  const hours = Math.floor(startMinutes / 60);
  let minutes = Math.round((startMinutes % 60) / 5) * 5 + deltaMarks * 5;
  if (minutes < 0) minutes = 55;
  if (minutes > 55) minutes = 0;
  return hours * 60 + minutes;
}

export function stepDuration(durationMinutes: number, delta: number): number {
  return clamp(durationMinutes + delta, MIN_DURATION_MINUTES, MAX_DURATION_MINUTES);
}

export function toggleDay(days: number[], day: number): number[] {
  if (days.includes(day)) {
    if (days.length === 1) return days;
    return days.filter((value) => value !== day);
  }
  return [...days, day].sort((a, b) => a - b);
}
