import Phaser from 'phaser';
import { createGameConfig } from './config/gameConfig';

const parent = document.getElementById('game-container');
if (!parent) {
  throw new Error('#game-container not found');
}

let game: Phaser.Game;

document.addEventListener(
  'contextmenu',
  (e) => e.preventDefault(),
  { passive: false },
);

document.addEventListener(
  'gesturestart',
  (e) => e.preventDefault(),
  { passive: false },
);

game = new Phaser.Game(createGameConfig(parent));

window.addEventListener('resize', () => {
  game.scale.refresh();
});
