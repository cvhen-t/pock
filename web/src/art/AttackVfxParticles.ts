import Phaser from 'phaser';

import { ATTACK_VFX } from './attackVfxKeys';

export function registerAttackParticles(scene: Phaser.Scene): void {
  if (!scene.textures.exists(ATTACK_VFX.DIRT_PARTICLE)) {
    buildDirtParticle(scene);
  }
  if (!scene.textures.exists(ATTACK_VFX.SPORE_PARTICLE)) {
    buildSporeParticle(scene);
  }
  if (!scene.textures.exists(ATTACK_VFX.ACID_DRIP_PARTICLE)) {
    buildAcidDripParticle(scene);
  }
  if (!scene.textures.exists(ATTACK_VFX.THORN_CHIP_PARTICLE)) {
    buildThornChipParticle(scene);
  }
}

function buildDirtParticle(scene: Phaser.Scene): void {
  const g = scene.make.graphics({ x: 0, y: 0 }, false);
  g.fillStyle(0x4a4034, 1);
  g.fillCircle(4, 4, 3);
  g.fillStyle(0x6a5a48, 0.7);
  g.fillCircle(3, 3, 1.5);
  g.generateTexture(ATTACK_VFX.DIRT_PARTICLE, 8, 8);
  g.destroy();
}

function buildSporeParticle(scene: Phaser.Scene): void {
  const g = scene.make.graphics({ x: 0, y: 0 }, false);
  g.fillStyle(0x3a5a32, 0.85);
  g.fillCircle(4, 4, 3);
  g.fillStyle(0x5a7a48, 0.5);
  g.fillCircle(5, 3, 1.5);
  g.generateTexture(ATTACK_VFX.SPORE_PARTICLE, 8, 8);
  g.destroy();
}

function buildThornChipParticle(scene: Phaser.Scene): void {
  const g = scene.make.graphics({ x: 0, y: 0 }, false);
  g.fillStyle(0x5c4038, 1);
  g.fillTriangle(4, 2, 7, 7, 1, 7);
  g.fillStyle(0x7a5a48, 0.85);
  g.fillCircle(4, 4, 1.5);
  g.generateTexture(ATTACK_VFX.THORN_CHIP_PARTICLE, 8, 8);
  g.destroy();
}

function buildAcidDripParticle(scene: Phaser.Scene): void {
  const g = scene.make.graphics({ x: 0, y: 0 }, false);
  g.fillStyle(0x5a6a38, 0.9);
  g.fillEllipse(3, 5, 4, 7);
  g.fillStyle(0x7a8a48, 0.4);
  g.fillEllipse(3, 3, 2, 3);
  g.generateTexture(ATTACK_VFX.ACID_DRIP_PARTICLE, 6, 10);
  g.destroy();
}
