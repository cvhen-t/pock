import { isStorageMember, markWarehouseMember } from '../storageInventory';
import {
  SORT_FILTER_KEY,
  SORT_MODE_KEY,
  SORT_WEIGHT_KEY,
  setSortFilterCardId,
  setSortMode,
  type SortModeId,
} from '../sortHandRules';
import type GameCard from '../../objects/GameCard';
import type { CardStack } from '../../systems/CardStackSystem';
import type { BlueprintStack } from '../../systems/ActionBarStackSystem';
import type { BarrierSystem } from '../../systems/BarrierSystem';
import { REGISTRY, SECONDS_PER_DAY } from '../../config/gameConfig';
import type { BaseCampSystem } from '../../systems/BaseCampSystem';
import type { HandInventory } from '../HandInventory';
import type TopHud from '../../ui/TopHud';
import type { ResourceSnapshot } from '../../ui/TopHud';
import {
  SAVE_SCHEMA_VERSION,
  type GameSaveFile,
  type SavedCardExtras,
  type SavedCardSnapshot,
} from './saveTypes';

const WORKSITE_DEPLETED_KEY = 'worksiteDepleted';

export interface SaveCollectContext {
  scene: Phaser.Scene;
  stacks: { getAllStacks(): CardStack[] };
  blueprintStacks: { getAllStacks(): BlueprintStack[] };
  resources: ResourceSnapshot;
  topHud: TopHud;
  backpack: HandInventory;
  baseCamp: BaseCampSystem;
  barriers: BarrierSystem;
  gameOver: boolean;
}

function snapshotCard(card: GameCard, barrierHp?: { hp: number; maxHp: number }): SavedCardSnapshot {
  const extras: SavedCardExtras = {};
  if (isStorageMember(card)) extras.storageMember = true;

  const sortMode = card.getData(SORT_MODE_KEY) as SortModeId | undefined;
  if (sortMode) extras.sortMode = sortMode;

  const sortFilter = card.getData(SORT_FILTER_KEY) as string | null | undefined;
  if (sortFilter) extras.sortFilter = sortFilter;

  const sortWeight = card.getData(SORT_WEIGHT_KEY) as number | undefined;
  if (sortWeight != null) extras.sortWeight = sortWeight;

  if (card.getData(WORKSITE_DEPLETED_KEY) === true) extras.worksiteDepleted = true;

  if (barrierHp) {
    extras.barrierHp = barrierHp.hp;
    extras.barrierMaxHp = barrierHp.maxHp;
  }

  const snap: SavedCardSnapshot = {
    cardId: card.definition.id,
    x: card.x,
    y: card.y,
    qty: card.quantity,
    orientation: card.orientation,
  };

  if (card.getDisplayMode() === 'placed') snap.displayMode = 'placed';
  if (Object.keys(extras).length > 0) snap.extras = extras;

  return snap;
}

export function buildSaveFile(ctx: SaveCollectContext): GameSaveFile {
  const barrierByCard = new Map<GameCard, { hp: number; maxHp: number }>();
  for (const entry of ctx.barriers.collectSaveEntries()) {
    barrierByCard.set(entry.card, { hp: entry.hp, maxHp: entry.maxHp });
  }

  const blueprintCards = new Set<GameCard>();
  for (const bp of ctx.blueprintStacks.getAllStacks()) {
    blueprintCards.add(bp.base);
    for (const m of bp.members) blueprintCards.add(m);
  }

  const boardStacks = ctx.stacks
    .getAllStacks()
    .filter((s) => !blueprintCards.has(s.base))
    .map((stack) => ({
      stackId: stack.id,
      base: snapshotCard(stack.base, barrierByCard.get(stack.base)),
      members: stack.members.map((m) => snapshotCard(m, barrierByCard.get(m))),
    }));

  const blueprintStacks = ctx.blueprintStacks.getAllStacks().map((stack) => ({
    base: snapshotCard(stack.base),
    members: stack.members.map((m) => snapshotCard(m)),
  }));

  const dayIndex = (ctx.scene.registry.get(REGISTRY.DAY_INDEX) as number) ?? 1;
  const dayRemaining = ctx.topHud.getDayRemaining();

  let base: GameSaveFile['base'];
  if (ctx.baseCamp.isActive || ctx.baseCamp.getSaveDestroyed()) {
    const hp = ctx.baseCamp.getHp();
    base = {
      hp: hp.hp,
      maxHp: hp.maxHp,
      destroyed: ctx.baseCamp.getSaveDestroyed(),
    };
  }

  return {
    version: SAVE_SCHEMA_VERSION,
    savedAt: new Date().toISOString(),
    dayIndex,
    dayRemaining,
    speedLevel: ctx.topHud.getSpeedLevel(),
    resources: { ...ctx.resources },
    base,
    gameOver: ctx.gameOver,
    backpack: ctx.backpack.getSlots().map((s) => ({
      cardId: s.cardId,
      count: s.count,
      order: s.order,
    })),
    blueprintStacks,
    boardStacks,
  };
}

export function applyCardExtras(card: GameCard, extras?: SavedCardExtras): void {
  if (!extras) return;
  if (extras.storageMember) markWarehouseMember(card);
  if (extras.sortMode) setSortMode(card, extras.sortMode);
  if (extras.sortFilter) setSortFilterCardId(card, extras.sortFilter);
  if (extras.sortWeight != null) card.setData(SORT_WEIGHT_KEY, extras.sortWeight);
  if (extras.worksiteDepleted) card.setData(WORKSITE_DEPLETED_KEY, true);
}

/** Restore registry day fields before HUD day cycle starts. */
export function applyMetaToRegistry(scene: Phaser.Scene, save: GameSaveFile): void {
  scene.registry.set(REGISTRY.DAY_INDEX, save.dayIndex);
  scene.registry.set(REGISTRY.DAY_SECONDS, SECONDS_PER_DAY);
  scene.registry.set(REGISTRY.DAY_REMAINING, save.dayRemaining);
}
