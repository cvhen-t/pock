import BootScene from '../scenes/BootScene';
import PreloaderScene from '../scenes/PreloaderScene';
import GameScene from '../scenes/GameScene';

export const REGISTRY = {
  MOON_SECONDS: 'moonSeconds',
  MOON_INDEX: 'moonIndex',
  MOON_REMAINING: 'moonRemaining',
} as const;

const MIN_WIDTH = 320;
const MIN_HEIGHT = 480;

/** Read #game-container (or window) size for initial canvas dimensions. */
export function getViewportSize(parent: HTMLElement): { width: number; height: number } {
  const width = Math.max(MIN_WIDTH, Math.floor(parent.clientWidth || window.innerWidth));
  const height = Math.max(MIN_HEIGHT, Math.floor(parent.clientHeight || window.innerHeight));
  return { width, height };
}

export function createGameConfig(parent: HTMLElement): Phaser.Types.Core.GameConfig {
  const { width, height } = getViewportSize(parent);

  return {
    type: Phaser.AUTO,
    parent,
    width,
    height,
    backgroundColor: '#1a1814',
    scale: {
      mode: Phaser.Scale.RESIZE,
      autoCenter: Phaser.Scale.NO_CENTER,
    },
    input: {
      activePointers: 1,
      smoothFactor: 0,
    },
    scene: [BootScene, PreloaderScene, GameScene],
    render: {
      antialias: true,
      roundPixels: true,
    },
    fps: {
      target: 60,
      forceSetTimeOut: true,
    },
  };
}
