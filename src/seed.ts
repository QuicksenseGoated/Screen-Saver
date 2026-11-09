import {
  type AppGroup,
  type AppState,
  type TimeWindow,
  uid,
} from "./model";

function window(start: string, end: string): TimeWindow {
  return { id: uid(), start, end };
}

const SOCIAL = ["instagram", "tiktok", "x", "youtube", "reddit"];

function socialGroup(options: {
  dailyLimitMinutes: number;
  pauseSeconds: number;
  pauseMessage: string;
  access: AppGroup["access"];
  days: AppGroup["days"];
  windows: TimeWindow[];
  sessionMinutes?: number | null;
  opensPerDay?: number | null;
}): AppGroup {
  return {
    id: uid(),
    name: "Social",
    appIds: [...SOCIAL],
    dailyLimitMinutes: options.dailyLimitMinutes,
    opensPerDay: options.opensPerDay ?? null,
    sessionMinutes: options.sessionMinutes ?? null,
    cooldownMinutes: null,
    pauseSeconds: options.pauseSeconds,
    pauseGrows: false,
    pauseMessage: options.pauseMessage,
    access: options.access,
    days: options.days,
    windows: options.windows,
  };
}

export function seedState(): AppState {
  return {
    pinnedProfileId: null,
    usageByDate: {},
    streak: { count: 0, settledThrough: null },
    settings: {
      lockCode: null,
      locked: false,
      unlockAt: null,
      emergencyPassesPerDay: 1,
    },
    profiles: [
      {
        id: uid(),
        name: "Weekday",
        isDefault: false,
        days: [1, 2, 3, 4, 5],
        windows: [window("07:00", "23:00")],
        groups: [
          socialGroup({
            dailyLimitMinutes: 120,
            pauseSeconds: 5,
            pauseMessage: "Is this important?",
            access: "windows",
            days: [1, 2, 3, 4, 5],
            windows: [window("12:00", "13:00"), window("18:00", "21:00")],
          }),
        ],
      },
      {
        id: uid(),
        name: "Weekend",
        isDefault: false,
        days: [0, 6],
        windows: [],
        groups: [
          socialGroup({
            dailyLimitMinutes: 180,
            pauseSeconds: 3,
            pauseMessage: "What are you seeking?",
            access: "windows",
            days: [0, 6],
            windows: [window("10:00", "22:00")],
            sessionMinutes: 20,
            opensPerDay: 12,
          }),
        ],
      },
      {
        id: uid(),
        name: "After hours",
        isDefault: true,
        days: [],
        windows: [],
        groups: [
          socialGroup({
            dailyLimitMinutes: 30,
            pauseSeconds: 5,
            pauseMessage: "Can this wait?",
            access: "anytime",
            days: [],
            windows: [],
          }),
        ],
      },
    ],
  };
}
