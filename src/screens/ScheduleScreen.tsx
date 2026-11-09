import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Rule, SectionLabel, TextButton } from '../components/Chrome';
import { formatDuration, pad } from '../domain/format';
import {
  describeSchedule,
  stepDuration,
  stepHours,
  stepMinuteMarks,
  toggleDay,
} from '../domain/schedule';
import type { AppState, Schedule } from '../domain/types';
import { MAX_DURATION_MINUTES } from '../domain/types';
import { appName } from '../domain/hud';
import { label, theme } from '../theme';

const DAY_CHIPS = [
  { day: 1, name: 'Mon' },
  { day: 2, name: 'Tue' },
  { day: 3, name: 'Wed' },
  { day: 4, name: 'Thu' },
  { day: 5, name: 'Fri' },
  { day: 6, name: 'Sat' },
  { day: 0, name: 'Sun' },
];

const PRESETS = [15, 30, 45, 60, 90, 120];

export function ScheduleScreen({
  now,
  state,
  appId,
  onBack,
  onChange,
  onRemove,
  onOpen,
}: {
  now: Date;
  state: AppState;
  appId: string;
  onBack: () => void;
  onChange: (schedule: Schedule) => void;
  onRemove: () => void;
  onOpen: () => void;
}) {
  const existing = state.schedules[appId];
  const [draft, setDraft] = useState<Schedule | null>(existing ?? null);
  if (!existing || !draft) {
    return (
      <View style={styles.fill}>
        <TextButton label="Back" onPress={onBack} quiet />
        <Text style={styles.missing}>This app is not blocked.</Text>
      </View>
    );
  }

  const name = appName(state, appId);
  const described = describeSchedule(draft, now);
  const update = (next: Schedule) => {
    setDraft(next);
    onChange(next);
  };

  return (
    <ScrollView style={styles.fill} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
      <TextButton label="Back" onPress={onBack} quiet />
      <Text style={styles.name}>{name}</Text>
      <Text style={styles.id}>{appId}</Text>

      <View style={styles.block}>
        <SectionLabel>Starts</SectionLabel>
        <View style={styles.steppers}>
          <Stepper
            label="Hour"
            value={pad(Math.floor(draft.startMinutes / 60))}
            onDecrement={() => update({ ...draft, startMinutes: stepHours(draft.startMinutes, -1) })}
            onIncrement={() => update({ ...draft, startMinutes: stepHours(draft.startMinutes, 1) })}
          />
          <Stepper
            label="Minute"
            value={pad(draft.startMinutes % 60)}
            onDecrement={() => update({ ...draft, startMinutes: stepMinuteMarks(draft.startMinutes, -1) })}
            onIncrement={() => update({ ...draft, startMinutes: stepMinuteMarks(draft.startMinutes, 1) })}
          />
        </View>
      </View>

      <View style={styles.block}>
        <SectionLabel>Lasts</SectionLabel>
        <View style={styles.presets}>
          {PRESETS.map((minutes) => {
            const selected = draft.durationMinutes === minutes;
            return (
              <Pressable
                key={minutes}
                onPress={() => update({ ...draft, durationMinutes: minutes })}
                accessibilityRole="button"
                accessibilityState={{ selected }}
                style={styles.preset}
              >
                <Text style={[styles.presetText, selected ? { color: state.wall.accent } : null]}>
                  {minutes === 90 ? '90m' : minutes < 60 ? `${minutes}m` : `${minutes / 60}h`}
                </Text>
              </Pressable>
            );
          })}
        </View>
        <Stepper
          label="Length"
          value={formatDuration(draft.durationMinutes)}
          onDecrement={() => update({ ...draft, durationMinutes: stepDuration(draft.durationMinutes, -15) })}
          onIncrement={() => update({ ...draft, durationMinutes: stepDuration(draft.durationMinutes, 15) })}
        />
        <Text style={styles.cap}>Up to {formatDuration(MAX_DURATION_MINUTES)}.</Text>
      </View>

      <View style={styles.block}>
        <SectionLabel>Days</SectionLabel>
        <View style={styles.days}>
          {DAY_CHIPS.map((chip) => {
            const selected = draft.days.includes(chip.day);
            return (
              <Pressable
                key={chip.name}
                onPress={() => update({ ...draft, days: toggleDay(draft.days, chip.day) })}
                accessibilityRole="button"
                accessibilityState={{ selected }}
                style={styles.day}
              >
                <Text style={[styles.dayText, selected ? { color: state.wall.accent } : null]}>{chip.name}</Text>
              </Pressable>
            );
          })}
        </View>
      </View>

      <Rule />
      <Text style={styles.summary}>{described.summary}</Text>
      <Text style={[styles.status, { color: state.wall.accent }]}>{described.status}</Text>

      <View style={styles.footer}>
        <TextButton label={`Open ${name}`} onPress={onOpen} color={state.wall.accent} />
        <TextButton label="Remove block" onPress={onRemove} quiet />
      </View>
    </ScrollView>
  );
}

function Stepper({
  label: caption,
  value,
  onDecrement,
  onIncrement,
}: {
  label: string;
  value: string;
  onDecrement: () => void;
  onIncrement: () => void;
}) {
  return (
    <View style={styles.stepper}>
      <Text style={label}>{caption}</Text>
      <View style={styles.stepperRow}>
        <Pressable onPress={onDecrement} hitSlop={12} accessibilityRole="button" accessibilityLabel={`Decrease ${caption}`}>
          <Text style={styles.step}>−</Text>
        </Pressable>
        <Text style={styles.stepValue}>{value}</Text>
        <Pressable onPress={onIncrement} hitSlop={12} accessibilityRole="button" accessibilityLabel={`Increase ${caption}`}>
          <Text style={styles.step}>+</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1 },
  content: { paddingTop: 8, paddingBottom: 28, gap: 8 },
  name: { color: theme.text, fontSize: 32, fontWeight: '400', marginTop: 12 },
  id: { color: theme.faint, fontSize: 12 },
  missing: { color: theme.muted, fontSize: 16, marginTop: 24 },
  block: { marginTop: 22, gap: 12 },
  steppers: { flexDirection: 'row', gap: 28 },
  stepper: { gap: 8 },
  stepperRow: { flexDirection: 'row', alignItems: 'center', gap: 16 },
  step: { color: theme.text, fontSize: 22, minWidth: 18, textAlign: 'center' },
  stepValue: { color: theme.text, fontSize: 22, fontVariant: ['tabular-nums'], minWidth: 72 },
  presets: { flexDirection: 'row', flexWrap: 'wrap', gap: 14 },
  preset: { paddingVertical: 4 },
  presetText: { color: theme.muted, fontSize: 16, fontVariant: ['tabular-nums'] },
  cap: { color: theme.faint, fontSize: 12 },
  days: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  day: { paddingVertical: 4, minWidth: 36 },
  dayText: { color: theme.faint, fontSize: 15 },
  summary: { color: theme.text, fontSize: 16, lineHeight: 23 },
  status: { fontSize: 15, lineHeight: 22 },
  footer: { marginTop: 18, gap: 4 },
});
