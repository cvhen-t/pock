import Phaser from 'phaser';
import { REGISTRY } from '../config/gameConfig';
import { hudBarWidth } from './LayoutManager';
export default class TopHud extends Phaser.GameObjects.Container {
    bg;
    resText;
    moonLabel;
    moonTimer;
    baseText;
    moonEvent;
    remaining = 0;
    onMoonEnd;
    constructor(scene, centerX, centerY, screenWidth) {
        super(scene, centerX, centerY);
        const barW = hudBarWidth(screenWidth);
        this.bg = scene.add
            .rectangle(0, 0, barW, 56, 0x2a2620, 0.92)
            .setOrigin(0.5)
            .setStrokeStyle(1, 0x5c4a32);
        this.resText = scene.add.text(-barW * 0.48, -8, '', {
            fontSize: '13px',
            color: '#b8a88a',
        });
        this.moonLabel = scene.add.text(-barW * 0.02, -8, '月相 1', {
            fontSize: '14px',
            color: '#c9b896',
        });
        this.moonLabel.setOrigin(0.5, 0);
        this.moonTimer = scene.add.text(-barW * 0.02, 10, '2:00', {
            fontSize: '13px',
            color: '#e8e0d4',
        });
        this.moonTimer.setOrigin(0.5, 0);
        this.baseText = scene.add.text(barW * 0.48, -2, '', {
            fontSize: '13px',
            color: '#c9b896',
        });
        this.baseText.setOrigin(1, 0.5);
        this.add([this.bg, this.resText, this.moonLabel, this.moonTimer, this.baseText]);
        scene.add.existing(this);
        this.setScrollFactor(0);
        this.setDepth(2200);
        this.setResources({ food: 4, water: 3, caps: 2 });
    }
    applyLayout(centerX, centerY, screenWidth) {
        this.setPosition(centerX, centerY);
        this.setBarWidth(hudBarWidth(screenWidth));
    }
    setBarWidth(width) {
        this.bg.width = width;
        this.resText.setX(-width * 0.48);
        this.moonLabel.setX(-width * 0.02);
        this.moonTimer.setX(-width * 0.02);
        this.baseText.setX(width * 0.48);
    }
    setResources(res, baseHp) {
        this.resText.setText(`食物 ${res.food}  水 ${res.water}  筹 ${res.caps}`);
        if (baseHp) {
            this.baseText.setText(`本营 ${baseHp.hp}/${baseHp.max}`);
            this.baseText.setVisible(true);
        }
        else {
            this.baseText.setVisible(false);
        }
    }
    startMoonCycle(onMoonEnd) {
        this.onMoonEnd = onMoonEnd;
        this.remaining = this.scene.registry.get(REGISTRY.MOON_SECONDS);
        this.moonEvent?.remove();
        this.moonEvent = this.scene.time.addEvent({
            delay: 1000,
            loop: true,
            callback: () => {
                this.remaining = Math.max(0, this.remaining - 1);
                this.refreshMoon();
                if (this.remaining <= 0) {
                    this.moonEvent?.remove();
                    this.onMoonEnd?.();
                }
            },
        });
        this.refreshMoon();
    }
    advanceMoon() {
        const idx = this.scene.registry.get(REGISTRY.MOON_INDEX) + 1;
        this.scene.registry.set(REGISTRY.MOON_INDEX, idx);
        this.remaining = this.scene.registry.get(REGISTRY.MOON_SECONDS);
        if (this.onMoonEnd)
            this.startMoonCycle(this.onMoonEnd);
    }
    refreshMoon() {
        const moon = this.scene.registry.get(REGISTRY.MOON_INDEX);
        const m = Math.floor(this.remaining / 60);
        const s = this.remaining % 60;
        this.moonLabel.setText(`月相 ${moon}`);
        this.moonTimer.setText(`${m}:${s.toString().padStart(2, '0')}`);
        this.scene.registry.set(REGISTRY.MOON_REMAINING, this.remaining);
    }
    getMoonRemaining() {
        return this.remaining;
    }
    destroy(fromScene) {
        this.moonEvent?.remove();
        super.destroy(fromScene);
    }
}
