import { Platform, type TextStyle, type ViewStyle } from 'react-native';

export const theme = {
  stage: '#030303',
  bg: '#070809',
  text: '#f3f2ee',
  muted: 'rgba(243, 242, 238, 0.52)',
  faint: 'rgba(243, 242, 238, 0.28)',
  line: 'rgba(243, 242, 238, 0.16)',
  accent: '#d6e2c5',
};

export const mono: TextStyle = {
  fontFamily: Platform.select({
    ios: 'Menlo',
    android: 'monospace',
    default: 'ui-monospace, SFMono-Regular, Menlo, Consolas, monospace',
  }),
};

export const sans: TextStyle = {
  fontFamily: Platform.select({
    ios: 'Helvetica Neue',
    android: 'sans-serif',
    default: 'Helvetica Neue, Helvetica, Arial, sans-serif',
  }),
};

export const label: TextStyle = {
  ...mono,
  color: theme.muted,
  fontSize: 11,
  letterSpacing: 1.8,
  textTransform: 'uppercase',
};

export const hit: ViewStyle = {
  paddingVertical: 8,
};
