import Phaser from 'phaser';

import { pointInCard } from '../core/combat/cardBounds';
import GameCard from '../objects/GameCard';
import type { InvasionSystem } from './InvasionSystem';

interface TrapEffect {
  type: 'trap_contact';
  damage?: number;
  radius?: number;
}

interface TrapState {
  card: GameCard;
  damage: number;
  radius: number;
  hitCooldown: Map<GameCard, number>;
}

export class TrapSystem {
  private readonly traps = new Map<GameCard, TrapState>();

  private readonly globalCooldownMs = 1200;

  private invasion: InvasionSystem | null = null;

  constructor(private readonly scene: Phaser.Scene) {
    scene.events.on('card-spawned', (c: GameCard) => this.tryRegister(c));
    scene.events.once(Phaser.Scenes.Events.SHUTDOWN, () => this.traps.clear());

    for (const child of scene.children.list) {
      if (child instanceof GameCard) this.tryRegister(child);
    }
  }

  bindInvasion(invasion: InvasionSystem): void {
    this.invasion = invasion;
  }

  tryRegister(card: GameCard): void {
    if (this.traps.has(card)) return;
    const effect = card.definition.effects?.find((e) => e.type === 'trap_contact') as
      | TrapEffect
      | undefined;
    if (!effect) return;

    this.traps.set(card, {
      card,
      damage: effect.damage ?? 3,
      radius: effect.radius ?? 50,
      hitCooldown: new Map(),
    });
  }

  checkEnemy(enemyCard: GameCard, now: number): void {
    if (!this.invasion) return;
    const ex = enemyCard.x;
    const ey = enemyCard.y;

    for (const trap of this.traps.values()) {
      if (!trap.card.active) continue;

      const inCard = pointInCard(trap.card, ex, ey);
      const dist = Phaser.Math.Distance.Between(ex, ey, trap.card.x, trap.card.y);
      if (!inCard && dist > trap.radius) continue;

      const last = trap.hitCooldown.get(enemyCard) ?? 0;
      if (now - last < this.globalCooldownMs) continue;

      trap.hitCooldown.set(enemyCard, now);
      const killed = this.invasion!.damageEnemy(enemyCard, trap.damage);
      this.scene.events.emit('trap-triggered', {
        trap: trap.card.definition.name,
        damage: trap.damage,
        killed,
      });
    }
  }
}
