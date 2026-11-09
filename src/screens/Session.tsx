import { useEffect, useRef } from "react";
import { AppMark } from "../components/AppMark";
import {
  catalogApp,
  dateKey,
  formatDuration,
  groupFor,
  groupSeconds,
  resolveProfile,
  usageFor,
} from "../model";
import { useStore } from "../state";

export function SessionScreen() {
  const store = useStore();
  const { view, state, now } = store;
  const tickRef = useRef(store.tickSession);
  tickRef.current = store.tickSession;

  useEffect(() => {
    if (view.name !== "session") return;
    let last = Date.now();
    const { appId, startedAt, bypass } = view;
    const id = window.setInterval(() => {
      const next = Date.now();
      const delta = (next - last) / 1000;
      last = next;
      tickRef.current(appId, delta, startedAt, bypass);
    }, 250);
    return () => window.clearInterval(id);
  }, [view]);

  if (view.name !== "session") return null;
  const app = catalogApp(view.appId);
  const profile = resolveProfile(state, now);
  const group = groupFor(profile, view.appId);
  const usage = usageFor(state, dateKey(now));
  const elapsed = Math.max(0, (now.getTime() - view.startedAt) / 1000);
  const sessionCap = group?.sessionMinutes ? group.sessionMinutes * 60 : null;
  const dailyCap = group?.dailyLimitMinutes != null ? group.dailyLimitMinutes * 60 : null;
  const used = group ? groupSeconds(usage, group) : 0;

  return (
    <div className="session" data-testid="session-screen">
      <header className="top">
        <div>
          <p className="eyebrow">{view.bypass ? "Emergency session" : profile.name}</p>
          <h1>{app?.name ?? "App"}</h1>
        </div>
        {app && <AppMark app={app} size={48} />}
      </header>
      <div className="session-body">
        <p className="eyebrow">Time in this visit</p>
        <p className="session-clock" data-testid="session-elapsed">
          {formatDuration(elapsed)}
        </p>
        {group ? (
          <div className="card">
            <p>
              Counts toward <strong>{group.name}</strong>
              {view.bypass ? ". This pass ignores the block until you leave." : "."}
            </p>
            {dailyCap != null && (
              <p className="figure small">
                {formatDuration(Math.max(0, dailyCap - used))} <span>left in the shared budget</span>
              </p>
            )}
            {sessionCap != null && (
              <p className="meta">
                This visit can last {formatDuration(Math.max(0, sessionCap - elapsed))} more.
              </p>
            )}
          </div>
        ) : (
          <div className="card">
            <p>This app is not in a group, so the time is not counted.</p>
          </div>
        )}
      </div>
      <button type="button" className="primary wide" onClick={store.endSession} data-testid="session-leave">
        Leave
      </button>
    </div>
  );
}
