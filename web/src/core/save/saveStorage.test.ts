import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { SAVE_SCHEMA_VERSION, type GameSaveFile } from './saveTypes';
import {
  clearSaveGame,
  getSaveSummary,
  hasSaveGame,
  readSaveGame,
  writeSaveGame,
} from './saveStorage';

const sampleSave = (): GameSaveFile => ({
  version: SAVE_SCHEMA_VERSION,
  savedAt: '2026-06-03T12:00:00.000Z',
  dayIndex: 3,
  dayRemaining: 45,
  speedLevel: 1,
  resources: { food: 2, water: 1, caps: 5 },
  gameOver: false,
  backpack: [{ cardId: 'test_shop', count: 1, order: 0 }],
  blueprintStacks: [],
  boardStacks: [],
});

describe('saveStorage', () => {
  const store = new Map<string, string>();

  beforeEach(() => {
    store.clear();
    vi.stubGlobal('localStorage', {
      getItem: (key: string) => store.get(key) ?? null,
      setItem: (key: string, value: string) => {
        store.set(key, value);
      },
      removeItem: (key: string) => {
        store.delete(key);
      },
    });
  });

  afterEach(() => {
    clearSaveGame();
    vi.unstubAllGlobals();
  });

  it('writes and reads a save slot', () => {
    writeSaveGame(sampleSave());
    expect(hasSaveGame()).toBe(true);
    const loaded = readSaveGame();
    expect(loaded?.dayIndex).toBe(3);
    expect(loaded?.resources.caps).toBe(5);
  });

  it('exposes summary metadata', () => {
    writeSaveGame(sampleSave());
    const summary = getSaveSummary();
    expect(summary?.dayIndex).toBe(3);
    expect(summary?.gameOver).toBe(false);
  });

  it('rejects unknown schema versions', () => {
    localStorage.setItem(
      'wasteland-stack-cards.save',
      JSON.stringify({ ...sampleSave(), version: 99 }),
    );
    expect(readSaveGame()).toBeNull();
  });
});
