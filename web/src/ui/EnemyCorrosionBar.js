import Phaser from 'phaser';
/** 3px corrosion duration strip at the bottom of an enemy card. */
export class EnemyCorrosionBar {
    card;
    scene;
    bg;
    fill;
    onRotated;
    constructor(card, scene) {
        this.card = card;
        this.scene = scene;
        const w = card.cardWidth - 10;
        this.bg = scene.add.rectangle(0, 0, w, 3, 0x1a1612, 0.85);
        this.fill = scene.add.rectangle(0, 0, w, 3, 0x4a5a30, 1);
        card.add([this.bg, this.fill]);
        this.layout();
        this.onRotated = (c) => {
            if (c === card)
                this.layout();
        };
        scene.events.on('card-rotated', this.onRotated);
    }
    setRatio(ratio) {
        const w = this.card.cardWidth - 10;
        this.fill.width = w * Phaser.Math.Clamp(ratio, 0, 1);
        this.layout();
    }
    destroy() {
        this.scene.events.off('card-rotated', this.onRotated);
        this.bg.destroy();
        this.fill.destroy();
    }
    layout() {
        const w = this.card.cardWidth - 10;
        const y = this.card.cardHeight / 2 - 4;
        const fillW = this.fill.width;
        this.bg.width = w;
        this.bg.setPosition(0, y);
        this.fill.setPosition(-w / 2 + fillW / 2, y);
        this.bg.setDepth(22);
        this.fill.setDepth(23);
    }
}
