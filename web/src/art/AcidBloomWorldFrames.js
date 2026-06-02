import { WORLD_SPRITE, WORLD_SPRITE_FRAME_COUNT, WORLD_SPRITE_FRAME_H, WORLD_SPRITE_FRAME_W, } from './worldSpriteKeys';
/** Acid bloom flower — petal breathe + drip pulse. */
export function buildAcidBloomWorldAtlasProcedural(scene) {
    const atlasW = WORLD_SPRITE_FRAME_W * WORLD_SPRITE_FRAME_COUNT;
    const g = scene.make.graphics({ x: 0, y: 0 }, false);
    for (let i = 0; i < WORLD_SPRITE_FRAME_COUNT; i++) {
        drawAcidBloomWorldFrame(g, i * WORLD_SPRITE_FRAME_W, 0, i);
    }
    g.generateTexture(WORLD_SPRITE.PLANT_ACID_BLOOM_ATLAS, atlasW, WORLD_SPRITE_FRAME_H);
    g.destroy();
    const tex = scene.textures.get(WORLD_SPRITE.PLANT_ACID_BLOOM_ATLAS);
    for (let i = 0; i < WORLD_SPRITE_FRAME_COUNT; i++) {
        tex.add(i, 0, i * WORLD_SPRITE_FRAME_W, 0, WORLD_SPRITE_FRAME_W, WORLD_SPRITE_FRAME_H);
    }
}
function drawAcidBloomWorldFrame(g, ox, oy, frame) {
    const w = WORLD_SPRITE_FRAME_W;
    const h = WORLD_SPRITE_FRAME_H;
    const baseX = ox + w / 2;
    const groundY = oy + h - 8;
    const phase = (frame / WORLD_SPRITE_FRAME_COUNT) * Math.PI * 2;
    const bloom = 1 + Math.sin(phase) * 0.08;
    const dripY = groundY - 30 - Math.max(0, Math.sin(phase + 1.2)) * 6;
    g.fillStyle(0x1a1612, 0.08);
    g.fillRect(ox, oy, w, h);
    g.fillStyle(0x2a241c, 0.35);
    g.fillEllipse(baseX, groundY + 2, 18, 6);
    g.fillStyle(0x3a4a28, 1);
    g.lineStyle(3, 0x3a4a28, 1);
    g.lineBetween(baseX, groundY, baseX, groundY - 18);
    const petals = 5;
    for (let p = 0; p < petals; p++) {
        const a = (p / petals) * Math.PI * 2 - Math.PI / 2;
        const px = baseX + Math.cos(a) * 11 * bloom;
        const py = groundY - 26 + Math.sin(a) * 7 * bloom;
        g.fillStyle(0x4a5a30, 0.9);
        g.fillEllipse(px, py, 7 * bloom, 5 * bloom);
        g.fillStyle(0x5a6a38, 0.55);
        g.fillEllipse(px, py - 1, 4 * bloom, 3 * bloom);
    }
    g.fillStyle(0x5a6a38, 0.85);
    g.fillCircle(baseX, groundY - 26, 5 * bloom);
    g.fillStyle(0x6a7a40, 0.5);
    g.fillCircle(baseX - 1, groundY - 27, 3);
    g.fillStyle(0x6a7a40, 0.75 + Math.sin(phase) * 0.15);
    g.fillEllipse(baseX, dripY, 5, 7);
    g.fillStyle(0x7a8a48, 0.45);
    g.fillEllipse(baseX + 1, dripY - 3, 3, 4);
    if (frame >= 3 && frame <= 5) {
        g.lineStyle(1, 0x8a9a50, 0.25 + (frame - 3) * 0.12);
        g.lineBetween(baseX, dripY + 5, baseX, groundY - 10);
    }
}
