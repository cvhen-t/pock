import Phaser from 'phaser';
import { CARD_SHAPES } from '../config/cardLayout';
import { TEX } from './textureKeys';

/**
 * Procedural wasteland textures until `public/assets/` PNGs are wired in PreloaderScene.
 */
export function generateGameTextures(scene: Phaser.Scene, cardIds: string[]): void {
  drawAllCardShells(scene);
  for (const id of cardIds) {
    const key = TEX.icon(id);
    if (!scene.textures.exists(key)) {
      drawCardIcon(scene, id, key);
    }
  }
}

function drawAllCardShells(scene: Phaser.Scene): void {
  const shells: { key: string; w: number; h: number }[] = [
    { key: TEX.CARD_SHELL, ...CARD_SHAPES.standard },
    { key: TEX.CARD_SHELL_COMPACT, ...CARD_SHAPES.compact },
    { key: TEX.CARD_SHELL_SLIM, ...CARD_SHAPES.slim },
    { key: TEX.CARD_SHELL_WIDE, ...CARD_SHAPES.wide },
    { key: TEX.CARD_SHELL_TILE, ...CARD_SHAPES.tile },
  ];
  for (const { key, w, h } of shells) {
    if (!scene.textures.exists(key)) {
      drawCardShell(scene, key, w, h);
    }
  }
}

/** (Re)build background texture to match current viewport. */
export function ensureWastelandBackground(scene: Phaser.Scene, w: number, h: number): void {
  if (scene.textures.exists(TEX.BG_WASTELAND)) {
    scene.textures.remove(TEX.BG_WASTELAND);
  }
  drawWastelandBackground(scene, w, h);
}

function drawWastelandBackground(scene: Phaser.Scene, w: number, h: number): void {
  const g = scene.make.graphics({ x: 0, y: 0 }, false);

  const skyTop = 0x12100e;
  const skyBottom = 0x2a241c;
  for (let y = 0; y < h * 0.55; y++) {
    const t = y / (h * 0.55);
    const c = Phaser.Display.Color.Interpolate.ColorWithColor(
      Phaser.Display.Color.IntegerToColor(skyTop),
      Phaser.Display.Color.IntegerToColor(skyBottom),
      100,
      Math.floor(t * 100),
    );
    g.fillStyle(Phaser.Display.Color.GetColor(c.r, c.g, c.b), 1);
    g.fillRect(0, y, w, 1);
  }

  const horizonY = h * 0.48;
  g.fillStyle(0x3d3428, 0.35);
  g.fillEllipse(w / 2, horizonY, w * 1.1, 80);

  const groundTop = 0x2e2820;
  const groundBottom = 0x1a1612;
  for (let y = Math.floor(horizonY); y < h; y++) {
    const t = (y - horizonY) / (h - horizonY);
    const c = Phaser.Display.Color.Interpolate.ColorWithColor(
      Phaser.Display.Color.IntegerToColor(groundTop),
      Phaser.Display.Color.IntegerToColor(groundBottom),
      100,
      Math.floor(t * 100),
    );
    g.fillStyle(Phaser.Display.Color.GetColor(c.r, c.g, c.b), 1);
    g.fillRect(0, y, w, 1);
  }

  g.fillStyle(0x1e1a16, 0.55);
  drawRuinSilhouette(g, 40, horizonY + 12, 48, 36);
  drawRuinSilhouette(g, w - 70, horizonY + 8, 56, 42);
  drawRuinSilhouette(g, w * 0.42, horizonY + 18, 72, 28);

  g.fillStyle(0x4a4034, 0.22);
  for (let i = 0; i < 18; i++) {
    const px = ((i * 47) % (w - 16)) + 8;
    const py = ((i * 31) % Math.floor(h - horizonY - 80)) + Math.floor(horizonY) + 40;
    g.fillCircle(px, py, 1 + (i % 3));
  }

  g.fillStyle(0x000000, 0.45);
  g.fillRect(0, 0, w, 48);
  g.fillStyle(0x000000, 0.55);
  g.fillRect(0, h - 72, w, 72);

  g.generateTexture(TEX.BG_WASTELAND, w, h);
  g.destroy();
}

