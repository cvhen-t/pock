import Phaser from 'phaser';
export default class ResourceBar extends Phaser.GameObjects.Container {
    bg;
    text;
    constructor(scene, x, y, barWidth) {
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
    setBarWidth(width) {
        this.bg.width = width;
    }
    setResources(res, baseHp) {
        let line = `食物 ${res.food}  净水 ${res.water}  筹码 ${res.caps}`;
        if (baseHp) {
            line += `  本营 ${baseHp.hp}/${baseHp.max}`;
        }
        this.text.setText(line);
    }
}
export function hudBarWidth(screenWidth) {
    return Math.min(400, Math.max(260, screenWidth - 24));
}
