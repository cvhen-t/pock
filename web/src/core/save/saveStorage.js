import { SAVE_SCHEMA_VERSION, SAVE_STORAGE_KEY, } from './saveTypes';
export function hasSaveGame() {
    return readSaveGame() !== null;
}
export function readSaveGame() {
    try {
        const raw = localStorage.getItem(SAVE_STORAGE_KEY);
        if (!raw)
            return null;
        const parsed = JSON.parse(raw);
        if (parsed.version !== SAVE_SCHEMA_VERSION)
            return null;
        if (!parsed.savedAt || !Array.isArray(parsed.boardStacks))
            return null;
        return parsed;
    }
    catch {
        return null;
    }
}
export function writeSaveGame(save) {
    localStorage.setItem(SAVE_STORAGE_KEY, JSON.stringify(save));
}
export function clearSaveGame() {
    localStorage.removeItem(SAVE_STORAGE_KEY);
}
export function getSaveSummary() {
    const save = readSaveGame();
    if (!save)
        return null;
    return {
        dayIndex: save.dayIndex,
        savedAt: save.savedAt,
        gameOver: save.gameOver,
    };
}
export function formatSaveTimestamp(iso) {
    const d = new Date(iso);
    if (Number.isNaN(d.getTime()))
        return '';
    const pad = (n) => String(n).padStart(2, '0');
    return `${d.getMonth() + 1}/${d.getDate()} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}
