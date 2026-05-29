import Phaser from 'phaser';

import type GameCard from '../objects/GameCard';

const PICKUP_MS = 100;
const SETTLE_MS = 200;
const ENTER_MS = 240;
const GHOST_FADE_MS = 120;

/** Lift card when drag starts. */
export function tweenDragPickup(
  scene: Phaser.Scene,
  card: Phaser.GameObjects.GameObject,
  scale: number,
): void {
  scene.tweens.killTweensOf(card);
  scene.tweens.add({
    targets: card,
    scaleX: scale,
    scaleY: scale,
    duration: PICKUP_MS,
    ease: 'Back.easeOut',
  });
}

/** Smooth snap to a resting position. */
export function tweenCardSettle(
  scene: Phaser.Scene,
  card: GameCard,
  x: number,
  y: number,
  scale: number,
  onComplete?: () => void,
): void {
  scene.tweens.killTweensOf(card);
  scene.tweens.add({
    targets: card,
    x,
    y,
    scaleX: scale,
    scaleY: scale,
    alpha: 1,
    duration: SETTLE_MS,
    ease: 'Back.easeOut',
    onComplete,
  });
}

/** Pop-in when a card appears in a drop zone. */
export function tweenCardEnter(
  scene: Phaser.Scene,
  card: GameCard,
  scale: number,
): void {
  const tx = card.x;
  const ty = card.y;
  card.setScale(scale * 0.78);
  card.setAlpha(0.55);
  scene.tweens.killTweensOf(card);
  scene.tweens.add({
    targets: card,
    x: tx,
    y: ty,
    scaleX: scale,
    scaleY: scale,
    alpha: 1,
    duration: ENTER_MS,
    ease: 'Back.easeOut',
  });
}

/** Fade out drag ghost after hand-off to target zone. */
export function fadeOutGhost(
  scene: Phaser.Scene,
  ghost: GameCard,
  onComplete?: () => void,
): void {
  scene.tweens.killTweensOf(ghost);
  scene.tweens.add({
    targets: ghost,
    alpha: 0,
    scaleX: ghost.scaleX * 0.92,
    scaleY: ghost.scaleY * 0.92,
    duration: GHOST_FADE_MS,
    ease: 'Quad.easeIn',
    onComplete: () => {
      ghost.destroy();
      onComplete?.();
    },
  });
}

/** Highlight panel while a card hovers for drop. */
export function setPanelDropHover(
  scene: Phaser.Scene,
  bg: Phaser.GameObjects.Rectangle,
  active: boolean,
  baseAlpha = 0.94,
): void {
  scene.tweens.killTweensOf(bg);
  scene.tweens.add({
    targets: bg,
    fillAlpha: active ? 0.99 : baseAlpha,
    duration: 140,
    ease: 'Sine.easeOut',
  });
  bg.setStrokeStyle(active ? 2 : 1, active ? 0x6a8a5a : 0x4a4034, active ? 0.9 : 0.75);
}
