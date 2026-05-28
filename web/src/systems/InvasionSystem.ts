import Phaser from 'phaser';

import { REGISTRY } from '../config/gameConfig';
import { CardSpawner } from '../core/CardSpawner';
import { InvasionConfig } from '../core/InvasionConfig';
import GameCard from '../objects/GameCard';
import type { BaseCampSystem } from './BaseCampSystem';
import type { BarrierSystem } from './BarrierSystem';
import type { TrapSystem } from './TrapSystem';

export interface EnemyRuntime {
  card: GameCard;
  enemyId: string;
  hp: number;
  maxHp: number;
  speed: number;
  damage: number;
  contactCooldownMs: number;
  lastAttackMs: number;
}

export class InvasionSystem {
  readonly enemies = new Map<GameCard, EnemyRuntime>();

  private spawnTimer?: Phaser.Time.TimerEvent;

  private surgeTriggered = false;

  private readonly config: InvasionConfig;

  private paused = false;

  constructor(
    private readonly scene: Phaser.Scene,
    private readonly spawner: CardSpawner,
    private readonly baseCamp: BaseCampSystem,
    private readonly barriers: BarrierSystem,
    private readonly traps: TrapSystem,
    invasionConfig: InvasionConfig,
  ) {
    this.config = invasionConfig;

    const moon = this.getMoonIndex();
    const tier = this.config.getTierForMoon(moon);

    this.spawnTimer = scene.time.addEvent({
      delay: tier.spawnIntervalSec * 1000,
      loop: true,
      callback: () => this.trySpawn(),
    });

    scene.time.delayedCall(this.config.firstSpawnDelaySec * 1000, () => this.trySpawn());

    scene.events.on(Phaser.Scenes.Events.UPDATE, this.tick, this);
    scene.events.on('moon-end', () => {
      this.surgeTriggered = false;
      this.restartSpawnTimer();
    });
    scene.events.once(Phaser.Scenes.Events.SHUTDOWN, () => this.destroy());
  }

  destroy(): void {
    this.paused = true;
    this.spawnTimer?.remove();
    this.scene.events.off(Phaser.Scenes.Events.UPDATE, this.tick, this);
    for (const { card } of this.enemies.values()) {
      card.destroy();
    }
    this.enemies.clear();
  }

  pauseSpawning(): void {
    this.paused = true;
    this.spawnTimer?.remove();
  }

  private getMoonIndex(): number {
    return (this.scene.registry.get(REGISTRY.MOON_INDEX) as number) ?? 1;
  }

  private restartSpawnTimer(): void {
    this.spawnTimer?.remove();
    const tier = this.config.getTierForMoon(this.getMoonIndex());
    this.spawnTimer = this.scene.time.addEvent({
      delay: tier.spawnIntervalSec * 1000,
      loop: true,
      callback: () => this.trySpawn(),
    });
  }

  private trySpawn(): void {
    if (this.paused) return;

    const moon = this.getMoonIndex();
    const tier = this.config.getTierForMoon(moon);
    if (this.enemies.size >= tier.maxAlive) return;

    const w = this.scene.scale.width;
    const h = this.scene.scale.height;
    const margin = Math.max(36, w * 0.1);
    const boardTop = h * 0.28;
    const boardBottom = h * 0.68;

    const edge = Phaser.Math.Between(0, 3);
    let x = w / 2;
    let y = h * 0.55;

    switch (edge) {
      case 0:
        x = margin;
        y = Phaser.Math.Between(boardTop, boardBottom);
        break;
      case 1:
        x = w - margin;
        y = Phaser.Math.Between(boardTop, boardBottom);
        break;
      case 2:
        x = Phaser.Math.Between(margin, w - margin);
        y = boardTop;
        break;
      default:
        x = Phaser.Math.Between(margin, w - margin);
        y = boardBottom;
    }

    const enemyId = this.config.pickEnemyId(moon);
    const def = this.config.getEnemy(enemyId);
    if (!def) return;

    const card = this.spawner.spawn(def.cardId, x, y);
    if (!card) return;

    this.enemies.set(card, {
      card,
      enemyId: def.id,
      hp: def.hp,
      maxHp: def.hp,
      speed: def.speed,
      damage: def.contactDamage,
      contactCooldownMs: def.contactCooldownSec * 1000,
      lastAttackMs: 0,
    });

    this.scene.events.emit('invasion-spawn', card);
  }

