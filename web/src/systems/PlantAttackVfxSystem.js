import Phaser from 'phaser';
import { ATTACK_VFX } from '../art/attackVfxKeys';
import { boardDepthFromY } from '../objects/GameCard';
export class PlantAttackVfxSystem {
    scene;
    invasion;
    pool = [];
    dirtEmitter;
    constructor(scene, invasion) {
        this.scene = scene;
        this.invasion = invasion;
        scene.events.once(Phaser.Scenes.Events.SHUTDOWN, () => this.destroy());
    }
    destroy() {
        this.dirtEmitter?.destroy();
        this.dirtEmitter = undefined;
        for (const s of this.pool)
            s.destroy();
        this.pool.length = 0;
    }
    play(presentation, _plant, target, damage, onComplete) {
        const style = presentation?.style ?? 'instant';
        if (style === 'underground_vine') {
            this.playUndergroundVine(presentation, target, damage, onComplete);
            return true;
        }
        return false;
    }
    playUndergroundVine(presentation, target, damage, onComplete) {
        const hitFrame = presentation?.hitFrame ?? 5;
        const pending = { target, damage };
        let hitApplied = false;
        const feetY = target.y + target.cardHeight * 0.38;
        const sprite = this.acquireSprite(target.x, feetY);
        sprite.setDepth(boardDepthFromY(feetY) + 2);
        sprite.play({
            key: ATTACK_VFX.UNDERGROUND_VINE_ANIM,
            frameRate: presentation?.frameRate ?? 12,
        });
        this.burstDirt(target.x, feetY);
        sprite.on(Phaser.Animations.Events.ANIMATION_UPDATE, (_a, frame) => {
            if (!hitApplied && frame.index >= hitFrame) {
                hitApplied = true;
                this.applyHit(pending);
            }
        });
        sprite.once(Phaser.Animations.Events.ANIMATION_COMPLETE, () => {
            sprite.off(Phaser.Animations.Events.ANIMATION_UPDATE);
            if (!hitApplied) {
                hitApplied = true;
                this.applyHit(pending);
            }
            this.releaseSprite(sprite);
            onComplete?.();
        });
    }
    applyHit({ target, damage }) {
        if (!target.active)
            return;
        const killed = this.invasion.damageEnemy(target, damage);
        this.scene.tweens.add({
            targets: target,
            x: target.x + Phaser.Math.Between(-5, 5),
            duration: 70,
            yoyo: true,
        });
        const floater = this.scene.add
            .text(target.x, target.y - target.cardHeight * 0.55, `-${damage}`, {
            fontSize: '15px',
            color: '#9aba6a',
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
    burstDirt(x, y, quantity = 10) {
        const emitter = this.ensureDirtEmitter();
        emitter.explode(quantity, x, y);
    }
    ensureDirtEmitter() {
        if (this.dirtEmitter)
            return this.dirtEmitter;
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
    acquireSprite(x, y) {
        const sprite = this.pool.pop() ??
            this.scene.add.sprite(0, 0, ATTACK_VFX.UNDERGROUND_VINE_ATLAS, 0);
        sprite.setActive(true).setVisible(true);
        sprite.setOrigin(0.5, 1);
        sprite.setPosition(x, y);
        sprite.setAlpha(1);
        sprite.setScale(1);
        return sprite;
    }
    releaseSprite(sprite) {
        sprite.anims.stop();
        sprite.setActive(false).setVisible(false);
        this.pool.push(sprite);
    }
}
