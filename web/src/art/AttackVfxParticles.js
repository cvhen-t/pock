import { ATTACK_VFX } from './attackVfxKeys';
export function registerAttackParticles(scene) {
    if (!scene.textures.exists(ATTACK_VFX.DIRT_PARTICLE)) {
        buildDirtParticle(scene);
    }
    if (!scene.textures.exists(ATTACK_VFX.SPORE_PARTICLE)) {
        buildSporeParticle(scene);
    }
    if (!scene.textures.exists(ATTACK_VFX.ACID_DRIP_PARTICLE)) {
        buildAcidDripParticle(scene);
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
function buildSporeParticle(scene) {
    const g = scene.make.graphics({ x: 0, y: 0 }, false);
    g.fillStyle(0x3a5a32, 0.85);
    g.fillCircle(4, 4, 3);
    g.fillStyle(0x5a7a48, 0.5);
    g.fillCircle(5, 3, 1.5);
    g.generateTexture(ATTACK_VFX.SPORE_PARTICLE, 8, 8);
    g.destroy();
}
function buildAcidDripParticle(scene) {
    const g = scene.make.graphics({ x: 0, y: 0 }, false);
    g.fillStyle(0x5a6a38, 0.9);
    g.fillEllipse(3, 5, 4, 7);
    g.fillStyle(0x7a8a48, 0.4);
    g.fillEllipse(3, 3, 2, 3);
    g.generateTexture(ATTACK_VFX.ACID_DRIP_PARTICLE, 6, 10);
    g.destroy();
}
