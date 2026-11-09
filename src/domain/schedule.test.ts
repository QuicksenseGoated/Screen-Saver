import assert from 'node:assert/strict';
import { test } from 'node:test';
import { formatCountdown } from './format';
import { blockedRows } from './hud';
import {
  activeWindow,
  defaultSchedule,
  describeSchedule,
  formatUntil,
  remainingMs,
  stepDuration,
  stepHours,
  toggleDay,
  upcomingWindow,
} from './schedule';
import { defaultState, withBlock } from './state';
import type { Schedule } from './types';

const monday = new Date(2026, 10, 9, 14, 32, 10);

test('9 Nov 2026 is a Monday in local time', () => {
  assert.equal(monday.getDay(), 1);
});

test('a new block covers the rest of the current hour', () => {
  const schedule = defaultSchedule('com.instagram.android', monday);
  const window = activeWindow(schedule, monday);
  assert.ok(window);
  assert.equal(window.start.getHours(), 14);
  assert.equal(window.start.getMinutes(), 0);
  assert.equal(window.end.getHours(), 15);
  assert.equal(remainingMs(schedule, monday), (27 * 60 + 50) * 1000);
  assert.match(describeSchedule(schedule, monday).status, /Blocked right now/);
});

test('a window can cross midnight onto the next morning', () => {
  const schedule: Schedule = {
    appId: 'com.zhiliaoapp.musically',
    days: [1],
    startMinutes: 23 * 60,
    durationMinutes: 120,
  };
  assert.ok(activeWindow(schedule, new Date(2026, 10, 9, 23, 30, 0)));
  assert.ok(activeWindow(schedule, new Date(2026, 10, 10, 0, 30, 0)));
  assert.equal(activeWindow(schedule, new Date(2026, 10, 10, 1, 0, 0)), null);
  assert.equal(activeWindow(schedule, new Date(2026, 10, 9, 22, 59, 0)), null);
  assert.equal(
    formatUntil(activeWindow(schedule, new Date(2026, 10, 9, 23, 30, 0))!.end, new Date(2026, 10, 9, 23, 30, 0)),
    'until 01:00 tomorrow',
  );
});

test('days that are off stay open, and the next start is reported', () => {
  const schedule: Schedule = {
    appId: 'com.google.android.youtube',
    days: [2],
    startMinutes: 18 * 60,
    durationMinutes: 90,
  };
  assert.equal(activeWindow(schedule, monday), null);
  const next = upcomingWindow(schedule, monday);
  assert.ok(next);
  assert.equal(next.start.getDate(), 10);
  assert.equal(next.start.getHours(), 18);
  assert.match(describeSchedule(schedule, monday).status, /tomorrow at 18:00/);
});

test('the block ends at the exact end time', () => {
  const schedule = defaultSchedule('com.instagram.android', monday);
  assert.equal(activeWindow(schedule, new Date(2026, 10, 9, 15, 0, 0)), null);
  assert.ok(activeWindow(schedule, new Date(2026, 10, 9, 14, 0, 0)));
});

test('countdown and steppers stay inside the editor bounds', () => {
  assert.equal(formatCountdown(0), '00:00');
  assert.equal(formatCountdown(1000), '00:01');
  assert.equal(formatCountdown(60_000), '01:00');
  assert.equal(formatCountdown(3_600_000), '1:00:00');
  assert.equal(stepHours(23 * 60 + 15, 1), 15);
  assert.equal(stepDuration(15, -30), 15);
  assert.equal(stepDuration(12 * 60, 15), 12 * 60);
  assert.deepEqual(toggleDay([1], 1), [1]);
  assert.deepEqual(toggleDay([1], 3), [1, 3]);
});

test('the home list shows a just-blocked app', () => {
  const state = withBlock(defaultState(), { id: 'com.instagram.android', name: 'Instagram' }, monday);
  const rows = blockedRows(state, monday);
  assert.equal(rows.length, 1);
  assert.equal(rows[0]?.name, 'Instagram');
  assert.ok(rows[0] && rows[0].remainingMs > 0);
});
