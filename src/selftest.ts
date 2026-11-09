import {
  decideGate,
  displayStreak,
  recordOpen,
  recordSeconds,
  settleStreak,
  type AppState,
} from "./model";
import { seedState } from "./seed";

function assert(condition: boolean, message: string): void {
  if (!condition) throw new Error(message);
}

function at(hour: number, minute: number, day = 9): Date {
  // Monday 9 Nov 2026 is a Monday. day is the calendar date.
  return new Date(2026, 10, day, hour, minute, 0, 0);
}

const mondayNoon = at(12, 30, 9);
const mondayLateMorning = at(11, 20, 9);
const mondayEarly = at(6, 0, 9);
const sundayEvening = at(15, 0, 8);
const sundayLate = at(23, 0, 8);

let state = seedState();

{
  const gate = decideGate(state, "instagram", mondayNoon);
  assert(gate.kind === "pause", "weekday noon should pause");
  if (gate.kind === "pause") {
    assert(gate.seconds === 5, `pause should be 5s, got ${gate.seconds}`);
    assert(gate.message === "Is this important?", gate.message);
    assert(gate.profileName === "Weekday", gate.profileName);
  }
}

{
  const gate = decideGate(state, "maps", mondayLateMorning);
  assert(gate.kind === "open", "maps is not tracked");
}

{
  const gate = decideGate(state, "tiktok", mondayLateMorning);
  assert(gate.kind === "block" && gate.reason === "schedule", "11:20 should be outside weekday windows");
  if (gate.kind === "block") {
    assert(gate.until != null, "schedule block should name the next opening");
    const next = new Date(gate.until ?? 0);
    assert(next.getHours() === 12 && next.getMinutes() === 0, `next open should be noon, got ${next}`);
  }
}

{
  const gate = decideGate(state, "youtube", mondayEarly);
  assert(gate.kind === "pause" && gate.profileName === "After hours", "before 7am uses the fallback profile");
  if (gate.kind === "pause") assert(gate.message === "Can this wait?", gate.message);
}

{
  const gate = decideGate(state, "reddit", sundayEvening);
  assert(gate.kind === "pause" && gate.profileName === "Weekend", "sunday afternoon is weekend");
  if (gate.kind === "pause") {
    assert(gate.seconds === 3, "weekend pause is 3s");
    assert(gate.message === "What are you seeking?", gate.message);
  }
}

{
  const gate = decideGate(state, "reddit", sundayLate);
  assert(gate.kind === "block" && gate.reason === "schedule", "sunday 23:00 is outside weekend hours");
}

{
  state = {
    ...state,
    pinnedProfileId: state.profiles.find((profile) => profile.name === "Weekend")?.id ?? null,
  };
  const gate = decideGate(state, "instagram", mondayNoon);
  assert(gate.kind === "block" && gate.profileName === "Weekend", "pin uses weekend rules even on a weekday");
  state = {
    ...state,
    pinnedProfileId: state.profiles.find((profile) => profile.name === "After hours")?.id ?? null,
  };
  const fallback = decideGate(state, "instagram", mondayNoon);
  assert(fallback.kind === "pause" && fallback.profileName === "After hours", "pin overrides the clock");
  if (fallback.kind === "pause") assert(fallback.message === "Can this wait?", fallback.message);
  state = { ...state, pinnedProfileId: null };
}

{
  const key = "2026-11-09";
  state = {
    ...state,
    usageByDate: {
      [key]: {
        secondsByApp: { instagram: 100 * 60, tiktok: 20 * 60 },
        opensByApp: {},
        lastClosedAtByApp: {},
        bypasses: 0,
        exceeded: false,
      },
    },
  };
  const gate = decideGate(state, "youtube", mondayNoon);
  assert(gate.kind === "block" && gate.reason === "minutes", "shared social minutes should block a third app");
  state = { ...state, usageByDate: {} };
}

{
  const weekday = state.profiles.find((profile) => profile.name === "Weekday");
  assert(weekday != null, "weekday profile");
  const grown = {
    ...state,
    profiles: state.profiles.map((profile) =>
      profile.name === "Weekday"
        ? {
            ...profile,
            groups: profile.groups.map((group) => ({ ...group, pauseGrows: true, opensPerDay: 2 })),
          }
        : profile,
    ),
    usageByDate: {
      "2026-11-09": {
        secondsByApp: {},
        opensByApp: { instagram: 1 },
        lastClosedAtByApp: { x: mondayNoon.getTime() - 30_000 },
        bypasses: 0,
        exceeded: false,
      },
    },
  };
  const pause = decideGate(grown, "tiktok", mondayNoon);
  assert(pause.kind === "pause" && pause.seconds === 10, `growing pause should be 10s, got ${pause.kind === "pause" ? pause.seconds : pause.kind}`);
  const cooled = {
    ...grown,
    profiles: grown.profiles.map((profile) =>
      profile.name === "Weekday"
        ? {
            ...profile,
            groups: profile.groups.map((group) => ({ ...group, cooldownMinutes: 10 })),
          }
        : profile,
    ),
  };
  const cool = decideGate(cooled, "x", mondayNoon);
  assert(cool.kind === "block" && cool.reason === "cooldown", "cooldown blocks the app just closed");
  const opened = recordOpen(recordOpen(cooled, "instagram", mondayNoon), "tiktok", mondayNoon);
  const cap = decideGate(opened, "reddit", mondayNoon);
  assert(cap.kind === "block" && cap.reason === "opens", "opens are shared by the group");
}

{
  let timed = seedState();
  const first = recordSeconds(timed, "instagram", 50, mondayNoon, true);
  assert(!first.hitLimit, "50s is inside 120m");
  timed = first.state;
  const second = recordSeconds(timed, "tiktok", 120 * 60, mondayNoon, true);
  assert(second.hitLimit, "crossing the shared budget ends the session");
  const used = Object.values(second.state.usageByDate["2026-11-09"].secondsByApp).reduce((sum, n) => sum + n, 0);
  assert(Math.round(used) === 120 * 60, `budget should clamp at 120m, got ${used}`);
}

{
  const base: AppState = {
    ...seedState(),
    streak: { count: 4, settledThrough: "2026-11-06" },
    usageByDate: {
      "2026-11-07": {
        secondsByApp: {},
        opensByApp: {},
        lastClosedAtByApp: {},
        bypasses: 1,
        exceeded: false,
      },
    },
  };
  const settled = settleStreak(base, mondayNoon);
  assert(settled.count === 1, `the clean day after a bypass starts again, got ${settled.count}`);
  assert(settled.settledThrough === "2026-11-08", settled.settledThrough ?? "");
  const clean: AppState = {
    ...seedState(),
    streak: { count: 2, settledThrough: "2026-11-06" },
    usageByDate: {},
  };
  const grown = settleStreak(clean, mondayNoon);
  assert(grown.count === 4, `empty days count as held limits, got ${grown.count}`);
  assert(displayStreak({ ...clean, streak: grown }, mondayNoon) === 4, "today still counts the settled streak");
}

console.log("model checks passed");
