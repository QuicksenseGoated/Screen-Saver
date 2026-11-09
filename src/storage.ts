import { settleStreak, unlockIfDue, type AppState } from "./model";
import { seedState } from "./seed";

const KEY = "screen-saver-v1";

function prepare(state: AppState, now = new Date()): AppState {
  return {
    ...state,
    settings: unlockIfDue(state.settings, now.getTime()),
    streak: settleStreak(state, now),
  };
}

export function loadState(): AppState {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return prepare(seedState());
    const parsed = JSON.parse(raw) as AppState;
    if (!parsed || !Array.isArray(parsed.profiles) || parsed.profiles.length === 0) {
      return prepare(seedState());
    }
    return prepare(parsed);
  } catch {
    return prepare(seedState());
  }
}

export function saveState(state: AppState): void {
  localStorage.setItem(KEY, JSON.stringify(state));
}
