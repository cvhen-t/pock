import Phaser from 'phaser';

import GameCard, { boardDepthFromY } from '../objects/GameCard';
import type { CardDragSystem } from '../systems/CardDragSystem';
import type { CardStackSystem } from '../systems/CardStackSystem';
import { clampCardCenter } from '../ui/playfieldClamp';
import { dataStore } from './DataStore';

export class CardSpawner {
  constructor(
    private readonly scene: Phaser.Scene,
    private readonly stacks: CardStackSystem,
    private readonly drag: CardDragSystem,
  ) {}

  spawn(cardId: string, x: number, y: number): GameCard | null {
    const def = dataStore.getCard(cardId);
    if (!def) {
      console.warn('Unknown card:', cardId);
      return null;
    }

    const card = new GameCard(this.scene, x, y, def);
    const pf = this.scene.registry.get('playfield') as Phaser.Geom.Rectangle | undefined;
    if (pf) {
      clampCardCenter(pf, card);
    }
    card.setDepth(boardDepthFromY(card.y));
    this.stacks.registerBase(card);
    this.drag.registerCard(card);
    this.scene.events.emit('card-spawned', card);
    return card;
  }

  spawnToHand(cardId: string): boolean {
    const def = dataStore.getCard(cardId);
    if (!def) {
      console.warn('Unknown card:', cardId);
      return false;
    }
    this.scene.events.emit('hand-add', { cardId });
    return true;
  }
}
