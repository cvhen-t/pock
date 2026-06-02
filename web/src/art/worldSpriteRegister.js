import { buildAcidBloomWorldAtlasProcedural } from './AcidBloomWorldFrames';
import { buildSnareRootWorldAtlasProcedural } from './SnareRootWorldFrames';
import { buildSporegunWorldAtlasProcedural } from './SporegunWorldFrames';
import { buildThornvineWorldAtlasProcedural } from './ThornvineWorldFrames';
import { stripWorldSpriteBackground } from './worldSpritePostProcess';
import { shouldUseProceduralWorldSprite, WORLD_SPRITE_MANIFEST, } from './worldSpriteManifest';
import { WORLD_SPRITE } from './worldSpriteKeys';
const PROCEDURAL_BUILDERS = {
    [WORLD_SPRITE.PLANT_THORNVINE_ATLAS]: buildThornvineWorldAtlasProcedural,
    [WORLD_SPRITE.PLANT_SPOREGUN_ATLAS]: buildSporegunWorldAtlasProcedural,
    [WORLD_SPRITE.PLANT_SNARE_ROOT_ATLAS]: buildSnareRootWorldAtlasProcedural,
    [WORLD_SPRITE.PLANT_ACID_BLOOM_ATLAS]: buildAcidBloomWorldAtlasProcedural,
};
const REGISTRY = new Map();
export function registerWorldSpriteAtlases(scene) {
    REGISTRY.clear();
    for (const entry of WORLD_SPRITE_MANIFEST) {
        registerOne(scene, entry);
        REGISTRY.set(entry.id, {
            atlasKey: entry.atlasKey,
            animKey: entry.animKey,
            frameW: entry.frameW,
            frameH: entry.frameH,
            frameCount: entry.frameCount,
            frameRate: entry.frameRate,
            defaultScale: entry.defaultScale,
            defaultFeetOffsetY: entry.defaultFeetOffsetY,
            tweenSway: entry.tweenSway ?? false,
        });
    }
}
export function resolveRegisteredWorldSprite(spriteId) {
    return REGISTRY.get(spriteId);
}
function registerOne(scene, entry) {
    const useProcedural = shouldUseProceduralWorldSprite(scene, entry.atlasKey);
    const buildProcedural = PROCEDURAL_BUILDERS[entry.atlasKey];
    if (scene.textures.exists(entry.atlasKey) && useProcedural) {
        scene.textures.remove(entry.atlasKey);
    }
    if (!scene.textures.exists(entry.atlasKey) && buildProcedural) {
        buildProcedural(scene);
    }
    if (!useProcedural && entry.singleImage && scene.textures.exists(entry.atlasKey)) {
        stripWorldSpriteBackground(scene, entry.atlasKey);
    }
    ensureAtlasFrames(scene, entry);
    if (entry.tweenSway)
        return;
    if (!scene.anims.exists(entry.animKey)) {
        scene.anims.create({
            key: entry.animKey,
            frames: scene.anims.generateFrameNumbers(entry.atlasKey, {
                start: 0,
                end: entry.frameCount - 1,
            }),
            frameRate: entry.frameRate,
            repeat: -1,
        });
    }
}
function ensureAtlasFrames(scene, entry) {
    const tex = scene.textures.get(entry.atlasKey);
    if (entry.singleImage) {
        if (!tex.has('0')) {
            const source = tex.getSourceImage();
            const w = 'width' in source ? source.width : entry.frameW;
            const h = 'height' in source ? source.height : entry.frameH;
            tex.add('0', 0, 0, 0, w, h);
        }
        return;
    }
    if (tex.frameTotal >= entry.frameCount)
        return;
    for (let i = 0; i < entry.frameCount; i++) {
        const frameName = String(i);
        if (!tex.has(frameName)) {
            tex.add(frameName, 0, i * entry.frameW, 0, entry.frameW, entry.frameH);
        }
    }
}
