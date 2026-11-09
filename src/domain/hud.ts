import { activeWindow, remainingMs, upcomingWindow } from './schedule';
import type { AppState } from './types';

export type HudBlock = {
  appId: string;
  name: string;
  remainingMs: number;
  durationMs: number;
  end: Date;
};

export type HudNext = {
  appId: string;
  name: string;
  start: Date;
  durationMinutes: number;
};

export function appName(state: AppState, appId: string): string {
  return state.knownApps[appId]?.name ?? appId;
}

export function blockedRows(state: AppState, now: Date): HudBlock[] {
  const rows: HudBlock[] = [];
  for (const schedule of Object.values(state.schedules)) {
    const active = activeWindow(schedule, now);
    if (!active) continue;
    rows.push({
      appId: schedule.appId,
      name: appName(state, schedule.appId),
      remainingMs: remainingMs(schedule, now),
      durationMs: schedule.durationMinutes * 60_000,
      end: active.end,
    });
  }
  rows.sort((a, b) => a.remainingMs - b.remainingMs || a.name.localeCompare(b.name));
  return rows;
}

export function upcomingRows(state: AppState, now: Date): HudNext[] {
  const rows: HudNext[] = [];
  for (const schedule of Object.values(state.schedules)) {
    if (activeWindow(schedule, now)) continue;
    const next = upcomingWindow(schedule, now);
    if (!next) continue;
    rows.push({
      appId: schedule.appId,
      name: appName(state, schedule.appId),
      start: next.start,
      durationMinutes: schedule.durationMinutes,
    });
  }
  rows.sort((a, b) => a.start.getTime() - b.start.getTime() || a.name.localeCompare(b.name));
  return rows.slice(0, 3);
}
