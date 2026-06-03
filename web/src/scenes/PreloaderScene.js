import Phaser from 'phaser';
import { BG_SCENE_URL, markBackgroundProcedural } from '../art/backgroundAssets';
import { ATTACK_VFX_MANIFEST, markAttackVfxProcedural } from '../art/attackVfxManifest';
import { markWorldSpriteProcedural, WORLD_SPRITE_MANIFEST } from '../art/worldSpriteManifest';
import { registerAllAttackVfx } from '../art/AttackVfxRegistry';
import { registerWorldSprites } from '../art/WorldSpriteRegistry';
import { ensureWastelandBackground, generateGameTextures } from '../art/TextureGenerator';
import { TEX } from '../art/textureKeys';
import { collectCardsFromCache, CARD_JSON_PATHS } from '../core/loadCards';
import { dataStore } from '../core/DataStore';
export default class PreloaderScene extends Phaser.Scene {
    constructor() {
        super({ key: 'Preloader' });
    }
    preload() {
        const { width, height } = this.scale;
        const bar = this.add.rectangle(width / 2, height / 2, width * 0.6, 8, 0x3d3830);
        const fill = this.add.rectangle(width / 2 - bar.width / 2, height / 2, 0, 8, 0x8b6914);
        this.load.on('progress', (value) => {
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
        this.load.json('logistics_link_rules', 'data/logistics/link_rules.json');
        this.load.json('logistics_automation', 'data/logistics/automation.json');
        this.load.json('logistics_link_visual', 'data/logistics/link_visual.json');
        markBackgroundProcedural(this, false);
        this.load.image(TEX.BG_WASTELAND, BG_SCENE_URL);
        this.load.on(`filecomplete-image-${TEX.BG_WASTELAND}`, () => {
            markBackgroundProcedural(this, false);
        });
        this.load.on('loaderror', (file) => {
            if (file.key === TEX.BG_WASTELAND) {
                markBackgroundProcedural(this, true);
            }
            const vfx = ATTACK_VFX_MANIFEST.find((e) => e.atlasKey === file.key);
            if (vfx) {
                markAttackVfxProcedural(this, vfx.atlasKey, true);
            }
            const world = WORLD_SPRITE_MANIFEST.find((e) => e.atlasKey === file.key);
            if (world) {
                markWorldSpriteProcedural(this, world.atlasKey, true);
            }
        });
        for (const entry of ATTACK_VFX_MANIFEST) {
            markAttackVfxProcedural(this, entry.atlasKey, false);
            this.load.spritesheet(entry.atlasKey, entry.pngPath, {
                frameWidth: entry.frameW,
                frameHeight: entry.frameH,
            });
        }
        for (const entry of WORLD_SPRITE_MANIFEST) {
            markWorldSpriteProcedural(this, entry.atlasKey, false);
            if (entry.singleImage) {
                this.load.image(entry.atlasKey, entry.pngPath);
            }
            else {
                this.load.spritesheet(entry.atlasKey, entry.pngPath, {
                    frameWidth: entry.frameW,
                    frameHeight: entry.frameH,
                });
            }
        }
    }
    create() {
        this.queueOptionalCardArt();
        if (this.load.list.size > 0) {
            this.load.once('complete', () => this.finishLoading());
            this.load.start();
            return;
        }
        this.finishLoading();
    }
    queueOptionalCardArt() {
        const cards = collectCardsFromCache(this.cache);
        for (const card of cards) {
            const artKey = card.artKey ?? card.id;
            if (this.textures.exists(TEX.cardArt(artKey)))
                continue;
            this.load.image(TEX.cardArt(artKey), `assets/cards/${artKey}.png`);
        }
    }
    finishLoading() {
        const cards = collectCardsFromCache(this.cache);
        dataStore.setCards(cards);
        if (this.registry.get('bgProcedural') === true) {
            const { width, height } = this.scale;
            ensureWastelandBackground(this, width, height);
        }
        generateGameTextures(this, cards.map((c) => c.id));
        registerAllAttackVfx(this);
        registerWorldSprites(this);
        this.scene.start('MainMenu');
    }
}
