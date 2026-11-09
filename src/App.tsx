import { PhoneShell } from "./components/PhoneShell";
import { BlockScreen } from "./screens/Block";
import { LauncherScreen } from "./screens/Launcher";
import { PauseScreen } from "./screens/Pause";
import { ProfileEditor } from "./screens/ProfileEditor";
import { ProfilesScreen } from "./screens/Profiles";
import { ProgressScreen } from "./screens/Progress";
import { SessionScreen } from "./screens/Session";
import { SettingsScreen } from "./screens/Settings";
import { TodayScreen } from "./screens/Today";
import { StoreProvider, useStore } from "./state";

function Screens() {
  const { view } = useStore();
  if (view.name === "pause") return <PauseScreen />;
  if (view.name === "block") return <BlockScreen />;
  if (view.name === "session") return <SessionScreen />;
  if (view.name === "settings") return <SettingsScreen />;
  if (view.name === "editor") return <ProfileEditor />;
  if (view.name === "launcher") return <LauncherScreen />;
  if (view.name === "progress") return <ProgressScreen />;
  if (view.name === "profiles") return <ProfilesScreen />;
  return <TodayScreen />;
}

export function App() {
  return (
    <StoreProvider>
      <PhoneShell>
        <Screens />
      </PhoneShell>
    </StoreProvider>
  );
}
