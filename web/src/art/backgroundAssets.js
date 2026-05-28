import { ensureWastelandBackground } from './TextureGenerator';
import { TEX } from './textureKeys';
export const BG_SCENE_URL = 'assets/scenes/wasteland_board.png';
const REGISTRY_BG_PROCEDURAL = 'bgProcedural';
export function markBackgroundProcedural(scene, procedural) {
    scene.registry.set(REGISTRY_BG_PROCEDURAL, procedural);
}
export function isProceduralBackground(scene) {
    return scene.registry.get(REGISTRY_BG_PROCEDURAL) === true;
}
/** PNG from Preloader, or procedural fallback when the file is missing. */
export function ensureGameBackgroundTexture(scene, w, h) {
    if (scene.textures.exists(TEX.BG_WASTELAND) && !isProceduralBackground(scene)) {
        return;
    }
    ensureWastelandBackground(scene, w, h);
    markBackgroundProcedural(scene, true);
}
export function layoutBackgroundCover(bg, width, height) {
    const frame = bg.frame;
    const tw = frame.width;
    const th = frame.height;
    const scale = Math.max(width / tw, height / th);
    bg.setDisplaySize(tw * scale, th * scale);
    bg.setPosition(width / 2, height / 2);
}