function drawRuinSilhouette(
  g: Phaser.GameObjects.Graphics,
  x: number,
  baseY: number,
  width: number,
  height: number,
): void {
  g.fillRect(x, baseY - height, width * 0.35, height);
  g.fillRect(x + width * 0.45, baseY - height * 0.7, width * 0.4, height * 0.7);
  g.fillTriangle(x + width * 0.2, baseY - height, x + width * 0.5, baseY - height * 1.15, x + width * 0.75, baseY - height * 0.85);
}

function drawCardShell(scene: Phaser.Scene, key: string, w: number, h: number): void {
  const r = Math.min(5, Math.floor(Math.min(w, h) * 0.1));
  const g = scene.make.graphics({ x: 0, y: 0 }, false);

  g.fillStyle(0x0c0a08, 0.45);
  g.fillRoundedRect(2, 2, w, h, r);

  g.fillStyle(0x3a3530, 1);
  g.fillRoundedRect(0, 0, w, h, r);
  g.lineStyle(1.5, 0x6a5f52, 1);
  g.strokeRoundedRect(1, 1, w - 2, h - 2, Math.max(1, r - 1));
  g.lineStyle(1, 0x2a2620, 0.8);
  g.strokeRoundedRect(3, 3, w - 6, h - 6, Math.max(1, r - 2));

  const headerH = Math.min(12, Math.floor(h * 0.14));
  g.fillStyle(0x5c5348, 0.35);
  g.fillRoundedRect(4, 4, w - 8, headerH, 2);

  g.generateTexture(key, w + 2, h + 4);
  g.destroy();
}

function drawCardIcon(scene: Phaser.Scene, cardId: string, key: string): void {
  const size = 56;
  const g = scene.make.graphics({ x: 0, y: 0 }, false);
  const cx = size / 2;
  const cy = size / 2;

  g.fillStyle(0x1a1814, 0.85);
  g.fillCircle(cx, cy, size / 2 - 2);
  g.lineStyle(1, 0x4a4540, 0.9);
  g.strokeCircle(cx, cy, size / 2 - 3);

  switch (cardId) {
    case 'survivor':
      drawSurvivorIcon(g, cx, cy);
      break;
    case 'rust_bush':
      drawBushIcon(g, cx, cy, 0x4a5c38, 0x6a5040);
      break;
    case 'berry_mutant':
      drawBerryIcon(g, cx, cy);
      break;
    case 'scrap_pile':
      drawScrapPileIcon(g, cx, cy);
      break;
    case 'scrap':
      drawScrapIcon(g, cx, cy);
      break;
    case 'base_camp':
      drawBaseCampIcon(g, cx, cy);
      break;
    case 'trader_post':
      drawTraderIcon(g, cx, cy);
      break;
    case 'blight_plot':
      drawSoilIcon(g, cx, cy, 0x3a4a32);
      break;
    case 'seed_thornvine':
      drawSeedIcon(g, cx, cy);
      break;
    case 'plant_thornvine':
      drawPlantIcon(g, cx, cy);
      break;
    case 'plant_sporegun':
      drawSporeIcon(g, cx, cy);
      break;
    case 'plant_weed':
      drawWeedIcon(g, cx, cy);
      break;
    case 'mutant_hound':
    case 'watch_dog':
      drawHoundIcon(g, cx, cy);
      break;
    case 'fence_iron':
    case 'barricade_wood':
      drawFenceIcon(g, cx, cy);
      break;
    case 'sandbag_wall':
    case 'gate_scrap':
    case 'spike_strip':
      drawWallIcon(g, cx, cy);
      break;
    case 'blight_plot':
    case 'bunker_sheet':
      drawSoilIcon(g, cx, cy, 0x3a4a32);
      break;
    case 'chicken_coop':
      drawCoopIcon(g, cx, cy);
      break;
    case 'rusty_machete':
      drawBladeIcon(g, cx, cy);
      break;
    case 'scrap_bow':
      drawBowIcon(g, cx, cy);
      break;
    case 'molotov':
      drawMolotovIcon(g, cx, cy);
      break;
    case 'seed_spore':
      drawSeedIcon(g, cx, cy);
      break;
    case 'trap_wire':
    case 'barbed_roll':
      drawWireIcon(g, cx, cy);
      break;
    case 'water_dirty':
    case 'water_clean':
      drawWaterIcon(g, cx, cy, cardId === 'water_clean');
      break;
    case 'canned_food':
      drawCanIcon(g, cx, cy);
      break;
    case 'caps':
      drawCapsIcon(g, cx, cy);
      break;
    case 'wood_plank':
      drawPlankIcon(g, cx, cy);
      break;
    case 'soil_clump':
      drawSoilClumpIcon(g, cx, cy);
      break;
    case 'wild_soil_mound':
      drawWildSoilIcon(g, cx, cy);
      break;
    case 'wild_ore_vein':
      drawWildOreIcon(g, cx, cy);
      break;
    case 'wild_tree_grove':
      drawWildTreeIcon(g, cx, cy);
      break;
    case 'wild_lake':
      drawWildLakeIcon(g, cx, cy);
      break;
    case 'feed_bag':
      drawFeedIcon(g, cx, cy);
      break;
    case 'iron_wheat_seed':
      drawSeedIcon(g, cx, cy);
      break;
    default:
      g.fillStyle(0x8b7355, 1);
      g.fillCircle(cx, cy, 8);
  }

  g.generateTexture(key, size, size);
  g.destroy();
}

