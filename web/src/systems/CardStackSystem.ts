import Phaser from 'phaser';

import {
  CARD_DROP_RADIUS,
  STACK_HIT_RADIUS,
  STACK_SNAP,
} from '../config/cardLayout';
import { isQuantityMergePair, isQuantityStackable } from '../core/cardQuantity';
import GameCard, { boardDepthFromY } from '../objects/GameCard';

export { STACK_SNAP } from '../config/cardLayout';

export interface CardStack {
  id: string;
  base: GameCard;
  members: GameCard[];
}

/**
 * Stack data + layout. Pointer hit/drag lives in CardDragSystem.
 */
export class CardStackSystem {
  private stacks = new Map<string, CardStack>();

  private nextId = 1;

  constructor(private scene: Phaser.Scene) {}

  registerBase(card: GameCard): string {
    this.removeCardFromAllStacks(card);
    const id = `stack_${this.nextId++}`;
    card.stackId = id;
    const stack: CardStack = { id, base: card, members: [] };
    this.stacks.set(id, stack);
    return id;
  }

  getAllStacks(): CardStack[] {
    return [...this.stacks.values()];
  }

  getStackAt(card: GameCard): CardStack | undefined {
    if (!card.stackId) return undefined;
    return this.stacks.get(card.stackId);
  }

  containsCard(stack: CardStack, card: GameCard): boolean {
    return stack.base === card || stack.members.includes(card);
  }

  /**
   * Fix orphan stackIds / ghost members after many drag cycles.
   */
  reconcile(knownCards: Iterable<GameCard>): void {
    for (const stack of this.stacks.values()) {
      stack.members = stack.members.filter(
        (m) => m !== stack.base && m.stackId === stack.id,
      );
      if (stack.base.stackId !== stack.id) {
        stack.base.stackId = stack.id;
      }
    }

    for (const card of knownCards) {
      if (!card.stackId) continue;
      const stack = this.stacks.get(card.stackId);
      if (!stack || !this.containsCard(stack, card)) {
        card.stackId = null;
      }
    }

    for (const stack of [...this.stacks.values()]) {
      if (stack.members.length === 0 && stack.base.stackId !== stack.id) {
        this.stacks.delete(stack.id);
      }
    }
  }

  /** Valid stack for hit/drag; re-registers solo cards with no stack. */
  resolveStackForCard(card: GameCard): CardStack {
    const existing = this.getStackAt(card);
    if (existing && this.containsCard(existing, card)) {
      return existing;
    }

    card.stackId = null;
    this.removeCardFromAllStacks(card);
    const id = `stack_${this.nextId++}`;
    card.stackId = id;
    const stack: CardStack = { id, base: card, members: [] };
    this.stacks.set(id, stack);
    return stack;
  }

  private removeCardFromAllStacks(card: GameCard): void {
    for (const stack of this.stacks.values()) {
      if (stack.base === card) {
        if (stack.members.length === 0) {
          this.stacks.delete(stack.id);
          card.stackId = null;
        } else {
          const [newBase, ...rest] = stack.members;
          stack.base = newBase;
          stack.members = rest;
          newBase.stackId = stack.id;
          card.stackId = null;
        }
        continue;
      }
      if (stack.members.includes(card)) {
        stack.members = stack.members.filter((c) => c !== card);
      }
    }
  }

  getTopCard(stack: CardStack): GameCard {
    return stack.members.length > 0 ? stack.members[stack.members.length - 1]! : stack.base;
  }

  getPileBounds(stack: CardStack): Phaser.Geom.Rectangle {
    const top = this.getTopCard(stack);
    const pileCards = [stack.base, ...stack.members];
    const maxW = Math.max(...pileCards.map((c) => c.cardWidth));
    const baseH = stack.base.cardHeight;
    const topH = top.cardHeight;
    const left = stack.base.x - maxW / 2;
    const topEdge = top.y - topH / 2;
    const height = Math.max(baseH, stack.base.y + baseH / 2 - topEdge);
    return new Phaser.Geom.Rectangle(left, topEdge, maxW, height);
  }

