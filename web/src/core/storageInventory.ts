import { isQuantityStackable } from './cardQuantity';
import { dataStore } from './DataStore';
import type { CardStackSystem } from '../systems/CardStackSystem';
import type { CardSpawner } from './CardSpawner';
import type { CardDragSystem } from '../systems/CardDragSystem';
import type GameCard from '../objects/GameCard';

const STORAGE_MEMBER_KEY = 'storageMember';

const WAREHOUSE_BLOCKED_TAGS = ['survivor', 'shop', 'enemy', 'base', 'building'] as const;

/** 储物棚可存入的卡牌（除人物/商店/敌人/本营/建筑外均可） */
export function isWarehouseStorable(tags: string[]): boolean {
  return !WAREHOUSE_BLOCKED_TAGS.some((t) => tags.includes(t));
}

export function isAutoDepotCard(card: GameCard): boolean {
  return (card.definition.tags ?? []).includes('logistics_depot');
}

export function isPlayerWarehouseCard(card: GameCard): boolean {
  return (card.definition.effects ?? []).some((e) => e.type === 'warehouse');
}

export function isStorageMember(card: GameCard): boolean {
  return card.getData(STORAGE_MEMBER_KEY) === true;
}

export function markWarehouseMember(card: GameCard): void {
  card.setData(STORAGE_MEMBER_KEY, true);
  card.visible = false;
}

export function getDepotCapacity(base: GameCard): number {
  const effect = base.definition.effects?.find((e) => e.type === 'auto_storage');
  return Number((effect as { maxStored?: number } | undefined)?.maxStored ?? 16);
}

export function getPlayerWarehouseCapacity(base: GameCard): number {
  const effect = base.definition.effects?.find((e) => e.type === 'warehouse');
  return Number((effect as { maxStored?: number } | undefined)?.maxStored ?? 8);
}

export function getStorageCapacity(base: GameCard): number {
  if (isPlayerWarehouseCard(base)) return getPlayerWarehouseCapacity(base);
  return getDepotCapacity(base);
}

export function countStoredQuantity(stack: { members: GameCard[] }): number {
  let n = 0;
  for (const m of stack.members) n += m.quantity;
  return n;
}

export function storageHasRoom(
  stack: { base: GameCard; members: GameCard[] },
  addQty = 1,
): boolean {
  return countStoredQuantity(stack) + addQty <= getStorageCapacity(stack.base);
}

export interface StorageEntry {
  cardId: string;
  qty: number;
}

export function getWarehouseInventory(stack: { members: GameCard[] }): StorageEntry[] {
  const map = new Map<string, number>();
  for (const m of stack.members) {
    map.set(m.definition.id, (map.get(m.definition.id) ?? 0) + m.quantity);
  }
  return [...map.entries()]
    .map(([cardId, qty]) => ({ cardId, qty }))
    .sort((a, b) => {
      const da = dataStore.getCard(a.cardId);
      const db = dataStore.getCard(b.cardId);
      return (da?.name ?? a.cardId).localeCompare(db?.name ?? b.cardId, 'zh');
    });
}

export function deliverToAutoDepot(
  stacks: CardStackSystem,
  spawner: CardSpawner,
  drag: CardDragSystem,
  depotBase: GameCard,
  cardId: string,
  qty = 1,
): boolean {
  const stack = stacks.getStackAt(depotBase);
  if (!stack || !storageHasRoom(stack, qty)) return false;

  const existing = stack.members.find((m) => m.definition.id === cardId);
  if (existing && isQuantityStackable(existing.definition)) {
    existing.addQuantity(qty);
    stacks.layoutStack(stack);
    depotBase.scene.events.emit('stack-changed', stack);
    return true;
  }

  const card = spawner.spawn(cardId, depotBase.x, depotBase.y - 8, qty);
  if (!card) return false;
  stacks.removeCardFromPlay(card);
  markWarehouseMember(card);
  stack.members.push(card);
  card.stackId = stack.id;
  stacks.layoutStack(stack);
  drag.registerCard(card);
  depotBase.scene.events.emit('stack-changed', stack);
  return true;
}

export function pullFromWarehouse(
  stacks: CardStackSystem,
  warehouseBase: GameCard,
  cardId: string,
  qty = 1,
): number {
  const stack = stacks.getStackAt(warehouseBase);
  if (!stack) return 0;
  const member = stack.members.find((m) => m.definition.id === cardId);
  if (!member) return 0;
  const take = Math.min(qty, member.quantity);
  if (take <= 0) return 0;

  if (member.quantity > take) {
    member.setQuantity(member.quantity - take);
  } else {
    stack.members = stack.members.filter((m) => m !== member);
    member.stackId = null;
    member.destroy();
  }
  stacks.layoutStack(stack);
  warehouseBase.scene.events.emit('stack-changed', stack);
  return take;
}

export function pullFromAutoDepot(
  stacks: CardStackSystem,
  depotBase: GameCard,
  cardId: string,
  qty = 1,
): boolean {
  return pullFromWarehouse(stacks, depotBase, cardId, qty) > 0;
}
