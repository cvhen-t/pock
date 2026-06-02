/** World-sprite atlas / animation keys for placed card visuals. */
export const WORLD_SPRITE = {
  PLANT_THORNVINE_ATLAS: 'world-plant-thornvine-atlas',
  PLANT_THORNVINE_SWAY: 'world-plant-thornvine-sway',
  PLANT_SPOREGUN_ATLAS: 'world-plant-sporegun-atlas',
  PLANT_SPOREGUN_IDLE: 'world-plant-sporegun-idle',
  PLANT_SNARE_ROOT_ATLAS: 'world-plant-snare-root-atlas',
  PLANT_SNARE_ROOT_IDLE: 'world-plant-snare-root-idle',
  PLANT_ACID_BLOOM_ATLAS: 'world-plant-acid-bloom-atlas',
  PLANT_ACID_BLOOM_IDLE: 'world-plant-acid-bloom-idle',
} as const;

export const WORLD_SPRITE_FRAME_W = 56;
export const WORLD_SPRITE_FRAME_H = 80;
export const WORLD_SPRITE_FRAME_COUNT = 8;

export const THORNVINE_WORLD_FRAME_W = WORLD_SPRITE_FRAME_W;
export const THORNVINE_WORLD_FRAME_H = WORLD_SPRITE_FRAME_H;
export const THORNVINE_WORLD_FRAME_COUNT = WORLD_SPRITE_FRAME_COUNT;