function drawSurvivorIcon(g: Phaser.GameObjects.Graphics, cx: number, cy: number): void {
  g.fillStyle(0x8b7355, 1);
  g.fillCircle(cx, cy - 10, 7);
  g.fillStyle(0x5c4a3a, 1);
  g.fillRoundedRect(cx - 9, cy - 2, 18, 16, 3);
  g.fillStyle(0x4a4038, 1);
  g.fillRect(cx - 11, cy + 6, 6, 12);
  g.fillRect(cx + 5, cy + 6, 6, 12);
}

function drawBushIcon(
  g: Phaser.GameObjects.Graphics,
  cx: number,
  cy: number,
  leaf: number,
  rust: number,
): void {
  g.fillStyle(leaf, 1);
  g.fillCircle(cx - 8, cy + 2, 9);
  g.fillCircle(cx + 8, cy + 2, 9);
  g.fillCircle(cx, cy - 6, 10);
  g.fillStyle(rust, 0.9);
  g.fillCircle(cx + 4, cy + 4, 5);
  g.fillStyle(0x3a3228, 1);
  g.fillRect(cx - 2, cy + 8, 4, 10);
}

function drawBerryIcon(g: Phaser.GameObjects.Graphics, cx: number, cy: number): void {
  g.fillStyle(0x5c4038, 1);
  g.fillCircle(cx - 7, cy + 2, 5);
  g.fillCircle(cx + 6, cy, 5);
  g.fillCircle(cx, cy - 5, 5);
  g.fillStyle(0x6a4a38, 0.8);
  g.fillCircle(cx - 2, cy + 6, 4);
  g.fillStyle(0x3a4a2e, 1);
  g.fillRect(cx - 1, cy + 8, 2, 6);
}

function drawScrapPileIcon(g: Phaser.GameObjects.Graphics, cx: number, cy: number): void {
  g.fillStyle(0x5a5550, 1);
  g.fillRect(cx - 12, cy + 4, 24, 8);
  g.fillStyle(0x6a6058, 1);
  g.fillRect(cx - 8, cy - 4, 10, 10);
  g.fillRect(cx + 2, cy - 8, 8, 14);
  g.fillStyle(0x8b6914, 0.9);
  g.fillCircle(cx + 6, cy - 2, 3);
}

