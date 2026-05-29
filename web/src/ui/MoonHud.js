import Phaser from 'phaser';
import { REGISTRY } from '../config/gameConfig';
export default class MoonHud extends Phaser.GameObjects.Container {
    bg;
    label;
    timer;
    dayEvent;
    remaining = 0;
    constructor(scene, x, y, barWidth) {
        super(scene, x, y);
        this.bg = scene.add.rectangle(0, 0, barWidth, 48, 0x2a2620, 0.92).setOrigin(0.5);
        this.bg.setStrokeStyle(1, 0x5c4a32);
        const labelX = -barWidth * 0.42;
        const timerX = barWidth * 0.22;
        this.label = scene.add.text(labelX, -10, '第 1 天', {
            fontSize: '16px',
            color: '#c9b896',
        });
        this.timer = scene.add.text(timerX, -10, '2:00', {
            fontSize: '16px',
            color: '#e8e0d4',
        });
        this.add([this.bg, this.label, this.timer]);
        scene.add.existing(this);
    }
    setBarWidth(width) {
        this.bg.width = width;
        this.label.setX(-width * 0.42);
        this.timer.setX(width * 0.22);
    }
    startDayCycle(onDayEnd) {
        this.remaining = this.scene.registry.get(REGISTRY.DAY_SECONDS);
        this.dayEvent?.remove();
        this.dayEvent = this.scene.time.addEvent({
            delay: 1000,
            loop: true,
            callback: () => {
                this.remaining = Math.max(0, this.remaining - 1);
                this.refresh();
                if (this.remaining <= 0) {
                    this.dayEvent?.remove();
                    onDayEnd();
                }
            },
        });
        this.refresh();
    }
    refresh() {
        const day = this.scene.registry.get(REGISTRY.DAY_INDEX);
        const m = Math.floor(this.remaining / 60);
        const s = this.remaining % 60;
        this.label.setText(`第 ${day} 天`);
        this.timer.setText(`${m}:${s.toString().padStart(2, '0')}`);
    }
    advanceDay() {
        const idx = this.scene.registry.get(REGISTRY.DAY_INDEX) + 1;
        this.scene.registry.set(REGISTRY.DAY_INDEX, idx);
        this.remaining = this.scene.registry.get(REGISTRY.DAY_SECONDS);
        this.startDayCycle(() => this.scene.events.emit('day-end'));
    }
}
