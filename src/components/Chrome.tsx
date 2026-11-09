import { Pressable, StyleSheet, Text, View } from 'react-native';
import { label, theme } from '../theme';

export function Frame() {
  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFill}>
      <View style={[styles.corner, styles.tl]} />
      <View style={[styles.corner, styles.tr]} />
      <View style={[styles.corner, styles.bl]} />
      <View style={[styles.corner, styles.br]} />
    </View>
  );
}

export function Rule() {
  return <View style={styles.rule} />;
}

export function TextButton({
  label: text,
  onPress,
  color,
  quiet,
}: {
  label: string;
  onPress: () => void;
  color?: string;
  quiet?: boolean;
}) {
  return (
    <Pressable onPress={onPress} hitSlop={12} accessibilityRole="button" style={styles.hit}>
      <Text style={[styles.button, quiet ? styles.quiet : null, color ? { color } : null]}>{text}</Text>
    </Pressable>
  );
}

export function SectionLabel({ children }: { children: string }) {
  return <Text style={label}>{children}</Text>;
}

const styles = StyleSheet.create({
  corner: {
    position: 'absolute',
    width: 16,
    height: 16,
    borderColor: 'rgba(243, 242, 238, 0.34)',
  },
  tl: { top: 14, left: 14, borderTopWidth: 1, borderLeftWidth: 1 },
  tr: { top: 14, right: 14, borderTopWidth: 1, borderRightWidth: 1 },
  bl: { bottom: 14, left: 14, borderBottomWidth: 1, borderLeftWidth: 1 },
  br: { bottom: 14, right: 14, borderBottomWidth: 1, borderRightWidth: 1 },
  rule: {
    height: 1,
    backgroundColor: theme.line,
    marginVertical: 20,
  },
  hit: {
    paddingVertical: 8,
  },
  button: {
    color: theme.text,
    fontSize: 16,
    letterSpacing: 0.2,
  },
  quiet: {
    color: theme.muted,
    fontSize: 14,
  },
});
