import Phaser from 'phaser';

import {
  ATTACK_VFX,
  SPORE_FRAME_COUNT,
  SPORE_FRAME_H,
  SPORE_FRAME_W,
} from './attackVfxKeys';

/** Frame 0 muzzle puff → 1–2 travel → 3 splash → 4–5 dissipate. */
export function buildSporeBurstAtlasProcedural(scene: Phaser.Scene): void {
  buildSporeAtlas(scene);
}

function buildSporeAtlas(scene: Phaser.Scene): void {
  const atlasW = SPORE_FRAME_W * SPORE_FRAME_COUNT;
  const g = scene.make.graphics({ x: 0, y: 0 }, false);

  for (let i = 0; i < SPORE_FRAME_COUNT; i++) {
    drawSporeFrame(g, i * SPORE_FRAME_W, 0, i);
  }

  g.generateTexture(ATTACK_VFX.SPORE_BURST_ATLAS, atlasW, SPORE_FRAME_H);
  g.destroy();

  const tex = scene.textures.get(ATTACK_VFX.SPORE_BURST_ATLAS);
  for (let i = 0; i < SPORE_FRAME_COUNT; i++) {
    tex.add(i, 0, i * SPORE_FRAME_W, 0, SPORE_FRAME_W, SPORE_FRAME_H);
  }
}

function drawSporeFrame(
  g: Phaser.GameObjects.Graphics,
  ox: number,
  oy: number,
  frame: number,
): void {
  const w = SPORE_FRAME_W;
  const h = SPORE_FRAME_H;
  const cx = ox + w / 2;
  const cy = oy + h / 2;

  g.fillStyle(0x1a1612, 0.08);
  g.fillRect(ox, oy, w, h);

  if (frame === 0) {
    g.fillStyle(0x3a5a32, 0.45);
    g.fillCircle(cx, cy + 4, 10);
    g.fillStyle(0x4a6a38, 0.7);
    g.fillCircle(cx, cy + 2, 6);
    return;
  }

  if (frame <= 2) {
    const r = frame === 1 ? 9 : 11;
    g.fillStyle(0x3a5230, 0.75);
    g.fillCircle(cx, cy, r);
    g.fillStyle(0x5a7a48, 0.55);
    g.fillCircle(cx - 3, cy - 2, 4);
    g.fillCircle(cx + 4, cy + 1, 3);
    g.fillStyle(0x6a8a50, 0.35);
    g.fillCircle(cx + 1, cy - 4, 5);
    return;
  }

  if (frame === 3) {
    g.fillStyle(0x4a6a38, 0.5);
    g.fillCircle(cx, cy + 2, 18);
    g.fillStyle(0x5a7a48, 0.65);
    g.fillCircle(cx - 6, cy, 5);
    g.fillCircle(cx + 7, cy - 2, 4);
    g.fillCircle(cx + 2, cy + 6, 4);
    g.lineStyle(1, 0x6a8a50, 0.6);
    g.strokeCircle(cx, cy + 2, 14);
    return;
  }

  const fade = frame === 4 ? 0.5 : 0.25;
  g.fillStyle(0x4a6a38, fade);
  g.fillCircle(cx, cy + 2, 12);
  g.fillStyle(0x5a7a48, fade * 0.7);
  g.fillCircle(cx - 4, cy, 3);
  g.fillCircle(cx + 5, cy - 1, 3);
}
