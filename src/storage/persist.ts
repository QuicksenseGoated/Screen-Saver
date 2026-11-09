import AsyncStorage from '@react-native-async-storage/async-storage';
import { hydrate, serialize } from '../domain/state';
import type { AppState } from '../domain/types';

const KEY = 'screen-saver/v1';

export async function loadState(): Promise<AppState> {
  try {
    const raw = await AsyncStorage.getItem(KEY);
    return hydrate(raw);
  } catch {
    return hydrate(null);
  }
}

export async function saveState(state: AppState): Promise<void> {
  try {
    await AsyncStorage.setItem(KEY, serialize(state));
  } catch {
    // The session still holds the schedule if the device refuses storage.
  }
}
