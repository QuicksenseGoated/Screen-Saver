import { StyleSheet, Text, View } from 'react-native';
import { TextButton } from '../components/Chrome';
import { INTERVENTION_NOTE } from '../domain/copy';
import { formatCountdown } from '../domain/format';
import { appName } from '../domain/hud';
import { activeWindow, formatUntil, formatWhen, progressRemaining, upcomingWindow } from '../domain/schedule';
import type { AppState } from '../domain/types';
import { label, sans, theme } from '../theme';

export function InterventionScreen({
  now,
  state,
  appId,
  onLeave,
}: {
  now: Date;
  state: AppState;
  appId: string;
  onLeave: () => void;
}) {
  const schedule = state.schedules[appId];
  const name = appName(state, appId);
  const lines = state.wall.lines.filter((line) => line.trim().length > 0);
  const active = schedule ? activeWindow(schedule, now) : null;
  const next = schedule && !active ? upcomingWindow(schedule, now) : null;
  const remaining = active ? active.end.getTime() - now.getTime() : 0;
  const progress = schedule ? progressRemaining(schedule, now) : 0;

  return (
    <View style={styles.fill}>
      <View style={styles.walls}>
        {lines.map((line, index) => (
          <Text key={`${line}-${index}`} style={index === 0 ? styles.wall : styles.wallNext}>
            {line}
          </Text>
        ))}
      </View>

      <View style={styles.center}>
        <Text style={label}>{name}</Text>
        {active ? (
          <>
            <Text
              style={[styles.count, { color: state.wall.accent }]}
              numberOfLines={1}
              adjustsFontSizeToFit
              minimumFontScale={0.5}
            >
              {formatCountdown(remaining)}
            </Text>
            <Text style={styles.until}>{formatUntil(active.end, now)}</Text>
            <View style={styles.track}>
              <View style={[styles.bar, { width: `${Math.max(progress, 0.02) * 100}%`, backgroundColor: state.wall.accent }]} />
            </View>
          </>
        ) : (
          <>
            <Text style={[styles.open, { color: state.wall.accent }]}>{schedule ? 'Open' : 'Clear'}</Text>
            <Text style={styles.until}>
              {schedule
                ? next
                  ? `Next block is ${formatWhen(next.start, now)}.`
                  : 'No block is set this week.'
                : 'This app is not blocked.'}
            </Text>
          </>
        )}
      </View>

      <View style={styles.footer}>
        <Text style={styles.note}>{INTERVENTION_NOTE}</Text>
        <TextButton label="Leave" onPress={onLeave} quiet />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1, paddingTop: 12 },
  walls: { gap: 8, paddingTop: 18 },
  wall: {
    ...sans,
    color: theme.text,
    fontSize: 36,
    fontWeight: '400',
    lineHeight: 42,
  },
  wallNext: {
    color: theme.muted,
    fontSize: 18,
    lineHeight: 26,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    gap: 12,
  },
  count: {
    fontSize: 76,
    fontWeight: '300',
    fontVariant: ['tabular-nums'],
    letterSpacing: -1,
  },
  open: {
    fontSize: 64,
    fontWeight: '300',
  },
  until: {
    color: theme.muted,
    fontSize: 16,
  },
  track: {
    marginTop: 8,
    height: 1,
    backgroundColor: theme.line,
  },
  bar: { height: 1 },
  footer: {
    paddingBottom: 8,
    gap: 8,
  },
  note: {
    color: theme.faint,
    fontSize: 12,
    lineHeight: 18,
  },
});
