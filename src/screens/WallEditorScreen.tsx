import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SectionLabel, TextButton } from '../components/Chrome';
import { ACCENTS, type Wall } from '../domain/types';
import { theme } from '../theme';

export function WallEditorScreen({
  wall,
  onBack,
  onChange,
}: {
  wall: Wall;
  onBack: () => void;
  onChange: (wall: Wall) => void;
}) {
  const [lines, setLines] = useState<string[]>(() => {
    const next = [...wall.lines];
    while (next.length < 3) next.push('');
    return next.slice(0, 3);
  });
  const [accent, setAccent] = useState(wall.accent);

  const commit = (nextLines: string[], nextAccent: string) => {
    onChange({ lines: nextLines, accent: nextAccent });
  };

  return (
    <ScrollView style={styles.fill} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
      <TextButton label="Back" onPress={onBack} quiet />
      <SectionLabel>Walls</SectionLabel>
      <Text style={styles.lead}>These lines sit at the top of the screen that appears when a blocked app is opened.</Text>

      {lines.map((line, index) => (
        <TextInput
          key={index}
          value={line}
          onChangeText={(value) => {
            const next = lines.map((item, itemIndex) => (itemIndex === index ? value.slice(0, 80) : item));
            setLines(next);
            commit(next, accent);
          }}
          placeholder={index === 0 ? 'Look up.' : 'Optional'}
          placeholderTextColor={theme.faint}
          style={[styles.input, index === 0 ? styles.inputFirst : null]}
          accessibilityLabel={`Wall line ${index + 1}`}
          maxLength={80}
        />
      ))}

      <View style={styles.block}>
        <SectionLabel>Countdown</SectionLabel>
        <View style={styles.swatches}>
          {ACCENTS.map((item) => {
            const selected = item.value === accent;
            return (
              <Pressable
                key={item.id}
                onPress={() => {
                  setAccent(item.value);
                  commit(lines, item.value);
                }}
                accessibilityRole="button"
                accessibilityLabel={`${item.id} countdown color`}
                accessibilityState={{ selected }}
                style={[styles.swatch, { backgroundColor: item.value }, selected ? styles.swatchOn : null]}
              />
            );
          })}
        </View>
      </View>

      <View style={styles.preview}>
        <SectionLabel>Preview</SectionLabel>
        <View style={styles.previewCard}>
          {(lines.map((line) => line.trim()).filter(Boolean).length > 0
            ? lines.map((line) => line.trim()).filter(Boolean)
            : ['Look up.']
          ).map((line, index) => (
            <Text key={`${line}-${index}`} style={index === 0 ? styles.previewFirst : styles.previewNext}>
              {line}
            </Text>
          ))}
          <Text style={[styles.sample, { color: accent }]}>27:14</Text>
          <Text style={styles.sampleNote}>Placement only. A real block counts down on its own.</Text>
        </View>
      </View>
      <Text style={styles.kept}>Kept on this device.</Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1 },
  content: { paddingTop: 8, paddingBottom: 32, gap: 12 },
  lead: { color: theme.muted, fontSize: 15, lineHeight: 22 },
  input: {
    color: theme.text,
    fontSize: 18,
    borderBottomWidth: 1,
    borderBottomColor: theme.line,
    paddingVertical: 10,
  },
  inputFirst: { fontSize: 28 },
  block: { marginTop: 18, gap: 14 },
  swatches: { flexDirection: 'row', gap: 12 },
  swatch: { width: 22, height: 22 },
  swatchOn: {
    borderWidth: 1,
    borderColor: theme.text,
  },
  preview: { marginTop: 22, gap: 12 },
  previewCard: { gap: 8, paddingVertical: 8 },
  previewFirst: { color: theme.text, fontSize: 28, fontWeight: '400' },
  previewNext: { color: theme.muted, fontSize: 16 },
  sample: { fontSize: 48, fontWeight: '300', fontVariant: ['tabular-nums'], marginTop: 12 },
  sampleNote: { color: theme.faint, fontSize: 12, lineHeight: 18 },
  kept: { color: theme.faint, fontSize: 12, marginTop: 8 },
});
