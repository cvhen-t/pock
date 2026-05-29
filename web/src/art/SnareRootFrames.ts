import Phaser from 'phaser';

import {
  ATTACK_VFX,
  SNARE_FRAME_COUNT,
  SNARE_FRAME_H,
  SNARE_FRAME_W,
} from './attackVfxKeys';

/** Frame 0 crack → 1–3 spread → 4–5 wrap → 6 tighten → 7 sink. */
export function buildSnareRootAtlasProcedural(scene: Phaser.Scene): void {
  buildSnareAtlas(scene);
}

function buildSnareAtlas(scene: Phaser.Scene): void {
  const atlasW = SNARE_FRAME_W * SNARE_FRAME_COUNT;
  const g = scene.make.graphics({ x: 0, y: 0 }, false);

  for (let i = 0; i < SNARE_FRAME_COUNT; i++) {
    drawSnareFrame(g, i * SNARE_FRAME_W, 0, i);
  }

  g.generateTexture(ATTACK_VFX.UNDERGROUND_SNARE_ATLAS, atlasW, SNARE_FRAME_H);
  g.destroy();

  const tex = scene.textures.get(ATTACK_VFX.UNDERGROUND_SNARE_ATLAS);
  for (let i = 0; i < SNARE_FRAME_COUNT; i++) {
    tex.add(i, 0, i * SNARE_FRAME_W, 0, SNARE_FRAME_W, SNARE_FRAME_H);
  }
}

function drawSnareFrame(
  g: Phaser.GameObjects.Graphics,
  ox: number,
  oy: number,
  frame: number,
): void {
  const w = SNARE_FRAME_W;
  const h = SNARE_FRAME_H;
  const baseX = ox + w / 2;
  const groundY = oy + h - 8;
  const ankleY = groundY - 18;

  g.fillStyle(0x1a1612, 0.1);
  g.fillRect(ox, oy, w, h);

  const crackAlpha = frame === 0 ? 0.85 : frame <= 2 ? 0.5 : frame >= 7 ? 0.15 : 0.3;
  g.lineStyle(1, 0x3a3228, crackAlpha);
  g.lineBetween(baseX - 22, groundY, baseX - 8, groundY - 2);
  g.lineBetween(baseX + 10, groundY, baseX + 24, groundY - 1);
  g.lineBetween(baseX - 6, groundY, baseX + 8, groundY - 3);
  g.lineBetween(baseX - 16, groundY + 1, baseX + 18, groundY + 1);

  if (frame === 0) return;

  const spread = Phaser.Math.Clamp(frame / 4, 0.2, 1);
  g.fillStyle(0x2a241c, 0.45);
  g.fillEllipse(baseX, groundY + 2, 28 + spread * 14, 7);

  const rootColor = 0x3a4a28;
  const rootHi = 0x4a5c32;
  g.lineStyle(2.5, rootColor, 0.95);

  const roots = 3;
  for (let r = 0; r < roots; r++) {
    const side = r === 0 ? -1 : r === 1 ? 1 : 0;
    const reach = (18 + spread * 22) * (side === 0 ? 0.7 : 1);
    const endX = baseX + side * reach;
    const endY = ankleY + (frame >= 4 ? 4 : 0);
    const ctrlX = baseX + side * reach * 0.45;
    const ctrlY = groundY - 6 - spread * 8;

    g.beginPath();
    g.moveTo(baseX + side * 4, groundY);
    g.lineTo(ctrlX, ctrlY);
    g.lineTo(endX, endY);
    g.strokePath();

    g.lineStyle(1.5, rootHi, 0.7);
    g.lineBetween(baseX, groundY, ctrlX, ctrlY);
    g.lineStyle(2.5, rootColor, 0.95);
  }

  if (frame >= 4) {
    const wrapW = frame >= 5 ? 26 : 20;
    const wrapH = frame >= 6 ? 16 : 12;
    g.lineStyle(2, rootColor, frame >= 6 ? 0.95 : 0.7);
    g.strokeEllipse(baseX, ankleY + 2, wrapW, wrapH);

    if (frame >= 5) {
      g.lineStyle(1.5, 0x5a4a30, 0.6);
      g.lineBetween(baseX - wrapW * 0.35, ankleY, baseX + wrapW * 0.3, ankleY + 4);
      g.lineBetween(baseX + wrapW * 0.25, ankleY - 2, baseX - wrapW * 0.2, ankleY + 6);
    }
  }

  if (frame === 6) {
    g.fillStyle(0x8a7a50, 0.2);
    g.fillEllipse(baseX, ankleY + 2, 30, 14);
  }

  if (frame === 7) {
    g.fillStyle(0x2e2820, 0.45);
    g.fillEllipse(baseX, groundY, 24, 6);
  }
}