  detachCardForDrag(card: GameCard): void {
    const stack = this.getStackAt(card);
    if (!stack || stack.base === card) return;

    stack.members = stack.members.filter((c) => c !== card);
    card.stackId = null;
    this.layoutStack(stack);
  }

  /** Remove a solo card from the board (not allowed if base still has members). */
  removeCardFromPlay(card: GameCard): boolean {
    const stack = this.getStackAt(card);
    if (stack?.base === card && stack.members.length > 0) {
      return false;
    }

    const prevStack = stack;
    this.removeCardFromAllStacks(card);
    card.stackId = null;

    if (prevStack && this.stacks.has(prevStack.id)) {
      this.layoutStack(prevStack);
      this.scene.events.emit('stack-changed', prevStack);
    } else if (prevStack) {
      this.scene.events.emit('stack-changed', prevStack);
    }

    return true;
  }

  /** Whether a drop would stack (read-only; does not mutate stacks). */
  wouldAcceptStack(dragged: GameCard, target: GameCard): boolean {
    if (dragged === target) return false;
    if (isQuantityMergePair(dragged, target)) return true;

    const targetStack = this.resolveStackForCard(target);
    const draggedStack = dragged.stackId ? this.stacks.get(dragged.stackId) : undefined;

    if (draggedStack && this.containsCard(draggedStack, dragged)) {
      if (draggedStack.base !== dragged) return false;
    }

    return this.isValidStackTarget(dragged, targetStack);
  }

  tryStack(dragged: GameCard, target: GameCard): boolean {
    if (dragged === target) return false;
    if (isQuantityMergePair(dragged, target)) {
      return this.mergeQuantityCards(dragged, target);
    }

    const targetStack = this.resolveStackForCard(target);
    const draggedStack = dragged.stackId ? this.stacks.get(dragged.stackId) : undefined;

    if (draggedStack && this.containsCard(draggedStack, dragged)) {
      if (draggedStack.base === dragged) {
        this.detachFromStack(dragged);
      } else {
        return false;
      }
    }

    if (!this.isValidStackTarget(dragged, targetStack)) {
      return false;
    }

    this.removeCardFromAllStacks(dragged);
    targetStack.members.push(dragged);
    dragged.stackId = targetStack.id;
    this.layoutStack(targetStack);
    this.scene.events.emit('stack-changed', targetStack);
    return true;
  }

  private detachFromStack(card: GameCard): void {
    const stack = card.stackId ? this.stacks.get(card.stackId) : undefined;
    if (!stack) {
      card.stackId = null;
      return;
    }

    if (stack.base === card) {
      if (stack.members.length === 0) {
        this.stacks.delete(stack.id);
        card.stackId = null;
        return;
      }
      const [newBase, ...rest] = stack.members;
      stack.base = newBase;
      stack.members = rest;
      newBase.stackId = stack.id;
      card.stackId = null;
    } else {
      stack.members = stack.members.filter((c) => c !== card);
      card.stackId = null;
    }
    this.layoutStack(stack);
  }

