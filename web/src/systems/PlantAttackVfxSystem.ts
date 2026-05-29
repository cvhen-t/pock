import Phaser from 'phaser';

import { ATTACK_VFX } from '../art/attackVfxKeys';
import { boardDepthFromY } from '../objects/GameCard';
import type GameCard from '../objects/GameCard';
import type { EnemyStatusSystem, HitExtras } from './EnemyStatusSystem';
import type { InvasionSystem } from './InvasionSystem';

export type { HitExtras } from './EnemyStatusSystem';

export interface AttackPresentation {
  style?: string;
  spawnFrom?: 'target_feet' | 'plant_base' | 'plant_muzzle';
  hitFrame?: number;
  frameRate?: number;
  floaterColor?: string;
  onHitTint?: string;
}

interface PendingHit {
  target: GameCard;
  damage: number;
  floaterColor: string;
  onHitTint?: string;
  hitExtras?: HitExtras;
}

interface TravelVfxConfig {
  animKey: string;
  atlasKey: string;
  hitFrame: number;
  frameRate: number;
  travelStartFrame: number;
  travelEndFrame: number;
  impactStartFrame: number;
  arcHeight: number;
  floaterColor: string;
  onHitTint?: string;
  particleKey?: string;
  particleQuantity?: number;
}

export class PlantAttackVfxSystem {
  private readonly pools = new Map<string, Phaser.GameObjects.Sprite[]>();
  private dirtEmitter?: Phaser.GameObjects.Particles.ParticleEmitter;
  private sporeEmitter?: Phaser.GameObjects.Particles.ParticleEmitter;
  private acidEmitter?: Phaser.GameObjects.Particles.ParticleEmitter;

  constructor(
    private readonly scene: Phaser.Scene,
    private readonly invasion: InvasionSystem,
    private readonly enemyStatus?: EnemyStatusSystem,
  ) {
    scene.events.once(Phaser.Scenes.Events.SHUTDOWN, () => this.destroy());
    scene.events.on('enemy-slow-dust', this.onSlowDust, this);
  }

  private onSlowDust(x: number, y: number): void {
    this.burstDirt(x, y, 2);
  }

  destroy(): void {
    this.scene.events.off('enemy-slow-dust', this.onSlowDust, this);
    this.dirtEmitter?.destroy();
    this.sporeEmitter?.destroy();
    this.acidEmitter?.destroy();
    this.dirtEmitter = undefined;
    this.sporeEmitter = undefined;
    this.acidEmitter = undefined;
    for (const pool of this.pools.values()) {
      for (const s of pool) s.destroy();
    }
    this.pools.clear();
  }

