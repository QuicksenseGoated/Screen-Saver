export function describeLimits(input: { platform: string; nativeLinked: boolean }): string {
  if (input.platform === 'ios') {
    return 'iOS can hide other apps only with Family Controls, the Screen Time entitlement Apple grants per team. This project does not include that entitlement. The countdown runs inside Screen Saver.';
  }
  if (input.platform === 'android' && input.nativeLinked) {
    return 'Android can interrupt other apps only with usage access and a system overlay. Play policy restricts both. The settings hooks are wired; the countdown still runs inside Screen Saver.';
  }
  if (input.platform === 'android') {
    return 'This session is not a dev build, so the installed-app list and the usage-access hooks are unavailable. The countdown runs inside Screen Saver.';
  }
  return 'This session cannot read the phone’s apps or block them. A realistic catalog stands in, and the countdown runs inside Screen Saver.';
}

export function listNote(source: 'device' | 'catalog'): string {
  if (source === 'device') return 'Apps with a launcher icon on this phone.';
  return 'Device app list unavailable. These common apps stand in so a block can be set and opened.';
}

export const INTERVENTION_NOTE =
  'Shown inside Screen Saver. The system does not hide this app yet.';
