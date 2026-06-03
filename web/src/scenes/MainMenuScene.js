import Phaser from 'phaser';
import { ensureGameBackgroundTexture, layoutBackgroundCover, } from '../art/backgroundAssets';
import { TEX } from '../art/textureKeys';
import { MAIN_MENU_COLORS } from '../config/mainMenuConfig';
import { getSaveSummary, hasSaveGame, readSaveGame } from '../core/save/saveStorage';
import MainMenuPanel from '../ui/MainMenuPanel';
export default class MainMenuScene extends Phaser.Scene {
    bgImage;
    overlay;
    vignette;
    panel;
    starting = false;
    constructor() {
        super({ key: 'MainMenu' });
    }
    create() {
        const { width, height } = this.scale;
        ensureGameBackgroundTexture(this, width, height);
        this.bgImage = this.add.image(width / 2, height / 2, TEX.BG_WASTELAND);
        this.bgImage.setDepth(-10);
        this.overlay = this.add.rectangle(width / 2, height / 2, width, height, MAIN_MENU_COLORS.overlay, MAIN_MENU_COLORS.overlayAlpha);
        this.overlay.setDepth(-9);
        this.vignette = this.add.rectangle(width / 2, height, width, height * 0.45, MAIN_MENU_COLORS.vignette, MAIN_MENU_COLORS.vignetteAlpha);
        this.vignette.setDepth(-8);
        this.panel = new MainMenuPanel(this, {
            onStart: () => this.beginGame(),
            onContinue: () => this.continueGame(),
        });
        this.panel.setDepth(10);
        this.refreshContinueButton();
        this.layoutBackground(width, height);
        this.panel.layout(width, height);
        this.cameras.main.fadeIn(500, 0, 0, 0);
        this.scale.on('resize', this.onResize, this);
        this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
            this.scale.off('resize', this.onResize, this);
        });
    }
    refreshContinueButton() {
        const summary = getSaveSummary();
        this.panel.setContinueEnabled(hasSaveGame(), summary);
    }
    onResize(gameSize) {
        const w = gameSize.width;
        const h = gameSize.height;
        this.layoutBackground(w, h);
        this.panel.layout(w, h);
    }
    layoutBackground(width, height) {
        layoutBackgroundCover(this.bgImage, width, height);
        this.overlay.setPosition(width / 2, height / 2);
        this.overlay.setSize(width, height);
        this.vignette.setPosition(width / 2, height);
        this.vignette.setSize(width, height * 0.45);
    }
    beginGame() {
        if (this.starting)
            return;
        this.starting = true;
        this.panel.setStartEnabled(false);
        this.panel.setContinueEnabled(false);
        this.cameras.main.fadeOut(380, 10, 12, 10);
        this.cameras.main.once(Phaser.Cameras.Scene2D.Events.FADE_OUT_COMPLETE, () => {
            this.scene.start('Game');
        });
    }
    continueGame() {
        if (this.starting)
            return;
        const save = readSaveGame();
        if (!save) {
            this.refreshContinueButton();
            return;
        }
        this.starting = true;
        this.panel.setStartEnabled(false);
        this.panel.setContinueEnabled(false);
        this.cameras.main.fadeOut(380, 10, 12, 10);
        this.cameras.main.once(Phaser.Cameras.Scene2D.Events.FADE_OUT_COMPLETE, () => {
            this.scene.start('Game', { save });
        });
    }
}