  private tick(_time: number, delta: number): void {
    if (this.paused) return;

    this.checkSurge();

    const target = this.getPrimaryTarget();
    if (!target) return;

    const dt = delta / 1000;
    const now = this.scene.time.now;
    const reachRadius = target.isBase
      ? this.baseCamp.getContactRadius()
      : 36;

    for (const runtime of this.enemies.values()) {
      const dx = target.x - runtime.card.x;
      const dy = target.y - runtime.card.y;
      const dist = Math.hypot(dx, dy) || 1;

      if (dist > reachRadius) {
        const slow = this.barriers.getSlowFactorAt(runtime.card.x, runtime.card.y);
        const step = runtime.speed * (1 - slow) * dt;
        const toX = runtime.card.x + (dx / dist) * step;
        const toY = runtime.card.y + (dy / dist) * step;
        const resolved = this.barriers.resolveMove(runtime.card.x, runtime.card.y, toX, toY, now);
        runtime.card.x = resolved.x;
        runtime.card.y = resolved.y;
        runtime.card.setDepth(10 + Math.round(runtime.card.y));
        this.traps.checkEnemy(runtime.card, now);
      } else if (now - runtime.lastAttackMs > this.getAttackCooldown(runtime, target)) {
        runtime.lastAttackMs = now;
        if (target.isBase) {
          this.scene.events.emit('enemy-reached-base', {
            runtime,
            damage: runtime.damage,
          });
        } else {
          this.scene.events.emit('enemy-reached-survivor', runtime);
        }
      }
    }
  }

  private checkSurge(): void {
    if (this.surgeTriggered) return;

    const moon = this.getMoonIndex();
    const tier = this.config.getTierForMoon(moon);
    const surge = tier.surgeOnMoonEnd;
    if (!surge) return;

    const remaining =
      (this.scene.registry.get(REGISTRY.MOON_REMAINING) as number) ?? surge.leadSec + 1;
    if (remaining > surge.leadSec) return;

    this.surgeTriggered = true;
    this.scene.events.emit('invasion-surge', { count: surge.count });
    for (let i = 0; i < surge.count; i++) {
      this.trySpawn();
    }
  }

  private getAttackCooldown(
    runtime: EnemyRuntime,
    target: { isBase: boolean },
  ): number {
    return target.isBase ? runtime.contactCooldownMs : 2500;
  }

  private getPrimaryTarget(): { x: number; y: number; isBase: boolean } | null {
    const basePos = this.baseCamp.isActive ? this.baseCamp.getPosition() : null;
    if (basePos) {
      return { ...basePos, isBase: true };
    }
    const survivors = this.getSurvivorPositions();
    if (survivors.length === 0) return null;
    const s = survivors[0]!;
    return { x: s.x, y: s.y, isBase: false };
  }

  damageEnemy(card: GameCard, amount: number): boolean {
    const runtime = this.enemies.get(card);
    if (!runtime) return false;

    runtime.hp -= amount;
    if (runtime.hp <= 0) {
      this.enemies.delete(card);
      card.destroy();
      this.scene.events.emit('enemy-defeated', card);
      return true;
    }
    return false;
  }

  private getSurvivorPositions(): { x: number; y: number }[] {
    return this.scene.children.list
      .filter(
        (c): c is GameCard =>
          c instanceof GameCard && (c.definition.tags ?? []).includes('survivor'),
      )
      .map((c) => ({ x: c.x, y: c.y }));
  }
}
