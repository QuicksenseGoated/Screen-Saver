import type { ReactNode } from "react";
import { useStore, type View } from "../state";

const TABS: { name: Extract<View["name"], "today" | "launcher" | "progress" | "profiles">; label: string }[] = [
  { name: "today", label: "Today" },
  { name: "launcher", label: "Apps" },
  { name: "progress", label: "Progress" },
  { name: "profiles", label: "Profiles" },
];

export function PhoneShell({ children }: { children: ReactNode }) {
  const { view, setView, now, note } = useStore();
  const showNav = view.name === "today" || view.name === "launcher" || view.name === "progress" || view.name === "profiles";

  return (
    <div className="stage">
      <div className="phone">
        <div className="status">
          <span>{now.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}</span>
          <span>Screen Saver</span>
        </div>
        {note && (
          <p className="toast" role="status">
            {note}
          </p>
        )}
        <div className="content">{children}</div>
        {showNav && (
          <nav className="nav">
            {TABS.map((tab) => (
              <button
                key={tab.name}
                type="button"
                className={view.name === tab.name ? "nav-btn active" : "nav-btn"}
                onClick={() => setView({ name: tab.name })}
                data-testid={`nav-${tab.name}`}
              >
                {tab.label}
              </button>
            ))}
          </nav>
        )}
      </div>
    </div>
  );
}
