import Phaser from 'phaser';
import {
  ensureGameBackgroundTexture,
  isProceduralBackground,
  layoutBackgroundCover,
} from '../art/backgroundAssets';
import { ensureWastelandBackground } from '../art/TextureGenerator';
import { TEX } from '../art/textureKeys';

/**
 * Full-screen wasteland backdrop + play board mat overlay.
 */
export default class GameBackground extends Phaser.GameObjects.Container {
  readonly boardZone: Phaser.GameObjects.Rectangle;

  private bg!: Phaser.GameObjects.Image;

  private mat!: Phaser.GameObjects.Rectangle;

  private inner!: Phaser.GameObjects.Rectangle;

  private hint!: Phaser.GameObjects.Text;

  constructor(scene: Phaser.Scene, width: number, height: number) {
    super(scene, 0, 0);
    ensureGameBackgroundTexture(scene, width, height);

    this.bg = scene.add.image(width / 2, height / 2, TEX.BG_WASTELAND);
    this.mat = scene.add.rectangle(0, 0, 1, 1, 0x1a1612, 0.42);
    this.inner = scene.add.rectangle(0, 0, 1, 1, 0x252019, 0.28);
    this.hint = scene.add.text(0, 0, '拖动叠放 · 双击拖整摞', {
      fontFamily: 'system-ui, sans-serif',
      fontSize: '10px',
      color: '#5a5248',
    });

    for (const obj of [this.bg, this.mat, this.inner, this.hint]) {
      obj.setScrollFactor(0);
    }

    this.boardZone = this.inner;
    this.add([this.bg, this.mat, this.inner, this.hint]);
    scene.add.existing(this);
    this.setDepth(-100);
    this.setScrollFactor(0);

    this.layoutCover(width, height);
  }

  resize(width: number, height: number): void {
    if (isProceduralBackground(this.scene)) {
      ensureWastelandBackground(this.scene, width, height);
      this.bg.setTexture(TEX.BG_WASTELAND);
    }
    this.layoutCover(width, height);
  }

  /** Playfield mat fills all space between top HUD and bottom action bar. */
  layoutPlayfield(playfield: Phaser.Geom.Rectangle): void {
    this.mat.setPosition(playfield.centerX, playfield.centerY);
    this.mat.setSize(playfield.width, playfield.height);
    this.mat.setStrokeStyle(1, 0x4a4034, 0.55);

    this.inner.setPosition(playfield.centerX, playfield.centerY);
    this.inner.setSize(playfield.width - 8, playfield.height - 6);
    this.inner.setStrokeStyle(1, 0x3d3830, 0.45);

    this.hint.setPosition(playfield.centerX, playfield.bottom - 8);
    this.hint.setOrigin(0.5, 1);
  }

  private layoutCover(width: number, height: number): void {
    layoutBackgroundCover(this.bg, width, height);
  }
}
