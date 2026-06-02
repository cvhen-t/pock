import type { CardDefinition } from '../types/gameData';

/** Survival supplies are deposited by dragging onto the base camp, not tap pickup. */
export function isHudTapPickupCard(_def: CardDefinition): boolean {
  return false;
}

export function isBaseSupplyCard(def: CardDefinition): boolean {
  const tags = def.tags ?? [];
  return tags.includes('food') || tags.includes('water');
}
