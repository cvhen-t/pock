import Phaser from 'phaser';
import { EnemyCorrosionBar } from '../ui/EnemyCorrosionBar';
/** Temporary debuffs on invasion enemies (slow, corrosion DOT). */
export class EnemyStatusSystem {
    scene;
    invasion;
    statuses = new Map();
    constructor(scene, invasion) {
        this.scene = scene;
        this.invasion = invasion;
        scene.events.on('day-end', () => this.clearAll());
        scene.events.on(Phaser.Scenes.Events.UPDATE, this.tick, this);
        scene.events.once(Phaser.Scenes.Events.SHUTDOWN, () => this.destroy());
    }
    destroy() {
        this.scene.events.off(Phaser.Scenes.Events.UPDATE, this.tick, this);
        this.clearAll();
    }
    getSlowFactor(card) {
        const slow = this.statuses.get(card)?.slow;
        if (!slow)
            return 0;
        if (this.scene.time.now >= slow.expiresAt) {
            this.clearSlow(card);
            return 0;
        }
        return slow.factor;
    }
    applyOnHit(card, extras) {
        if (!extras || !card.active)
            return;
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
    removeEnemy(card) {
        this.cleanup(card);
    }
    applySlow(card, factor, durationMs) {
        const now = this.scene.time.now;
        const state = this.ensureState(card);
        const clamped = Phaser.Math.Clamp(factor, 0, 0.85);
        state.slow = {
            factor: Math.max(state.slow?.factor ?? 0, clamped),
            expiresAt: now + durationMs,
        };
        this.ensureSlowDust(card, state);
    }
    applyCorrosion(card, opts) {
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
    tick() {
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
            if (!corrosion)
                continue;
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
    tickCorrosion(card, damage) {
        if (!card.active)
            return;
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
    updateCorrosionBar(state) {
        const corrosion = state.corrosion;
        if (!corrosion || !state.corrosionBar)
            return;
        const remaining = corrosion.expiresAt - this.scene.time.now;
        state.corrosionBar.setRatio(remaining / corrosion.durationMs);
    }
    ensureSlowDust(card, state) {
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
    clearSlow(card) {
        const state = this.statuses.get(card);
        if (!state)
            return;
        state.slow = undefined;
        state.dustTimer?.remove();
        state.dustTimer = undefined;
        this.pruneState(card);
    }
    clearCorrosion(card) {
        const state = this.statuses.get(card);
        if (!state)
            return;
        state.corrosion = undefined;
        state.corrosionBar?.destroy();
        state.corrosionBar = undefined;
        this.pruneState(card);
    }
    ensureState(card) {
        let state = this.statuses.get(card);
        if (!state) {
            state = {};
            this.statuses.set(card, state);
        }
        return state;
    }
    cleanup(card) {
        const state = this.statuses.get(card);
        if (!state)
            return;
        state.dustTimer?.remove();
        state.corrosionBar?.destroy();
        this.statuses.delete(card);
    }
    pruneState(card) {
        const state = this.statuses.get(card);
        if (!state)
            return;
        if (!state.slow && !state.corrosion) {
            state.dustTimer?.remove();
            this.statuses.delete(card);
        }
    }
    clearAll() {
        for (const card of [...this.statuses.keys()]) {
            this.cleanup(card);
        }
    }
}
