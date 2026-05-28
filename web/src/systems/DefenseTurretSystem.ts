import Phaser from 'phaser';

import GameCard from '../objects/GameCard';
import type { AttackPresentation, PlantAttackVfxSystem } from './PlantAttackVfxSystem';
import type { InvasionSystem } from './InvasionSystem';

interface TurretState {
  card: GameCard;
  hp: number;
  maxHp: number;
  damage: number;
  range: number;
  cooldownMs: number;
  lastShot: number;
  attackPresentation?: AttackPresentation;
}

interface DefenseTurretEffect {
  type: 'defense_turret';
  damage?: number;
  range?: number;
  hp?: number;
  attackCooldown?: number;
  attackPresentation?: AttackPresentation;
}

export class DefenseTurretSystem {
  private readonly turrets = new Map<GameCard, TurretState>();

  constructor(
    private readonly scene: Phaser.Scene,
    private readonly invasion: InvasionSystem,
    private readonly attackVfx?: PlantAttackVfxSystem,
  ) {
    scene.events.on('card-spawned', (card: GameCard) => this.registerPlant(card));
    scene.events.on('mutant-growth-complete', ({ card }: { card: GameCard }) =>
      this.registerPlant(card),
    );
    scene.events.on(Phaser.Scenes.Events.UPDATE, this.tick, this);
    scene.events.once(Phaser.Scenes.Events.SHUTDOWN, () => this.destroy());

    for (const child of scene.children.list) {
      if (child instanceof GameCard) this.registerPlant(child);
    }
  }

  destroy(): void {
    this.scene.events.off(Phaser.Scenes.Events.UPDATE, this.tick, this);
    this.turrets.clear();
  }

  private registerPlant(card: GameCard): void {
    if (this.turrets.has(card)) return;
    const effect = card.definition.effects?.find(
      (e) => e.type === 'defense_turret',
    ) as DefenseTurretEffect | undefined;
    if (!effect) return;

    const hp = effect?.hp ?? 5;
    this.turrets.set(card, {
      card,
      hp,
      maxHp: hp,
      damage: effect?.damage ?? 1,
      range: effect?.range ?? 90,
      cooldownMs: (effect?.attackCooldown ?? 1.2) * 1000,
      lastShot: 0,
      attackPresentation: effect?.attackPresentation,
    });
  }

  private tick(_time: number, _delta: number): void {
    const now = this.scene.time.now;

    for (const turret of this.turrets.values()) {
      if (!turret.card.active) {
        this.turrets.delete(turret.card);
        continue;
      }

      let nearest: GameCard | null = null;
      let nearestDist = turret.range;

      for (const { card: enemy } of this.invasion.enemies.values()) {
        const dist = Phaser.Math.Distance.Between(
          turret.card.x,
          turret.card.y,
          enemy.x,
          enemy.y,
        );
        if (dist <= nearestDist) {
          nearestDist = dist;
          nearest = enemy;
        }
      }

      if (!nearest || now - turret.lastShot < turret.cooldownMs) continue;

      turret.lastShot = now;

      const played = this.attackVfx?.play(
        turret.attackPresentation,
        turret.card,
        nearest,
        turret.damage,
      );
      if (played) continue;

      this.invasion.damageEnemy(nearest, turret.damage);
      this.scene.tweens.add({
        targets: nearest,
        x: nearest.x + Phaser.Math.Between(-4, 4),
        duration: 60,
        yoyo: true,
      });
    }
  }
}
