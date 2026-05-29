import Phaser from 'phaser';
import { REGISTRY, SECONDS_PER_DAY } from '../config/gameConfig';

export default class BootScene extends Phaser.Scene {
  constructor() {
    super({ key: 'Boot' });
  }

  create(): void {
    this.registry.set(REGISTRY.DAY_SECONDS, SECONDS_PER_DAY);
    this.registry.set(REGISTRY.DAY_INDEX, 1);
    this.scene.start('Preloader');
  }
}
