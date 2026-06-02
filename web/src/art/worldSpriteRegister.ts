import Phaser from 'phaser';

import { buildAcidBloomWorldAtlasProcedural } from './AcidBloomWorldFrames';
import { buildSnareRootWorldAtlasProcedural } from './SnareRootWorldFrames';
import { buildSporegunWorldAtlasProcedural } from './SporegunWorldFrames';
import { buildThornvineWorldAtlasProcedural } from './ThornvineWorldFrames';
import { stripWorldSpriteBackground } from './worldSpritePostProcess';
import {
  shouldUseProceduralWorldSprite,
  WORLD_SPRITE_MANIFEST,
  type WorldSpriteManifestEntry,
} from './worldSpriteManifest';
import { WORLD_SPRITE } from './worldSpriteKeys';

const PROCEDURAL_BUILDERS: Record<string, (scene: Phaser.Scene) => void> = {
  [WORLD_SPRITE.PLANT_THORNVINE_ATLAS]: buildThornvineWorldAtlasProcedural,
  [WORLD_SPRITE.PLANT_SPOREGUN_ATLAS]: buildSporegunWorldAtlasProcedural,
  [WORLD_SPRITE.PLANT_SNARE_ROOT_ATLAS]: buildSnareRootWorldAtlasProcedural,
  [WORLD_SPRITE.PLANT_ACID_BLOOM_ATLAS]: buildAcidBloomWorldAtlasProcedural,
};

export interface RegisteredWorldSprite {
  atlasKey: string;
  animKey: string;
  frameW: number;
  frameH: number;
  frameCount: number;
  frameRate: number;
  defaultScale: number;
  defaultFeetOffsetY: number;
  tweenSway: boolean;
}

const REGISTRY = new Map<string, RegisteredWorldSprite>();

export function registerWorldSpriteAtlases(scene: Phaser.Scene): void {
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

export function resolveRegisteredWorldSprite(spriteId: string): RegisteredWorldSprite | undefined {
  return REGISTRY.get(spriteId);
}

function registerOne(scene: Phaser.Scene, entry: WorldSpriteManifestEntry): void {
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

  if (entry.tweenSway) return;

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

function ensureAtlasFrames(scene: Phaser.Scene, entry: WorldSpriteManifestEntry): void {
  const tex = scene.textures.get(entry.atlasKey);
  if (entry.singleImage) {
    if (!tex.has('0')) {
      const source = tex.getSourceImage() as HTMLImageElement | HTMLCanvasElement;
      const w = 'width' in source ? source.width : entry.frameW;
      const h = 'height' in source ? source.height : entry.frameH;
      tex.add('0', 0, 0, 0, w, h);
    }
    return;
  }

  if (tex.frameTotal >= entry.frameCount) return;
  for (let i = 0; i < entry.frameCount; i++) {
    const frameName = String(i);
    if (!tex.has(frameName)) {
      tex.add(frameName, 0, i * entry.frameW, 0, entry.frameW, entry.frameH);
    }
  }
}
