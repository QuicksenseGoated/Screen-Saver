import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import {
  dateKey,
  decideGate,
  duplicateProfile,
  recordBypass,
  recordClose,
  recordOpen,
  recordSeconds,
  sessionLimitMs,
  settingsAreLocked,
  settleStreak,
  unlockIfDue,
  type AppState,
  type BlockReason,
  type Profile,
  type Settings,
} from "./model";
import { loadState, saveState } from "./storage";

export type View =
  | { name: "today" | "launcher" | "progress" | "profiles" | "settings" }
  | { name: "editor"; profileId: string }
  | {
      name: "pause";
      appId: string;
      seconds: number;
      message: string;
      groupName: string;
      profileName: string;
      resume: boolean;
    }
  | {
      name: "block";
      appId: string;
      reason: BlockReason;
      detail: string;
      until: number | null;
      groupName: string;
      profileName: string;
    }
  | { name: "session"; appId: string; startedAt: number; bypass: boolean };

interface Store {
  state: AppState;
  now: Date;
  view: View;
  note: string | null;
  locked: boolean;
  setView: (view: View) => void;
  openApp: (appId: string) => void;
  finishPause: () => void;
  leavePause: () => void;
  endSession: () => void;
  tickSession: (appId: string, delta: number, startedAt: number, bypass: boolean) => void;
  bypass: () => void;
  saveProfile: (profile: Profile) => void;
  deleteProfile: (id: string) => void;
  duplicate: (id: string) => void;
  pin: (id: string) => void;
  unpin: () => void;
  updateSettings: (settings: Settings) => void;
}

const StoreContext = createContext<Store | null>(null);

export function useStore(): Store {
  const store = useContext(StoreContext);
  if (!store) throw new Error("Store missing");
  return store;
}

export function StoreProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AppState>(() => loadState());
  const [view, setView] = useState<View>({ name: "today" });
  const [now, setNow] = useState(() => new Date());
  const [note, setNote] = useState<string | null>(null);
  const stateRef = useRef(state);
  const viewRef = useRef(view);
  const ready = useRef(false);
  stateRef.current = state;
  viewRef.current = view;

  useEffect(() => {
    ready.current = true;
  }, []);

  useEffect(() => {
    if (!ready.current) return;
    saveState(state);
  }, [state]);

  useEffect(() => {
    const id = window.setInterval(() => setNow(new Date()), 1000);
    return () => window.clearInterval(id);
  }, []);

  useEffect(() => {
    if (!note) return;
    const id = window.setTimeout(() => setNote(null), 2400);
    return () => window.clearTimeout(id);
  }, [note]);

  useEffect(() => {
    setState((current) => {
      const settings = unlockIfDue(current.settings, Date.now());
      const streak = settleStreak({ ...current, settings }, new Date());
      if (
        settings === current.settings &&
        streak.count === current.streak.count &&
        streak.settledThrough === current.streak.settledThrough
      ) {
        return current;
      }
      return { ...current, settings, streak };
    });
  }, [dateKey(now)]);

  const locked = settingsAreLocked(state.settings, now.getTime());

  const api = useMemo<Store>(() => {
    function commit(next: AppState) {
      stateRef.current = next;
      setState(next);
    }

    function flash(message: string) {
      setNote(message);
    }

    function guardEdit(): boolean {
      if (!settingsAreLocked(stateRef.current.settings, Date.now())) return false;
      flash("Settings are locked");
      return true;
    }

    function showGate(appId: string, resume: boolean) {
      const gate = decideGate(stateRef.current, appId, new Date());
      if (gate.kind === "open") {
        startSession(appId, resume, false);
        return;
      }
      if (gate.kind === "pause") {
        setView({ name: "pause", appId, resume, ...gate });
        return;
      }
      setView({ name: "block", appId, ...gate });
    }

    function startSession(appId: string, resume: boolean, bypassOpen: boolean) {
      const date = new Date();
      if (!resume) commit(recordOpen(stateRef.current, appId, date));
      setView({ name: "session", appId, startedAt: date.getTime(), bypass: bypassOpen });
    }

    return {
      state,
      now,
      view,
      note,
      locked,
      setView,
      openApp(appId) {
        showGate(appId, false);
      },
      finishPause() {
        const current = viewRef.current;
        if (current.name !== "pause") return;
        startSession(current.appId, current.resume, false);
      },
      leavePause() {
        const current = viewRef.current;
        if (current.name === "pause" && current.resume) {
          commit(recordClose(stateRef.current, current.appId, new Date()));
        }
        setView({ name: "launcher" });
      },
      endSession() {
        const current = viewRef.current;
        if (current.name === "session") {
          commit(recordClose(stateRef.current, current.appId, new Date()));
        }
        setView({ name: "launcher" });
      },
      tickSession(appId, delta, startedAt, bypass) {
        const date = new Date();
        const recorded = recordSeconds(stateRef.current, appId, delta, date, !bypass);
        commit(recorded.state);
        if (!bypass && recorded.hitLimit) {
          commit(recordClose(stateRef.current, appId, date));
          showGate(appId, false);
          return;
        }
        const limit = sessionLimitMs(stateRef.current, appId, date);
        if (limit != null && date.getTime() - startedAt >= limit) {
          const gate = decideGate(stateRef.current, appId, date);
          if (gate.kind === "pause") {
            setView({ name: "pause", appId, resume: true, ...gate });
            return;
          }
          commit(recordClose(stateRef.current, appId, date));
          if (gate.kind === "block") setView({ name: "block", appId, ...gate });
          else setView({ name: "launcher" });
        }
      },
      bypass() {
        const current = viewRef.current;
        if (current.name !== "block") return;
        const date = new Date();
        commit(recordBypass(stateRef.current, date));
        startSession(current.appId, false, true);
        flash("Emergency pass used. Streak paused for today.");
      },
      saveProfile(profile) {
        if (guardEdit()) return;
        const profiles = stateRef.current.profiles.some((item) => item.id === profile.id)
          ? stateRef.current.profiles.map((item) => (item.id === profile.id ? profile : item))
          : [...stateRef.current.profiles, profile];
        commit({ ...stateRef.current, profiles });
        setView({ name: "profiles" });
        flash("Profile saved");
      },
      deleteProfile(id) {
        if (guardEdit()) return;
        const target = stateRef.current.profiles.find((profile) => profile.id === id);
        if (!target || target.isDefault) return;
        commit({
          ...stateRef.current,
          profiles: stateRef.current.profiles.filter((profile) => profile.id !== id),
          pinnedProfileId: stateRef.current.pinnedProfileId === id ? null : stateRef.current.pinnedProfileId,
        });
        flash("Profile removed");
      },
      duplicate(id) {
        if (guardEdit()) return;
        const target = stateRef.current.profiles.find((profile) => profile.id === id);
        if (!target) return;
        const copy = duplicateProfile(target);
        commit({ ...stateRef.current, profiles: [...stateRef.current.profiles, copy] });
        flash("Profile duplicated");
      },
      pin(id) {
        if (guardEdit()) return;
        commit({ ...stateRef.current, pinnedProfileId: id });
        flash("Profile pinned");
      },
      unpin() {
        if (guardEdit()) return;
        commit({ ...stateRef.current, pinnedProfileId: null });
        flash("Following the clock again");
      },
      updateSettings(settings) {
        commit({ ...stateRef.current, settings });
      },
    };
  }, [state, now, view, note, locked]);

  return <StoreContext.Provider value={api}>{children}</StoreContext.Provider>;
}
