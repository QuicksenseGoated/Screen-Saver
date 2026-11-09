import { Platform } from 'react-native';
import { getScreenTimeNative, type NativeCapabilities } from 'screen-time';
import { CATALOG } from '../domain/catalog';
import { describeLimits } from '../domain/copy';
import { resolveAppList } from '../domain/state';
import type { AppInfo } from '../domain/types';

export type ListSource = 'device' | 'catalog';

export type Capabilities = {
  platform: string;
  nativeLinked: boolean;
  canListApps: boolean;
  canBlockApps: boolean;
  usageAccess: boolean | null;
  overlay: boolean | null;
  blockReason: string;
  listSource: ListSource;
};

export type LoadedApps = {
  apps: AppInfo[];
  recentPackages: string[];
  capabilities: Capabilities;
};

function getNative() {
  return getScreenTimeNative();
}

export function catalogLoad(): LoadedApps {
  const platform = Platform.OS;
  const resolved = resolveAppList(null, CATALOG);
  return {
    apps: resolved.apps,
    recentPackages: [],
    capabilities: {
      platform,
      nativeLinked: false,
      canListApps: false,
      canBlockApps: false,
      usageAccess: null,
      overlay: null,
      blockReason: describeLimits({ platform, nativeLinked: false }),
      listSource: 'catalog',
    },
  };
}

function asBool(value: boolean | undefined): boolean | null {
  return typeof value === 'boolean' ? value : null;
}

export function loadInstalledApps(): LoadedApps {
  const native = getNative();
  if (!native) return catalogLoad();
  try {
    const caps: NativeCapabilities = native.getCapabilities();
    const platform = caps.platform || Platform.OS;
    const resolved = resolveAppList(native.getLaunchableApps(), CATALOG);
    const recent = Array.isArray(native.getRecentPackages())
      ? native.getRecentPackages().filter((id) => typeof id === 'string' && id.length > 0)
      : [];
    return {
      apps: resolved.apps,
      recentPackages: resolved.source === 'device' ? recent : [],
      capabilities: {
        platform,
        nativeLinked: true,
        canListApps: Boolean(caps.canListApps) && resolved.source === 'device',
        canBlockApps: Boolean(caps.canBlockApps),
        usageAccess: asBool(caps.usageAccess),
        overlay: asBool(caps.overlay),
        blockReason: describeLimits({ platform, nativeLinked: true }),
        listSource: resolved.source,
      },
    };
  } catch {
    return catalogLoad();
  }
}

export function openUsageAccessSettings(): void {
  getNative()?.openUsageAccessSettings();
}

export function openOverlaySettings(): void {
  getNative()?.openOverlaySettings();
}
