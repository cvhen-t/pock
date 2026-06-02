import Phaser from 'phaser';
import GameCard from '../objects/GameCard';
import { getLogisticsRole } from '../core/linkRules';

export class SortHandBuildingSystem {
  constructor(private readonly scene: Phaser.Scene) {
    scene.events.on('board-card-tap', this.onCardTap, this);
    scene.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      scene.events.off('board-card-tap', this.onCardTap, this);
    });
  }

  private onCardTap = ({ card }: { card: GameCard }): void => {
    if (!this.isSortHand(card)) return;
    this.scene.events.emit('sort-hand-panel-open', { card });
  };

  private isSortHand(card: GameCard): boolean {
    return getLogisticsRole(card.definition.tags ?? []) === 'logistics_sorter';
  }
}
