/** Thin progress strip at top of a card; follows drag and stack layout. */
export class CardProgressBar {
    card;
    scene;
    bg;
    fill;
    tween;
    onRotated;
    constructor(card, scene, fillColor, durationMs) {
        this.card = card;
        this.scene = scene;
        const w = card.cardWidth - 8;
        const barH = 4;
        this.bg = scene.add.rectangle(0, 0, w, barH, 0x1a1612, 0.7);
        this.fill = scene.add.rectangle(0, 0, 1, barH, fillColor, 0.9);
        card.add([this.bg, this.fill]);
        this.layout();
        this.tween = scene.tweens.add({
            targets: this.fill,
            width: w,
            duration: durationMs,
            ease: 'Linear',
            onUpdate: () => this.layout(),
        });
        this.onRotated = (c) => {
            if (c === card)
                this.layout();
        };
        scene.events.on('card-rotated', this.onRotated);
    }
    destroy() {
        this.tween?.stop();
        this.scene.events.off('card-rotated', this.onRotated);
        this.bg.destroy();
        this.fill.destroy();
    }
    layout() {
        const w = this.card.cardWidth - 8;
        const y = -this.card.cardHeight / 2 + 6;
        const fillW = this.fill.width;
        this.bg.width = w;
        this.bg.setPosition(0, y);
        this.fill.setPosition(-w / 2 + fillW / 2, y);
        this.bg.setDepth(20);
        this.fill.setDepth(21);
    }
}
