import Phaser from 'phaser';
import GameCard from '../objects/GameCard';
export class DefenseTurretSystem {
    scene;
    invasion;
    attackVfx;
    turrets = new Map();
    constructor(scene, invasion, attackVfx) {
        this.scene = scene;
        this.invasion = invasion;
        this.attackVfx = attackVfx;
        scene.events.on('card-spawned', (card) => this.registerPlant(card));
        scene.events.on('mutant-growth-complete', ({ card }) => this.registerPlant(card));
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
    tick(_time, _delta) {
        const now = this.scene.time.now;
        for (const turret of this.turrets.values()) {
            if (!turret.card.active) {
                this.turrets.delete(turret.card);
                continue;
            }
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
            const played = this.attackVfx?.play(turret.attackPresentation, turret.card, nearest, turret.damage);
            if (played)
                continue;
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
