import Phaser from 'phaser';

import {
  THORNVINE_WORLD_FRAME_COUNT,
  THORNVINE_WORLD_FRAME_H,
  THORNVINE_WORLD_FRAME_W,
  WORLD_SPRITE,
  WORLD_SPRITE_FRAME_COUNT,
  WORLD_SPRITE_FRAME_H,
  WORLD_SPRITE_FRAME_W,
} from './worldSpriteKeys';

export interface WorldSpriteManifestEntry {
  id: string;
  atlasKey: string;
  animKey: string;
  pngPath: string;
  promptPath: string;
  /** Single-image asset; omit for horizontal spritesheets. */
  singleImage?: boolean;
  frameW: number;
  frameH: number;
  frameCount: number;
  frameRate: number;
  defaultScale: number;
  defaultFeetOffsetY: number;
  /** Gentle idle sway via tween (used for single PNG). */
  tweenSway?: boolean;
}

export const WORLD_SPRITE_MANIFEST: WorldSpriteManifestEntry[] = [
  {
    id: 'plant_thornvine_world',
    atlasKey: WORLD_SPRITE.PLANT_THORNVINE_ATLAS,
    animKey: WORLD_SPRITE.PLANT_THORNVINE_SWAY,
    pngPath: 'assets/world/plant_thornvine_world.png',
    promptPath: 'assets/world/plant_thornvine_world.prompt.json',
    singleImage: true,
    frameW: THORNVINE_WORLD_FRAME_W,
    frameH: THORNVINE_WORLD_FRAME_H,
    frameCount: THORNVINE_WORLD_FRAME_COUNT,
    frameRate: 6,
    defaultScale: 0.18,
    defaultFeetOffsetY: 34,
    tweenSway: true,
  },
  {
    id: 'plant_sporegun_world',
    atlasKey: WORLD_SPRITE.PLANT_SPOREGUN_ATLAS,
    animKey: WORLD_SPRITE.PLANT_SPOREGUN_IDLE,
    pngPath: 'assets/world/plant_sporegun_world.png',
    promptPath: 'assets/world/plant_sporegun_world.prompt.json',
    singleImage: true,
    frameW: WORLD_SPRITE_FRAME_W,
    frameH: WORLD_SPRITE_FRAME_H,
    frameCount: WORLD_SPRITE_FRAME_COUNT,
    frameRate: 6,
    defaultScale: 0.18,
    defaultFeetOffsetY: 36,
    tweenSway: true,
  },
  {
    id: 'plant_snare_root_world',
    atlasKey: WORLD_SPRITE.PLANT_SNARE_ROOT_ATLAS,
    animKey: WORLD_SPRITE.PLANT_SNARE_ROOT_IDLE,
    pngPath: 'assets/world/plant_snare_root_world.png',
    promptPath: 'assets/world/plant_snare_root_world.prompt.json',
    singleImage: true,
    frameW: WORLD_SPRITE_FRAME_W,
    frameH: WORLD_SPRITE_FRAME_H,
    frameCount: WORLD_SPRITE_FRAME_COUNT,
    frameRate: 5,
    defaultScale: 0.18,
    defaultFeetOffsetY: 34,
    tweenSway: true,
  },
  {
    id: 'plant_acid_bloom_world',
    atlasKey: WORLD_SPRITE.PLANT_ACID_BLOOM_ATLAS,
    animKey: WORLD_SPRITE.PLANT_ACID_BLOOM_IDLE,
    pngPath: 'assets/world/plant_acid_bloom_world.png',
    promptPath: 'assets/world/plant_acid_bloom_world.prompt.json',
    singleImage: true,
    frameW: WORLD_SPRITE_FRAME_W,
    frameH: WORLD_SPRITE_FRAME_H,
    frameCount: WORLD_SPRITE_FRAME_COUNT,
    frameRate: 6,
    defaultScale: 0.18,
    defaultFeetOffsetY: 36,
    tweenSway: true,
  },
];

const REGISTRY_PREFIX = 'world-use-procedural:';

export function markWorldSpriteProcedural(
  scene: Phaser.Scene,
  atlasKey: string,
  procedural: boolean,
): void {
  scene.registry.set(`${REGISTRY_PREFIX}${atlasKey}`, procedural);
}

export function shouldUseProceduralWorldSprite(scene: Phaser.Scene, atlasKey: string): boolean {
  return scene.registry.get(`${REGISTRY_PREFIX}${atlasKey}`) === true;
}
