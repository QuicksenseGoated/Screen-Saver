import { CATALOG } from './catalog';
import { defaultSchedule, sanitizeSchedule } from './schedule';
import type { AppInfo, AppState, Schedule, Wall } from './types';
import { ACCENTS, DEFAULT_ACCENT, DEFAULT_WALL } from './types';

export function defaultState(): AppState {
  return {
    schedules: {},
    knownApps: {},
    wall: { lines: [...DEFAULT_WALL.lines], accent: DEFAULT_WALL.accent },
  };
}

export function sanitizeWall(input: unknown): Wall {
  const fallback: Wall = { lines: [...DEFAULT_WALL.lines], accent: DEFAULT_ACCENT };
  if (!input || typeof input !== 'object') return fallback;
  const raw = input as { lines?: unknown; accent?: unknown };
  const lines = Array.isArray(raw.lines)
    ? raw.lines
        .filter((line): line is string => typeof line === 'string')
        .map((line) => line.trim().slice(0, 80))
        .filter(Boolean)
        .slice(0, 3)
    : [];
  const accent =
    typeof raw.accent === 'string' && ACCENTS.some((item) => item.value === raw.accent)
      ? raw.accent
      : DEFAULT_ACCENT;
  return { lines: lines.length > 0 ? lines : fallback.lines, accent };
}

export function hydrate(raw: string | null | undefined): AppState {
  if (!raw) return defaultState();
  try {
    const parsed: unknown = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object') return defaultState();
    const data = parsed as { schedules?: unknown; knownApps?: unknown; wall?: unknown };
    const schedules: Record<string, Schedule> = {};
    if (data.schedules && typeof data.schedules === 'object') {
      for (const value of Object.values(data.schedules as Record<string, unknown>)) {
        if (!value || typeof value !== 'object') continue;
        const item = value as Partial<Schedule>;
        const clean = sanitizeSchedule({
          appId: typeof item.appId === 'string' ? item.appId : '',
          days: Array.isArray(item.days) ? item.days.map((day) => Number(day)) : [],
          startMinutes: Number(item.startMinutes),
          durationMinutes: Number(item.durationMinutes),
        });
        if (clean) schedules[clean.appId] = clean;
      }
    }
    const knownApps: Record<string, AppInfo> = {};
    if (data.knownApps && typeof data.knownApps === 'object') {
      for (const value of Object.values(data.knownApps as Record<string, unknown>)) {
        if (!value || typeof value !== 'object') continue;
        const item = value as Partial<AppInfo>;
        if (typeof item.id !== 'string' || !item.id) continue;
        if (typeof item.name !== 'string' || !item.name.trim()) continue;
        knownApps[item.id] = { id: item.id, name: item.name.trim() };
      }
    }
    return { schedules, knownApps, wall: sanitizeWall(data.wall) };
  } catch {
    return defaultState();
  }
}

export function serialize(state: AppState): string {
  return JSON.stringify(state);
}

export function withBlock(state: AppState, app: AppInfo, now: Date): AppState {
  if (state.schedules[app.id]) return state;
  return {
    ...state,
    knownApps: { ...state.knownApps, [app.id]: { id: app.id, name: app.name } },
    schedules: { ...state.schedules, [app.id]: defaultSchedule(app.id, now) },
  };
}

export function withoutBlock(state: AppState, appId: string): AppState {
  if (!state.schedules[appId]) return state;
  const schedules = { ...state.schedules };
  const knownApps = { ...state.knownApps };
  delete schedules[appId];
  delete knownApps[appId];
  return { ...state, schedules, knownApps };
}

export function withSchedule(state: AppState, schedule: Schedule): AppState {
  const clean = sanitizeSchedule(schedule);
  if (!clean || !state.schedules[clean.appId]) return state;
  return { ...state, schedules: { ...state.schedules, [clean.appId]: clean } };
}

export function withWall(state: AppState, wall: Wall): AppState {
  return { ...state, wall: sanitizeWall(wall) };
}

export function resolveAppList(
  nativeApps: readonly { id?: string; name?: string }[] | null | undefined,
  catalog: readonly AppInfo[] = CATALOG,
): { apps: AppInfo[]; source: 'device' | 'catalog' } {
  const seen = new Set<string>();
  const apps: AppInfo[] = [];
  for (const app of nativeApps ?? []) {
    const id = typeof app?.id === 'string' ? app.id.trim() : '';
    const name = typeof app?.name === 'string' ? app.name.trim() : '';
    if (!id || !name || seen.has(id)) continue;
    seen.add(id);
    apps.push({ id, name });
  }
  if (apps.length > 0) return { apps, source: 'device' };
  return { apps: catalog.map((app) => ({ ...app })), source: 'catalog' };
}
