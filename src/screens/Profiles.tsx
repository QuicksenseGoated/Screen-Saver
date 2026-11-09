import {
  formatDays,
  formatWindows,
  resolveProfile,
  scheduledProfile,
} from "../model";
import { useStore } from "../state";

export function ProfilesScreen() {
  const { state, now, setView, pin, unpin, duplicate, deleteProfile, locked } = useStore();
  const active = resolveProfile(state, now);
  const scheduled = scheduledProfile(state, now);

  return (
    <div className="screen">
      <header className="top">
        <div>
          <p className="eyebrow">Rules for different parts of the week</p>
          <h1>Profiles</h1>
          <p className="muted">
            The clock is on {scheduled.name}
            {state.pinnedProfileId ? `, and ${active.name} is pinned.` : "."}
          </p>
        </div>
      </header>
      <div className="stack">
        {state.profiles.map((profile) => {
          const on = profile.id === active.id;
          return (
            <article key={profile.id} className="card" data-testid={`profile-${profile.name}`}>
              <div className="card-row">
                <h2>{profile.name}</h2>
                {on && <span className="pill">Active</span>}
              </div>
              <p className="muted">
                {profile.isDefault
                  ? "Fallback when no other profile matches."
                  : `${formatDays(profile.days)} · ${formatWindows(profile.windows)}`}
              </p>
              <p className="meta">
                {profile.groups.length === 0
                  ? "No groups"
                  : profile.groups
                      .map((group) => {
                        const budget = group.dailyLimitMinutes == null ? "no cap" : `${group.dailyLimitMinutes}m`;
                        return `${group.name} ${budget}`;
                      })
                      .join(" · ")}
              </p>
              <div className="row-actions">
                <button type="button" className="ghost" onClick={() => setView({ name: "editor", profileId: profile.id })}>
                  Edit
                </button>
                {profile.id === state.pinnedProfileId ? (
                  <button type="button" className="ghost" onClick={unpin} disabled={locked} data-testid="unpin">
                    Use schedule
                  </button>
                ) : (
                  <button
                    type="button"
                    className="ghost"
                    disabled={locked}
                    onClick={() => pin(profile.id)}
                    data-testid={`pin-${profile.name}`}
                  >
                    Use now
                  </button>
                )}
                <button type="button" className="ghost" disabled={locked} onClick={() => duplicate(profile.id)}>
                  Duplicate
                </button>
                {!profile.isDefault && (
                  <button type="button" className="ghost danger" disabled={locked} onClick={() => deleteProfile(profile.id)}>
                    Delete
                  </button>
                )}
              </div>
            </article>
          );
        })}
      </div>
      <button
        type="button"
        className="primary wide"
        disabled={locked}
        data-testid="new-profile"
        onClick={() => setView({ name: "editor", profileId: "new" })}
      >
        New profile
      </button>
    </div>
  );
}
