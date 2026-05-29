import Phaser from 'phaser';

import { DropConfig } from '../core/DropConfig';
import { InvasionConfig } from '../core/InvasionConfig';
import { CardSpawner } from '../core/CardSpawner';
import GameCard from '../objects/GameCard';

export interface EnemyDefeatedPayload {
  enemyId: string;
  x: number;
  y: number;
}

const LOOT_DATA_KEY = 'lootDrop';

export class DropSystem {
  constructor(
    private readonly scene: Phaser.Scene,
    private readonly spawner: CardSpawner,
    private readonly dropConfig: DropConfig,
    private readonly invasionConfig: InvasionConfig,
  ) {
    scene.events.on(
      'enemy-defeated',
      (payload: EnemyDefeatedPayload) => this.onEnemyDefeated(payload),
    );
    scene.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      scene.events.off('enemy-defeated', this.onEnemyDefeated, this);
    });
  }

  private onEnemyDefeated(payload: EnemyDefeatedPayload): void {
    if (Math.random() > this.dropConfig.dropChance) return;
    if (this.countBoardDrops() >= this.dropConfig.maxDropsOnBoard) return;

    const def = this.invasionConfig.getEnemy(payload.enemyId);
    const tags = def?.tags ?? [];
    const cardId = this.dropConfig.pickCardId(tags);
    if (!cardId) return;

    const x = payload.x + Phaser.Math.Between(-24, 24);
    const y = payload.y + Phaser.Math.Between(-16, 16);
    const card = this.spawner.spawn(cardId, x, y);
    if (!card) return;

    card.setData(LOOT_DATA_KEY, true);
    const name = card.definition.name;
    this.scene.events.emit('loot-dropped', { cardId, card, enemyId: payload.enemyId });
    this.scene.events.emit('drag-toast', `掉落：${name}`);
  }

  private countBoardDrops(): number {
    return this.scene.children.list.filter(
      (c): c is GameCard => c instanceof GameCard && c.getData(LOOT_DATA_KEY) === true,
    ).length;
  }
}
