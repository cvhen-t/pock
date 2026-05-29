import Phaser from 'phaser';
import { LAYOUT_ACTION_H, LAYOUT_BACKPACK_MAX_W, LAYOUT_BACKPACK_MIN_W, LAYOUT_BACKPACK_WIDTH_RATIO, LAYOUT_LANE_MAX_W, LAYOUT_LANE_MIN_W, LAYOUT_LANE_WIDTH_RATIO, LAYOUT_TOP_H, } from '../config/layoutConfig';
export function hudBarWidth(screenWidth) {
    return Math.min(400, Math.max(260, screenWidth - 24));
}
export function readSafeTop(canvas) {
    const topInset = Number.parseFloat(getComputedStyle(canvas).getPropertyValue('padding-top') || '0');
    return Number.isFinite(topInset) && topInset > 0 ? topInset + 8 : 24;
}
export function readSafeBottom() {
    return 8;
}
export function computeLayout(width, height, safeTop, safeBottom) {
    const laneW = Phaser.Math.Clamp(width * LAYOUT_LANE_WIDTH_RATIO, LAYOUT_LANE_MIN_W, LAYOUT_LANE_MAX_W);
    const backpackW = Phaser.Math.Clamp(width * LAYOUT_BACKPACK_WIDTH_RATIO, LAYOUT_BACKPACK_MIN_W, LAYOUT_BACKPACK_MAX_W);
    const topHud = new Phaser.Geom.Rectangle(0, 0, width, safeTop + LAYOUT_TOP_H);
    const actionBar = new Phaser.Geom.Rectangle(0, height - LAYOUT_ACTION_H - safeBottom, width, LAYOUT_ACTION_H + safeBottom);
    const mainH = actionBar.top - topHud.bottom;
    const stackLane = new Phaser.Geom.Rectangle(0, topHud.bottom, laneW, mainH);
    const backpackBar = new Phaser.Geom.Rectangle(width - backpackW, topHud.bottom, backpackW, mainH);
    const playfield = new Phaser.Geom.Rectangle(laneW, topHud.bottom, width - laneW - backpackW, mainH);
    return { topHud, stackLane, playfield, backpackBar, actionBar };
}
export function containsRect(rect, sx, sy) {
    return rect.contains(sx, sy);
}
