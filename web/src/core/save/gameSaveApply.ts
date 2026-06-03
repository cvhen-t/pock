import { boardDepthFromY } from '../../objects/GameCard';
import GameCard from '../../objects/GameCard';
import type { CardDragSystem } from '../../systems/CardDragSystem';
import type { CardStackSystem } from '../../systems/CardStackSystem';
import type { ActionBarStackSystem } from '../../systems/ActionBarStackSystem';
import type { BaseCampSystem } from '../../systems/BaseCampSystem';
import type { BarrierSystem } from '../../systems/BarrierSystem';
import { dataStore } from '../DataStore';
import type { ResourceSnapshot } from '../../ui/TopHud';
import { applyCardExtras, applyMetaToRegistry } from './gameSaveCodec';
import type { GameSaveFile, SavedBlueprintStack, SavedBoardStack, SavedCardSnapshot } from './saveTypes';

export interface SaveApplyContext {
  scene: Phaser.Scene;
  stacks: CardStackSystem;
  drag: CardDragSystem;
  blueprintStacks: ActionBarStackSystem;
  baseCamp: BaseCampSystem;
  barriers: BarrierSystem;
  resources: ResourceSnapshot;
}

function spawnSnapshotCard(
  ctx: SaveApplyContext,
  snap: SavedCardSnapshot,
): GameCard | null {
  const def = dataStore.getCard(snap.cardId);
  if (!def) return null;

  const card = new GameCard(ctx.scene, snap.x, snap.y, def);
  if (snap.qty > 1) card.setQuantity(snap.qty);
  if (snap.orientation === 1 && card.orientation === 0) {
    card.toggleRotation();
  }
  if (snap.displayMode === 'placed' && card.hasPlacedVisual()) {
    card.setDisplayMode('placed');
  }
  applyCardExtras(card, snap.extras);

  card.setDepth(boardDepthFromY(snap.y));
  ctx.drag.registerCard(card);
  ctx.scene.events.emit('card-spawned', card);
  return card;
}

function restoreBoardStack(ctx: SaveApplyContext, saved: SavedBoardStack): void {
  const base = spawnSnapshotCard(ctx, saved.base);
  if (!base) return;

  base.stackId = saved.stackId;
  const stack = { id: saved.stackId, base, members: [] as GameCard[] };
  ctx.stacks.importStack(stack);

  for (const memberSnap of saved.members) {
    const member = spawnSnapshotCard(ctx, memberSnap);
    if (!member) continue;
    member.stackId = saved.stackId;
    stack.members.push(member);
  }

  ctx.stacks.layoutStack(stack);
  ctx.scene.events.emit('stack-changed', stack);

  if (saved.base.extras?.barrierHp != null && saved.base.extras.barrierMaxHp != null) {
    ctx.barriers.applySaveHp(base, saved.base.extras.barrierHp, saved.base.extras.barrierMaxHp);
  }
  for (let i = 0; i < saved.members.length; i++) {
    const extras = saved.members[i]?.extras;
    const member = stack.members[i];
    if (member && extras?.barrierHp != null && extras.barrierMaxHp != null) {
      ctx.barriers.applySaveHp(member, extras.barrierHp, extras.barrierMaxHp);
    }
  }
}

function restoreBlueprintStack(ctx: SaveApplyContext, saved: SavedBlueprintStack): void {
  const base = spawnSnapshotCard(ctx, saved.base);
  if (!base) return;

  ctx.stacks.removeCardFromPlay(base);
  const stackId = ctx.blueprintStacks.registerBase(base, saved.base.x, saved.base.y);
  const stack = ctx.blueprintStacks.getAllStacks().find((s) => s.id === stackId);
  if (!stack) return;

  for (const memberSnap of saved.members) {
    const member = spawnSnapshotCard(ctx, memberSnap);
    if (!member) continue;
    ctx.stacks.removeCardFromPlay(member);
    stack.members.push(member);
  }
  ctx.blueprintStacks.layoutStack(stack);
}

export function applySaveFile(ctx: SaveApplyContext, save: GameSaveFile): void {
  applyMetaToRegistry(ctx.scene, save);

  ctx.resources.food = save.resources.food;
  ctx.resources.water = save.resources.water;
  ctx.resources.caps = save.resources.caps;

  for (const stack of save.boardStacks) {
    restoreBoardStack(ctx, stack);
  }

  for (const bp of save.blueprintStacks) {
    restoreBlueprintStack(ctx, bp);
  }

  if (save.base) {
    ctx.baseCamp.applySaveState(save.base);
  }
}

export type { GameSaveFile };
