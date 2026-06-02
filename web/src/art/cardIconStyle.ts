import type { IconDrawCtx } from './cardIconTypes';

export const ICON_SCALE = 1.08;

/** 卡牌图标 / 卡面内衬统一底色 #c9c4bc */
export const CARD_ICON_BG = 0xcbc0b5;
export const CARD_ICON_BG_HEX = '#3f3e3d';
/** 卡面内衬统一不透明度 */
export const CARD_INNER_ALPHA = 0.1;

export function resolveCardInnerAlpha(_cardId?: string): number {
  return CARD_INNER_ALPHA;
}

export function iconK(size: number): number {
  return (size / 56) * ICON_SCALE;
}

/** 统一灰白圆角底 — 所有卡牌图标先画此层 */
export function drawIconBackground(ctx: IconDrawCtx, size: number): void {
  const pad = 5;
  const r = Math.floor(size * 0.14);
  ctx.fillStyle(CARD_ICON_BG, 1);
  ctx.fillRoundedRect(pad, pad, size - pad * 2, size - pad * 2, r);
  ctx.strokeStyle(CARD_ICON_BG, 1.2, 1);
  ctx.strokeRoundedRect(pad + 1, pad + 1, size - pad * 2 - 2, size - pad * 2 - 2, Math.max(2, r - 1));
}

/** @deprecated 已改用灰白底，保留空实现避免旧调用 */
export function drawGround(
  _ctx: IconDrawCtx,
  _cx: number,
  _cy: number,
  _k: number,
  _rw = 20,
  _rh = 7,
): void {}

export function drawSandbags(ctx: IconDrawCtx, cx: number, cy: number, k: number, spread = 20): void {
  ctx.fillStyle(0x5c5348, 1);
  ctx.fillRoundedRect(cx - spread * k, cy + 4 * k, 8 * k, 10 * k, 2 * k);
  ctx.fillRoundedRect(cx + (spread - 8) * k, cy + 4 * k, 8 * k, 10 * k, 2 * k);
  ctx.fillStyle(0x6a6058, 0.9);
  ctx.fillRect(cx - (spread - 2) * k, cy + 6 * k, 5 * k, 2 * k);
  ctx.fillRect(cx + (spread - 5) * k, cy + 6 * k, 5 * k, 2 * k);
}

export function drawRustRoof(ctx: IconDrawCtx, cx: number, cy: number, k: number, halfW = 22): void {
  ctx.fillStyle(0x6a5a48, 1);
  ctx.fillTriangle(cx, cy - 20 * k, cx - halfW * k, cy - 1 * k, cx + halfW * k, cy - 1 * k);
  ctx.fillStyle(0x7a6a58, 1);
  ctx.fillTriangle(cx, cy - 18 * k, cx - 12 * k, cy - 6 * k, cx + 12 * k, cy - 6 * k);
  ctx.strokeStyle(0x5c4a38, 1.6 * k, 0.8);
  ctx.line(cx - 14 * k, cy - 12 * k, cx + 14 * k, cy - 12 * k);
  ctx.line(cx - 10 * k, cy - 8 * k, cx + 10 * k, cy - 8 * k);
}

export function drawWoodenWalls(
  ctx: IconDrawCtx,
  cx: number,
  cy: number,
  k: number,
  w = 32,
  h = 22,
): void {
  ctx.fillStyle(0x3d3428, 1);
  ctx.fillRoundedRect(cx - (w / 2) * k, cy - 1 * k, w * k, h * k, 3 * k);
  ctx.fillStyle(0x4a4038, 1);
  ctx.fillRect(cx - (w / 2 - 2) * k, cy + 2 * k, (w - 4) * k, (h - 4) * k);
}

export function drawGoldenDoor(ctx: IconDrawCtx, cx: number, cy: number, k: number): void {
  ctx.fillStyle(0xc9a030, 1);
  ctx.fillRoundedRect(cx - 6 * k, cy + 3 * k, 12 * k, 14 * k, 2 * k);
  ctx.fillStyle(0x8b6914, 1);
  ctx.fillRect(cx - 3 * k, cy + 4 * k, 2.5 * k, 12 * k);
  ctx.fillRect(cx + 0.5 * k, cy + 4 * k, 2.5 * k, 12 * k);
  ctx.fillStyle(0x6a5018, 1);
  ctx.fillCircle(cx, cy + 14 * k, 1.6 * k);
}

export function drawCommandFlag(ctx: IconDrawCtx, cx: number, cy: number, k: number, x = 10): void {
  ctx.fillStyle(0x5a5550, 1);
  ctx.fillRect(cx + x * k, cy - 16 * k, 2.5 * k, 18 * k);
  ctx.fillStyle(0x8b5038, 1);
  ctx.fillTriangle(cx + (x + 2.5) * k, cy - 16 * k, cx + (x + 9) * k, cy - 12 * k, cx + (x + 2.5) * k, cy - 8 * k);
}

export function drawScrapPatch(ctx: IconDrawCtx, cx: number, cy: number, k: number, side = -14): void {
  ctx.fillStyle(0x7a7068, 1);
  ctx.fillRect(cx + side * k, cy + 5 * k, 6 * k, 5 * k);
  ctx.strokeStyle(0x5a5550, 1 * k, 1);
  ctx.line(cx + (side + 1) * k, cy + 6 * k, cx + (side + 4) * k, cy + 9 * k);
}

/** 废土棚屋（建筑类通用） */
export function drawWastelandShelter(
  ctx: IconDrawCtx,
  cx: number,
  cy: number,
  k: number,
  opts: { sandbags?: boolean; flag?: boolean; door?: boolean; patch?: boolean } = {},
): void {
  const { sandbags = true, flag = false, door = true, patch = true } = opts;
  if (sandbags) drawSandbags(ctx, cx, cy, k);
  drawWoodenWalls(ctx, cx, cy, k);
  drawRustRoof(ctx, cx, cy, k);
  if (patch) drawScrapPatch(ctx, cx, cy, k);
  if (door) drawGoldenDoor(ctx, cx, cy, k);
  if (flag) drawCommandFlag(ctx, cx, cy, k);
}

/** 物品高光描边 */
export function drawItemGleam(ctx: IconDrawCtx, x1: number, y1: number, x2: number, y2: number, k: number): void {
  ctx.strokeStyle(0xc9c4b8, 1.2 * k, 0.55);
  ctx.line(x1, y1, x2, y2);
}
