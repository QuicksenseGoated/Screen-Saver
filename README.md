# Screen Saver

A quiet screen-time HUD. Pick the apps you want to stay out of, choose the days and the hour the block starts, and choose how long it lasts. Opening a blocked app shows the lines you wrote at the top, then a countdown until the block ends.

Schedules and the wall are stored on the device.

## Run

```bash
npm install
npm test
npm run typecheck
npm run web
```

`npm run web` is the fastest way to use the whole flow on this machine. `npm start` opens the Expo dev server for Expo Go. A development build is required before the Android package list and the settings hooks are live:

```bash
npx expo run:android
npx expo run:ios
```

iOS compilation needs macOS.

## Try it

1. The home screen is the clock.
2. Tap **Apps**.
3. Turn an app on. It is blocked from the start of the current hour, for one hour, every day.
4. Tap **Open**. The wall is the text at the top. The countdown runs until the block ends.
5. Tap **Edit** to change the start, the length (15 minutes through 12 hours), and the days.
6. From home, tap **Wall** to change those lines and the countdown color. That choice is shared by every blocked app and kept on device.

Turning an app on during an hour that already started still blocks the rest of that hour, so the countdown is visible immediately.

## What the phone actually blocks

The intervention inside this app is complete: the list, the schedule, the wall, and the timer. The operating system is not hiding other apps.

**iOS.** Shielding another app requires Family Controls (`com.apple.developer.family-controls`), plus ManagedSettings and DeviceActivity. Apple grants that entitlement per developer team. It is not in this project, it does not work in Expo Go, and it is not available to a normal App Store app without that approval. `modules/screen-time` reports `canBlockApps: false` and does not return an installed-app list. Until the entitlement is on the signing identity, the app uses the built-in catalog so the schedule and the wall can still be tried.

**Android.** A development build lists launcher apps through `PackageManager` (`<queries>` for `MAIN` / `LAUNCHER`). It can also read whether usage access is granted, whether an overlay is allowed, and open those system screens. `PACKAGE_USAGE_STATS` and `SYSTEM_ALERT_WINDOW` are special permissions. Google Play restricts both, and a production listing would need a declaration. This project does not ship the foreground watcher or overlay activity that would take over another app. Granting the settings does not start blocking.

Expo Go does not include the local native module. Web, Expo Go, and tests use the catalog on purpose and say so on the Apps screen.

## Native module

`modules/screen-time` exposes a module named `ScreenTime`:

| Method | Android dev build | iOS |
| --- | --- | --- |
| `getLaunchableApps()` | Launcher activities | Empty. Family Controls is not entitled. |
| `getCapabilities()` | `canBlockApps: false`, plus usage-access and overlay flags | `canBlockApps: false` |
| `getRecentPackages()` | Last day of usage stats, only if usage access is already granted | Empty |
| `openUsageAccessSettings()` | Usage-access screen | No-op |
| `openOverlaySettings()` | Overlay screen | No-op |

JavaScript falls back to `src/domain/catalog.ts` when that list is empty. The wall copy lives in `src/domain/copy.ts` and does not claim the system is blocking apps.

## Tests

`npm test` covers the schedule (including a block that crosses midnight), persistence, the catalog fallback, and the limit copy. `npm run typecheck` runs `tsc --noEmit`.
