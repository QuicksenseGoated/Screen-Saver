import { useState } from "react";
import {
  blankGroup,
  blankProfile,
  CATALOG,
  DAY_LABELS,
  MESSAGE_PRESETS,
  uid,
  type Access,
  type AppGroup,
  type Day,
  type Profile,
  type TimeWindow,
} from "../model";
import { useStore } from "../state";

export function ProfileEditor() {
  const { state, view, setView, saveProfile, locked } = useStore();
  const profileId = view.name === "editor" ? view.profileId : null;
  const [draft, setDraft] = useState<Profile>(() => {
    if (!profileId || profileId === "new") return blankProfile();
    return state.profiles.find((profile) => profile.id === profileId) ?? blankProfile();
  });
  const [error, setError] = useState<string | null>(null);

  if (view.name !== "editor") return null;

  function update(patch: Partial<Profile>) {
    setDraft((current) => ({ ...current, ...patch }));
  }

  function updateGroup(id: string, patch: Partial<AppGroup>) {
    setDraft((current) => ({
      ...current,
      groups: current.groups.map((group) => (group.id === id ? { ...group, ...patch } : group)),
    }));
  }

  function save() {
    const name = draft.name.trim();
    if (!name) {
      setError("Name the profile.");
      return;
    }
    saveProfile({
      ...draft,
      name,
      groups: draft.groups.map((group) => ({
        ...group,
        name: group.name.trim() || "Group",
        pauseMessage: group.pauseMessage.trim() || "Is this important?",
        pauseSeconds: clamp(group.pauseSeconds, 0, 120),
        dailyLimitMinutes: clampNullable(group.dailyLimitMinutes, 0, 24 * 60),
        opensPerDay: clampNullable(group.opensPerDay, 1, 99),
        sessionMinutes: clampNullable(group.sessionMinutes, 1, 180),
        cooldownMinutes: clampNullable(group.cooldownMinutes, 1, 24 * 60),
      })),
    });
  }

  return (
    <div className="screen">
      <header className="top">
        <button type="button" className="text-btn" onClick={() => setView({ name: "profiles" })} data-testid="editor-back">
          Back
        </button>
        <h1>{draft.isDefault ? draft.name : "Edit profile"}</h1>
      </header>
      {locked && <p className="banner">Settings are locked. You can look, not change.</p>}
      {draft.isDefault && <p className="muted">This profile is the fallback when nothing else matches the clock.</p>}
      <fieldset disabled={locked} className="plain">
        <label className="field">
          <span>Name</span>
          <input value={draft.name} onChange={(event) => update({ name: event.target.value })} data-testid="profile-name" />
        </label>
        {!draft.isDefault && (
          <>
            <DayPicker days={draft.days} onChange={(days) => update({ days })} />
            <WindowEditor
              windows={draft.windows}
              emptyLabel="All day on the selected days."
              onChange={(windows) => update({ windows })}
            />
          </>
        )}
        {draft.groups.map((group) => (
          <GroupEditor
            key={group.id}
            group={group}
            onChange={(patch) => updateGroup(group.id, patch)}
            onRemove={() => update({ groups: draft.groups.filter((item) => item.id !== group.id) })}
            onClaimApp={(appId) => {
              setDraft((current) => ({
                ...current,
                groups: current.groups.map((item) => {
                  if (item.id === group.id) {
                    const has = item.appIds.includes(appId);
                    return {
                      ...item,
                      appIds: has ? item.appIds.filter((id) => id !== appId) : [...item.appIds, appId],
                    };
                  }
                  return { ...item, appIds: item.appIds.filter((id) => id !== appId) };
                }),
              }));
            }}
          />
        ))}
        <button type="button" className="ghost wide" onClick={() => update({ groups: [...draft.groups, blankGroup()] })} data-testid="add-group">
          Add group
        </button>
      </fieldset>
      {error && <p className="banner">{error}</p>}
      <div className="savebar">
        <button type="button" className="primary wide" disabled={locked} onClick={save} data-testid="save-profile">
          Save profile
        </button>
      </div>
    </div>
  );
}

