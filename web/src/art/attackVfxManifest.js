import { ACID_FRAME_COUNT, ACID_FRAME_H, ACID_FRAME_W, ATTACK_VFX, SNARE_FRAME_COUNT, SNARE_FRAME_H, SNARE_FRAME_W, SPORE_FRAME_COUNT, SPORE_FRAME_H, SPORE_FRAME_W, VINE_FRAME_COUNT, VINE_FRAME_H, VINE_FRAME_W, } from './attackVfxKeys';
export const ATTACK_VFX_MANIFEST = [
    {
        id: 'underground_vine',
        atlasKey: ATTACK_VFX.UNDERGROUND_VINE_ATLAS,
        animKey: ATTACK_VFX.UNDERGROUND_VINE_ANIM,
        pngPath: 'assets/vfx/underground_vine.png',
        promptPath: 'assets/vfx/underground_vine.prompt.json',
        frameW: VINE_FRAME_W,
        frameH: VINE_FRAME_H,
        frameCount: VINE_FRAME_COUNT,
        frameRate: 12,
    },
    {
        id: 'underground_snare',
        atlasKey: ATTACK_VFX.UNDERGROUND_SNARE_ATLAS,
        animKey: ATTACK_VFX.UNDERGROUND_SNARE_ANIM,
        pngPath: 'assets/vfx/underground_snare.png',
        promptPath: 'assets/vfx/underground_snare.prompt.json',
        frameW: SNARE_FRAME_W,
        frameH: SNARE_FRAME_H,
        frameCount: SNARE_FRAME_COUNT,
        frameRate: 10,
    },
    {
        id: 'spore_burst',
        atlasKey: ATTACK_VFX.SPORE_BURST_ATLAS,
        animKey: ATTACK_VFX.SPORE_BURST_ANIM,
        pngPath: 'assets/vfx/spore_burst.png',
        promptPath: 'assets/vfx/spore_burst.prompt.json',
        frameW: SPORE_FRAME_W,
        frameH: SPORE_FRAME_H,
        frameCount: SPORE_FRAME_COUNT,
        frameRate: 14,
    },
    {
        id: 'acid_splash',
        atlasKey: ATTACK_VFX.ACID_SPLASH_ATLAS,
        animKey: ATTACK_VFX.ACID_SPLASH_ANIM,
        pngPath: 'assets/vfx/acid_splash.png',
        promptPath: 'assets/vfx/acid_splash.prompt.json',
        frameW: ACID_FRAME_W,
        frameH: ACID_FRAME_H,
        frameCount: ACID_FRAME_COUNT,
        frameRate: 11,
    },
];
const REGISTRY_PREFIX = 'vfx-use-procedural:';
export function markAttackVfxProcedural(scene, atlasKey, procedural) {
    scene.registry.set(`${REGISTRY_PREFIX}${atlasKey}`, procedural);
}
export function shouldUseProceduralVfx(scene, atlasKey) {
    return scene.registry.get(`${REGISTRY_PREFIX}${atlasKey}`) === true;
}
