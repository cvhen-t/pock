import Phaser from 'phaser';
import { pointInCard } from '../core/combat/cardBounds';
import { CardHpBar } from '../ui/CardHpBar';
import GameCard from '../objects/GameCard';
/**
 * Defensive barriers — block/slow enemies; take damage while occupied.
 */
export class BarrierSystem {
    scene;
    barriers = new Map();
    attackBarrierCooldownMs = 500;
    constructor(scene) {
        this.scene = scene;
        scene.events.on('card-spawned', (c) => this.tryRegister(c));
        scene.events.once(Phaser.Scenes.Events.SHUTDOWN, () => this.destroy());
        for (const child of scene.children.list) {
            if (child instanceof GameCard)
                this.tryRegister(child);
        }
    }
    destroy() {
        for (const s of this.barriers.values()) {
            s.hpBar.destroy();
        }
        this.barriers.clear();
    }
    tryRegister(card) {
        if (this.barriers.has(card))
            return;
        const effect = card.definition.effects?.find((e) => e.type === 'barrier');
        if (!effect)
            return;
        const maxHp = effect.hp ?? 8;
        const state = {
            card,
            hp: maxHp,
            maxHp,
            slow: Phaser.Math.Clamp(effect.slow ?? 0.35, 0, 0.85),
            hpBar: new CardHpBar(card, this.scene),
            lastDamagedMs: 0,
        };
        state.hpBar.setRatio(1, 0x6a6560);
        this.barriers.set(card, state);
    }
    getSlowFactorAt(x, y) {
        let slow = 0;
        for (const s of this.barriers.values()) {
            if (!s.card.active)
                continue;
            if (pointInCard(s.card, x, y)) {
                slow = Math.max(slow, s.slow);
            }
        }
        return slow;
    }
    isBlockedAt(x, y) {
        for (const s of this.barriers.values()) {
            if (s.card.active && pointInCard(s.card, x, y))
                return true;
        }
        return false;
    }
    /** Apply barrier collision to a movement step; returns allowed position. */
    resolveMove(fromX, fromY, toX, toY, now) {
        if (!this.isBlockedAt(toX, toY)) {
            return { x: toX, y: toY, hitBarrier: false };
        }
        this.damageBarrierAt(toX, toY, 1, now);
        const slow = this.getSlowFactorAt(fromX, fromY);
        const slideX = fromX + (toX - fromX) * (1 - slow) * 0.25;
        const slideY = fromY + (toY - fromY) * (1 - slow) * 0.25;
        if (!this.isBlockedAt(slideX, slideY)) {
            return { x: slideX, y: slideY, hitBarrier: true };
        }
        return { x: fromX, y: fromY, hitBarrier: true };
    }
    getAttackableCards() {
        const cards = [];
        for (const s of this.barriers.values()) {
            if (s.card.active && s.hp > 0)
                cards.push(s.card);
        }
        return cards;
    }
    /** Enemy melee strike on a barrier card. */
    damageFromEnemy(card, amount, now) {
        const s = this.barriers.get(card);
        if (!s || !s.card.active)
            return;
        if (now - s.lastDamagedMs < this.attackBarrierCooldownMs)
            return;
        s.lastDamagedMs = now;
        this.damageBarrier(s, Math.max(1, amount));
    }
    healBarrier(card, amount) {
        const s = this.barriers.get(card);
        if (!s)
            return;
        s.hp = Math.min(s.maxHp, s.hp + amount);
        s.hpBar.setRatio(s.hp / s.maxHp);
        this.scene.events.emit('barrier-repaired', { card, hp: s.hp });
    }
    damageBarrierAt(x, y, amount, now) {
        for (const s of this.barriers.values()) {
            if (!s.card.active || !pointInCard(s.card, x, y))
                continue;
            if (now - s.lastDamagedMs < this.attackBarrierCooldownMs)
                continue;
            s.lastDamagedMs = now;
            this.damageBarrier(s, amount);
            return;
        }
    }
    damageBarrier(s, amount) {
        s.hp -= amount;
        s.hpBar.setRatio(s.hp / s.maxHp);
        this.scene.tweens.add({
            targets: s.card,
            scale: 1.03,
            duration: 60,
            yoyo: true,
        });
        if (s.hp <= 0) {
            this.barriers.delete(s.card);
            s.hpBar.destroy();
            const name = s.card.definition.name;
            s.card.destroy();
            this.scene.events.emit('barrier-destroyed', { name });
        }
    }
}
