import { ACID_FRAME_COUNT, ACID_FRAME_H, ACID_FRAME_W, ATTACK_VFX, } from './attackVfxKeys';
/** Frame 0 bloom → 1 charge → 2–3 travel → 4 splash → 5 smoke → 6 stain fade. */
export function buildAcidSplashAtlasProcedural(scene) {
    buildAcidAtlas(scene);
}
function buildAcidAtlas(scene) {
    const atlasW = ACID_FRAME_W * ACID_FRAME_COUNT;
    const g = scene.make.graphics({ x: 0, y: 0 }, false);
    for (let i = 0; i < ACID_FRAME_COUNT; i++) {
        drawAcidFrame(g, i * ACID_FRAME_W, 0, i);
    }
    g.generateTexture(ATTACK_VFX.ACID_SPLASH_ATLAS, atlasW, ACID_FRAME_H);
    g.destroy();
    const tex = scene.textures.get(ATTACK_VFX.ACID_SPLASH_ATLAS);
    for (let i = 0; i < ACID_FRAME_COUNT; i++) {
        tex.add(i, 0, i * ACID_FRAME_W, 0, ACID_FRAME_W, ACID_FRAME_H);
    }
}
function drawAcidFrame(g, ox, oy, frame) {
    const w = ACID_FRAME_W;
    const h = ACID_FRAME_H;
    const cx = ox + w / 2;
    const groundY = oy + h - 10;
    g.fillStyle(0x1a1612, 0.08);
    g.fillRect(ox, oy, w, h);
    if (frame === 0) {
        g.fillStyle(0x4a5a30, 0.5);
        g.fillCircle(cx, groundY - 20, 8);
        g.lineStyle(2, 0x5a6a38, 0.7);
        g.lineBetween(cx - 10, groundY - 14, cx - 4, groundY - 22);
        g.lineBetween(cx + 10, groundY - 14, cx + 4, groundY - 22);
        return;
    }
    if (frame === 1) {
        g.fillStyle(0x5a6a38, 0.85);
        g.fillEllipse(cx, groundY - 28, 7, 10);
        g.fillStyle(0x7a8a48, 0.45);
        g.fillEllipse(cx - 1, groundY - 30, 4, 5);
        return;
    }
    if (frame <= 3) {
        const dripY = frame === 2 ? groundY - 38 : groundY - 48;
        g.fillStyle(0x5a6a38, 0.9);
        g.fillEllipse(cx, dripY, 8, 12);
        g.fillStyle(0x6a7a40, 0.5);
        g.fillEllipse(cx + 1, dripY - 4, 4, 5);
        if (frame === 3) {
            g.lineStyle(1, 0x8a9a50, 0.4);
            g.lineBetween(cx, dripY + 6, cx, groundY - 8);
        }
        return;
    }
    if (frame === 4) {
        g.fillStyle(0x5a6a38, 0.55);
        g.fillEllipse(cx, groundY - 4, 36, 14);
        g.fillStyle(0x6a7a40, 0.7);
        for (let s = 0; s < 5; s++) {
            const ang = -Math.PI * 0.15 - (s / 4) * Math.PI * 0.7;
            const dist = 14 + (s % 2) * 6;
            g.fillCircle(cx + Math.cos(ang) * dist, groundY - 6 + Math.sin(ang) * dist * 0.3, 4);
        }
        g.lineStyle(1, 0x7a8a48, 0.5);
        g.strokeEllipse(cx, groundY - 4, 32, 10);
        return;
    }
    if (frame === 5) {
        g.fillStyle(0x6a7a40, 0.25);
        g.fillEllipse(cx, groundY - 12, 28, 20);
        g.fillStyle(0x5a6a38, 0.35);
        g.fillEllipse(cx, groundY - 4, 30, 10);
        return;
    }
    g.fillStyle(0x3a4a28, 0.35);
    g.fillEllipse(cx, groundY - 2, 26, 6);
    g.fillStyle(0x2e3820, 0.2);
    g.fillEllipse(cx, groundY, 20, 4);
}
