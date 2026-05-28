import Phaser from 'phaser';
import { REGISTRY } from '../config/gameConfig';
export default class BootScene extends Phaser.Scene {
    constructor() {
        super({ key: 'Boot' });
    }
    create() {
        this.registry.set(REGISTRY.MOON_SECONDS, 120);
        this.registry.set(REGISTRY.MOON_INDEX, 1);
        this.scene.start('Preloader');
    }
}
