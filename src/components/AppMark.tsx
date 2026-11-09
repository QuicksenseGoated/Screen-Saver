import type { CatalogApp } from "../model";

export function AppMark({ app, size = 52 }: { app: CatalogApp; size?: number }) {
  return (
    <span
      className="mark"
      style={{
        width: size,
        height: size,
        background: `hsl(${app.hue} 38% 24%)`,
        color: `hsl(${app.hue} 62% 86%)`,
        fontSize: Math.max(12, size * 0.32),
      }}
      aria-hidden="true"
    >
      {app.letter}
    </span>
  );
}
