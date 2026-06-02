import Phaser from 'phaser';

import GameCard from '../objects/GameCard';
import type { CardDropResult } from './CardDragSystem';
import type { CardStack, CardStackSystem } from './CardStackSystem';

/** Switches configured cards between card face (drag) and world sprite (placed). */
export class PlacedVisualSystem {
  private readonly dragging = new Set<GameCard>();

  constructor(
    scene: Phaser.Scene,
    private readonly stacks: CardStackSystem,
  ) {
    scene.events.on('card-spawned', (card: GameCard) => this.refreshCard(card));
    scene.events.on('card-drag-start', ({ cards }: { cards: GameCard[] }) => {
      for (const card of cards) this.dragging.add(card);
      this.refreshCards(cards);
    });
    scene.events.on(
      'card-drag-end',
      ({ cards }: { cards: GameCard[]; result: CardDropResult }) => {
        for (const card of cards) this.dragging.delete(card);
        this.refreshCards(cards);
      },
    );
    scene.events.on('stack-changed', (stack: CardStack) => {
      this.refreshCard(stack.base);
      for (const member of stack.members) this.refreshCard(member);
    });
    scene.events.once(Phaser.Scenes.Events.SHUTDOWN, () => this.dragging.clear());

    for (const child of scene.children.list) {
      if (child instanceof GameCard) this.refreshCard(child);
    }
  }

  private refreshCards(cards: GameCard[]): void {
    for (const card of cards) this.refreshCard(card);
  }

  private refreshCard(card: GameCard): void {
    if (!card.hasPlacedVisual() || !card.active || !card.scene) return;

    const stack = this.stacks.getStackAt(card);
    const isBase = !stack || stack.base === card;
    const shouldPlace = !this.dragging.has(card) && isBase;

    card.setDisplayMode(shouldPlace ? 'placed' : 'card');
  }
}