function drawScrapIcon(g: Phaser.GameObjects.Graphics, cx: number, cy: number): void {
  g.lineStyle(3, 0x7a7068, 1);
  g.strokeCircle(cx, cy, 10);
  g.lineBetween(cx - 6, cy - 6, cx + 6, cy + 6);
  g.fillStyle(0x8b7355, 1);
  g.fillRect(cx + 8, cy - 2, 6, 4);
}

function drawSoilIcon(g: Phaser.GameObjects.Graphics, cx: number, cy: number, tint: number): void {
  g.fillStyle(tint, 1);
  g.fillRoundedRect(cx - 14, cy - 6, 28, 18, 4);
  g.fillStyle(0x2e2820, 0.5);
  g.fillCircle(cx - 6, cy, 3);
  g.fillCircle(cx + 5, cy + 2, 2);
  g.fillStyle(0x4a4038, 0.6);
  g.fillRect(cx - 12, cy + 8, 24, 4);
}

function drawSeedIcon(g: Phaser.GameObjects.Graphics, cx: number, cy: number): void {
  g.fillStyle(0x5c4a32, 1);
  g.fillEllipse(cx, cy + 4, 10, 14);
  g.fillStyle(0x3a4a2e, 1);
  g.fillTriangle(cx, cy - 12, cx - 6, cy + 2, cx + 6, cy + 2);
  g.lineStyle(1, 0x6a5c40, 0.8);
  g.lineBetween(cx, cy - 10, cx, cy + 2);
}

function drawWeedIcon(g: Phaser.GameObjects.Graphics, cx: number, cy: number): void {
  g.fillStyle(0x4a5038, 1);
  g.fillCircle(cx - 6, cy + 4, 6);
  g.fillCircle(cx + 7, cy + 2, 5);
  g.fillStyle(0x3a4230, 1);
  g.fillRect(cx - 1, cy + 6, 3, 10);
}

function drawHoundIcon(g: Phaser.GameObjects.Graphics, cx: number, cy: number): void {
  g.fillStyle(0x5a4040, 1);
  g.fillEllipse(cx, cy + 4, 22, 12);
  g.fillStyle(0x4a3232, 1);
  g.fillCircle(cx + 10, cy - 6, 7);
  g.lineStyle(2, 0x6a4a4a, 1);
  g.lineBetween(cx + 14, cy - 4, cx + 18, cy - 2);
  g.fillStyle(0x8a3030, 0.9);
  g.fillCircle(cx + 12, cy - 7, 2);
}

function drawFenceIcon(g: Phaser.GameObjects.Graphics, cx: number, cy: number): void {
  g.lineStyle(3, 0x6a6560, 1);
  for (let i = -2; i <= 2; i++) {
    g.lineBetween(cx + i * 6, cy - 14, cx + i * 6, cy + 14);
  }
  g.lineBetween(cx - 12, cy - 8, cx + 12, cy - 8);
  g.lineBetween(cx - 12, cy + 8, cx + 12, cy + 8);
}

function drawWallIcon(g: Phaser.GameObjects.Graphics, cx: number, cy: number): void {
  g.fillStyle(0x5a5040, 1);
  g.fillRoundedRect(cx - 16, cy - 6, 32, 12, 2);
  g.fillStyle(0x4a4540, 1);
  g.fillRect(cx - 14, cy - 2, 8, 8);
  g.fillRect(cx - 2, cy - 2, 8, 8);
  g.fillRect(cx + 10, cy - 2, 6, 8);
}

function drawTraderIcon(g: Phaser.GameObjects.Graphics, cx: number, cy: number): void {
  g.fillStyle(0x5c4a38, 1);
  g.fillRoundedRect(cx - 16, cy - 4, 32, 16, 3);
  g.fillStyle(0x8b6914, 1);
  g.fillTriangle(cx, cy - 18, cx - 20, cy - 4, cx + 20, cy - 4);
  g.fillStyle(0x4a4030, 1);
  g.fillRect(cx - 10, cy + 2, 20, 10);
  g.fillStyle(0xc9b896, 1);
  g.fillCircle(cx, cy - 8, 4);
}

