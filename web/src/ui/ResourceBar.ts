import Phaser from 'phaser';

export interface ResourceSnapshot {
  food: number;
  water: number;
  caps: number;
}

export default class ResourceBar extends Phaser.GameObjects.Container {
  private bg: Phaser.GameObjects.Rectangle;
  private text: Phaser.GameObjects.Text;

  constructor(scene: Phaser.Scene, x: number, y: number, barWidth: number) {
    super(scene, x, y);
    this.bg = scene.add.rectangle(0, 0, barWidth, 40, 0x2a2620, 0.88).setOrigin(0.5);
    this.text = scene.add.text(0, 0, '', {
      fontSize: '14px',
      color: '#b8a88a',
    }).setOrigin(0.5);
    this.add([this.bg, this.text]);
    scene.add.existing(this);
    this.setResources({ food: 4, water: 3, caps: 2 });
  }

  setBarWidth(width: number): void {
    this.bg.width = width;
  }

  setResources(res: ResourceSnapshot, baseHp?: { hp: number; max: number }): void {
    let line = `食物 ${res.food}  净水 ${res.water}  筹码 ${res.caps}`;
    if (baseHp) {
      line += `  本营 ${baseHp.hp}/${baseHp.max}`;
    }
    this.text.setText(line);
  }
}

export function hudBarWidth(screenWidth: number): number {
  return Math.min(400, Math.max(260, screenWidth - 24));
}
