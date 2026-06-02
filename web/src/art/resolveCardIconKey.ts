import type Phaser from 'phaser';
import type { CardDefinition } from '../types/gameData';
import { TEX } from './textureKeys';

export function cardArtKey(def: Pick<CardDefinition, 'id' | 'artKey'>): string {
  return def.artKey ?? def.id;
}

/** Baked PNG in `assets/cards/`, then procedural icon fallback. */
export function resolveCardIconKey(
  scene: Phaser.Scene,
  def: Pick<CardDefinition, 'id' | 'artKey' | 'icon'>,
): string {
  const bakedKey = TEX.cardArt(cardArtKey(def));
  if (scene.textures.exists(bakedKey)) {
    return bakedKey;
  }
  const iconId = def.icon ?? def.id;
  const procedural = TEX.icon(iconId);
  if (scene.textures.exists(procedural)) {
    return procedural;
  }
  return TEX.icon(def.id);
}
