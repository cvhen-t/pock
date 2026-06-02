import Phaser from 'phaser';

import { isPlayerWarehouseCard } from '../core/storageInventory';
import GameCard from '../objects/GameCard';
import type { CardStackSystem } from './CardStackSystem';

/** 储物棚：单击打开仓储面板 */
export class StorageBuildingSystem {
  constructor(
    private readonly scene: Phaser.Scene,
    private readonly stacks: CardStackSystem,
  ) {
    scene.events.on('board-card-tap', this.onCardTap, this);
    scene.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      scene.events.off('board-card-tap', this.onCardTap, this);
    });
  }

  private onCardTap = ({ card }: { card: GameCard }): void => {
    const warehouse = this.resolveWarehouse(card);
    if (!warehouse) return;
    this.scene.events.emit('storage-panel-open', { card: warehouse });
  };

  private resolveWarehouse(card: GameCard): GameCard | null {
    if (this.isWarehouseBuilding(card)) return card;
    const stack = card.stackId ? this.stacks.getStackAt(card) : undefined;
    if (stack && this.isWarehouseBuilding(stack.base)) return stack.base;
    return null;
  }

  isWarehouseBuilding(card: GameCard): boolean {
    if (!isPlayerWarehouseCard(card)) return false;
    const stack = card.stackId ? this.stacks.getStackAt(card) : undefined;
    if (stack && stack.base !== card) return false;
    return true;
  }
}
