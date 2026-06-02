/** Minimal 2D API shared by Phaser.Graphics and node-canvas. */
export interface IconDrawCtx {
  fillStyle(color: number, alpha?: number): void;
  strokeStyle(color: number, width: number, alpha?: number): void;
  fillCircle(x: number, y: number, r: number): void;
  strokeCircle(x: number, y: number, r: number): void;
  fillRect(x: number, y: number, w: number, h: number): void;
  fillRoundedRect(x: number, y: number, w: number, h: number, r: number): void;
  fillEllipse(x: number, y: number, rw: number, rh: number): void;
  strokeEllipse(x: number, y: number, rw: number, rh: number): void;
  line(x1: number, y1: number, x2: number, y2: number): void;
  fillTriangle(x1: number, y1: number, x2: number, y2: number, x3: number, y3: number): void;
  strokeRoundedRect(x: number, y: number, w: number, h: number, r: number): void;
}