function drawBaseCampIcon(g: Phaser.GameObjects.Graphics, cx: number, cy: number): void {
  g.fillStyle(0x4a4038, 1);
  g.fillRoundedRect(cx - 14, cy - 8, 28, 18, 3);
  g.fillStyle(0x5c4a3a, 1);
  g.fillTriangle(cx, cy - 16, cx - 18, cy - 6, cx + 18, cy - 6);
  g.fillStyle(0x8b6914, 0.9);
  g.fillRect(cx - 4, cy + 2, 8, 10);
  g.lineStyle(2, 0x6a5f52, 0.8);
  g.strokeRoundedRect(cx - 15, cy - 9, 30, 20, 3);
}

function drawCoopIcon(g: Phaser.GameObjects.Graphics, cx: number, cy: number): void {
  g.fillStyle(0x5a4a32, 1);
  g.fillRoundedRect(cx - 14, cy - 4, 28, 14, 2);
  g.fillStyle(0x4a4030, 1);
  g.fillTriangle(cx, cy - 14, cx - 16, cy - 4, cx + 16, cy - 4);
}

function drawBladeIcon(g: Phaser.GameObjects.Graphics, cx: number, cy: number): void {
  g.fillStyle(0x7a7068, 1);
  g.fillTriangle(cx + 4, cy - 12, cx + 10, cy + 10, cx - 2, cy + 8);
  g.fillStyle(0x5c4a3a, 1);
  g.fillRect(cx - 8, cy + 4, 6, 12);
}

function drawBowIcon(g: Phaser.GameObjects.Graphics, cx: number, cy: number): void {
  g.lineStyle(2, 0x6a6058, 1);
  g.strokeEllipse(cx, cy, 14, 18);
  g.lineBetween(cx - 10, cy, cx + 10, cy);
}

function drawMolotovIcon(g: Phaser.GameObjects.Graphics, cx: number, cy: number): void {
  g.fillStyle(0x6a5040, 1);
  g.fillRect(cx - 4, cy + 2, 8, 12);
  g.fillStyle(0x8a4030, 0.9);
  g.fillCircle(cx, cy - 6, 7);
}

function drawSporeIcon(g: Phaser.GameObjects.Graphics, cx: number, cy: number): void {
  g.fillStyle(0x3a4a32, 1);
  g.fillCircle(cx, cy + 4, 10);
  g.fillStyle(0x5a6a48, 0.8);
  g.fillCircle(cx - 8, cy - 6, 4);
  g.fillCircle(cx + 8, cy - 4, 5);
  g.fillCircle(cx, cy - 10, 4);
}

function drawWireIcon(g: Phaser.GameObjects.Graphics, cx: number, cy: number): void {
  g.lineStyle(2, 0x7a7068, 1);
  for (let i = 0; i < 4; i++) {
    g.strokeEllipse(cx - 8 + i * 5, cy, 3, 8);
  }
}

function drawWaterIcon(g: Phaser.GameObjects.Graphics, cx: number, cy: number, clean: boolean): void {
  g.fillStyle(clean ? 0x4a5a5c : 0x3a4548, 1);
  g.fillRoundedRect(cx - 8, cy - 10, 16, 20, 3);
  g.fillStyle(clean ? 0x6a8a8c : 0x4a5058, 0.6);
  g.fillEllipse(cx, cy - 2, 10, 8);
}

function drawCanIcon(g: Phaser.GameObjects.Graphics, cx: number, cy: number): void {
  g.fillStyle(0x5c4a38, 1);
  g.fillRoundedRect(cx - 7, cy - 10, 14, 20, 2);
  g.fillStyle(0x8b7355, 0.8);
  g.fillRect(cx - 5, cy - 4, 10, 4);
}

function drawCapsIcon(g: Phaser.GameObjects.Graphics, cx: number, cy: number): void {
  g.fillStyle(0x8b6914, 1);
  g.fillCircle(cx - 6, cy, 6);
  g.fillCircle(cx + 6, cy, 6);
  g.fillCircle(cx, cy - 4, 5);
}

