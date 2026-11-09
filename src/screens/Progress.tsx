import {
  addDays,
  catalogApp,
  dateKey,
  DAY_LABELS,
  displayStreak,
  formatDuration,
  groupSeconds,
  resolveProfile,
  usageFor,
} from "../model";
import { useStore } from "../state";

export function ProgressScreen() {
  const { state, now } = useStore();
  const profile = resolveProfile(state, now);
  const today = dateKey(now);
  const days = Array.from({ length: 7 }, (_, index) => addDays(today, index - 6));
  const totals = days.map((key) => {
    const usage = state.usageByDate[key];
    if (!usage) return 0;
    return Object.values(usage.secondsByApp).reduce((sum, seconds) => sum + seconds, 0);
  });
  const max = Math.max(60, ...totals);
  const todayUsage = usageFor(state, today);

  return (
    <div className="screen">
      <header className="top">
        <div>
          <p className="eyebrow">Tracked apps only</p>
          <h1>Progress</h1>
          <p className="muted">Maps, messages, and anything you left out of a group never land here.</p>
        </div>
      </header>
      <section className="card">
        <div className="week">
          {days.map((key, index) => (
            <div key={key} className="week-col">
              <div className="week-track">
                <span style={{ height: totals[index] === 0 ? "0%" : `${Math.max(8, (totals[index] / max) * 100)}%` }} />
              </div>
              <span className={key === today ? "week-label today" : "week-label"}>{DAY_LABELS[new Date(key + "T12:00:00").getDay()]}</span>
            </div>
          ))}
        </div>
        <p className="meta">This week · {formatDuration(totals.reduce((sum, value) => sum + value, 0))}</p>
      </section>
      <section className="streak-card compact">
        <p className="eyebrow">Streak</p>
        <p className="streak-count">{displayStreak(state, now)}</p>
      </section>
      <div className="stack">
        {profile.groups.map((group) => (
          <article key={group.id} className="card">
            <h2>{group.name}</h2>
            <p className="figure small">
              {formatDuration(groupSeconds(todayUsage, group))} <span>today on {profile.name}</span>
            </p>
            <ul className="app-lines">
              {group.appIds.map((id) => (
                <li key={id}>
                  <span>{catalogApp(id)?.name ?? id}</span>
                  <span>{formatDuration(todayUsage.secondsByApp[id] ?? 0)}</span>
                </li>
              ))}
            </ul>
          </article>
        ))}
      </div>
    </div>
  );
}
