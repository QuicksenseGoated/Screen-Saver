import { AppMark } from "../components/AppMark";
import { CATALOG, groupFor, resolveProfile } from "../model";
import { useStore } from "../state";

export function LauncherScreen() {
  const { state, now, openApp } = useStore();
  const profile = resolveProfile(state, now);
  const limited = CATALOG.filter((app) => groupFor(profile, app.id));
  const rest = CATALOG.filter((app) => !groupFor(profile, app.id));

  return (
    <div className="screen">
      <header className="top">
        <div>
          <p className="eyebrow">{profile.name}</p>
          <h1>Apps</h1>
          <p className="muted">Limited apps share the rules of their group. Everything else opens straight away.</p>
        </div>
      </header>
      <AppGrid title="Limited" apps={limited} onOpen={openApp} />
      <AppGrid title="Always available" apps={rest} onOpen={openApp} />
    </div>
  );
}

function AppGrid({
  title,
  apps,
  onOpen,
}: {
  title: string;
  apps: typeof CATALOG;
  onOpen: (id: string) => void;
}) {
  if (apps.length === 0) return null;
  return (
    <section>
      <h2 className="section-label">{title}</h2>
      <div className="grid">
        {apps.map((app) => (
          <button key={app.id} type="button" className="app-tile" onClick={() => onOpen(app.id)} data-testid={`app-${app.id}`}>
            <AppMark app={app} />
            <span>{app.name}</span>
          </button>
        ))}
      </div>
    </section>
  );
}
