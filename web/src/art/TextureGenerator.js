import Phaser from 'phaser';
import { CARD_SHAPES } from '../config/cardLayout';
import { drawIconFrame, drawIconKind } from './cardIconDraw';
import { resolveIconKind } from './cardIconKinds';
import { phaserIconCtx } from './cardIconPhaserCtx';
import { TEX } from './textureKeys';
/**
 * Procedural wasteland textures until `public/assets/` PNGs are wired in PreloaderScene.
 */
export function generateGameTextures(scene, cardIds) {
    drawAllCardShells(scene);
    for (const id of cardIds) {
        const key = TEX.icon(id);
        if (!scene.textures.exists(key)) {
            drawCardIcon(scene, id, key);
        }
    }
}
function drawAllCardShells(scene) {
    const shells = [
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
export function ensureWastelandBackground(scene, w, h) {
    if (scene.textures.exists(TEX.BG_WASTELAND)) {
        scene.textures.remove(TEX.BG_WASTELAND);
    }
    drawWastelandBackground(scene, w, h);
}
function drawWastelandBackground(scene, w, h) {
    const g = scene.make.graphics({ x: 0, y: 0 }, false);
    const skyTop = 0x12100e;
    const skyBottom = 0x2a241c;
    for (let y = 0; y < h * 0.55; y++) {
        const t = y / (h * 0.55);
        const c = Phaser.Display.Color.Interpolate.ColorWithColor(Phaser.Display.Color.IntegerToColor(skyTop), Phaser.Display.Color.IntegerToColor(skyBottom), 100, Math.floor(t * 100));
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
        const c = Phaser.Display.Color.Interpolate.ColorWithColor(Phaser.Display.Color.IntegerToColor(groundTop), Phaser.Display.Color.IntegerToColor(groundBottom), 100, Math.floor(t * 100));
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
function drawRuinSilhouette(g, x, baseY, width, height) {
    g.fillRect(x, baseY - height, width * 0.35, height);
    g.fillRect(x + width * 0.45, baseY - height * 0.7, width * 0.4, height * 0.7);
    g.fillTriangle(x + width * 0.2, baseY - height, x + width * 0.5, baseY - height * 1.15, x + width * 0.75, baseY - height * 0.85);
}
function drawCardShell(scene, key, w, h) {
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
function drawCardIcon(scene, cardId, key) {
    const size = 64;
    const g = scene.make.graphics({ x: 0, y: 0 }, false);
    const ctx = phaserIconCtx(g);
    drawIconFrame(ctx, size);
    drawIconKind(ctx, resolveIconKind(cardId), size);
    g.generateTexture(key, size, size);
    g.destroy();
}