function GroupEditor({
  group,
  onChange,
  onRemove,
  onClaimApp,
}: {
  group: AppGroup;
  onChange: (patch: Partial<AppGroup>) => void;
  onRemove: () => void;
  onClaimApp: (appId: string) => void;
}) {
  return (
    <details className="group" open>
      <summary>{group.name}</summary>
      <label className="field">
        <span>Group name</span>
        <input value={group.name} onChange={(event) => onChange({ name: event.target.value })} />
      </label>
      <p className="hint">Apps in this group share the daily minutes and the open cap.</p>
      <div className="chips">
        {CATALOG.map((app) => {
          const on = group.appIds.includes(app.id);
          return (
            <button
              key={app.id}
              type="button"
              className={on ? "chip on" : "chip"}
              onClick={() => onClaimApp(app.id)}
              data-testid={`pick-${group.name}-${app.id}`}
            >
              {app.name}
            </button>
          );
        })}
      </div>
      <NumberField
        label="Daily minutes"
        value={group.dailyLimitMinutes}
        placeholder="No cap"
        onChange={(dailyLimitMinutes) => onChange({ dailyLimitMinutes })}
        testId="daily-minutes"
      />
      <NumberField
        label="Opens per day"
        value={group.opensPerDay}
        placeholder="No cap"
        onChange={(opensPerDay) => onChange({ opensPerDay })}
        testId="opens-per-day"
      />
      <NumberField
        label="Minutes per visit"
        value={group.sessionMinutes}
        placeholder="Until you leave"
        onChange={(sessionMinutes) => onChange({ sessionMinutes })}
        testId="session-minutes"
      />
      <NumberField
        label="Cooldown minutes"
        value={group.cooldownMinutes}
        placeholder="None"
        onChange={(cooldownMinutes) => onChange({ cooldownMinutes })}
        testId="cooldown-minutes"
      />
      <NumberField
        label="Pause seconds"
        value={group.pauseSeconds}
        placeholder="0"
        onChange={(pauseSeconds) => onChange({ pauseSeconds: pauseSeconds ?? 0 })}
        testId="pause-seconds"
      />
      <label className="check">
        <input
          type="checkbox"
          checked={group.pauseGrows}
          onChange={(event) => onChange({ pauseGrows: event.target.checked })}
        />
        Wait grows with each open today
      </label>
      <label className="field">
        <span>Message</span>
        <input
          value={group.pauseMessage}
          maxLength={80}
          onChange={(event) => onChange({ pauseMessage: event.target.value })}
          data-testid="pause-message-input"
        />
      </label>
      <div className="chips">
        {MESSAGE_PRESETS.map((message) => (
          <button key={message} type="button" className="chip" onClick={() => onChange({ pauseMessage: message })}>
            {message}
          </button>
        ))}
      </div>
      <div className="segmented" role="group" aria-label="When this group is allowed">
        {(
          [
            ["anytime", "Anytime"],
            ["windows", "Scheduled"],
            ["blocked", "Blocked"],
          ] as [Access, string][]
        ).map(([access, label]) => (
          <button
            key={access}
            type="button"
            className={group.access === access ? "seg on" : "seg"}
            onClick={() =>
              onChange({
                access,
                windows: access === "windows" && group.windows.length === 0 ? [{ id: uid(), start: "12:00", end: "13:00" }] : group.windows,
              })
            }
          >
            {label}
          </button>
        ))}
      </div>
      {group.access === "windows" && (
        <>
          <DayPicker days={group.days} onChange={(days) => onChange({ days })} />
          <WindowEditor
            windows={group.windows}
            emptyLabel="Add a window. With none, this group stays blocked."
            onChange={(windows) => onChange({ windows })}
          />
        </>
      )}
      <button type="button" className="text-btn danger" onClick={onRemove}>
        Remove group
      </button>
    </details>
  );
}

function DayPicker({ days, onChange }: { days: Day[]; onChange: (days: Day[]) => void }) {
  return (
    <div className="field">
      <span>Days</span>
      <div className="days">
        {DAY_LABELS.map((label, index) => {
          const day = index as Day;
          const on = days.includes(day);
          return (
            <button
              key={day}
              type="button"
              className={on ? "day on" : "day"}
              aria-pressed={on}
              onClick={() => onChange(on ? days.filter((item) => item !== day) : [...days, day].sort((a, b) => a - b))}
            >
              {label}
            </button>
          );
        })}
      </div>
      <p className="hint">{days.length === 0 ? "No days selected means every day." : "Only the selected days."}</p>
    </div>
  );
}

function WindowEditor({
  windows,
  onChange,
  emptyLabel,
}: {
  windows: TimeWindow[];
  onChange: (windows: TimeWindow[]) => void;
  emptyLabel: string;
}) {
  return (
    <div className="field">
      <span>Hours</span>
      {windows.length === 0 && <p className="hint">{emptyLabel}</p>}
      {windows.map((window) => (
        <div key={window.id} className="window-row">
          <input
            type="time"
            value={window.start}
            onChange={(event) =>
              onChange(windows.map((item) => (item.id === window.id ? { ...item, start: event.target.value } : item)))
            }
            data-testid="window-start"
          />
          <span>to</span>
          <input
            type="time"
            value={window.end}
            onChange={(event) =>
              onChange(windows.map((item) => (item.id === window.id ? { ...item, end: event.target.value } : item)))
            }
            data-testid="window-end"
          />
          <button type="button" className="text-btn" onClick={() => onChange(windows.filter((item) => item.id !== window.id))}>
            Remove
          </button>
        </div>
      ))}
      <button
        type="button"
        className="text-btn"
        data-testid="add-window"
        onClick={() => onChange([...windows, { id: uid(), start: "18:00", end: "21:00" }])}
      >
        Add hours
      </button>
    </div>
  );
}

function NumberField({
  label,
  value,
  placeholder,
  onChange,
  testId,
}: {
  label: string;
  value: number | null;
  placeholder: string;
  onChange: (value: number | null) => void;
  testId: string;
}) {
  return (
    <label className="field">
      <span>{label}</span>
      <input
        inputMode="numeric"
        placeholder={placeholder}
        value={value ?? ""}
        data-testid={testId}
        onChange={(event) => {
          const next = event.target.value.trim();
          if (next === "") onChange(null);
          else if (/^\d+$/.test(next)) onChange(Number(next));
        }}
      />
    </label>
  );
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function clampNullable(value: number | null, min: number, max: number): number | null {
  if (value == null) return null;
  return clamp(value, min, max);
}
