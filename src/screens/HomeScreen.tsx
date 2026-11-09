import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Rule, SectionLabel, TextButton } from '../components/Chrome';
import { formatClock, formatCountdown, formatDateLine, formatDurationCompact, pad } from '../domain/format';
import { blockedRows, upcomingRows } from '../domain/hud';
import { formatWhen } from '../domain/schedule';
import type { AppState } from '../domain/types';
import { label, sans, theme } from '../theme';

export function HomeScreen({
  now,
  state,
  onOpenApps,
  onEditWall,
  onOpenApp,
}: {
  now: Date;
  state: AppState;
  onOpenApps: () => void;
  onEditWall: () => void;
  onOpenApp: (appId: string) => void;
}) {
  const blocked = blockedRows(state, now);
  const upcoming = upcomingRows(state, now);
  const count = Object.keys(state.schedules).length;

  return (
    <View style={styles.fill}>
      <View style={styles.top}>
        <Text style={label}>Screen Saver</Text>
        <Text style={label}>{pad(count)}</Text>
      </View>

      <View style={styles.clockBlock}>
        <Text style={styles.clock} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.6}>
          {formatClock(now, true)}
        </Text>
        <Text style={styles.date}>{formatDateLine(now)}</Text>
        <Text style={[styles.status, blocked.length > 0 ? { color: state.wall.accent } : null]}>
          {blocked.length > 0 ? 'Blocked' : 'Clear'}
        </Text>
      </View>

      <Rule />

      <ScrollView style={styles.fill} contentContainerStyle={styles.list} showsVerticalScrollIndicator={false}>
        {blocked.length > 0 ? <SectionLabel>Blocked now</SectionLabel> : null}
        {blocked.map((row) => {
          const width = row.durationMs <= 0 ? 0 : Math.max(0.04, row.remainingMs / row.durationMs);
          return (
            <Pressable
              key={row.appId}
              onPress={() => onOpenApp(row.appId)}
              accessibilityRole="button"
              accessibilityLabel={`Open ${row.name}`}
              style={styles.row}
            >
              <View style={styles.rowTop}>
                <Text style={styles.name} numberOfLines={1}>
                  {row.name}
                </Text>
                <Text style={[styles.remain, { color: state.wall.accent }]}>{formatCountdown(row.remainingMs)}</Text>
              </View>
              <View style={styles.track}>
                <View style={[styles.bar, { width: `${width * 100}%`, backgroundColor: state.wall.accent }]} />
              </View>
            </Pressable>
          );
        })}

        {blocked.length === 0 ? (
          <Text style={styles.empty}>Nothing is blocked right now.</Text>
        ) : null}

        {upcoming.length > 0 ? (
          <View style={styles.next}>
            <SectionLabel>Next</SectionLabel>
            {upcoming.map((row) => (
              <View key={row.appId} style={styles.nextRow}>
                <Text style={styles.nextName} numberOfLines={1}>
                  {row.name}
                </Text>
                <Text style={styles.nextMeta}>
                  {formatWhen(row.start, now)} · {formatDurationCompact(row.durationMinutes)}
                </Text>
              </View>
            ))}
          </View>
        ) : null}

        {count === 0 ? <Text style={styles.hint}>Choose the apps to close, and when.</Text> : null}
      </ScrollView>

      <View style={styles.footer}>
        <TextButton label="Apps" onPress={onOpenApps} />
        <TextButton label="Wall" onPress={onEditWall} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1 },
  top: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
  },
  clockBlock: {
    paddingTop: 36,
    paddingBottom: 4,
  },
  clock: {
    ...sans,
    color: theme.text,
    fontSize: 64,
    fontWeight: '300',
    fontVariant: ['tabular-nums'],
    letterSpacing: -1,
  },
  date: {
    ...label,
    marginTop: 8,
  },
  status: {
    ...label,
    marginTop: 14,
    color: theme.faint,
  },
  list: {
    paddingBottom: 12,
  },
  row: {
    paddingVertical: 14,
  },
  rowTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    gap: 16,
  },
  name: {
    ...sans,
    flex: 1,
    color: theme.text,
    fontSize: 20,
    fontWeight: '400',
  },
  remain: {
    fontVariant: ['tabular-nums'],
    fontSize: 16,
  },
  track: {
    marginTop: 10,
    height: 1,
    backgroundColor: theme.line,
  },
  bar: {
    height: 1,
  },
  empty: {
    color: theme.muted,
    fontSize: 16,
    lineHeight: 24,
  },
  hint: {
    color: theme.faint,
    fontSize: 14,
    marginTop: 10,
  },
  next: {
    marginTop: 22,
    gap: 12,
  },
  nextRow: {
    gap: 4,
  },
  nextName: {
    color: theme.text,
    fontSize: 16,
  },
  nextMeta: {
    color: theme.muted,
    fontSize: 13,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: 4,
    paddingBottom: 6,
  },
});