  play(
    presentation: AttackPresentation | undefined,
    plant: GameCard,
    target: GameCard,
    damage: number,
    onComplete?: () => void,
    hitExtras?: HitExtras,
  ): boolean {
    const style = presentation?.style ?? 'instant';
    const hitOpts = {
      floaterColor: presentation?.floaterColor ?? '#9aba6a',
      onHitTint: presentation?.onHitTint,
    };

    switch (style) {
      case 'underground_vine':
        this.playAnchoredAnim(
          {
            animKey: ATTACK_VFX.UNDERGROUND_VINE_ANIM,
            atlasKey: ATTACK_VFX.UNDERGROUND_VINE_ATLAS,
            hitFrame: presentation?.hitFrame ?? 5,
            frameRate: presentation?.frameRate ?? 12,
            ...hitOpts,
          },
          this.targetFeet(target),
          target,
          damage,
          onComplete,
          hitExtras,
        );
        return true;

      case 'underground_snare':
        this.playAnchoredAnim(
          {
            animKey: ATTACK_VFX.UNDERGROUND_SNARE_ANIM,
            atlasKey: ATTACK_VFX.UNDERGROUND_SNARE_ATLAS,
            hitFrame: presentation?.hitFrame ?? 5,
            frameRate: presentation?.frameRate ?? 10,
            floaterColor: presentation?.floaterColor ?? '#a8b878',
            onHitTint: presentation?.onHitTint,
          },
          this.targetFeet(target),
          target,
          damage,
          onComplete,
          hitExtras,
        );
        return true;

      case 'spore_burst':
        this.pulsePlant(plant);
        this.playTravelingAnim(
          {
            animKey: ATTACK_VFX.SPORE_BURST_ANIM,
            atlasKey: ATTACK_VFX.SPORE_BURST_ATLAS,
            hitFrame: presentation?.hitFrame ?? 3,
            frameRate: presentation?.frameRate ?? 14,
            travelStartFrame: 0,
            travelEndFrame: 2,
            impactStartFrame: 3,
            arcHeight: 18,
            floaterColor: presentation?.floaterColor ?? '#9aba6a',
            particleKey: ATTACK_VFX.SPORE_PARTICLE,
            particleQuantity: 8,
          },
          this.plantMuzzle(plant),
          this.targetFeet(target),
          plant,
          target,
          damage,
          onComplete,
          hitExtras,
        );
        return true;

      case 'acid_splash':
        this.pulsePlant(plant);
        this.playTravelingAnim(
          {
            animKey: ATTACK_VFX.ACID_SPLASH_ANIM,
            atlasKey: ATTACK_VFX.ACID_SPLASH_ATLAS,
            hitFrame: presentation?.hitFrame ?? 4,
            frameRate: presentation?.frameRate ?? 11,
            travelStartFrame: 1,
            travelEndFrame: 3,
            impactStartFrame: 4,
            arcHeight: 28,
            floaterColor: presentation?.floaterColor ?? '#b8c878',
            onHitTint: presentation?.onHitTint ?? '#6a7a48',
            particleKey: ATTACK_VFX.ACID_DRIP_PARTICLE,
            particleQuantity: 10,
          },
          this.plantMuzzle(plant),
          this.targetFeet(target),
          plant,
          target,
          damage,
          onComplete,
          hitExtras,
        );
        return true;

      default:
        return false;
    }
  }

  private playAnchoredAnim(
    config: {
      animKey: string;
      atlasKey: string;
      hitFrame: number;
      frameRate: number;
      floaterColor: string;
      onHitTint?: string;
    },
    anchor: { x: number; y: number },
    target: GameCard,
    damage: number,
    onComplete?: () => void,
    hitExtras?: HitExtras,
  ): void {
    const pending: PendingHit = {
      target,
      damage,
      floaterColor: config.floaterColor,
      onHitTint: config.onHitTint,
      hitExtras,
    };
    let hitApplied = false;

    const sprite = this.acquireSprite(config.atlasKey, anchor.x, anchor.y, 0.5, 1);
    sprite.setDepth(boardDepthFromY(anchor.y) + 2);

    sprite.play({ key: config.animKey, frameRate: config.frameRate });
    this.burstDirt(anchor.x, anchor.y);

    sprite.on(
      Phaser.Animations.Events.ANIMATION_UPDATE,
      (_a: Phaser.Animations.Animation, frame: Phaser.Animations.AnimationFrame) => {
        if (!hitApplied && frame.index >= config.hitFrame) {
          hitApplied = true;
          this.applyHit(pending);
        }
      },
    );

    sprite.once(Phaser.Animations.Events.ANIMATION_COMPLETE, () => {
      sprite.off(Phaser.Animations.Events.ANIMATION_UPDATE);
      if (!hitApplied) {
        hitApplied = true;
        this.applyHit(pending);
      }
      this.releaseSprite(sprite, config.atlasKey);
      onComplete?.();
    });
  }

