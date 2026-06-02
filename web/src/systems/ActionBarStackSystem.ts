import Phaser from 'phaser';

import { CARD_DROP_RADIUS, STACK_SNAP } from '../config/cardLayout';
import type GameCard from '../objects/GameCard';
import type { CardStackSystem } from './CardStackSystem';

export interface BlueprintStack {
  id: string;
  base: GameCard;
  members: GameCard[];
}

/**
 * Free-form blueprint piles in the bottom action bar (screen-space, no gameplay effects).
 */
export class ActionBarStackSystem {
  private stacks = new Map<string, BlueprintStack>();

  private nextId = 1;

  constructor(private readonly boardStacks: CardStackSystem) {}

  getAllStacks(): BlueprintStack[] {
    return [...this.stacks.values()];
  }

  getAllCards(): GameCard[] {
    const out: GameCard[] = [];
    for (const stack of this.stacks.values()) {
      out.push(stack.base, ...stack.members);
    }
    return out;
  }

  findStackOf(card: GameCard): BlueprintStack | undefined {
    for (const stack of this.stacks.values()) {
      if (stack.base === card || stack.members.includes(card)) return stack;
    }
    return undefined;
  }

  getTopCard(stack: BlueprintStack): GameCard {
    return stack.members.length > 0 ? stack.members[stack.members.length - 1]! : stack.base;
  }

  pileCards(stack: BlueprintStack): GameCard[] {
    return [stack.base, ...stack.members];
  }

  registerBase(card: GameCard, x: number, y: number): string {
    this.removeCard(card);
    const id = `bp_${this.nextId++}`;
    card.x = x;
    card.y = y;
    this.stacks.set(id, { id, base: card, members: [] });
    return id;
  }

  tryStack(dragged: GameCard, target: GameCard): boolean {
    if (dragged === target) return false;
    if (!this.boardStacks.wouldAcceptStack(dragged, target)) return false;

    const targetStack = this.findStackOf(target);
    if (!targetStack) return false;

    const dragStack = this.findStackOf(dragged);
    if (dragStack?.base === dragged && dragStack.members.length > 0) {
      return false;
    }

    this.detach(dragged);
    targetStack.members.push(dragged);
    this.layoutStack(targetStack);
    return true;
  }

  detach(card: GameCard): void {
    const stack = this.findStackOf(card);
    if (!stack) return;

    if (stack.base === card) {
      if (stack.members.length === 0) {
        this.stacks.delete(stack.id);
      } else {
        const [newBase, ...rest] = stack.members;
        stack.base = newBase;
        stack.members = rest;
      }
    } else {
      stack.members = stack.members.filter((c) => c !== card);
    }

    if (this.stacks.has(stack.id)) {
      this.layoutStack(stack);
    }
  }

  layoutStack(stack: BlueprintStack): void {
    const snap = STACK_SNAP * 0.55;
    let offsetY = -snap;
    for (let i = 0; i < stack.members.length; i++) {
      const member = stack.members[i]!;
      member.x = stack.base.x;
      member.y = stack.base.y + offsetY;
      member.setDepth(stack.base.depth + i + 1);
      offsetY -= snap;
    }
  }

  getPileBounds(stack: BlueprintStack): Phaser.Geom.Rectangle {
    const top = this.getTopCard(stack);
    const pile = this.pileCards(stack);
    const maxW = Math.max(...pile.map((c) => c.displayWidth));
    const baseH = stack.base.displayHeight;
    const topH = top.displayHeight;
    const left = stack.base.x - maxW / 2;
    const topEdge = top.y - topH / 2;
    const height = Math.max(baseH, stack.base.y + baseH / 2 - topEdge);
    return new Phaser.Geom.Rectangle(left, topEdge, maxW, height);
  }

  hitCard(
    sx: number,
    sy: number,
    barX: number,
    barY: number,
    exclude?: GameCard,
  ): GameCard | undefined {
    const lx = sx - barX;
    const ly = sy - barY;

    for (const stack of this.stacks.values()) {
      if (this.getPileBounds(stack).contains(lx, ly)) {
        const top = this.getTopCard(stack);
        if (top !== exclude) return top;
      }
    }

    let best: GameCard | undefined;
    let bestDist = Infinity;
    for (const card of this.getAllCards()) {
      if (card === exclude) continue;
      const hw = card.displayWidth / 2;
      const hh = card.displayHeight / 2;
      if (lx >= card.x - hw && lx <= card.x + hw && ly >= card.y - hh && ly <= card.y + hh) {
        const dist = Phaser.Math.Distance.Between(lx, ly, card.x, card.y);
        if (dist < bestDist) {
          bestDist = dist;
          best = card;
        }
      }
    }
    return best;
  }

  findCardUnder(
    lx: number,
    ly: number,
    exclude?: GameCard,
  ): GameCard | undefined {
    let best: GameCard | undefined;
    let bestDist = Infinity;
    for (const card of this.getAllCards()) {
      if (card === exclude) continue;
      const dist = Phaser.Math.Distance.Between(lx, ly, card.x, card.y);
      if (dist < CARD_DROP_RADIUS && dist < bestDist) {
        bestDist = dist;
        best = card;
      }
    }
    return best;
  }

  removeCard(card: GameCard): void {
    this.detach(card);
  }

  clearStack(stack: BlueprintStack): GameCard[] {
    const cards = this.pileCards(stack);
    this.stacks.delete(stack.id);
    return cards;
  }
}
