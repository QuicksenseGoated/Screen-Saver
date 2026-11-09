import { useEffect, useRef, useState } from "react";
import { AppMark } from "../components/AppMark";
import { catalogApp } from "../model";
import { useStore } from "../state";

export function PauseScreen() {
  const store = useStore();
  const { view } = store;
  const started = useRef(Date.now());
  const [left, setLeft] = useState(view.name === "pause" ? view.seconds : 0);
  const [breathing, setBreathing] = useState(false);
  const [breathAt] = useState(() => Date.now());
  const [breathNow, setBreathNow] = useState(() => Date.now());

  useEffect(() => {
    if (view.name !== "pause") return;
    started.current = Date.now();
    const total = view.seconds;
    const id = window.setInterval(() => {
      const elapsed = (Date.now() - started.current) / 1000;
      setLeft(Math.max(0, total - elapsed));
      setBreathNow(Date.now());
    }, 100);
    return () => window.clearInterval(id);
  }, [view]);

  if (view.name !== "pause") return null;
  const app = catalogApp(view.appId);
  const ready = left <= 0;
  const shown = ready ? 0 : Math.ceil(left);
  const turn = ((breathNow - breathAt) / 1000) % 12;
  const phase = turn < 4 ? "Inhale" : turn < 8 ? "Hold" : "Exhale";

  return (
    <div className="gate" data-testid="pause-screen">
      <p className="eyebrow">
        {view.profileName} · {view.groupName}
      </p>
      {app && <AppMark app={app} size={64} />}
      <h1 className="gate-message" data-testid="pause-message">
        {view.message}
      </h1>
      <div className="ring" style={{ ["--p" as string]: String(view.seconds === 0 ? 1 : 1 - left / view.seconds) }}>
        <span data-testid="pause-count">{shown}</span>
      </div>
      <p className="muted">{view.resume ? "That session is over. Wait, then decide again." : "Wait, then decide if you still want in."}</p>
      <button type="button" className="text-btn" onClick={() => setBreathing((value) => !value)}>
        {breathing ? "Hide breathing" : "Breathe instead"}
      </button>
      {breathing && (
        <div className="breath" data-testid="breath">
          <strong>{phase}</strong>
          <p>Four counts each. The timer keeps running.</p>
        </div>
      )}
      <div className="gate-actions">
        <button type="button" className="ghost" onClick={store.leavePause} data-testid="pause-leave">
          Leave
        </button>
        <button type="button" className="primary" disabled={!ready} onClick={store.finishPause} data-testid="pause-enter">
          Enter
        </button>
      </div>
    </div>
  );
}
