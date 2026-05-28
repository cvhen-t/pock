import Phaser from 'phaser';
/** Thin HP strip at bottom of a card. */
export class CardHpBar {
    card;
    bg;
    fill;
    constructor(card, scene) {
        this.card = card;
        const w = card.cardWidth - 8;
        this.bg = scene.add.rectangle(0, 0, w, 4, 0x1a1612, 0.9);
        this.fill = scene.add.rectangle(0, 0, w, 4, 0x6a6560, 1);
        card.add([this.bg, this.fill]);
        this.layout();
    }
    setRatio(ratio, fillColor) {
        const w = this.card.cardWidth - 8;
        const r = Phaser.Math.Clamp(ratio, 0, 1);
        this.fill.width = w * r;
        if (fillColor !== undefined) {
            this.fill.setFillStyle(fillColor);
        }
        else if (r > 0.5) {
            this.fill.setFillStyle(0x6a6560);
        }
        else if (r > 0.25) {
            this.fill.setFillStyle(0x8b5a3a);
        }
        else {
            this.fill.setFillStyle(0x8b3a3a);
        }
        this.layout();
    }
    destroy() {
        this.bg.destroy();
        this.fill.destroy();
    }
    layout() {
        const y = this.card.cardHeight / 2 - 6;
        const fillW = this.fill.width;
        this.bg.setPosition(0, y);
        this.fill.setPosition(-(this.card.cardWidth - 8) / 2 + fillW / 2, y);
        this.bg.setDepth(20);
        this.fill.setDepth(21);
    }
}
