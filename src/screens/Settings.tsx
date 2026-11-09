import { useState } from "react";
import { formatClock, type Settings } from "../model";
import { useStore } from "../state";

export function SettingsScreen() {
  const { state, setView, updateSettings, locked, now } = useStore();
  const { settings } = state;
  const [draft, setDraft] = useState("");
  const [confirm, setConfirm] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  function commit(next: Settings) {
    updateSettings(next);
  }

  function submitPin(code: string) {
    setError(null);
    if (locked) {
      if (settings.lockCode === code) commit({ ...settings, locked: false, unlockAt: null });
      else setError("That code does not match.");
      return;
    }
    if (!settings.lockCode) {
      if (confirm == null) {
        setConfirm(code);
        setDraft("");
        return;
      }
      if (confirm !== code) {
        setConfirm(null);
        setError("Those codes did not match. Start again.");
        return;
      }
      commit({ ...settings, lockCode: code, locked: true, unlockAt: null });
      setConfirm(null);
      return;
    }
  }

  return (
    <div className="screen">
      <header className="top">
        <button type="button" className="text-btn" onClick={() => setView({ name: "today" })}>
          Back
        </button>
        <h1>Settings</h1>
      </header>
      <section className="card">
        <h2>Settings lock</h2>
        <p className="muted">
          While locked, profiles and limits stay put. You can still open apps, and an emergency pass still works.
        </p>
        {locked && settings.unlockAt != null && (
          <p className="banner" data-testid="unlock-at">
            Unlocks at {formatClock(settings.unlockAt)}
          </p>
        )}
        {!settings.lockCode && !locked && (
          <p className="meta">{confirm ? "Enter the same 4 digits again." : "Choose a 4-digit code."}</p>
        )}
        {settings.lockCode && !locked && <p className="meta">Code is set. Lock it when you want the rules to hold.</p>}
        {locked && <p className="meta">Enter the code to unlock now.</p>}
        {(!settings.lockCode || locked) && (
          <PinPad
            value={draft}
            onChange={setDraft}
            onComplete={(code) => {
              setDraft("");
              submitPin(code);
            }}
          />
        )}
        {error && (
          <p className="banner" data-testid="pin-error">
            {error}
          </p>
        )}
        <div className="row-actions">
          {settings.lockCode && !locked && (
            <button
              type="button"
              className="primary"
              data-testid="lock-now"
              onClick={() => commit({ ...settings, locked: true, unlockAt: null })}
            >
              Lock settings
            </button>
          )}
          {settings.lockCode && !locked && (
            <button
              type="button"
              className="ghost"
              onClick={() => commit({ ...settings, lockCode: null, locked: false, unlockAt: null })}
            >
              Remove code
            </button>
          )}
          {locked && (
            <button
              type="button"
              className="ghost"
              data-testid="unlock-timer"
              onClick={() => commit({ ...settings, unlockAt: Date.now() + 15 * 60_000 })}
            >
              Unlock in 15 minutes
            </button>
          )}
        </div>
      </section>
      <section className="card">
        <h2>Emergency passes</h2>
        <p className="muted">Each pass opens a blocked app once and breaks today’s streak. They refill at midnight.</p>
        <div className="stepper">
          <button
            type="button"
            className="ghost"
            disabled={locked || settings.emergencyPassesPerDay <= 0}
            onClick={() => commit({ ...settings, emergencyPassesPerDay: settings.emergencyPassesPerDay - 1 })}
          >
            Fewer
          </button>
          <strong data-testid="pass-count">{settings.emergencyPassesPerDay}</strong>
          <button
            type="button"
            className="ghost"
            disabled={locked || settings.emergencyPassesPerDay >= 3}
            onClick={() => commit({ ...settings, emergencyPassesPerDay: settings.emergencyPassesPerDay + 1 })}
          >
            More
          </button>
        </div>
      </section>
      <section className="card">
        <h2>On this device</h2>
        <p className="muted">
          Rules and time stay in this browser. Screen Saver does not see or block apps installed outside this page. The day
          turns over at local midnight ({now.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })} now).
        </p>
      </section>
    </div>
  );
}

function PinPad({
  value,
  onChange,
  onComplete,
}: {
  value: string;
  onChange: (value: string) => void;
  onComplete: (code: string) => void;
}) {
  function press(digit: string) {
    const next = (value + digit).slice(0, 4);
    onChange(next);
    if (next.length === 4) onComplete(next);
  }

  return (
    <div className="pin" data-testid="pin-pad">
      <p className="pin-dots" aria-label={`${value.length} digits entered`}>
        {[0, 1, 2, 3].map((index) => (
          <span key={index} className={index < value.length ? "dot filled" : "dot"} />
        ))}
      </p>
      <div className="pin-grid">
        {["1", "2", "3", "4", "5", "6", "7", "8", "9", "0"].map((digit) => (
          <button key={digit} type="button" className="pin-key" onClick={() => press(digit)} data-testid={`pin-${digit}`}>
            {digit}
          </button>
        ))}
        <button type="button" className="pin-key ghost" onClick={() => onChange("")}>
          Clear
        </button>
      </div>
    </div>
  );
}
