import Phaser from 'phaser';
import { pointInCard } from '../core/combat/cardBounds';
import GameCard from '../objects/GameCard';
export class TrapSystem {
    scene;
    traps = new Map();
    globalCooldownMs = 1200;
    invasion = null;
    constructor(scene) {
        this.scene = scene;
        scene.events.on('card-spawned', (c) => this.tryRegister(c));
        scene.events.once(Phaser.Scenes.Events.SHUTDOWN, () => this.traps.clear());
        for (const child of scene.children.list) {
            if (child instanceof GameCard)
                this.tryRegister(child);
        }
    }
    bindInvasion(invasion) {
        this.invasion = invasion;
    }
    tryRegister(card) {
        if (this.traps.has(card))
            return;
        const effect = card.definition.effects?.find((e) => e.type === 'trap_contact');
        if (!effect)
            return;
        this.traps.set(card, {
            card,
            damage: effect.damage ?? 3,
            radius: effect.radius ?? 50,
            hitCooldown: new Map(),
        });
    }
    checkEnemy(enemyCard, now) {
        if (!this.invasion)
            return;
        const ex = enemyCard.x;
        const ey = enemyCard.y;
        for (const trap of this.traps.values()) {
            if (!trap.card.active)
                continue;
            const inCard = pointInCard(trap.card, ex, ey);
            const dist = Phaser.Math.Distance.Between(ex, ey, trap.card.x, trap.card.y);
            if (!inCard && dist > trap.radius)
                continue;
            const last = trap.hitCooldown.get(enemyCard) ?? 0;
            if (now - last < this.globalCooldownMs)
                continue;
            trap.hitCooldown.set(enemyCard, now);
            const killed = this.invasion.damageEnemy(enemyCard, trap.damage);
            this.scene.events.emit('trap-triggered', {
                trap: trap.card.definition.name,
                damage: trap.damage,
                killed,
            });
        }
    }
}