  private playTravelingAnim(
    config: TravelVfxConfig,
    start: { x: number; y: number },
    end: { x: number; y: number },
    plant: GameCard,
    target: GameCard,
    damage: number,
    onComplete?: () => void,
    hitExtras?: HitExtras,
  ): void {
    const pending: PendingHit = {
      target,
      damage,
      floaterColor: config.floaterColor,
      onHitTint: config.onHitTint,
      hitExtras,
    };
    let hitApplied = false;

    const sprite = this.acquireSprite(config.atlasKey, start.x, start.y, 0.5, 0.5);
    const depthBase = Math.max(boardDepthFromY(plant.y), boardDepthFromY(target.y)) + 3;
    sprite.setDepth(depthBase);

    const placeSprite = (frameIndex: number) => {
      if (frameIndex >= config.impactStartFrame) {
        sprite.setPosition(end.x, end.y);
        sprite.setOrigin(0.5, 1);
        return;
      }
      const pos = this.travelPos(
        frameIndex,
        config.travelStartFrame,
        config.travelEndFrame,
        start,
        end,
        config.arcHeight,
      );
      sprite.setPosition(pos.x, pos.y);
      sprite.setOrigin(0.5, 0.5);
    };

    placeSprite(0);
    sprite.play({ key: config.animKey, frameRate: config.frameRate });

    sprite.on(
      Phaser.Animations.Events.ANIMATION_UPDATE,
      (_a: Phaser.Animations.Animation, frame: Phaser.Animations.AnimationFrame) => {
        placeSprite(frame.index);
        if (!hitApplied && frame.index >= config.hitFrame) {
          hitApplied = true;
          this.applyHit(pending);
          if (config.particleKey) {
            this.burstParticle(config.particleKey, end.x, end.y, config.particleQuantity ?? 8);
          }
          this.burstDirt(end.x, end.y, 6);
        }
      },
    );

    sprite.once(Phaser.Animations.Events.ANIMATION_COMPLETE, () => {
      sprite.off(Phaser.Animations.Events.ANIMATION_UPDATE);
      if (!hitApplied) {
        hitApplied = true;
        this.applyHit(pending);
      }
      this.releaseSprite(sprite, config.atlasKey);
      onComplete?.();
    });
  }

  private travelPos(
    frame: number,
    travelStart: number,
    travelEnd: number,
    start: { x: number; y: number },
    end: { x: number; y: number },
    arcHeight: number,
  ): { x: number; y: number } {
    if (frame <= travelStart) return start;
    if (frame >= travelEnd) return end;
    const span = travelEnd - travelStart;
    const t = span > 0 ? (frame - travelStart) / span : 1;
    return {
      x: Phaser.Math.Linear(start.x, end.x, t),
      y: Phaser.Math.Linear(start.y, end.y, t) - Math.sin(t * Math.PI) * arcHeight,
    };
  }

  private targetFeet(target: GameCard): { x: number; y: number } {
    return { x: target.x, y: target.y + target.cardHeight * 0.38 };
  }

  private plantMuzzle(plant: GameCard): { x: number; y: number } {
    return { x: plant.x, y: plant.y - plant.cardHeight * 0.42 };
  }

  private pulsePlant(plant: GameCard): void {
    this.scene.tweens.add({
      targets: plant,
      scaleY: plant.scaleY * 0.92,
      duration: 80,
      yoyo: true,
      ease: 'Quad.easeOut',
    });
  }

  private applyHit({ target, damage, floaterColor, onHitTint, hitExtras }: PendingHit): void {
    if (!target.active) return;

    const killed = this.invasion.damageEnemy(target, damage);

    if (!killed) {
      this.enemyStatus?.applyOnHit(target, hitExtras);
    }

    this.scene.tweens.add({
      targets: target,
      x: target.x + Phaser.Math.Between(-5, 5),
      duration: 70,
      yoyo: true,
    });

    if (onHitTint) {
      const tintColor = Phaser.Display.Color.HexStringToColor(onHitTint).color;
      const flash = this.scene.add
        .rectangle(target.x, target.y, target.cardWidth, target.cardHeight, tintColor, 0.35)
        .setDepth(boardDepthFromY(target.y) + 4);
      this.scene.tweens.add({
        targets: flash,
        alpha: 0,
        duration: 200,
        onComplete: () => flash.destroy(),
      });
    }

    const floater = this.scene.add
      .text(target.x, target.y - target.cardHeight * 0.55, `-${damage}`, {
        fontSize: '15px',
        color: floaterColor,
        stroke: '#1a1612',
        strokeThickness: 2,
      })
      .setOrigin(0.5)
      .setDepth(boardDepthFromY(target.y) + 5);

    this.scene.tweens.add({
      targets: floater,
      y: floater.y - 22,
      alpha: 0,
      duration: 520,
      onComplete: () => floater.destroy(),
    });

    if (!killed) {
      this.burstDirt(target.x, target.y + target.cardHeight * 0.35, 6);
    }
  }