  private isValidStackTarget(dragged: GameCard, target: CardStack): boolean {
    const baseTags = target.base.definition.tags ?? [];
    const dragTags = dragged.definition.tags ?? [];

    if (dragTags.includes('survivor') && baseTags.includes('craft_station')) return false;
    if (dragTags.includes('survivor') && baseTags.includes('ranch')) return false;

    if (dragTags.includes('survivor') && baseTags.includes('base')) return true;
    if (dragged.definition.id === 'scrap' && baseTags.includes('base')) return true;
    if (dragTags.includes('food') && baseTags.includes('base')) return true;
    if (dragTags.includes('water') && baseTags.includes('base')) return true;
    if (dragged.definition.id === 'barbed_roll' && baseTags.includes('barrier')) return true;
    if (dragTags.includes('survivor') && baseTags.includes('worksite')) return true;

    if (dragTags.includes('mutant_seed') && baseTags.includes('blight_plot')) return true;
    if (
      dragTags.includes('seed') &&
      !dragTags.includes('mutant_seed') &&
      baseTags.includes('farmland')
    ) {
      return true;
    }

    if (baseTags.includes('craft_station') && isCraftStackInput(dragTags)) return true;

    if (baseTags.includes('ranch')) {
      if (dragTags.includes('feed')) return true;
      if (dragTags.includes('animal') && animalAcceptedByRanch(dragTags, target.base.definition)) {
        return true;
      }
      return false;
    }

  if (baseTags.includes('warehouse') && isStorableMaterial(dragTags)) return true;

  if (baseTags.includes('shop')) return false;

  if (dragTags.includes('weapon')) {
      const pile = [target.base, ...target.members];
      return pile.some((c) => (c.definition.tags ?? []).includes('survivor'));
    }

    const activation = target.base.definition.effects?.find(
      (e) => e.type === 'plant_activation',
    );
    if (
      activation &&
      dragged.definition.id === String(activation.consumeCardId ?? '')
    ) {
      const plantActivation = this.scene.registry.get('plantActivation') as
        | { canStackActivator(base: GameCard): boolean }
        | undefined;
      return plantActivation?.canStackActivator(target.base) ?? true;
    }

    if (isQuantityStackable(dragged.definition) || isQuantityStackable(target.base.definition)) {
      return false;
    }

    return Phaser.Math.Distance.Between(dragged.x, dragged.y, target.base.x, target.base.y) < STACK_HIT_RADIUS;
  }

  private mergeQuantityCards(dragged: GameCard, target: GameCard): boolean {
    const draggedStack = dragged.stackId ? this.stacks.get(dragged.stackId) : undefined;
    if (draggedStack && this.containsCard(draggedStack, dragged) && draggedStack.base !== dragged) {
      return false;
    }

    if (draggedStack?.base === dragged) {
      this.detachFromStack(dragged);
    } else {
      this.removeCardFromAllStacks(dragged);
    }

    target.addQuantity(dragged.quantity);
    dragged.stackId = null;
    this.scene.events.emit('card-removed', dragged);
    dragged.destroy();

    const targetStack = this.getStackAt(target);
    if (targetStack) {
      this.layoutStack(targetStack);
      this.scene.events.emit('stack-changed', targetStack);
    }
    return true;
  }

  layoutStack(stack: CardStack): void {
    stack.base.setDepth(boardDepthFromY(stack.base.y));
    const snap = STACK_SNAP;
    let offsetY = -snap;
    for (let i = 0; i < stack.members.length; i++) {
      const member = stack.members[i]!;
      member.x = stack.base.x;
      member.y = stack.base.y + offsetY;
      member.setDepth(stack.base.depth + i + 1);
      offsetY -= snap;
    }
  }

  findCardUnder(x: number, y: number, exclude?: GameCard): GameCard | undefined {
    const cards = this.scene.children.list.filter(
      (c): c is GameCard => c instanceof GameCard && c !== exclude,
    );
    let best: GameCard | undefined;
    let bestDist = Infinity;
    for (const card of cards) {
      const dist = Phaser.Math.Distance.Between(x, y, card.x, card.y);
      if (dist < CARD_DROP_RADIUS && dist < bestDist) {
        bestDist = dist;
        best = card;
      }
    }
    return best;
  }
}

const CRAFT_INPUT_TAGS = [
  'material_raw',
  'material',
  'material_refined',
  'food',
  'feed',
  'chemical',
  'water_raw',
  'water',
  'organic',
  'animal_product',
  'crop',
  'animal',
  'metal',
  'wood',
  'fiber',
  'soil',
  'seed',
] as const;

function isCraftStackInput(tags: string[]): boolean {
  if (tags.includes('survivor')) return false;
  return CRAFT_INPUT_TAGS.some((t) => tags.includes(t));
}

function isStorableMaterial(tags: string[]): boolean {
  return isCraftStackInput(tags);
}

function animalAcceptedByRanch(
  dragTags: string[],
  baseDef: { effects?: { type: string; acceptTags?: string[] }[] },
): boolean {
  const effect = baseDef.effects?.find((e) => e.type === 'ranch_pen');
  const accept = effect?.acceptTags ?? [];
  if (accept.length === 0) return true;
  return accept.some((t) => dragTags.includes(t));
}
