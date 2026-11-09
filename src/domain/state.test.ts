import assert from 'node:assert/strict';
import { test } from 'node:test';
import { describeLimits, listNote } from './copy';
import { CATALOG } from './catalog';
import {
  defaultState,
  hydrate,
  resolveAppList,
  serialize,
  withBlock,
  withSchedule,
  withWall,
  withoutBlock,
} from './state';
import { DEFAULT_ACCENT } from './types';

const now = new Date(2026, 10, 9, 14, 32, 0);

test('storage round-trips a block and drops corrupt payloads', () => {
  let state = withBlock(defaultState(), { id: 'com.instagram.android', name: 'Instagram' }, now);
  state = withWall(state, { lines: ['  Go outside.  ', ''], accent: '#e6d3b4' });
  const restored = hydrate(serialize(state));
  assert.equal(restored.schedules['com.instagram.android']?.durationMinutes, 60);
  assert.deepEqual(restored.wall.lines, ['Go outside.']);
  assert.equal(restored.wall.accent, '#e6d3b4');
  assert.deepEqual(hydrate('{'), defaultState());
  assert.deepEqual(hydrate(null), defaultState());
  assert.equal(hydrate(JSON.stringify({ wall: { accent: 'nope', lines: [] } })).wall.accent, DEFAULT_ACCENT);
});

test('schedule edits keep the app, and removal clears it', () => {
  let state = withBlock(defaultState(), { id: 'com.spotify.music', name: 'Spotify' }, now);
  state = withSchedule(state, {
    appId: 'com.spotify.music',
    days: [1, 2, 3, 4, 5],
    startMinutes: 9 * 60,
    durationMinutes: 10_000,
  });
  assert.equal(state.schedules['com.spotify.music']?.durationMinutes, 12 * 60);
  assert.deepEqual(state.schedules['com.spotify.music']?.days, [1, 2, 3, 4, 5]);
  state = withoutBlock(state, 'com.spotify.music');
  assert.equal(state.schedules['com.spotify.music'], undefined);
  assert.equal(state.knownApps['com.spotify.music'], undefined);
});

test('a device app list replaces the catalog, an empty list does not', () => {
  const device = resolveAppList([
    { id: 'com.one.app', name: 'One' },
    { id: 'com.one.app', name: 'One again' },
    { id: ' ', name: 'Nope' },
    { id: 'com.two.app', name: ' Two ' },
  ]);
  assert.equal(device.source, 'device');
  assert.deepEqual(device.apps, [
    { id: 'com.one.app', name: 'One' },
    { id: 'com.two.app', name: 'Two' },
  ]);
  const fallback = resolveAppList([]);
  assert.equal(fallback.source, 'catalog');
  assert.equal(fallback.apps.length, CATALOG.length);
  assert.equal(listNote('catalog').includes('unavailable'), true);
  assert.equal(listNote('device').includes('launcher'), true);
});

test('limit copy never claims the system is already blocking', () => {
  const reasons = [
    describeLimits({ platform: 'ios', nativeLinked: true }),
    describeLimits({ platform: 'android', nativeLinked: true }),
    describeLimits({ platform: 'android', nativeLinked: false }),
    describeLimits({ platform: 'web', nativeLinked: false }),
  ];
  for (const reason of reasons) {
    assert.match(reason, /inside Screen Saver/);
    assert.equal(/apps are now blocked/i.test(reason), false);
    assert.equal(/will close other apps/i.test(reason), false);
  }
  assert.match(reasons[0] ?? '', /Family Controls/);
  assert.match(reasons[1] ?? '', /Play policy/);
});
