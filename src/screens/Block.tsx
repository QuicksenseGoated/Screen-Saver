import { useState } from "react";
import { AppMark } from "../components/AppMark";
import { catalogApp, formatUntil, passesLeft } from "../model";
import { useStore } from "../state";

const REASONS = {
  schedule: "Outside allowed hours",
  minutes: "Daily budget used",
  opens: "No opens left",
  cooldown: "Cooldown",
};

export function BlockScreen() {
  const store = useStore();
  const { view, state, now } = store;
  const [confirm, setConfirm] = useState(false);
  if (view.name !== "block") return null;
  const app = catalogApp(view.appId);
  const passes = passesLeft(state, now);

  return (
    <div className="gate block-gate" data-testid="block-screen">
      <p className="eyebrow">
        {view.profileName} · {view.groupName}
      </p>
      {app && <AppMark app={app} size={64} />}
      <h1 className="gate-message">{app?.name ?? "This app"} is blocked</h1>
      <p className="reason" data-testid="block-reason">
        {REASONS[view.reason]}
      </p>
      <p>{view.detail}</p>
      <p className="figure small" data-testid="block-until">
        {formatUntil(view.until, now)}
      </p>
      <div className="gate-actions">
        <button type="button" className="primary" onClick={() => store.setView({ name: "launcher" })} data-testid="block-leave">
          Leave
        </button>
      </div>
      {passes > 0 && !confirm && (
        <button type="button" className="text-btn danger" onClick={() => setConfirm(true)} data-testid="bypass">
          Emergency pass ({passes} left)
        </button>
      )}
      {passes > 0 && confirm && (
        <div className="confirm">
          <p>This opens the app once and ends today’s streak.</p>
          <button type="button" className="ghost" onClick={store.bypass} data-testid="bypass-confirm">
            Use the pass
          </button>
        </div>
      )}
      {passes === 0 && <p className="fine">No emergency passes left today.</p>}
    </div>
  );
}
