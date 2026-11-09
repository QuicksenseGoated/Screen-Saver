import { StatusBar } from 'expo-status-bar';
import { useCallback, useEffect, useState } from 'react';
import { BackHandler, Platform, StyleSheet, Text, View } from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { Frame } from './src/components/Chrome';
import type { AppInfo, AppState, Schedule, Wall } from './src/domain/types';
import { defaultState, withBlock, withSchedule, withWall, withoutBlock } from './src/domain/state';
import { catalogLoad, loadInstalledApps, type LoadedApps } from './src/native/screenTime';
import { AppsScreen } from './src/screens/AppsScreen';
import { HomeScreen } from './src/screens/HomeScreen';
import { InterventionScreen } from './src/screens/InterventionScreen';
import { ScheduleScreen } from './src/screens/ScheduleScreen';
import { WallEditorScreen } from './src/screens/WallEditorScreen';
import { loadState, saveState } from './src/storage/persist';
import { label, theme } from './src/theme';
import { useNow } from './src/useNow';

type Route =
  | { name: 'home' }
  | { name: 'apps' }
  | { name: 'schedule'; appId: string }
  | { name: 'wall' }
  | { name: 'intervention'; appId: string };

export default function App() {
  useEffect(() => {
    if (Platform.OS !== 'web' || typeof document === 'undefined') return;
    document.body.style.backgroundColor = theme.stage;
    document.body.style.margin = '0';
    document.documentElement.style.backgroundColor = theme.stage;
  }, []);

  return (
    <SafeAreaProvider>
      <StatusBar style="light" />
      <View style={styles.stage}>
        <View style={styles.device}>
          <Root />
        </View>
      </View>
    </SafeAreaProvider>
  );
}

function Root() {
  const now = useNow();
  const [hydrated, setHydrated] = useState(false);
  const [state, setState] = useState<AppState>(() => defaultState());
  const [loaded, setLoaded] = useState<LoadedApps>(() => catalogLoad());
  const [stack, setStack] = useState<Route[]>([{ name: 'home' }]);

  useEffect(() => {
    let cancel = false;
    loadState().then((next) => {
      if (cancel) return;
      setState(next);
      setHydrated(true);
    });
    setLoaded(loadInstalledApps());
    return () => {
      cancel = true;
    };
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    void saveState(state);
  }, [hydrated, state]);

  const pop = useCallback(() => {
    setStack((prev) => (prev.length > 1 ? prev.slice(0, -1) : prev));
  }, []);

  const push = useCallback((route: Route) => {
    setStack((prev) => [...prev, route]);
  }, []);

  useEffect(() => {
    if (Platform.OS !== 'android' || stack.length <= 1) return;
    const subscription = BackHandler.addEventListener('hardwareBackPress', () => {
      pop();
      return true;
    });
    return () => subscription.remove();
  }, [pop, stack.length]);

  const route = stack[stack.length - 1] ?? { name: 'home' as const };
  const blockApp = (app: AppInfo) => setState((prev) => withBlock(prev, app, new Date()));
  const removeApp = (appId: string) => setState((prev) => withoutBlock(prev, appId));
  const changeSchedule = (schedule: Schedule) => setState((prev) => withSchedule(prev, schedule));
  const changeWall = (wall: Wall) => setState((prev) => withWall(prev, wall));

  let body = <Boot />;
  if (hydrated && route.name === 'home') {
    body = (
      <HomeScreen
        now={now}
        state={state}
        onOpenApps={() => push({ name: 'apps' })}
        onEditWall={() => push({ name: 'wall' })}
        onOpenApp={(appId) => push({ name: 'intervention', appId })}
      />
    );
  } else if (hydrated && route.name === 'apps') {
    body = (
      <AppsScreen
        now={now}
        state={state}
        loaded={loaded}
        onBack={pop}
        onToggle={(app, on) => (on ? blockApp(app) : removeApp(app.id))}
        onEdit={(appId) => push({ name: 'schedule', appId })}
        onOpen={(appId) => push({ name: 'intervention', appId })}
      />
    );
  } else if (hydrated && route.name === 'schedule') {
    body = (
      <ScheduleScreen
        key={route.appId}
        now={now}
        state={state}
        appId={route.appId}
        onBack={pop}
        onChange={changeSchedule}
        onRemove={() => {
          removeApp(route.appId);
          pop();
        }}
        onOpen={() => push({ name: 'intervention', appId: route.appId })}
      />
    );
  } else if (hydrated && route.name === 'wall') {
    body = <WallEditorScreen wall={state.wall} onBack={pop} onChange={changeWall} />;
  } else if (hydrated && route.name === 'intervention') {
    body = (
      <InterventionScreen now={now} state={state} appId={route.appId} onLeave={pop} />
    );
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <Frame />
      <View style={styles.inner}>{body}</View>
    </SafeAreaView>
  );
}

function Boot() {
  return (
    <View style={styles.boot}>
      <Text style={label}>Screen Saver</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  stage: {
    flex: 1,
    backgroundColor: theme.stage,
    alignItems: 'center',
  },
  device: {
    flex: 1,
    width: '100%',
    maxWidth: 440,
    backgroundColor: theme.bg,
  },
  safe: {
    flex: 1,
    backgroundColor: theme.bg,
  },
  inner: {
    flex: 1,
    paddingHorizontal: 28,
  },
  boot: {
    flex: 1,
    justifyContent: 'center',
  },
});
