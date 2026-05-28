import Phaser from 'phaser';
import { REGISTRY } from '../config/gameConfig';

export default class MoonHud extends Phaser.GameObjects.Container {
  private bg: Phaser.GameObjects.Rectangle;
  private label: Phaser.GameObjects.Text;
  private timer: Phaser.GameObjects.Text;
  private moonEvent?: Phaser.Time.TimerEvent;
  private remaining = 0;

  constructor(scene: Phaser.Scene, x: number, y: number, barWidth: number) {
    super(scene, x, y);

    this.bg = scene.add.rectangle(0, 0, barWidth, 48, 0x2a2620, 0.92).setOrigin(0.5);
    this.bg.setStrokeStyle(1, 0x5c4a32);

    const labelX = -barWidth * 0.42;
    const timerX = barWidth * 0.22;

    this.label = scene.add.text(labelX, -10, '月相 1', {
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

  setBarWidth(width: number): void {
    this.bg.width = width;
    this.label.setX(-width * 0.42);
    this.timer.setX(width * 0.22);
  }

  startMoonCycle(onMoonEnd: () => void): void {
    this.remaining = this.scene.registry.get(REGISTRY.MOON_SECONDS) as number;
    this.moonEvent?.remove();
    this.moonEvent = this.scene.time.addEvent({
      delay: 1000,
      loop: true,
      callback: () => {
        this.remaining = Math.max(0, this.remaining - 1);
        this.refresh();
        if (this.remaining <= 0) {
          this.moonEvent?.remove();
          onMoonEnd();
        }
      },
    });
    this.refresh();
  }

  private refresh(): void {
    const moon = this.scene.registry.get(REGISTRY.MOON_INDEX) as number;
    const m = Math.floor(this.remaining / 60);
    const s = this.remaining % 60;
    this.label.setText(`月相 ${moon}`);
    this.timer.setText(`${m}:${s.toString().padStart(2, '0')}`);
  }

  advanceMoon(): void {
    const idx = (this.scene.registry.get(REGISTRY.MOON_INDEX) as number) + 1;
    this.scene.registry.set(REGISTRY.MOON_INDEX, idx);
    this.remaining = this.scene.registry.get(REGISTRY.MOON_SECONDS) as number;
    this.startMoonCycle(() => this.scene.events.emit('moon-end'));
  }
}
