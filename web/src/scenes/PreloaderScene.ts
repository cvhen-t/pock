import Phaser from 'phaser';

import { BG_SCENE_URL, markBackgroundProcedural } from '../art/backgroundAssets';
import { ATTACK_VFX_MANIFEST, markAttackVfxProcedural } from '../art/attackVfxManifest';
import { registerAllAttackVfx } from '../art/AttackVfxRegistry';
import { ensureWastelandBackground, generateGameTextures } from '../art/TextureGenerator';
import { TEX } from '../art/textureKeys';
import { collectCardsFromCache, CARD_JSON_PATHS } from '../core/loadCards';
import { dataStore } from '../core/DataStore';

export default class PreloaderScene extends Phaser.Scene {
  constructor() {
    super({ key: 'Preloader' });
  }

  preload(): void {
    const { width, height } = this.scale;
    const bar = this.add.rectangle(width / 2, height / 2, width * 0.6, 8, 0x3d3830);
    const fill = this.add.rectangle(width / 2 - bar.width / 2, height / 2, 0, 8, 0x8b6914);

    this.load.on('progress', (value: number) => {
      fill.width = bar.width * value;
      fill.x = width / 2 - bar.width / 2 + fill.width / 2;
    });

    for (const [key, path] of Object.entries(CARD_JSON_PATHS)) {
      this.load.json(key, path);
    }
    this.load.json('recipes_starter', 'data/recipes/starter.json');
    this.load.json('recipes_facility', 'data/recipes/facility.json');
    this.load.json('growth', 'data/growth/mutant_outcomes.json');
    this.load.json('invasion_enemies', 'data/invasion/enemies.json');
    this.load.json('invasion_waves', 'data/invasion/waves.json');
    this.load.json('invasion_drops', 'data/invasion/drops.json');
    this.load.json('packs', 'data/packs/packs.json');
    this.load.json('shop', 'data/shop/shop.json');
    this.load.json('player_guide', 'data/guide/player_guide.json');

    markBackgroundProcedural(this, false);
    this.load.image(TEX.BG_WASTELAND, BG_SCENE_URL);
    this.load.on(`filecomplete-image-${TEX.BG_WASTELAND}`, () => {
      markBackgroundProcedural(this, false);
    });
    this.load.on('loaderror', (file: { key?: string }) => {
      if (file.key === TEX.BG_WASTELAND) {
        markBackgroundProcedural(this, true);
      }
      const vfx = ATTACK_VFX_MANIFEST.find((e) => e.atlasKey === file.key);
      if (vfx) {
        markAttackVfxProcedural(this, vfx.atlasKey, true);
      }
    });

    for (const entry of ATTACK_VFX_MANIFEST) {
      markAttackVfxProcedural(this, entry.atlasKey, false);
      this.load.spritesheet(entry.atlasKey, entry.pngPath, {
        frameWidth: entry.frameW,
        frameHeight: entry.frameH,
      });
    }
  }

  create(): void {
    this.queueOptionalCardArt();
    if (this.load.list.size > 0) {
      this.load.once('complete', () => this.finishLoading());
      this.load.start();
      return;
    }
    this.finishLoading();
  }

  private queueOptionalCardArt(): void {
    const cards = collectCardsFromCache(this.cache);
    for (const card of cards) {
      if (!card.artKey || this.textures.exists(TEX.cardArt(card.artKey))) continue;
      this.load.image(TEX.cardArt(card.artKey), `assets/cards/${card.artKey}.png`);
    }
  }

  private finishLoading(): void {
    const cards = collectCardsFromCache(this.cache);
    dataStore.setCards(cards);
    if (this.registry.get('bgProcedural') === true) {
      const { width, height } = this.scale;
      ensureWastelandBackground(this, width, height);
    }
    generateGameTextures(this, cards.map((c) => c.id));
    registerAllAttackVfx(this);
    this.scene.start('Game');
  }
}
