export type Day = 0 | 1 | 2 | 3 | 4 | 5 | 6;

export interface TimeWindow {
  id: string;
  start: string;
  end: string;
}

export type Access = "anytime" | "windows" | "blocked";

export interface AppGroup {
  id: string;
  name: string;
  appIds: string[];
  dailyLimitMinutes: number | null;
  opensPerDay: number | null;
  sessionMinutes: number | null;
  cooldownMinutes: number | null;
  pauseSeconds: number;
  pauseGrows: boolean;
  pauseMessage: string;
  access: Access;
  days: Day[];
  windows: TimeWindow[];
}

export interface Profile {
  id: string;
  name: string;
  isDefault: boolean;
  days: Day[];
  windows: TimeWindow[];
  groups: AppGroup[];
}

export interface CatalogApp {
  id: string;
  name: string;
  letter: string;
  hue: number;
}

export interface DayUsage {
  secondsByApp: Record<string, number>;
  opensByApp: Record<string, number>;
  lastClosedAtByApp: Record<string, number>;
  bypasses: number;
  exceeded: boolean;
}

export interface Settings {
  lockCode: string | null;
  locked: boolean;
  unlockAt: number | null;
  emergencyPassesPerDay: number;
}

export interface Streak {
  count: number;
  settledThrough: string | null;
}

export interface AppState {
  profiles: Profile[];
  pinnedProfileId: string | null;
  usageByDate: Record<string, DayUsage>;
  streak: Streak;
  settings: Settings;
}

export const CATALOG: CatalogApp[] = [
  { id: "instagram", name: "Instagram", letter: "In", hue: 332 },
  { id: "tiktok", name: "TikTok", letter: "Tk", hue: 178 },
  { id: "x", name: "X", letter: "X", hue: 210 },
  { id: "youtube", name: "YouTube", letter: "Yt", hue: 6 },
  { id: "reddit", name: "Reddit", letter: "Rd", hue: 18 },
  { id: "netflix", name: "Netflix", letter: "Nf", hue: 356 },
  { id: "games", name: "Games", letter: "Ga", hue: 268 },
  { id: "spotify", name: "Spotify", letter: "Sp", hue: 132 },
  { id: "maps", name: "Maps", letter: "Mp", hue: 148 },
  { id: "messages", name: "Messages", letter: "Ms", hue: 205 },
  { id: "mail", name: "Mail", letter: "Ml", hue: 32 },
  { id: "calendar", name: "Calendar", letter: "Ca", hue: 198 },
];

export const MESSAGE_PRESETS = [
  "Is this important?",
  "Why am I checking?",
  "What are you seeking?",
  "Will this matter tomorrow?",
  "Can this wait?",
];

export const DAY_LABELS = ["S", "M", "T", "W", "T", "F", "S"] as const;
export const DAY_NAMES = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"] as const;

export function uid(): string {
  return crypto.randomUUID();
}

