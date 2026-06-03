import type { CardDisplayMode } from '../../objects/GameCard';
import type { ResourceSnapshot } from '../../ui/TopHud';
import type { SortModeId } from '../sortHandRules';

export const SAVE_SCHEMA_VERSION = 1;

export const SAVE_STORAGE_KEY = 'wasteland-stack-cards.save';

export interface SavedHandSlot {
  cardId: string;
  count: number;
  order: number;
}

export interface SavedCardExtras {
  storageMember?: boolean;
  sortMode?: SortModeId;
  sortFilter?: string | null;
  sortWeight?: number;
  worksiteDepleted?: boolean;
  barrierHp?: number;
  barrierMaxHp?: number;
}

export interface SavedCardSnapshot {
  cardId: string;
  x: number;
  y: number;
  qty: number;
  orientation: number;
  displayMode?: CardDisplayMode;
  extras?: SavedCardExtras;
}

export interface SavedBoardStack {
  stackId: string;
  base: SavedCardSnapshot;
  members: SavedCardSnapshot[];
}

export interface SavedBlueprintStack {
  base: SavedCardSnapshot;
  members: SavedCardSnapshot[];
}

export interface SavedBaseCamp {
  hp: number;
  maxHp: number;
  destroyed: boolean;
}

export interface GameSaveFile {
  version: number;
  savedAt: string;
  dayIndex: number;
  dayRemaining: number;
  speedLevel: number;
  resources: ResourceSnapshot;
  base?: SavedBaseCamp;
  gameOver: boolean;
  backpack: SavedHandSlot[];
  blueprintStacks: SavedBlueprintStack[];
  boardStacks: SavedBoardStack[];
}

export interface SaveSlotSummary {
  dayIndex: number;
  savedAt: string;
  gameOver: boolean;
}
