import Phaser from 'phaser';

import type GameCard from '../objects/GameCard';
import { EnemyCorrosionBar } from '../ui/EnemyCorrosionBar';
import type { InvasionSystem } from './InvasionSystem';

export interface OnHitEffect {
  type: string;
  [key: string]: unknown;
}

export interface HitExtras {
  slow?: number;
  slowDurationSec?: number;
  onHitApply?: OnHitEffect[];
}

interface SlowDebuff {
  factor: number;
  expiresAt: number;
}

interface CorrosionDebuff {
  damagePerTick: number;
  intervalMs: number;
  nextTickAt: number;
  expiresAt: number;
  startedAt: number;
  durationMs: number;
}

interface EnemyStatusState {
  slow?: SlowDebuff;
  corrosion?: CorrosionDebuff;
  corrosionBar?: EnemyCorrosionBar;
  dustTimer?: Phaser.Time.TimerEvent;
}

/** Temporary debuffs on invasion enemies (slow, corrosion DOT). */
export class EnemyStatusSystem {
  private readonly statuses = new Map<GameCard, EnemyStatusState>();

  constructor(
    private readonly scene: Phaser.Scene,
    private readonly invasion: InvasionSystem,
  ) {
    scene.events.on('day-end', () => this.clearAll());
    scene.events.on(Phaser.Scenes.Events.UPDATE, this.tick, this);
    scene.events.once(Phaser.Scenes.Events.SHUTDOWN, () => this.destroy());
  }

  destroy(): void {
    this.scene.events.off(Phaser.Scenes.Events.UPDATE, this.tick, this);
    this.clearAll();
  }

  getSlowFactor(card: GameCard): number {
    const slow = this.statuses.get(card)?.slow;
    if (!slow) return 0;
    if (this.scene.time.now >= slow.expiresAt) {
      this.clearSlow(card);
      return 0;
    }
    return slow.factor;
  }

  applyOnHit(card: GameCard, extras?: HitExtras): void {
    if (!extras || !card.active) return;

    if (extras.slow && extras.slow > 0) {
      this.applySlow(card, extras.slow, (extras.slowDurationSec ?? 2) * 1000);
    }

    for (const effect of extras.onHitApply ?? []) {
      if (effect.type === 'corrosion') {
        this.applyCorrosion(card, {
          damagePerTick: Number(effect.damagePerTick ?? 1),
          intervalSec: Number(effect.intervalSec ?? 1),
          durationSec: Number(effect.durationSec ?? 3),
        });
      }
    }
  }

  removeEnemy(card: GameCard): void {
    this.cleanup(card);
  }

  private applySlow(card: GameCard, factor: number, durationMs: number): void {
    const now = this.scene.time.now;
    const state = this.ensureState(card);
    const clamped = Phaser.Math.Clamp(factor, 0, 0.85);

    state.slow = {
      factor: Math.max(state.slow?.factor ?? 0, clamped),
      expiresAt: now + durationMs,
    };

    this.ensureSlowDust(card, state);
  }

  private applyCorrosion(
    card: GameCard,
    opts: { damagePerTick: number; intervalSec: number; durationSec: number },
  ): void {
    const now = this.scene.time.now;
    const durationMs = opts.durationSec * 1000;
    const intervalMs = opts.intervalSec * 1000;
    const state = this.ensureState(card);

    state.corrosion = {
      damagePerTick: Math.max(1, opts.damagePerTick),
      intervalMs: Math.max(200, intervalMs),
      nextTickAt: now + intervalMs,
      expiresAt: now + durationMs,
      startedAt: now,
      durationMs,
    };

    if (!state.corrosionBar) {
      state.corrosionBar = new EnemyCorrosionBar(card, this.scene);
    }
    this.updateCorrosionBar(state);
  }

  private tick(): void {
    const now = this.scene.time.now;

    for (const [card, state] of this.statuses.entries()) {
      if (!card.active) {
        this.cleanup(card);
        continue;
      }

      if (state.slow && now >= state.slow.expiresAt) {
        this.clearSlow(card);
      }

      const corrosion = state.corrosion;
      if (!corrosion) continue;

      if (now >= corrosion.expiresAt) {
        this.clearCorrosion(card);
        continue;
      }

      this.updateCorrosionBar(state);

      if (now >= corrosion.nextTickAt) {
        corrosion.nextTickAt = now + corrosion.intervalMs;
        this.tickCorrosion(card, corrosion.damagePerTick);
      }
    }
  }

  private tickCorrosion(card: GameCard, damage: number): void {
    if (!card.active) return;

    const killed = this.invasion.damageEnemy(card, damage);
    if (killed) {
      this.cleanup(card);
      return;
    }

    const floater = this.scene.add
      .text(card.x, card.y - card.cardHeight * 0.45, `-${damage}`, {
        fontSize: '12px',
        color: '#9aaa68',
        stroke: '#1a1612',
        strokeThickness: 2,
      })
      .setOrigin(0.5)
      .setDepth(10 + Math.round(card.y) + 5);

    this.scene.tweens.add({
      targets: floater,
      y: floater.y - 14,
      alpha: 0,
      duration: 420,
      onComplete: () => floater.destroy(),
    });
  }

  private updateCorrosionBar(state: EnemyStatusState): void {
    const corrosion = state.corrosion;
    if (!corrosion || !state.corrosionBar) return;
    const remaining = corrosion.expiresAt - this.scene.time.now;
    state.corrosionBar.setRatio(remaining / corrosion.durationMs);
  }

  private ensureSlowDust(card: GameCard, state: EnemyStatusState): void {
    state.dustTimer?.remove();
    state.dustTimer = this.scene.time.addEvent({
      delay: 380,
      loop: true,
      callback: () => {
        if (!card.active || !state.slow) {
          state.dustTimer?.remove();
          state.dustTimer = undefined;
          return;
        }
        if (this.scene.time.now >= state.slow.expiresAt) {
          this.clearSlow(card);
          return;
        }
        const feetY = card.y + card.cardHeight * 0.38;
        this.scene.events.emit('enemy-slow-dust', card.x, feetY);
      },
    });
  }

  private clearSlow(card: GameCard): void {
    const state = this.statuses.get(card);
    if (!state) return;
    state.slow = undefined;
    state.dustTimer?.remove();
    state.dustTimer = undefined;
    this.pruneState(card);
  }

  private clearCorrosion(card: GameCard): void {
    const state = this.statuses.get(card);
    if (!state) return;
    state.corrosion = undefined;
    state.corrosionBar?.destroy();
    state.corrosionBar = undefined;
    this.pruneState(card);
  }

  private ensureState(card: GameCard): EnemyStatusState {
    let state = this.statuses.get(card);
    if (!state) {
      state = {};
      this.statuses.set(card, state);
    }
    return state;
  }

  private cleanup(card: GameCard): void {
    const state = this.statuses.get(card);
    if (!state) return;
    state.dustTimer?.remove();
    state.corrosionBar?.destroy();
    this.statuses.delete(card);
  }

  private pruneState(card: GameCard): void {
    const state = this.statuses.get(card);
    if (!state) return;
    if (!state.slow && !state.corrosion) {
      state.dustTimer?.remove();
      this.statuses.delete(card);
    }
  }

  private clearAll(): void {
    for (const card of [...this.statuses.keys()]) {
      this.cleanup(card);
    }
  }
}
