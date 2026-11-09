import {
  catalogApp,
  displayStreak,
  formatDays,
  formatDuration,
  formatWindows,
  groupIsOpen,
  groupOpens,
  groupSeconds,
  passesLeft,
  resolveProfile,
  scheduledProfile,
  usageFor,
  dateKey,
} from "../model";
import { useStore } from "../state";

export function TodayScreen() {
  const { state, now, setView } = useStore();
  const profile = resolveProfile(state, now);
  const scheduled = scheduledProfile(state, now);
  const pinned = state.pinnedProfileId != null;
  const usage = usageFor(state, dateKey(now));
  const streak = displayStreak(state, now);
  const broken = usage.exceeded || usage.bypasses > 0;

  return (
    <div className="screen">
      <header className="top">
        <div>
          <p className="eyebrow">{now.toLocaleDateString([], { weekday: "long", month: "long", day: "numeric" })}</p>
          <h1>{profile.name}</h1>
          <p className="muted">
            {pinned ? "Pinned over the clock" : "Following the clock"}
            {pinned ? ` · schedule says ${scheduled.name}` : ""}
          </p>
        </div>
        <button type="button" className="icon-btn" onClick={() => setView({ name: "settings" })} data-testid="open-settings">
          Settings
        </button>
      </header>

      <section className="streak-card">
        <div>
          <p className="eyebrow">Streak</p>
          <p className="streak-count">{streak}</p>
          <p className="muted">{streak === 1 ? "day inside your limits" : "days inside your limits"}</p>
        </div>
        <p className="streak-note">
          {broken
            ? "Today already broke the streak. It resets when the day ends."
            : "A day counts when every limit holds and you skip the emergency pass."}
        </p>
      </section>

      {profile.groups.length === 0 && (
        <section className="card">
          <h2>No limits on this profile</h2>
          <p className="muted">Apps open without a pause. Add a group when you want a budget.</p>
        </section>
      )}

      <div className="stack">
        {profile.groups.map((group) => {
          const used = groupSeconds(usage, group);
          const opens = groupOpens(usage, group);
          const open = groupIsOpen(group, now);
          const cap = group.dailyLimitMinutes == null ? null : group.dailyLimitMinutes * 60;
          const ratio = cap ? Math.min(1, used / cap) : 0;
          const names = group.appIds.map((id) => catalogApp(id)?.name ?? id).join(", ");
          return (
            <article key={group.id} className="card" data-testid={`group-${group.name}`}>
              <div className="card-row">
                <h2>{group.name}</h2>
                <span className={open ? "pill" : "pill warn"}>{open ? "Open" : "Closed"}</span>
              </div>
              <p className="muted">{names || "No apps yet"}</p>
              {cap != null ? (
                <>
                  <p className="figure">
                    {formatDuration(Math.max(0, cap - used))} <span>left of {formatDuration(cap)}</span>
                  </p>
                  <div className="bar" aria-hidden="true">
                    <span style={{ width: `${ratio * 100}%` }} />
                  </div>
                </>
              ) : (
                <p className="figure">
                  {formatDuration(used)} <span>used · no daily cap</span>
                </p>
              )}
              <p className="meta">
                {group.opensPerDay != null ? `${opens} of ${group.opensPerDay} opens · ` : ""}
                {group.access === "blocked"
                  ? "Blocked all day"
                  : group.access === "anytime"
                    ? "Allowed any time"
                    : `${formatDays(group.days)} · ${formatWindows(group.windows)}`}
                {group.pauseSeconds > 0 ? ` · ${group.pauseSeconds}s pause` : ""}
              </p>
            </article>
          );
        })}
      </div>

      <button type="button" className="primary wide" onClick={() => setView({ name: "launcher" })} data-testid="open-apps">
        Open an app
      </button>
      <p className="fine">Emergency passes left today: {passesLeft(state, now)}</p>
    </div>
  );
}
