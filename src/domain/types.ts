export type AppInfo = {
  id: string;
  name: string;
};

export type Schedule = {
  appId: string;
  /** JS Date#getDay values, Sunday = 0. */
  days: number[];
  /** Minutes from local midnight. */
  startMinutes: number;
  durationMinutes: number;
};

export type Wall = {
  lines: string[];
  accent: string;
};

export type AppState = {
  schedules: Record<string, Schedule>;
  knownApps: Record<string, AppInfo>;
  wall: Wall;
};

export type BlockWindow = {
  start: Date;
  end: Date;
};

export const ACCENTS = [
  { id: 'sage', value: '#d6e2c5' },
  { id: 'sand', value: '#e6d3b4' },
  { id: 'mist', value: '#c5d4e4' },
  { id: 'clay', value: '#e4c7bc' },
  { id: 'lilac', value: '#d9d2e6' },
  { id: 'fog', value: '#e4e4e1' },
] as const;

export const DEFAULT_ACCENT = ACCENTS[0].value;

export const DEFAULT_WALL: Wall = {
  lines: ['Look up.', 'The phone can wait.'],
  accent: DEFAULT_ACCENT,
};

export const MIN_DURATION_MINUTES = 15;
export const MAX_DURATION_MINUTES = 12 * 60;
