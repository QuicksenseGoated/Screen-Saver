import type { AppInfo } from './types';

/**
 * Store ids for a typical phone. Used only when this session cannot ask the
 * device for its launcher apps (web, Expo Go, tests, or iOS without a
 * Family Controls list). A dev build on Android replaces this with
 * PackageManager results.
 */
export const CATALOG: readonly AppInfo[] = [
  { id: 'com.instagram.android', name: 'Instagram' },
  { id: 'com.zhiliaoapp.musically', name: 'TikTok' },
  { id: 'com.google.android.youtube', name: 'YouTube' },
  { id: 'com.facebook.katana', name: 'Facebook' },
  { id: 'com.twitter.android', name: 'X' },
  { id: 'com.reddit.frontpage', name: 'Reddit' },
  { id: 'com.snapchat.android', name: 'Snapchat' },
  { id: 'com.whatsapp', name: 'WhatsApp' },
  { id: 'com.discord', name: 'Discord' },
  { id: 'com.spotify.music', name: 'Spotify' },
  { id: 'com.netflix.mediaclient', name: 'Netflix' },
  { id: 'com.apple.mobilesafari', name: 'Safari' },
  { id: 'com.android.chrome', name: 'Chrome' },
  { id: 'com.apple.MobileSMS', name: 'Messages' },
  { id: 'com.google.android.gm', name: 'Gmail' },
  { id: 'com.google.android.apps.maps', name: 'Maps' },
  { id: 'com.google.android.apps.photos', name: 'Photos' },
  { id: 'com.apple.mobilecal', name: 'Calendar' },
];