  private burstDirt(x: number, y: number, quantity = 10): void {
    this.ensureDirtEmitter().explode(quantity, x, y);
  }

  private burstParticle(textureKey: string, x: number, y: number, quantity: number): void {
    const emitter =
      textureKey === ATTACK_VFX.SPORE_PARTICLE
        ? this.ensureSporeEmitter()
        : this.ensureAcidEmitter();
    emitter.explode(quantity, x, y);
  }

  private ensureDirtEmitter(): Phaser.GameObjects.Particles.ParticleEmitter {
    if (this.dirtEmitter) return this.dirtEmitter;

    this.dirtEmitter = this.scene.add.particles(0, 0, ATTACK_VFX.DIRT_PARTICLE, {
      lifespan: { min: 180, max: 420 },
      speed: { min: 24, max: 90 },
      angle: { min: 200, max: 340 },
      scale: { start: 0.9, end: 0 },
      alpha: { start: 0.85, end: 0 },
      gravityY: 120,
      emitting: false,
    });
    this.dirtEmitter.setDepth(500);
    return this.dirtEmitter;
  }

  private ensureSporeEmitter(): Phaser.GameObjects.Particles.ParticleEmitter {
    if (this.sporeEmitter) return this.sporeEmitter;

    this.sporeEmitter = this.scene.add.particles(0, 0, ATTACK_VFX.SPORE_PARTICLE, {
      lifespan: { min: 200, max: 480 },
      speed: { min: 18, max: 70 },
      angle: { min: 0, max: 360 },
      scale: { start: 0.8, end: 0 },
      alpha: { start: 0.7, end: 0 },
      gravityY: 40,
      emitting: false,
    });
    this.sporeEmitter.setDepth(500);
    return this.sporeEmitter;
  }

  private ensureAcidEmitter(): Phaser.GameObjects.Particles.ParticleEmitter {
    if (this.acidEmitter) return this.acidEmitter;

    this.acidEmitter = this.scene.add.particles(0, 0, ATTACK_VFX.ACID_DRIP_PARTICLE, {
      lifespan: { min: 220, max: 500 },
      speed: { min: 30, max: 100 },
      angle: { min: 210, max: 330 },
      scale: { start: 1, end: 0.2 },
      alpha: { start: 0.85, end: 0 },
      gravityY: 160,
      emitting: false,
    });
    this.acidEmitter.setDepth(500);
    return this.acidEmitter;
  }

  private acquireSprite(
    atlasKey: string,
    x: number,
    y: number,
    originX: number,
    originY: number,
  ): Phaser.GameObjects.Sprite {
    const pool = this.pools.get(atlasKey) ?? [];
    const sprite = pool.pop() ?? this.scene.add.sprite(0, 0, atlasKey, 0);
    if (!this.pools.has(atlasKey)) this.pools.set(atlasKey, pool);

    sprite.setActive(true).setVisible(true);
    sprite.setOrigin(originX, originY);
    sprite.setPosition(x, y);
    sprite.setAlpha(1);
    sprite.setScale(1);
    sprite.clearTint();
    return sprite;
  }

  private releaseSprite(sprite: Phaser.GameObjects.Sprite, atlasKey: string): void {
    sprite.anims.stop();
    sprite.setActive(false).setVisible(false);
    const pool = this.pools.get(atlasKey) ?? [];
    pool.push(sprite);
    this.pools.set(atlasKey, pool);
  }
}
