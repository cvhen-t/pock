import Phaser from 'phaser';

import {
  LAYOUT_HAND_H,
  LAYOUT_LANE_MAX_W,
  LAYOUT_LANE_MIN_W,
  LAYOUT_LANE_WIDTH_RATIO,
  LAYOUT_TOP_H,
} from '../config/layoutConfig';

export interface GameLayoutRects {
  topHud: Phaser.Geom.Rectangle;
  stackLane: Phaser.Geom.Rectangle;
  playfield: Phaser.Geom.Rectangle;
  handBar: Phaser.Geom.Rectangle;
}

export function hudBarWidth(screenWidth: number): number {
  return Math.min(400, Math.max(260, screenWidth - 24));
}

export function readSafeTop(canvas: HTMLCanvasElement): number {
  const topInset = Number.parseFloat(
    getComputedStyle(canvas).getPropertyValue('padding-top') || '0',
  );
  return Number.isFinite(topInset) && topInset > 0 ? topInset + 8 : 24;
}

export function readSafeBottom(): number {
  return 8;
}

export function computeLayout(
  width: number,
  height: number,
  safeTop: number,
  safeBottom: number,
): GameLayoutRects {
  const laneW = Phaser.Math.Clamp(
    width * LAYOUT_LANE_WIDTH_RATIO,
    LAYOUT_LANE_MIN_W,
    LAYOUT_LANE_MAX_W,
  );

  const topHud = new Phaser.Geom.Rectangle(0, safeTop, width, LAYOUT_TOP_H);
  const handBar = new Phaser.Geom.Rectangle(
    0,
    height - LAYOUT_HAND_H - safeBottom,
    width,
    LAYOUT_HAND_H + safeBottom,
  );
  const stackLane = new Phaser.Geom.Rectangle(
    0,
    topHud.bottom,
    laneW,
    handBar.top - topHud.bottom,
  );
  const playfield = new Phaser.Geom.Rectangle(
    laneW,
    topHud.bottom,
    width - laneW,
    handBar.top - topHud.bottom,
  );

  return { topHud, stackLane, playfield, handBar };
}

export function containsRect(rect: Phaser.Geom.Rectangle, sx: number, sy: number): boolean {
  return rect.contains(sx, sy);
}
