export type NativeCapabilities = {
  platform?: string;
  canListApps?: boolean;
  canBlockApps?: boolean;
  usageAccess?: boolean;
  overlay?: boolean;
  blockReason?: string;
};

export type NativeApp = {
  id?: string;
  name?: string;
};

export type ScreenTimeNative = {
  getCapabilities: () => NativeCapabilities;
  getLaunchableApps: () => NativeApp[];
  getRecentPackages: () => string[];
  openUsageAccessSettings: () => void;
  openOverlaySettings: () => void;
};

export function getScreenTimeNative(): ScreenTimeNative | null;
