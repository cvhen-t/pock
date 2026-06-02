import type Phaser from 'phaser';
import type { IconDrawCtx } from './cardIconDraw';

export function phaserIconCtx(g: Phaser.GameObjects.Graphics): IconDrawCtx {
  return {
    fillStyle(color, alpha = 1) {
      g.fillStyle(color, alpha);
    },
    strokeStyle(color, width, alpha = 1) {
      g.lineStyle(width, color, alpha);
    },
    fillCircle(x, y, r) {
      g.fillCircle(x, y, r);
    },
    strokeCircle(x, y, r) {
      g.strokeCircle(x, y, r);
    },
    fillRect(x, y, w, h) {
      g.fillRect(x, y, w, h);
    },
    fillRoundedRect(x, y, w, h, r) {
      g.fillRoundedRect(x, y, w, h, r);
    },
    fillEllipse(x, y, rw, rh) {
      g.fillEllipse(x, y, rw, rh);
    },
    strokeEllipse(x, y, rw, rh) {
      g.strokeEllipse(x, y, rw, rh);
    },
    line(x1, y1, x2, y2) {
      g.lineBetween(x1, y1, x2, y2);
    },
    fillTriangle(x1, y1, x2, y2, x3, y3) {
      g.fillTriangle(x1, y1, x2, y2, x3, y3);
    },
    strokeRoundedRect(x, y, w, h, r) {
      g.strokeRoundedRect(x, y, w, h, r);
    },
  };
}