function drawSoilClumpIcon(g: Phaser.GameObjects.Graphics, cx: number, cy: number): void {
  g.fillStyle(0x5a4a38, 1);
  g.fillCircle(cx - 5, cy + 2, 6);
  g.fillCircle(cx + 6, cy, 5);
  g.fillCircle(cx, cy - 4, 5);
  g.fillStyle(0x3a3228, 0.7);
  g.fillRect(cx - 8, cy + 6, 16, 3);
}

function drawWildSoilIcon(g: Phaser.GameObjects.Graphics, cx: number, cy: number): void {
  drawSoilIcon(g, cx, cy, 0x5a4a38);
  g.fillStyle(0x4a6a38, 0.5);
  g.fillCircle(cx - 10, cy - 4, 4);
  g.fillCircle(cx + 8, cy - 2, 3);
}

function drawWildOreIcon(g: Phaser.GameObjects.Graphics, cx: number, cy: number): void {
  g.fillStyle(0x4a4848, 1);
  g.fillTriangle(cx - 14, cy + 8, cx, cy - 12, cx + 14, cy + 8);
  g.fillStyle(0x6a6560, 1);
  g.fillTriangle(cx - 8, cy + 6, cx - 2, cy - 4, cx + 6, cy + 6);
  g.fillStyle(0x8b7355, 0.9);
  g.fillCircle(cx + 4, cy - 2, 3);
  g.fillCircle(cx - 6, cy + 2, 2);
}

function drawWildTreeIcon(g: Phaser.GameObjects.Graphics, cx: number, cy: number): void {
  g.fillStyle(0x4a4030, 1);
  g.fillRect(cx - 2, cy + 2, 4, 14);
  g.fillRect(cx - 10, cy - 2, 4, 12);
  g.fillRect(cx + 8, cy, 4, 10);
  g.lineStyle(2, 0x5a4a32, 1);
  g.lineBetween(cx - 10, cy - 2, cx - 6, cy - 12);
  g.lineBetween(cx - 2, cy + 2, cx, cy - 14);
  g.lineBetween(cx + 10, cy, cx + 6, cy - 10);
}

function drawWildLakeIcon(g: Phaser.GameObjects.Graphics, cx: number, cy: number): void {
  g.fillStyle(0x3a4548, 1);
  g.fillEllipse(cx, cy + 2, 26, 14);
  g.fillStyle(0x4a5a5c, 0.55);
  g.fillEllipse(cx - 4, cy, 12, 6);
  g.fillStyle(0x4a4038, 0.8);
  g.fillRect(cx - 14, cy + 8, 28, 4);
}

function drawPlankIcon(g: Phaser.GameObjects.Graphics, cx: number, cy: number): void {
  g.fillStyle(0x6a5a40, 1);
  g.fillRect(cx - 12, cy - 4, 24, 6);
  g.fillRect(cx - 10, cy + 4, 20, 5);
}

function drawFeedIcon(g: Phaser.GameObjects.Graphics, cx: number, cy: number): void {
  g.fillStyle(0x5a4a32, 1);
  g.fillRoundedRect(cx - 10, cy - 6, 20, 14, 2);
  g.fillStyle(0x4a4030, 0.8);
  g.fillCircle(cx, cy - 10, 5);
}

function drawPlantIcon(g: Phaser.GameObjects.Graphics, cx: number, cy: number): void {
  g.fillStyle(0x3a3228, 1);
  g.fillRect(cx - 2, cy + 6, 4, 12);
  g.fillStyle(0x2e4a28, 1);
  g.lineStyle(2, 0x3a5c32, 1);
  g.lineBetween(cx, cy + 6, cx - 10, cy - 8);
  g.lineBetween(cx, cy + 6, cx + 10, cy - 8);
  g.lineBetween(cx, cy + 2, cx - 6, cy - 12);
  g.lineBetween(cx, cy + 2, cx + 8, cy - 10);
  g.fillStyle(0x5c4038, 1);
  g.fillCircle(cx - 10, cy - 8, 3);
  g.fillCircle(cx + 10, cy - 8, 3);
}
