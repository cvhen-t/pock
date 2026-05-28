import Phaser from 'phaser';
import { ATTACK_VFX, VINE_FRAME_COUNT, VINE_FRAME_H, VINE_FRAME_W, } from './attackVfxKeys';
/**
 * Procedural underground-vine spritesheet (8 frames) until
 * `public/assets/vfx/underground_vine.png` is wired in PreloaderScene.
 */
export function registerUndergroundVineVfx(scene) {
    if (!scene.textures.exists(ATTACK_VFX.UNDERGROUND_VINE_ATLAS)) {
        buildVineAtlas(scene);
    }
    if (!scene.textures.exists(ATTACK_VFX.DIRT_PARTICLE)) {
        buildDirtParticle(scene);
    }
    if (!scene.anims.exists(ATTACK_VFX.UNDERGROUND_VINE_ANIM)) {
        scene.anims.create({
            key: ATTACK_VFX.UNDERGROUND_VINE_ANIM,
            frames: scene.anims.generateFrameNumbers(ATTACK_VFX.UNDERGROUND_VINE_ATLAS, {
                start: 0,
                end: VINE_FRAME_COUNT - 1,
            }),
            frameRate: 12,
            repeat: 0,
        });
    }
}
function buildVineAtlas(scene) {
    const atlasW = VINE_FRAME_W * VINE_FRAME_COUNT;
    const g = scene.make.graphics({ x: 0, y: 0 }, false);
    for (let i = 0; i < VINE_FRAME_COUNT; i++) {
        drawVineFrame(g, i * VINE_FRAME_W, 0, i);
    }
    g.generateTexture(ATTACK_VFX.UNDERGROUND_VINE_ATLAS, atlasW, VINE_FRAME_H);
    g.destroy();
    const tex = scene.textures.get(ATTACK_VFX.UNDERGROUND_VINE_ATLAS);
    for (let i = 0; i < VINE_FRAME_COUNT; i++) {
        tex.add(i, 0, i * VINE_FRAME_W, 0, VINE_FRAME_W, VINE_FRAME_H);
    }
}
function buildDirtParticle(scene) {
    const g = scene.make.graphics({ x: 0, y: 0 }, false);
    g.fillStyle(0x4a4034, 1);
    g.fillCircle(4, 4, 3);
    g.fillStyle(0x6a5a48, 0.7);
    g.fillCircle(3, 3, 1.5);
    g.generateTexture(ATTACK_VFX.DIRT_PARTICLE, 8, 8);
    g.destroy();
}
/** Frame 0 crack → 1–3 emerge → 4–5 strike → 6 hit → 7 retract. */
function drawVineFrame(g, ox, oy, frame) {
    const w = VINE_FRAME_W;
    const h = VINE_FRAME_H;
    const baseX = ox + w / 2;
    const groundY = oy + h - 10;
    g.fillStyle(0x1a1612, 0.12);
    g.fillRect(ox, oy, w, h);
    const crackAlpha = frame === 0 ? 0.9 : frame <= 2 ? 0.55 : frame >= 7 ? 0.2 : 0.35;
    g.lineStyle(1, 0x3a3228, crackAlpha);
    g.lineBetween(baseX - 14, groundY, baseX - 6, groundY - 2);
    g.lineBetween(baseX + 8, groundY, baseX + 16, groundY - 1);
    g.lineBetween(baseX - 4, groundY, baseX + 2, groundY - 3);
    const grow = Phaser.Math.Clamp(frame / 5, 0, 1);
    if (frame === 0)
        return;
    const vineH = 8 + grow * 58;
    const lean = frame >= 4 && frame <= 6 ? -10 : frame >= 2 ? -4 : 0;
    const tipX = baseX + lean;
    const tipY = groundY - vineH;
    g.fillStyle(0x2a241c, 0.5);
    g.fillEllipse(baseX, groundY + 2, 22 + grow * 10, 8);
    g.lineStyle(3, 0x2e4a28, 1);
    g.beginPath();
    g.moveTo(baseX, groundY);
    const midX = baseX + lean * 0.45;
    const midY = groundY - vineH * 0.55;
    g.lineTo(midX, midY);
    g.lineTo(tipX, tipY);
    g.strokePath();
    g.lineStyle(2, 0x3a5c32, 0.95);
    g.lineBetween(baseX, groundY, midX, midY);
    const thornCount = frame >= 3 ? 3 : frame >= 1 ? 1 : 0;
    g.fillStyle(0x5c4038, 1);
    for (let t = 0; t < thornCount; t++) {
        const tY = groundY - vineH * (0.35 + t * 0.22);
        const tX = baseX + lean * (0.2 + t * 0.15) + (t % 2 === 0 ? -8 : 8);
        g.fillTriangle(tX, tY, tX - 3, tY + 5, tX + 3, tY + 5);
    }
    if (frame >= 4) {
        g.lineStyle(2, 0x4a6a38, 0.85);
        g.lineBetween(tipX, tipY, tipX - 14, tipY - 6);
        g.lineBetween(tipX, tipY, tipX + 10, tipY - 4);
    }
    if (frame === 6) {
        g.fillStyle(0x8a9a5a, 0.35);
        g.fillCircle(tipX, tipY - 4, 14);
        g.lineStyle(2, 0x6a8a48, 0.9);
        g.strokeCircle(tipX, tipY - 4, 12);
    }
    if (frame === 7) {
        g.fillStyle(0x2e2820, 0.4);
        g.fillEllipse(baseX, groundY, 18, 6);
    }
}
