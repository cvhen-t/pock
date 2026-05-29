import Phaser from 'phaser';

import type GameCard from '../objects/GameCard';

/** Thin progress strip at top of a card; follows drag and stack layout. */
export class CardProgressBar {
  private bg: Phaser.GameObjects.Rectangle;
  private fill: Phaser.GameObjects.Rectangle;
  private tween?: Phaser.Tweens.Tween;
  private readonly onRotated: (card: GameCard) => void;

  constructor(
    private readonly card: GameCard,
    private readonly scene: Phaser.Scene,
    fillColor: number,
    durationMs: number,
  ) {
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
      if (c === card) this.layout();
    };
    scene.events.on('card-rotated', this.onRotated);
  }

  destroy(): void {
    this.tween?.stop();
    this.scene.events.off('card-rotated', this.onRotated);
    this.bg.destroy();
    this.fill.destroy();
  }

  private layout(): void {
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
