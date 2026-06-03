import Phaser from 'phaser';
const DEFAULT_STYLE = {
    bg: 0x322e28,
    bgHover: 0x3e3a34,
    stroke: 0x5c4a32,
    text: '#c9b896',
};
/** Large menu CTA — same interaction pattern as TopHud action chips. */
export default class MenuButton extends Phaser.GameObjects.Container {
    bg;
    label;
    constructor(scene, x, y, text, width, height, onPress, style = DEFAULT_STYLE) {
        super(scene, x, y);
        this.bg = scene.add.rectangle(0, 0, width, height, style.bg, 0.96);
        this.bg.setStrokeStyle(2, style.stroke, 0.9);
        this.label = scene.add.text(0, 0, text, {
            fontFamily: 'system-ui, -apple-system, sans-serif',
            fontSize: '16px',
            fontStyle: '600',
            color: style.text,
        });
        this.label.setOrigin(0.5);
        this.add([this.bg, this.label]);
        this.setSize(width, height);
        this.bg.setInteractive({ useHandCursor: true });
        this.bg.on('pointerover', () => {
            this.bg.setFillStyle(style.bgHover, 0.98);
            this.label.setColor('#ffffff');
        });
        this.bg.on('pointerout', () => {
            this.bg.setFillStyle(style.bg, 0.96);
            this.label.setColor(style.text);
        });
        this.bg.on('pointerdown', onPress);
    }
    setEnabled(enabled) {
        this.bg.disableInteractive();
        if (enabled) {
            this.bg.setInteractive({ useHandCursor: true });
            this.bg.setAlpha(1);
            this.label.setAlpha(1);
        }
        else {
            this.bg.setAlpha(0.45);
            this.label.setAlpha(0.45);
        }
    }
}
