import Phaser from 'phaser';

import {
  THORNVINE_WORLD_FRAME_COUNT,
  THORNVINE_WORLD_FRAME_H,
  THORNVINE_WORLD_FRAME_W,
  WORLD_SPRITE,
} from './worldSpriteKeys';

/** Idle swaying thornvine for placed `plant_thornvine` cards. */
export function buildThornvineWorldAtlasProcedural(scene: Phaser.Scene): void {
  const atlasW = THORNVINE_WORLD_FRAME_W * THORNVINE_WORLD_FRAME_COUNT;
  const g = scene.make.graphics({ x: 0, y: 0 }, false);

  for (let i = 0; i < THORNVINE_WORLD_FRAME_COUNT; i++) {
    drawThornvineWorldFrame(g, i * THORNVINE_WORLD_FRAME_W, 0, i);
  }

  g.generateTexture(WORLD_SPRITE.PLANT_THORNVINE_ATLAS, atlasW, THORNVINE_WORLD_FRAME_H);
  g.destroy();

  const tex = scene.textures.get(WORLD_SPRITE.PLANT_THORNVINE_ATLAS);
  for (let i = 0; i < THORNVINE_WORLD_FRAME_COUNT; i++) {
    tex.add(i, 0, i * THORNVINE_WORLD_FRAME_W, 0, THORNVINE_WORLD_FRAME_W, THORNVINE_WORLD_FRAME_H);
  }
}

function drawThornvineWorldFrame(
  g: Phaser.GameObjects.Graphics,
  ox: number,
  oy: number,
  frame: number,
): void {
  const w = THORNVINE_WORLD_FRAME_W;
  const h = THORNVINE_WORLD_FRAME_H;
  const baseX = ox + w / 2;
  const groundY = oy + h - 8;
  const sway = Math.sin((frame / THORNVINE_WORLD_FRAME_COUNT) * Math.PI * 2) * 5;
  const lean = sway * 0.55;

  g.fillStyle(0x1a1612, 0.08);
  g.fillRect(ox, oy, w, h);

  g.fillStyle(0x2a241c, 0.35);
  g.fillEllipse(baseX + lean * 0.3, groundY + 2, 22, 6);

  g.fillStyle(0x3a3228, 1);
  g.fillRect(baseX + lean * 0.15 - 3, groundY - 10, 6, 12);

  const stems: [number, number, number][] = [
    [-14, -42, -8],
    [12, -38, 6],
    [-6, -52, -4],
    [8, -48, 5],
    [0, -58, 0],
  ];

  for (const [sx, sy, thornDir] of stems) {
    const tipX = baseX + sx + lean;
    const tipY = groundY + sy;
    const rootX = baseX + sx * 0.2 + lean * 0.4;
    const rootY = groundY - 8;

    g.lineStyle(3, 0x2e4a28, 1);
    g.lineBetween(rootX, rootY, tipX, tipY);
    g.lineStyle(2, 0x3a5c32, 0.85);
    g.lineBetween(rootX, rootY, tipX, tipY);

    g.fillStyle(0x4a5c38, 1);
    g.fillCircle(tipX, tipY, 4);
    g.fillStyle(0x3a4a30, 1);
    g.fillCircle(tipX - 2, tipY + 1, 2.5);

    const thornX = tipX + thornDir;
    const thornY = tipY + 4;
    g.fillStyle(0x5c4038, 1);
    g.fillTriangle(thornX, thornY, thornX + thornDir * 2, thornY + 5, thornX - thornDir, thornY + 6);
    g.fillStyle(0x7a5a48, 0.9);
    g.fillCircle(thornX, thornY + 1, 2);
  }

  g.lineStyle(1, 0x5c4038, 0.5);
  for (let i = 0; i < 3; i++) {
    const px = baseX + lean + (i - 1) * 7;
    g.lineBetween(px, groundY - 4, px + lean * 0.2, groundY - 14 - i * 3);
  }
}
