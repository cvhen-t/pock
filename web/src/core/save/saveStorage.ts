import {
  SAVE_SCHEMA_VERSION,
  SAVE_STORAGE_KEY,
  type GameSaveFile,
  type SaveSlotSummary,
} from './saveTypes';

export function hasSaveGame(): boolean {
  return readSaveGame() !== null;
}

export function readSaveGame(): GameSaveFile | null {
  try {
    const raw = localStorage.getItem(SAVE_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as GameSaveFile;
    if (parsed.version !== SAVE_SCHEMA_VERSION) return null;
    if (!parsed.savedAt || !Array.isArray(parsed.boardStacks)) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function writeSaveGame(save: GameSaveFile): void {
  localStorage.setItem(SAVE_STORAGE_KEY, JSON.stringify(save));
}

export function clearSaveGame(): void {
  localStorage.removeItem(SAVE_STORAGE_KEY);
}

export function getSaveSummary(): SaveSlotSummary | null {
  const save = readSaveGame();
  if (!save) return null;
  return {
    dayIndex: save.dayIndex,
    savedAt: save.savedAt,
    gameOver: save.gameOver,
  };
}

export function formatSaveTimestamp(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getMonth() + 1}/${d.getDate()} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}
