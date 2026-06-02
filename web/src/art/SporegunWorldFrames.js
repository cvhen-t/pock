import { WORLD_SPRITE, WORLD_SPRITE_FRAME_COUNT, WORLD_SPRITE_FRAME_H, WORLD_SPRITE_FRAME_W, } from './worldSpriteKeys';
/** Idle sporegun mushroom — cap pulse + drifting spores. */
export function buildSporegunWorldAtlasProcedural(scene) {
    const atlasW = WORLD_SPRITE_FRAME_W * WORLD_SPRITE_FRAME_COUNT;
    const g = scene.make.graphics({ x: 0, y: 0 }, false);
    for (let i = 0; i < WORLD_SPRITE_FRAME_COUNT; i++) {
        drawSporegunWorldFrame(g, i * WORLD_SPRITE_FRAME_W, 0, i);
    }
    g.generateTexture(WORLD_SPRITE.PLANT_SPOREGUN_ATLAS, atlasW, WORLD_SPRITE_FRAME_H);
    g.destroy();
    const tex = scene.textures.get(WORLD_SPRITE.PLANT_SPOREGUN_ATLAS);
    for (let i = 0; i < WORLD_SPRITE_FRAME_COUNT; i++) {
        tex.add(i, 0, i * WORLD_SPRITE_FRAME_W, 0, WORLD_SPRITE_FRAME_W, WORLD_SPRITE_FRAME_H);
    }
}
function drawSporegunWorldFrame(g, ox, oy, frame) {
    const w = WORLD_SPRITE_FRAME_W;
    const h = WORLD_SPRITE_FRAME_H;
    const baseX = ox + w / 2;
    const groundY = oy + h - 8;
    const pulse = 1 + Math.sin((frame / WORLD_SPRITE_FRAME_COUNT) * Math.PI * 2) * 0.06;
    const capW = 18 * pulse;
    const capH = 10 * pulse;
    g.fillStyle(0x1a1612, 0.08);
    g.fillRect(ox, oy, w, h);
    g.fillStyle(0x2a241c, 0.35);
    g.fillEllipse(baseX, groundY + 2, 20, 6);
    g.fillStyle(0x3a3228, 1);
    g.fillRect(baseX - 4, groundY - 14, 8, 16);
    g.fillStyle(0x2a4230, 1);
    g.fillEllipse(baseX, groundY - 22, capW, capH);
    g.fillStyle(0x3a5a32, 0.85);
    g.fillEllipse(baseX - 2, groundY - 24, capW * 0.72, capH * 0.65);
    g.fillStyle(0x4a3a28, 1);
    g.fillRect(baseX + 7, groundY - 18, 5, 12);
    g.fillStyle(0x5c4038, 0.9);
    g.fillCircle(baseX + 9, groundY - 20, 3);
    const sporePhase = (frame / WORLD_SPRITE_FRAME_COUNT) * Math.PI * 2;
    const spores = [
        [Math.sin(sporePhase) * 8, -36 - Math.cos(sporePhase) * 4, 0.55],
        [12 + Math.sin(sporePhase + 1) * 5, -30, 0.4],
        [-14 + Math.cos(sporePhase + 2) * 4, -28, 0.35],
    ];
    for (const [sx, sy, alpha] of spores) {
        g.fillStyle(0x5a7a48, alpha);
        g.fillCircle(baseX + sx, groundY + sy, 2.5);
        g.fillStyle(0x6a8a50, alpha * 0.6);
        g.fillCircle(baseX + sx + 1, groundY + sy - 1, 1.5);
    }
    if (frame % 4 === 2) {
        g.fillStyle(0x4a6a38, 0.35);
        g.fillCircle(baseX + 14, groundY - 32, 5);
    }
}
