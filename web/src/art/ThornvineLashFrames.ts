import Phaser from 'phaser';

import {
  ATTACK_VFX,
  THORNVINE_LASH_FRAME_COUNT,
  THORNVINE_LASH_FRAME_H,
  THORNVINE_LASH_FRAME_W,
} from './attackVfxKeys';

/** Thornvine lash spritesheet — visual language aligned with `ThornvineWorldFrames`. */
export function buildThornvineLashAtlasProcedural(scene: Phaser.Scene): void {
  const atlasW = THORNVINE_LASH_FRAME_W * THORNVINE_LASH_FRAME_COUNT;
  const g = scene.make.graphics({ x: 0, y: 0 }, false);

  for (let i = 0; i < THORNVINE_LASH_FRAME_COUNT; i++) {
    drawThornvineLashFrame(g, i * THORNVINE_LASH_FRAME_W, 0, i);
  }

  g.generateTexture(ATTACK_VFX.THORNVINE_LASH_ATLAS, atlasW, THORNVINE_LASH_FRAME_H);
  g.destroy();

  const tex = scene.textures.get(ATTACK_VFX.THORNVINE_LASH_ATLAS);
  for (let i = 0; i < THORNVINE_LASH_FRAME_COUNT; i++) {
    tex.add(i, 0, i * THORNVINE_LASH_FRAME_W, 0, THORNVINE_LASH_FRAME_W, THORNVINE_LASH_FRAME_H);
  }
}

/** 0 coil → 1–3 extend → 4–5 whip → 6 impact → 7 retract. */
function drawThornvineLashFrame(
  g: Phaser.GameObjects.Graphics,
  ox: number,
  oy: number,
  frame: number,
): void {
  const w = THORNVINE_LASH_FRAME_W;
  const h = THORNVINE_LASH_FRAME_H;
  const baseX = ox + w / 2;
  const groundY = oy + h - 8;
  const grow = Phaser.Math.Clamp(frame / 5, 0, 1);
  const whip = frame >= 4 && frame <= 6 ? 1 : frame >= 2 ? 0.55 : 0;
  const lean = frame >= 5 ? -14 : frame >= 3 ? -8 : frame >= 1 ? -3 : 0;

  g.fillStyle(0x1a1612, 0.06);
  g.fillRect(ox, oy, w, h);

  g.fillStyle(0x2a241c, 0.4);
  g.fillEllipse(baseX + lean * 0.2, groundY + 2, 20 + grow * 12, 7);

  g.fillStyle(0x3a3228, 1);
  g.fillRect(baseX - 3, groundY - 10, 6, 12);

  if (frame === 0) {
    g.lineStyle(2, 0x3a5c32, 0.7);
    g.lineBetween(baseX, groundY - 8, baseX - 6, groundY - 18);
    g.lineBetween(baseX, groundY - 8, baseX + 8, groundY - 16);
    return;
  }

  const mainLen = 12 + grow * 72;
  const tipX = baseX + lean;
  const tipY = groundY - mainLen;

  drawLashStem(g, baseX, groundY - 6, tipX, tipY, 4, true);

  if (grow >= 0.35) {
    const branchT = 0.45 + whip * 0.15;
    const bx = Phaser.Math.Linear(baseX, tipX, branchT);
    const by = Phaser.Math.Linear(groundY - 6, tipY, branchT);
    drawLashStem(g, bx, by, bx - 18 - whip * 6, by - 22 - whip * 8, 2.5, false);
    drawLashStem(g, bx, by, bx + 16 + whip * 4, by - 18 - whip * 6, 2.5, false);
  }

  if (grow >= 0.55) {
    const midX = Phaser.Math.Linear(baseX, tipX, 0.62);
    const midY = Phaser.Math.Linear(groundY - 6, tipY, 0.62);
    placeThorn(g, midX - 10, midY + 2, -1);
    placeThorn(g, midX + 9, midY + 4, 1);
  }

  if (frame >= 3) {
    placeThorn(g, tipX - 8, tipY + 6, -1);
    placeThorn(g, tipX + 7, tipY + 5, 1);
    g.fillStyle(0x4a5c38, 1);
    g.fillCircle(tipX, tipY, 5);
    g.fillStyle(0x3a4a30, 1);
    g.fillCircle(tipX - 2, tipY + 1, 3);
  }

  if (frame >= 5) {
    g.lineStyle(2, 0x4a6a38, 0.9);
    g.lineBetween(tipX, tipY, tipX - 16, tipY - 8);
    g.lineBetween(tipX, tipY, tipX + 14, tipY - 6);
    g.lineBetween(tipX, tipY, tipX - 4, tipY - 18);
  }

  if (frame === 6) {
    g.fillStyle(0x8a6a48, 0.35);
    g.fillCircle(tipX, tipY - 2, 16);
    g.lineStyle(2, 0x7a5a48, 0.85);
    g.strokeCircle(tipX, tipY - 2, 13);
    g.fillStyle(0x6a8a48, 0.25);
    g.fillCircle(tipX, tipY - 2, 9);
  }

  if (frame === 7) {
    g.fillStyle(0x2e2820, 0.35);
    g.fillEllipse(baseX, groundY, 16, 5);
  }
}

function drawLashStem(
  g: Phaser.GameObjects.Graphics,
  x0: number,
  y0: number,
  x1: number,
  y1: number,
  width: number,
  thorns: boolean,
): void {
  const mx = (x0 + x1) / 2 + (x1 - x0) * 0.08;
  const my = (y0 + y1) / 2 - 6;

  g.lineStyle(width, 0x2e4a28, 1);
  g.beginPath();
  g.moveTo(x0, y0);
  g.lineTo(mx, my);
  g.lineTo(x1, y1);
  g.strokePath();

  g.lineStyle(Math.max(1.5, width - 1.5), 0x3a5c32, 0.85);
  g.lineBetween(x0, y0, mx, my);

  if (thorns) {
    placeThorn(g, mx - 7, my + 3, -1);
    placeThorn(g, mx + 8, my + 2, 1);
  }
}

function placeThorn(
  g: Phaser.GameObjects.Graphics,
  x: number,
  y: number,
  dir: number,
): void {
  g.fillStyle(0x5c4038, 1);
  g.fillTriangle(x, y, x + dir * 3, y + 6, x - dir * 2, y + 7);
  g.fillStyle(0x7a5a48, 0.9);
  g.fillCircle(x, y + 1, 2);
}
