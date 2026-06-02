import Phaser from 'phaser';

import { isHudTapPickupCard } from '../core/cardPickup';
import GameCard from '../objects/GameCard';

export interface ResourcePickupEvent {
  food: number;
  water: number;
  caps: number;
}

/**
 * Tap a solo water card (no drag) to collect into the resource bar.
 * Food / currency cards stay on the board for facility interactions.
 */
export class ResourcePickupSystem {
  constructor(
    private readonly scene: Phaser.Scene,
    private readonly onCollect: (delta: ResourcePickupEvent, card: GameCard) => void,
  ) {
    scene.input.on('pointerup', this.onPointerUp, this);
    scene.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      scene.input.off('pointerup', this.onPointerUp, this);
    });
  }

  private onPointerUp(pointer: Phaser.Input.Pointer): void {
    if (!pointer.wasTouch && pointer.button !== 0) return;

    const wx = pointer.worldX;
    const wy = pointer.worldY;

    const card = this.findPickupCard(wx, wy);
    if (!card) return;

    if (!isHudTapPickupCard(card.definition)) return;

    const delta: ResourcePickupEvent = { food: 0, water: 0, caps: 0 };
    delta.water = 1;

    this.onCollect(delta, card);
    this.scene.events.emit('card-removed', card);
    card.destroy();
    this.scene.events.emit('resource-collected', { cardId: card.definition.id, delta });
  }

  private findPickupCard(wx: number, wy: number): GameCard | undefined {
    const cards = this.scene.children.list.filter((c): c is GameCard => {
      if (!(c instanceof GameCard)) return false;
      return isHudTapPickupCard(c.definition);
    });

    let best: GameCard | undefined;
    let bestDepth = -1;

    for (const card of cards) {
      if (
        wx < card.x - card.cardWidth / 2 ||
        wx > card.x + card.cardWidth / 2 ||
        wy < card.y - card.cardHeight / 2 ||
        wy > card.y + card.cardHeight / 2
      ) {
        continue;
      }
      if (card.depth > bestDepth) {
        bestDepth = card.depth;
        best = card;
      }
    }

    return best;
  }
}