export function dateKey(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export function parseKey(key: string): Date {
  const [y, m, d] = key.split("-").map(Number);
  return new Date(y, m - 1, d);
}

export function addDays(key: string, days: number): string {
  const date = parseKey(key);
  date.setDate(date.getDate() + days);
  return dateKey(date);
}

export function minutesOf(date: Date): number {
  return date.getHours() * 60 + date.getMinutes();
}

export function parseHHMM(value: string): number {
  const [h, m] = value.split(":").map(Number);
  return (h || 0) * 60 + (m || 0);
}

export function inWindow(nowMin: number, window: TimeWindow): boolean {
  const start = parseHHMM(window.start);
  const end = parseHHMM(window.end);
  if (start === end) return false;
  if (end > start) return nowMin >= start && nowMin < end;
  return nowMin >= start || nowMin < end;
}

export function emptyUsage(): DayUsage {
  return {
    secondsByApp: {},
    opensByApp: {},
    lastClosedAtByApp: {},
    bypasses: 0,
    exceeded: false,
  };
}

export function usageFor(state: AppState, key: string): DayUsage {
  return state.usageByDate[key] ?? emptyUsage();
}

export function catalogApp(id: string): CatalogApp | undefined {
  return CATALOG.find((app) => app.id === id);
}

export function profileMatches(profile: Profile, date: Date): boolean {
  if (profile.isDefault) return false;
  if (profile.days.length > 0 && !profile.days.includes(date.getDay() as Day)) return false;
  if (profile.windows.length === 0) return true;
  return profile.windows.some((window) => inWindow(minutesOf(date), window));
}

export function defaultProfile(state: AppState): Profile {
  return state.profiles.find((profile) => profile.isDefault) ?? state.profiles[0];
}

export function resolveProfile(state: AppState, date: Date): Profile {
  if (state.pinnedProfileId) {
    const pinned = state.profiles.find((profile) => profile.id === state.pinnedProfileId);
    if (pinned) return pinned;
  }
  return state.profiles.find((profile) => profileMatches(profile, date)) ?? defaultProfile(state);
}

export function scheduledProfile(state: AppState, date: Date): Profile {
  return state.profiles.find((profile) => profileMatches(profile, date)) ?? defaultProfile(state);
}

export function groupFor(profile: Profile, appId: string): AppGroup | undefined {
  return profile.groups.find((group) => group.appIds.includes(appId));
}

export function groupSeconds(usage: DayUsage, group: AppGroup): number {
  return group.appIds.reduce((sum, id) => sum + (usage.secondsByApp[id] ?? 0), 0);
}

export function groupOpens(usage: DayUsage, group: AppGroup): number {
  return group.appIds.reduce((sum, id) => sum + (usage.opensByApp[id] ?? 0), 0);
}

export function nextMidnight(date: Date): number {
  const next = new Date(date);
  next.setHours(24, 0, 0, 0);
  return next.getTime();
}

export function nextOpening(group: AppGroup, from: Date): number | null {
  if (group.access !== "windows" || group.windows.length === 0) return null;
  for (let add = 0; add < 8; add += 1) {
    const day = new Date(from);
    day.setDate(from.getDate() + add);
    day.setHours(0, 0, 0, 0);
    const dow = day.getDay() as Day;
    if (group.days.length > 0 && !group.days.includes(dow)) continue;
    const windows = [...group.windows].sort((a, b) => parseHHMM(a.start) - parseHHMM(b.start));
    for (const window of windows) {
      const start = parseHHMM(window.start);
      const candidate = new Date(day);
      candidate.setHours(Math.floor(start / 60), start % 60, 0, 0);
      if (candidate.getTime() > from.getTime()) return candidate.getTime();
    }
  }
  return null;
}

export function groupIsOpen(group: AppGroup, date: Date): boolean {
  if (group.access === "blocked") return false;
  if (group.access === "anytime") return true;
  if (group.windows.length === 0) return false;
  if (group.days.length > 0 && !group.days.includes(date.getDay() as Day)) return false;
  return group.windows.some((window) => inWindow(minutesOf(date), window));
}

export function pauseLength(group: AppGroup, opensToday: number): number {
  if (group.pauseSeconds <= 0) return 0;
  if (!group.pauseGrows) return group.pauseSeconds;
  return Math.min(120, group.pauseSeconds * (opensToday + 1));
}

export type BlockReason = "schedule" | "minutes" | "opens" | "cooldown";

export type Gate =
  | { kind: "open" }
  | {
      kind: "pause";
      seconds: number;
      message: string;
      groupName: string;
      profileName: string;
    }
  | {
      kind: "block";
      reason: BlockReason;
      detail: string;
      until: number | null;
      groupName: string;
      profileName: string;
    };

export function decideGate(state: AppState, appId: string, date: Date): Gate {
  const profile = resolveProfile(state, date);
  const group = groupFor(profile, appId);
  if (!group) return { kind: "open" };

  const usage = usageFor(state, dateKey(date));
  const profileName = profile.name;

  if (!groupIsOpen(group, date)) {
    return {
      kind: "block",
      reason: "schedule",
      detail:
        group.access === "blocked"
          ? `${group.name} is blocked on ${profile.name}.`
          : `${group.name} is outside its allowed hours.`,
      until: group.access === "windows" ? nextOpening(group, date) : null,
      groupName: group.name,
      profileName,
    };
  }

  if (group.cooldownMinutes != null && group.cooldownMinutes > 0) {
    const closed = usage.lastClosedAtByApp[appId];
    if (closed) {
      const until = closed + group.cooldownMinutes * 60_000;
      if (date.getTime() < until) {
        return {
          kind: "block",
          reason: "cooldown",
          detail: "You just left this app. The cooldown is still running.",
          until,
          groupName: group.name,
          profileName,
        };
      }
    }
  }

  if (group.opensPerDay != null && groupOpens(usage, group) >= group.opensPerDay) {
    return {
      kind: "block",
      reason: "opens",
      detail: `${group.name} has used all ${group.opensPerDay} opens for today.`,
      until: nextMidnight(date),
      groupName: group.name,
      profileName,
    };
  }

  if (group.dailyLimitMinutes != null && groupSeconds(usage, group) >= group.dailyLimitMinutes * 60) {
    return {
      kind: "block",
      reason: "minutes",
      detail: `${group.name} has used its ${group.dailyLimitMinutes} minute${group.dailyLimitMinutes === 1 ? "" : "s"}.`,
      until: nextMidnight(date),
      groupName: group.name,
      profileName,
    };
  }

  const seconds = pauseLength(group, groupOpens(usage, group));
  if (seconds > 0) {
    return {
      kind: "pause",
      seconds,
      message: group.pauseMessage.trim() || "Is this important?",
      groupName: group.name,
      profileName,
    };
  }

  return { kind: "open" };
}

function cloneUsage(usage: DayUsage): DayUsage {
  return {
    secondsByApp: { ...usage.secondsByApp },
    opensByApp: { ...usage.opensByApp },
    lastClosedAtByApp: { ...usage.lastClosedAtByApp },
    bypasses: usage.bypasses,
    exceeded: usage.exceeded,
  };
}

function writeUsage(state: AppState, key: string, usage: DayUsage): AppState {
  return { ...state, usageByDate: { ...state.usageByDate, [key]: usage } };
}

export function recordOpen(state: AppState, appId: string, date: Date): AppState {
  if (!groupFor(resolveProfile(state, date), appId)) return state;
  const key = dateKey(date);
  const usage = cloneUsage(usageFor(state, key));
  usage.opensByApp[appId] = (usage.opensByApp[appId] ?? 0) + 1;
  return writeUsage(state, key, usage);
}

export function recordClose(state: AppState, appId: string, date: Date): AppState {
  const key = dateKey(date);
  const usage = cloneUsage(usageFor(state, key));
  usage.lastClosedAtByApp[appId] = date.getTime();
  return writeUsage(state, key, usage);
}

export function recordSeconds(
  state: AppState,
  appId: string,
  delta: number,
  date: Date,
  enforceLimit: boolean,
): { state: AppState; hitLimit: boolean } {
  const key = dateKey(date);
  const group = groupFor(resolveProfile(state, date), appId);
  if (!group) return { state, hitLimit: false };
  const usage = cloneUsage(usageFor(state, key));
  const next = (usage.secondsByApp[appId] ?? 0) + Math.max(0, delta);
  usage.secondsByApp[appId] = next;

  if (group.dailyLimitMinutes != null) {
    const cap = group.dailyLimitMinutes * 60;
    const total = groupSeconds(usage, group);
    if (total >= cap) {
      usage.exceeded = true;
      if (enforceLimit) {
        const overflow = total - cap;
        usage.secondsByApp[appId] = Math.max(0, next - overflow);
        return { state: writeUsage(state, key, usage), hitLimit: true };
      }
    }
  }

  return { state: writeUsage(state, key, usage), hitLimit: false };
}

export function recordBypass(state: AppState, date: Date): AppState {
  const key = dateKey(date);
  const usage = cloneUsage(usageFor(state, key));
  usage.bypasses += 1;
  return writeUsage(state, key, usage);
}

export function dayFailed(usage: DayUsage | undefined): boolean {
  if (!usage) return false;
  return usage.exceeded || usage.bypasses > 0;
}

export function settleStreak(state: AppState, today: Date): Streak {
  const todayKey = dateKey(today);
  if (state.streak.settledThrough == null) {
    return { count: state.streak.count, settledThrough: addDays(todayKey, -1) };
  }
  let count = state.streak.count;
  let cursor = addDays(state.streak.settledThrough, 1);
  while (cursor < todayKey) {
    count = dayFailed(state.usageByDate[cursor]) ? 0 : count + 1;
    cursor = addDays(cursor, 1);
  }
  return { count, settledThrough: addDays(todayKey, -1) };
}

export function displayStreak(state: AppState, today: Date): number {
  const settled = settleStreak(state, today);
  if (dayFailed(usageFor(state, dateKey(today)))) return 0;
  return settled.count;
}

export function passesLeft(state: AppState, date: Date): number {
  const used = usageFor(state, dateKey(date)).bypasses;
  return Math.max(0, state.settings.emergencyPassesPerDay - used);
}

export function settingsAreLocked(settings: Settings, now: number): boolean {
  if (!settings.locked) return false;
  if (settings.unlockAt != null && now >= settings.unlockAt) return false;
  return true;
}

export function unlockIfDue(settings: Settings, now: number): Settings {
  if (settings.locked && settings.unlockAt != null && now >= settings.unlockAt) {
    return { ...settings, locked: false, unlockAt: null };
  }
  return settings;
}

export function formatDuration(totalSeconds: number): string {
  const seconds = Math.max(0, Math.round(totalSeconds));
  const minutes = Math.floor(seconds / 60);
  const rest = seconds % 60;
  if (minutes >= 60) {
    const hours = Math.floor(minutes / 60);
    const rem = minutes % 60;
    return rem === 0 ? `${hours}h` : `${hours}h ${rem}m`;
  }
  if (minutes === 0) return `${rest}s`;
  if (rest === 0) return `${minutes}m`;
  return `${minutes}m ${rest}s`;
}

export function formatClock(ms: number): string {
  return new Date(ms).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
}

export function formatUntil(until: number | null, now: Date): string {
  if (until == null) return "No automatic unlock";
  const diff = until - now.getTime();
  if (diff <= 0) return "Available now";
  const target = new Date(until);
  const clock = formatClock(until);
  if (dateKey(target) === dateKey(now)) return `Available at ${clock}`;
  if (dateKey(target) === addDays(dateKey(now), 1)) return `Available tomorrow at ${clock}`;
  const weekday = target.toLocaleDateString([], { weekday: "short" });
  return `Available ${weekday} at ${clock}`;
}

export function formatHHMM(value: string): string {
  const date = new Date();
  const minutes = parseHHMM(value);
  date.setHours(Math.floor(minutes / 60), minutes % 60, 0, 0);
  return date.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
}

export function formatDays(days: Day[]): string {
  if (days.length === 0 || days.length === 7) return "Every day";
  const ordered = [...days].sort((a, b) => a - b);
  const key = ordered.join(",");
  if (key === "1,2,3,4,5") return "Weekdays";
  if (key === "0,6") return "Weekends";
  return ordered.map((day) => DAY_NAMES[day]).join(", ");
}

export function formatWindows(windows: TimeWindow[]): string {
  if (windows.length === 0) return "All day";
  return windows.map((window) => `${formatHHMM(window.start)}–${formatHHMM(window.end)}`).join(", ");
}

export function blankGroup(): AppGroup {
  return {
    id: uid(),
    name: "New group",
    appIds: [],
    dailyLimitMinutes: 60,
    opensPerDay: null,
    sessionMinutes: null,
    cooldownMinutes: null,
    pauseSeconds: 5,
    pauseGrows: false,
    pauseMessage: "Is this important?",
    access: "anytime",
    days: [],
    windows: [],
  };
}

export function blankProfile(): Profile {
  return {
    id: uid(),
    name: "New profile",
    isDefault: false,
    days: [],
    windows: [],
    groups: [],
  };
}

export function duplicateProfile(profile: Profile): Profile {
  return {
    ...profile,
    id: uid(),
    name: `${profile.name} copy`,
    isDefault: false,
    days: [...profile.days],
    windows: profile.windows.map((window) => ({ ...window, id: uid() })),
    groups: profile.groups.map((group) => ({
      ...group,
      id: uid(),
      appIds: [...group.appIds],
      days: [...group.days],
      windows: group.windows.map((window) => ({ ...window, id: uid() })),
    })),
  };
}

export function sessionLimitMs(state: AppState, appId: string, date: Date): number | null {
  const group = groupFor(resolveProfile(state, date), appId);
  if (!group?.sessionMinutes) return null;
  return group.sessionMinutes * 60_000;
}
