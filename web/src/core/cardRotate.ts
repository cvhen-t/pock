import type GameCard from '../objects/GameCard';
import type { CardStack } from '../systems/CardStackSystem';

/** Solo defense / facility cards with slim or wide shape can rotate 90°. */
const ROTATABLE_SHAPES = new Set(['slim', 'wide']);

export function canRotateBoardCard(stack: CardStack, card: GameCard): boolean {
  if (stack.members.length > 0) return false;
  if (stack.base !== card) return false;
  const tags = card.definition.tags ?? [];
  if (tags.includes('base')) return false;
  if (!tags.includes('defense') && !tags.includes('building')) return false;
  const shape = card.definition.shape ?? 'standard';
  return ROTATABLE_SHAPES.has(shape);
}
