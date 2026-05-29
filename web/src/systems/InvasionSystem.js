import Phaser from 'phaser';
import { REGISTRY } from '../config/gameConfig';
import GameCard from '../objects/GameCard';
export class InvasionSystem {
    scene;
    spawner;
    baseCamp;
    barriers;
    traps;
    enemies = new Map();
    spawnTimer;
    surgeTriggered = false;
    config;
    paused = false;
    statusSystem;
    constructor(scene, spawner, baseCamp, barriers, traps, invasionConfig) {
        this.scene = scene;
        this.spawner = spawner;
        this.baseCamp = baseCamp;
        this.barriers = barriers;
        this.traps = traps;
        this.config = invasionConfig;
        const day = this.getDayIndex();
        const tier = this.config.getTierForDay(day);
        this.spawnTimer = scene.time.addEvent({
            delay: tier.spawnIntervalSec * 1000,
            loop: true,
            callback: () => this.trySpawn(),
        });
        scene.time.delayedCall(this.config.firstSpawnDelaySec * 1000, () => this.trySpawn());
        scene.events.on(Phaser.Scenes.Events.UPDATE, this.tick, this);
        scene.events.on('day-end', () => {
            this.surgeTriggered = false;
            this.restartSpawnTimer();
        });
        scene.events.once(Phaser.Scenes.Events.SHUTDOWN, () => this.destroy());
    }
    bindStatusSystem(status) {
        this.statusSystem = status;
    }
    destroy() {
        this.paused = true;
        this.spawnTimer?.remove();
        this.scene.events.off(Phaser.Scenes.Events.UPDATE, this.tick, this);
        for (const { card } of this.enemies.values()) {
            card.destroy();
        }
        this.enemies.clear();
    }
    pauseSpawning() {
        this.paused = true;
        this.spawnTimer?.remove();
    }
    getDayIndex() {
        return this.scene.registry.get(REGISTRY.DAY_INDEX) ?? 1;
    }
    restartSpawnTimer() {
        this.spawnTimer?.remove();
        const tier = this.config.getTierForDay(this.getDayIndex());
        this.spawnTimer = this.scene.time.addEvent({
            delay: tier.spawnIntervalSec * 1000,
            loop: true,
            callback: () => this.trySpawn(),
        });
    }
    trySpawn() {
        if (this.paused)
            return;
        const day = this.getDayIndex();
        const tier = this.config.getTierForDay(day);
        if (this.enemies.size >= tier.maxAlive)
            return;
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
        const enemyId = this.config.pickEnemyId(day);
        const def = this.config.getEnemy(enemyId);
        if (!def)
            return;
        const card = this.spawner.spawn(def.cardId, x, y);
        if (!card)
            return;
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
    tick(_time, delta) {
        if (this.paused)
            return;
        this.checkSurge();
        const dt = delta / 1000;
        const now = this.scene.time.now;
        for (const runtime of this.enemies.values()) {
            if (!runtime.card.active)
                continue;
            const target = this.findNearestTarget(runtime.card.x, runtime.card.y);
            if (!target)
                continue;
            const reachRadius = this.getReachRadius(target);
            const dx = target.x - runtime.card.x;
            const dy = target.y - runtime.card.y;
            const dist = Math.hypot(dx, dy) || 1;
            if (dist > reachRadius) {
                const barrierSlow = this.barriers.getSlowFactorAt(runtime.card.x, runtime.card.y);
                const debuffSlow = this.statusSystem?.getSlowFactor(runtime.card) ?? 0;
                const slow = Math.max(barrierSlow, debuffSlow);
                const step = runtime.speed * (1 - slow) * dt;
                const toX = runtime.card.x + (dx / dist) * step;
                const toY = runtime.card.y + (dy / dist) * step;
                const resolved = this.barriers.resolveMove(runtime.card.x, runtime.card.y, toX, toY, now);
                runtime.card.x = resolved.x;
                runtime.card.y = resolved.y;
                runtime.card.setDepth(10 + Math.round(runtime.card.y));
                this.traps.checkEnemy(runtime.card, now);
            }
            else if (now - runtime.lastAttackMs > this.getAttackCooldown(runtime, target)) {
                runtime.lastAttackMs = now;
                this.attackTarget(runtime, target, now);
            }
        }
    }
    findNearestTarget(ex, ey) {
        let best = null;
        let bestDist = Infinity;
        const consider = (x, y, kind, card) => {
            const d = Math.hypot(x - ex, y - ey);
            if (d < bestDist) {
                bestDist = d;
                best = { x, y, kind, card };
            }
        };
        for (const card of this.barriers.getAttackableCards()) {
            consider(card.x, card.y, 'barrier', card);
        }
        for (const card of this.getSurvivorCards()) {
            consider(card.x, card.y, 'survivor', card);
        }
        const basePos = this.baseCamp.isActive ? this.baseCamp.getPosition() : null;
        if (basePos) {
            consider(basePos.x, basePos.y, 'base');
        }
        return best;
    }
    getReachRadius(target) {
        if (target.kind === 'base')
            return this.baseCamp.getContactRadius();
        if (target.kind === 'barrier' && target.card) {
            return Math.max(target.card.cardWidth, target.card.cardHeight) * 0.45;
        }
        return 36;
    }
    attackTarget(runtime, target, now) {
        switch (target.kind) {
            case 'barrier':
                if (target.card) {
                    this.barriers.damageFromEnemy(target.card, runtime.damage, now);
                }
                break;
            case 'base':
                this.scene.events.emit('enemy-reached-base', {
                    runtime,
                    damage: runtime.damage,
                });
                break;
            case 'survivor':
                this.scene.events.emit('enemy-reached-survivor', {
                    runtime,
                    card: target.card,
                });
                break;
        }
    }
    checkSurge() {
        if (this.surgeTriggered)
            return;
        const day = this.getDayIndex();
        const tier = this.config.getTierForDay(day);
        const surge = tier.surgeOnDayEnd;
        if (!surge)
            return;
        const remaining = this.scene.registry.get(REGISTRY.DAY_REMAINING) ?? surge.leadSec + 1;
        if (remaining > surge.leadSec)
            return;
        this.surgeTriggered = true;
        this.scene.events.emit('invasion-surge', { count: surge.count });
        for (let i = 0; i < surge.count; i++) {
            this.trySpawn();
        }
    }
    getAttackCooldown(runtime, target) {
        return target.kind === 'base' ? runtime.contactCooldownMs : 2500;
    }
    damageEnemy(card, amount) {
        const runtime = this.enemies.get(card);
        if (!runtime)
            return false;
        runtime.hp -= amount;
        if (runtime.hp <= 0) {
            const payload = {
                enemyId: runtime.enemyId,
                x: card.x,
                y: card.y,
            };
            this.statusSystem?.removeEnemy(card);
            this.enemies.delete(card);
            card.destroy();
            this.scene.events.emit('enemy-defeated', payload);
            return true;
        }
        return false;
    }
    getSurvivorCards() {
        return this.scene.children.list.filter((c) => c instanceof GameCard && (c.definition.tags ?? []).includes('survivor'));
    }
    getEnemyRuntime(card) {
        return this.enemies.get(card);
    }
}
