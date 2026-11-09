import { useMemo, useState } from 'react';
import { FlatList, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { SectionLabel, TextButton } from '../components/Chrome';
import { listNote } from '../domain/copy';
import { formatDurationCompact, formatTimeOfDay } from '../domain/format';
import { formatDays } from '../domain/format';
import type { AppInfo, AppState } from '../domain/types';
import { openOverlaySettings, openUsageAccessSettings, type LoadedApps } from '../native/screenTime';
import { label, theme } from '../theme';

export function AppsScreen({
  now,
  state,
  loaded,
  onBack,
  onToggle,
  onEdit,
  onOpen,
}: {
  now: Date;
  state: AppState;
  loaded: LoadedApps;
  onBack: () => void;
  onToggle: (app: AppInfo, on: boolean) => void;
  onEdit: (appId: string) => void;
  onOpen: (appId: string) => void;
}) {
  const [query, setQuery] = useState('');
  const recent = useMemo(() => new Set(loaded.recentPackages), [loaded.recentPackages]);
  const apps = useMemo(() => {
    const q = query.trim().toLowerCase();
    return loaded.apps
      .filter((app) => !q || app.name.toLowerCase().includes(q) || app.id.toLowerCase().includes(q))
      .slice()
      .sort((a, b) => {
        const aOn = state.schedules[a.id] ? 0 : 1;
        const bOn = state.schedules[b.id] ? 0 : 1;
        if (aOn !== bOn) return aOn - bOn;
        return a.name.localeCompare(b.name);
      });
  }, [loaded.apps, query, state.schedules]);

  const { capabilities } = loaded;

  return (
    <View style={styles.fill}>
      <View style={styles.header}>
        <TextButton label="Back" onPress={onBack} quiet />
        <SectionLabel>Apps</SectionLabel>
        <Text style={styles.note}>{listNote(capabilities.listSource)}</Text>
        <Text style={styles.reason}>{capabilities.blockReason}</Text>
        {capabilities.usageAccess !== null || capabilities.overlay !== null ? (
          <View style={styles.hooks}>
            {capabilities.usageAccess !== null ? (
              <TextButton
                label={capabilities.usageAccess ? 'Usage access on' : 'Usage access off'}
                onPress={openUsageAccessSettings}
                quiet
              />
            ) : null}
            {capabilities.overlay !== null ? (
              <TextButton
                label={capabilities.overlay ? 'Overlay on' : 'Overlay off'}
                onPress={openOverlaySettings}
                quiet
              />
            ) : null}
          </View>
        ) : null}
        <TextInput
          value={query}
          onChangeText={setQuery}
          placeholder="Filter"
          placeholderTextColor={theme.faint}
          autoCorrect={false}
          autoCapitalize="none"
          style={styles.filter}
          accessibilityLabel="Filter apps"
        />
      </View>
      <FlatList
        style={styles.fill}
        data={apps}
        keyExtractor={(item) => item.id}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={styles.list}
        ListEmptyComponent={<Text style={styles.empty}>Nothing matches.</Text>}
        renderItem={({ item }) => {
          const schedule = state.schedules[item.id];
          const on = Boolean(schedule);
          return (
            <View style={styles.row}>
              <View style={styles.rowTop}>
                <View style={styles.identity}>
                  <Text style={styles.name} numberOfLines={1}>
                    {item.name}
                  </Text>
                  <Text style={styles.id} numberOfLines={1}>
                    {item.id}
                    {recent.has(item.id) ? '  ·  recent' : ''}
                  </Text>
                </View>
                <Pressable
                  onPress={() => onToggle(item, !on)}
                  hitSlop={10}
                  accessibilityRole="button"
                  accessibilityLabel={on ? `Stop blocking ${item.name}` : `Block ${item.name}`}
                  style={styles.markHit}
                >
                  <View style={[styles.mark, on ? { backgroundColor: state.wall.accent, borderColor: state.wall.accent } : null]} />
                  <Text style={label}>{on ? 'On' : 'Off'}</Text>
                </Pressable>
              </View>
              {schedule ? (
                <View style={styles.actions}>
                  <Text style={styles.meta} numberOfLines={1}>
                    {formatTimeOfDay(schedule.startMinutes)} · {formatDurationCompact(schedule.durationMinutes)} ·{' '}
                    {formatDays(schedule.days)}
                  </Text>
                  <View style={styles.actionRow}>
                    <TextButton label="Open" onPress={() => onOpen(item.id)} color={state.wall.accent} />
                    <TextButton label="Edit" onPress={() => onEdit(item.id)} quiet />
                  </View>
                </View>
              ) : null}
            </View>
          );
        }}
      />
      <Text style={styles.clockHint}>{`${padTime(now)}`}</Text>
    </View>
  );
}

function padTime(now: Date): string {
  return `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
}

const styles = StyleSheet.create({
  fill: { flex: 1 },
  header: {
    gap: 10,
    paddingTop: 8,
  },
  note: {
    color: theme.text,
    fontSize: 15,
    lineHeight: 21,
  },
  reason: {
    color: theme.muted,
    fontSize: 13,
    lineHeight: 19,
  },
  hooks: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  filter: {
    color: theme.text,
    fontSize: 16,
    borderBottomWidth: 1,
    borderBottomColor: theme.line,
    paddingVertical: 8,
    marginTop: 4,
  },
  list: {
    paddingBottom: 20,
  },
  row: {
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: theme.line,
  },
  rowTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  identity: {
    flex: 1,
    gap: 4,
  },
  name: {
    color: theme.text,
    fontSize: 18,
  },
  id: {
    color: theme.faint,
    fontSize: 12,
  },
  markHit: {
    alignItems: 'center',
    gap: 6,
    minWidth: 36,
  },
  mark: {
    width: 10,
    height: 10,
    borderWidth: 1,
    borderColor: theme.faint,
  },
  actions: {
    marginTop: 10,
    gap: 2,
  },
  meta: {
    color: theme.muted,
    fontSize: 13,
  },
  actionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  empty: {
    color: theme.muted,
    paddingVertical: 24,
  },
  clockHint: {
    ...label,
    textAlign: 'right',
    paddingBottom: 8,
  },
});
