import Phaser from 'phaser';

import { getLogisticsRole } from '../core/linkRules';
import GameCard from '../objects/GameCard';
import { SortHandHud } from '../ui/SortHandHud';

/** 为棋盘上的分拣手挂载配置摘要 HUD */
export class SortHandHudSystem {
  private readonly huds = new Map<GameCard, SortHandHud>();

  constructor(private readonly scene: Phaser.Scene) {
    scene.events.on('card-spawned', this.onCardSpawned, this);
    scene.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      scene.events.off('card-spawned', this.onCardSpawned, this);
      for (const hud of this.huds.values()) hud.destroy();
      this.huds.clear();
    });

    for (const child of scene.children.list) {
      if (child instanceof GameCard) this.attachIfSortHand(child);
    }
  }

  private onCardSpawned = (card: GameCard): void => {
    this.attachIfSortHand(card);
  };

  private attachIfSortHand(card: GameCard): void {
    if (getLogisticsRole(card.definition.tags ?? []) !== 'logistics_sorter') return;
    if (this.huds.has(card)) return;
    this.huds.set(card, new SortHandHud(card, this.scene));
  }
}
