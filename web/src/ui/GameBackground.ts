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
  private title!: Phaser.GameObjects.Text;
  private hint!: Phaser.GameObjects.Text;

  constructor(scene: Phaser.Scene, width: number, height: number) {
    super(scene, 0, 0);
    ensureGameBackgroundTexture(scene, width, height);

    this.bg = scene.add.image(width / 2, height / 2, TEX.BG_WASTELAND);
    this.mat = scene.add.rectangle(0, 0, 1, 1, 0x1a1612, 0.42);
    this.inner = scene.add.rectangle(0, 0, 1, 1, 0x252019, 0.28);
    this.title = scene.add.text(0, 0, '荒原叠卡', {
      fontFamily: 'system-ui, sans-serif',
      fontSize: '22px',
      color: '#c9b896',
      stroke: '#1a1612',
      strokeThickness: 4,
    });
    this.hint = scene.add.text(0, 0, '拖动叠放 · 双击拖整摞 · 双指不缩放', {
      fontFamily: 'system-ui, sans-serif',
      fontSize: '11px',
      color: '#6a5f52',
    });

    for (const obj of [this.bg, this.mat, this.inner, this.title, this.hint]) {
      obj.setScrollFactor(0);
    }

    this.boardZone = this.inner;
    this.add([this.bg, this.mat, this.inner, this.title, this.hint]);
    scene.add.existing(this);
    this.setDepth(-100);
    this.setScrollFactor(0);

    this.layout(width, height);
  }

  resize(width: number, height: number): void {
    if (isProceduralBackground(this.scene)) {
      ensureWastelandBackground(this.scene, width, height);
      this.bg.setTexture(TEX.BG_WASTELAND);
    }
    this.layout(width, height);
  }

  layoutPlayfield(playfield: Phaser.Geom.Rectangle): void {
    this.mat.setPosition(playfield.centerX, playfield.centerY);
    this.mat.setSize(playfield.width - 8, playfield.height - 4);
    this.inner.setPosition(playfield.centerX, playfield.centerY);
    this.inner.setSize(playfield.width - 20, playfield.height - 12);
    this.hint.setPosition(playfield.centerX, playfield.bottom - 10);
  }

  private layout(width: number, height: number): void {
    layoutBackgroundCover(this.bg, width, height);

    const boardY = height / 2 + height * 0.05;
    const boardH = Math.max(200, height - height * 0.26);
    const titleY = Math.max(48, height * 0.085);
    const hintY = height - Math.max(20, height * 0.033);

    this.mat.setPosition(width / 2, boardY);
    this.mat.setSize(width - 16, boardH);
    this.mat.setStrokeStyle(2, 0x4a4034, 0.65);

    this.inner.setPosition(width / 2, boardY);
    this.inner.setSize(width - 28, boardH - 12);
    this.inner.setStrokeStyle(1, 0x3d3830, 0.5);

    this.title.setPosition(width / 2, titleY);
    this.title.setOrigin(0.5);

    this.hint.setPosition(width / 2, hintY);
    this.hint.setOrigin(0.5);
  }
}
