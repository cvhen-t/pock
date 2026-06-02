import Phaser from 'phaser';
import GameCard from '../objects/GameCard';
import { getDefenseTurretRange } from '../core/defenseTurretRange';
export class DefenseTurretSystem {
    scene;
    invasion;
    attackVfx;
    enemyStatus;
    plantActivation;
    turrets = new Map();
    constructor(scene, invasion, attackVfx, enemyStatus, plantActivation) {
        this.scene = scene;
        this.invasion = invasion;
        this.attackVfx = attackVfx;
        this.enemyStatus = enemyStatus;
        this.plantActivation = plantActivation;
        scene.events.on('card-spawned', (card) => this.registerPlant(card));
        scene.events.on('mutant-growth-complete', ({ card }) => this.registerPlant(card));
        scene.events.on('plant-activated', ({ card }) => {
            const turret = this.turrets.get(card);
            if (turret) {
                turret.enabled = true;
                return;
            }
            this.registerPlant(card);
        });
        scene.events.on(Phaser.Scenes.Events.UPDATE, this.tick, this);
        scene.events.once(Phaser.Scenes.Events.SHUTDOWN, () => this.destroy());
        for (const child of scene.children.list) {
            if (child instanceof GameCard)
                this.registerPlant(child);
        }
    }
    destroy() {
        this.scene.events.off(Phaser.Scenes.Events.UPDATE, this.tick, this);
        this.turrets.clear();
    }
    registerPlant(card) {
        if (this.turrets.has(card))
            return;
        const effect = card.definition.effects?.find((e) => e.type === 'defense_turret');
        if (!effect)
            return;
        const requiresActivation = effect.requiresActivation === true;
        const enabled = !requiresActivation || (this.plantActivation?.isActivated(card) ?? false);
        const hp = effect?.hp ?? 5;
        this.turrets.set(card, {
            card,
            hp,
            maxHp: hp,
            damage: effect?.damage ?? 1,
            range: getDefenseTurretRange(card.definition),
            cooldownMs: (effect?.attackCooldown ?? 1.2) * 1000,
            lastShot: 0,
            enabled,
            attackPresentation: effect?.attackPresentation,
            slow: effect?.slow,
            slowDurationSec: effect?.slowDurationSec,
            onHitApply: effect?.onHitApply,
        });
    }
    buildHitExtras(turret) {
        const hasSlow = (turret.slow ?? 0) > 0;
        const hasOnHit = (turret.onHitApply?.length ?? 0) > 0;
        if (!hasSlow && !hasOnHit)
            return undefined;
        return {
            slow: turret.slow,
            slowDurationSec: turret.slowDurationSec ?? 2,
            onHitApply: turret.onHitApply,
        };
    }
    tick(_time, _delta) {
        const now = this.scene.time.now;
        for (const turret of this.turrets.values()) {
            if (!turret.card.active) {
                this.turrets.delete(turret.card);
                continue;
            }
            if (!turret.enabled)
                continue;
            let nearest = null;
            let nearestDist = turret.range;
            for (const { card: enemy } of this.invasion.enemies.values()) {
                const dist = Phaser.Math.Distance.Between(turret.card.x, turret.card.y, enemy.x, enemy.y);
                if (dist <= nearestDist) {
                    nearestDist = dist;
                    nearest = enemy;
                }
            }
            if (!nearest || now - turret.lastShot < turret.cooldownMs)
                continue;
            turret.lastShot = now;
            const hitExtras = this.buildHitExtras(turret);
            const played = this.attackVfx?.play(turret.attackPresentation, turret.card, nearest, turret.damage, undefined, hitExtras);
            if (played)
                continue;
            const killed = this.invasion.damageEnemy(nearest, turret.damage);
            if (!killed && hitExtras) {
                this.enemyStatus?.applyOnHit(nearest, hitExtras);
            }
            this.scene.tweens.add({
                targets: nearest,
                x: nearest.x + Phaser.Math.Between(-4, 4),
                duration: 60,
                yoyo: true,
            });
        }
    }
}
