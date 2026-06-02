import Phaser from 'phaser';

import { registerWorldSpriteAtlases, resolveRegisteredWorldSprite } from './worldSpriteRegister';
import type { PlacedVisualConfig } from '../types/gameData';

export type { RegisteredWorldSprite } from './worldSpriteRegister';

export function registerWorldSprites(scene: Phaser.Scene): void {
  registerWorldSpriteAtlases(scene);
}

export function resolveWorldSprite(config: PlacedVisualConfig) {
  return resolveRegisteredWorldSprite(config.spriteId);
}
