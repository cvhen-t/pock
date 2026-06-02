import { WORLD_SPRITE, WORLD_SPRITE_FRAME_COUNT, WORLD_SPRITE_FRAME_H, WORLD_SPRITE_FRAME_W, } from './worldSpriteKeys';
/** Low snare root mat — tendrils sway and tighten in a loop. */
export function buildSnareRootWorldAtlasProcedural(scene) {
    const atlasW = WORLD_SPRITE_FRAME_W * WORLD_SPRITE_FRAME_COUNT;
    const g = scene.make.graphics({ x: 0, y: 0 }, false);
    for (let i = 0; i < WORLD_SPRITE_FRAME_COUNT; i++) {
        drawSnareRootWorldFrame(g, i * WORLD_SPRITE_FRAME_W, 0, i);
    }
    g.generateTexture(WORLD_SPRITE.PLANT_SNARE_ROOT_ATLAS, atlasW, WORLD_SPRITE_FRAME_H);
    g.destroy();
    const tex = scene.textures.get(WORLD_SPRITE.PLANT_SNARE_ROOT_ATLAS);
    for (let i = 0; i < WORLD_SPRITE_FRAME_COUNT; i++) {
        tex.add(i, 0, i * WORLD_SPRITE_FRAME_W, 0, WORLD_SPRITE_FRAME_W, WORLD_SPRITE_FRAME_H);
    }
}
function drawSnareRootWorldFrame(g, ox, oy, frame) {
    const w = WORLD_SPRITE_FRAME_W;
    const h = WORLD_SPRITE_FRAME_H;
    const baseX = ox + w / 2;
    const groundY = oy + h - 8;
    const phase = (frame / WORLD_SPRITE_FRAME_COUNT) * Math.PI * 2;
    const sway = Math.sin(phase) * 4;
    const reach = 0.75 + Math.sin(phase + 0.8) * 0.2;
    g.fillStyle(0x1a1612, 0.08);
    g.fillRect(ox, oy, w, h);
    g.fillStyle(0x2a241c, 0.4);
    g.fillEllipse(baseX + sway * 0.2, groundY + 2, 26, 7);
    g.lineStyle(1, 0x3a3228, 0.45);
    g.lineBetween(baseX - 18, groundY, baseX + 18, groundY - 1);
    g.lineBetween(baseX - 10, groundY + 1, baseX + 12, groundY - 2);
    const tendrils = [
        [-1, -0.55],
        [1, -0.5],
        [0, -0.7],
        [-0.7, -0.35],
        [0.75, -0.4],
    ];
    for (const [side, heightMul] of tendrils) {
        const len = (22 + sway * 0.3) * reach * heightMul;
        const tipX = baseX + side * len;
        const tipY = groundY - 8 - Math.abs(side) * 12 * reach;
        const rootX = baseX + side * 6 + sway * 0.3;
        const rootY = groundY - 2;
        g.lineStyle(2.5, 0x3a4a28, 0.95);
        g.lineBetween(rootX, rootY, tipX, tipY);
        g.lineStyle(1.5, 0x4a5c32, 0.75);
        g.lineBetween(rootX, rootY, (rootX + tipX) / 2, (rootY + tipY) / 2);
        g.fillStyle(0x4a5c38, 0.9);
        g.fillCircle(tipX, tipY, 3);
    }
    if (frame >= 4 && frame <= 6) {
        g.lineStyle(1, 0x5a6a40, 0.35);
        g.strokeCircle(baseX + sway * 0.15, groundY - 14, 10 + (frame - 4) * 2);
    }
}
