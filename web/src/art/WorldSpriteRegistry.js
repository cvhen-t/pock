import { registerWorldSpriteAtlases, resolveRegisteredWorldSprite } from './worldSpriteRegister';
export function registerWorldSprites(scene) {
    registerWorldSpriteAtlases(scene);
}
export function resolveWorldSprite(config) {
    return resolveRegisteredWorldSprite(config.spriteId);
}
