import { shouldUseProceduralVfx } from './attackVfxManifest';
export function registerAttackVfxAtlas(scene, entry, buildProcedural) {
    const useProcedural = shouldUseProceduralVfx(scene, entry.atlasKey);
    if (scene.textures.exists(entry.atlasKey) && useProcedural) {
        scene.textures.remove(entry.atlasKey);
    }
    if (!scene.textures.exists(entry.atlasKey)) {
        buildProcedural(scene);
    }
    ensureAtlasFrames(scene, entry);
    if (!scene.anims.exists(entry.animKey)) {
        scene.anims.create({
            key: entry.animKey,
            frames: scene.anims.generateFrameNumbers(entry.atlasKey, {
                start: 0,
                end: entry.frameCount - 1,
            }),
            frameRate: entry.frameRate,
            repeat: 0,
        });
    }
}
function ensureAtlasFrames(scene, entry) {
    const tex = scene.textures.get(entry.atlasKey);
    if (tex.frameTotal >= entry.frameCount)
        return;
    for (let i = 0; i < entry.frameCount; i++) {
        const frameName = String(i);
        if (!tex.has(frameName)) {
            tex.add(frameName, 0, i * entry.frameW, 0, entry.frameW, entry.frameH);
        }
    }
}
