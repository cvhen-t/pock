import { ATTACK_VFX_MANIFEST } from './attackVfxManifest';
import { registerAttackVfxAtlas } from './attackVfxRegister';
import { buildAcidSplashAtlasProcedural } from './AcidSplashFrames';
import { registerAttackParticles } from './AttackVfxParticles';
import { buildSnareRootAtlasProcedural } from './SnareRootFrames';
import { buildSporeBurstAtlasProcedural } from './SporeBurstFrames';
import { buildUndergroundVineAtlasProcedural } from './VineAttackFrames';
export function registerAllAttackVfx(scene) {
    const vine = ATTACK_VFX_MANIFEST.find((e) => e.id === 'underground_vine');
    const snare = ATTACK_VFX_MANIFEST.find((e) => e.id === 'underground_snare');
    const spore = ATTACK_VFX_MANIFEST.find((e) => e.id === 'spore_burst');
    const acid = ATTACK_VFX_MANIFEST.find((e) => e.id === 'acid_splash');
    registerAttackVfxAtlas(scene, vine, buildUndergroundVineAtlasProcedural);
    registerAttackVfxAtlas(scene, snare, buildSnareRootAtlasProcedural);
    registerAttackVfxAtlas(scene, spore, buildSporeBurstAtlasProcedural);
    registerAttackVfxAtlas(scene, acid, buildAcidSplashAtlasProcedural);
    registerAttackParticles(scene);
}
