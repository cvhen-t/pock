import Phaser from 'phaser';

import GameCard from '../objects/GameCard';
import type { CardStackSystem } from './CardStackSystem';

/**
 * Shop building on the board: tap opens trade UI; drag cards onto it to sell.
 */
export class ShopBuildingSystem {
  constructor(
    private readonly scene: Phaser.Scene,
    private readonly stacks: CardStackSystem,
  ) {
    scene.events.on('board-card-tap', this.onCardTap, this);
    scene.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      scene.events.off('board-card-tap', this.onCardTap, this);
    });
  }

  private onCardTap({ card }: { card: GameCard }): void {
    const shop = this.resolveShopBuilding(card);
    if (!shop) return;
    this.scene.events.emit('shop-trade-open', { card: shop });
  }

  /** Tapped card may be stacked on top of the shop building. */
  private resolveShopBuilding(card: GameCard): GameCard | null {
    if (this.isShopBuilding(card)) return card;
    const stack = card.stackId ? this.stacks.getStackAt(card) : undefined;
    if (stack && this.isShopBuilding(stack.base)) return stack.base;
    return null;
  }

  /** Screen coords (HUD / pointer.x). */
  findShopAtScreen(sx: number, sy: number): GameCard | null {
    const cam = this.scene.cameras.main;
    const wx = cam.scrollX + sx / cam.zoom;
    const wy = cam.scrollY + sy / cam.zoom;
    return this.findShopAtWorld(wx, wy);
  }

  /** World / playfield coords. */
  findShopAtWorld(wx: number, wy: number, exclude?: GameCard): GameCard | null {
    let best: GameCard | null = null;
    let bestDepth = -1;

    for (const stack of this.stacks.getAllStacks()) {
      const base = stack.base;
      if (exclude && base === exclude) continue;
      if (!this.isShopBuilding(base)) continue;
      if (!this.cardContainsWorld(base, wx, wy)) continue;
      if (base.depth > bestDepth) {
        bestDepth = base.depth;
        best = base;
      }
    }

    return best;
  }

  /** Shop under a dragged card (overlap), not only when centers align. */
  findShopForSell(dragged: GameCard): GameCard | null {
    let best: GameCard | null = null;
    let bestDepth = -1;

    for (const stack of this.stacks.getAllStacks()) {
      const shop = stack.base;
      if (shop === dragged) continue;
      if (!this.isShopBuilding(shop)) continue;
      if (!this.cardsOverlap(dragged, shop)) continue;
      if (shop.depth > bestDepth) {
        bestDepth = shop.depth;
        best = shop;
      }
    }

    return best;
  }

  isShopBuilding(card: GameCard): boolean {
    const tags = card.definition.tags ?? [];
    if (!tags.includes('shop')) return false;

    const stack = card.stackId ? this.stacks.getStackAt(card) : undefined;
    if (stack && stack.base !== card) return false;

    return true;
  }

  private cardContainsWorld(card: GameCard, wx: number, wy: number): boolean {
    const hw = card.cardWidth / 2;
    const hh = card.cardHeight / 2;
    return (
      wx >= card.x - hw &&
      wx <= card.x + hw &&
      wy >= card.y - hh &&
      wy <= card.y + hh
    );
  }

  private cardsOverlap(a: GameCard, b: GameCard): boolean {
    const dx = Math.abs(a.x - b.x);
    const dy = Math.abs(a.y - b.y);
    return (
      dx < (a.cardWidth + b.cardWidth) / 2 &&
      dy < (a.cardHeight + b.cardHeight) / 2
    );
  }
}
