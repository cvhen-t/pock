import Phaser from 'phaser';

import { CARD_SHAPES, resolveCardMetrics } from '../config/cardLayout';
import { dataStore } from '../core/DataStore';
import { resolveCardIconKey } from '../art/resolveCardIconKey';
import { TEX } from '../art/textureKeys';
import type { CardDefinition, CardShape } from '../types/gameData';

const SHELL_BY_SHAPE: Record<CardShape, string> = {
  standard: TEX.CARD_SHELL,
  compact: TEX.CARD_SHELL_COMPACT,
  slim: TEX.CARD_SHELL_SLIM,
  wide: TEX.CARD_SHELL_WIDE,
  tile: TEX.CARD_SHELL_TILE,
};

export interface CompactCardThumbOptions {
  scale?: number;
  subtitle?: string;
  priceCaps?: number;
  title?: string;
  /** 价格徽章放在卡牌下方，避免遮挡名称 */
  priceBelowCard?: boolean;
  /** 商店货架：忽略卡牌 shape，统一为标准竖版尺寸 */
  uniformStandard?: boolean;
  /** 收紧价格行间距（商店网格） */
  compactPrice?: boolean;
}

/** HUD-sized card preview (shop shelf, tooltips). */
export function createCardThumb(
  scene: Phaser.Scene,
  cardId: string,
  options: CompactCardThumbOptions = {},
): Phaser.GameObjects.Container | null {
  const def = dataStore.getCard(cardId);
  if (!def) return null;

  const scale = options.scale ?? 0.82;
  const uniform = options.uniformStandard ?? false;
  const shape = uniform ? 'standard' : (def.shape ?? 'standard');
  const metrics = uniform ? CARD_SHAPES.standard : resolveCardMetrics(def);
  const w = metrics.w * scale;
  const h = metrics.h * scale;
  const shellKey = uniform ? TEX.CARD_SHELL : (SHELL_BY_SHAPE[shape] ?? TEX.CARD_SHELL);

  const container = scene.add.container(0, 0);
  const shell = scene.add.image(0, 0, shellKey);
  shell.setDisplaySize(w + 2, h + 2);

  const color = Phaser.Display.Color.HexStringToColor(def.color ?? '#4a4540').color;
  const inner = scene.add.rectangle(0, 0, w - 8, h - 12, color, 0.9);

  const iconKey = resolveIconKey(scene, def);
  const icon = scene.add.image(0, -h * 0.08, iconKey);
  icon.setDisplaySize(metrics.icon * scale, metrics.icon * scale);

  const title = options.title ?? def.name;
  const namePx = Math.max(7, Math.round(8 * (scale / 0.82)));
  const name = scene.add.text(0, h * 0.24, title, {
    fontSize: shape === 'slim' ? `${Math.max(6, namePx - 1)}px` : `${namePx}px`,
    color: '#e8e0d4',
    align: 'center',
    wordWrap: { width: w - 8 },
  });
  name.setOrigin(0.5, 0);

  container.add([shell, inner, icon, name]);

  if (options.subtitle) {
    const sub = scene.add.text(0, -h * 0.38, options.subtitle, {
      fontSize: '9px',
      color: '#c9b896',
      backgroundColor: '#2a2620',
      padding: { x: 4, y: 2 },
    });
    sub.setOrigin(0.5);
    container.add(sub);
  }

  let totalH = h;
  if (options.priceCaps !== undefined) {
    const below = options.priceBelowCard ?? false;
    const compact = options.compactPrice ?? false;
    const priceY = below ? h / 2 + (compact ? 2 : 10) : h * 0.46;
    const price = scene.add.text(0, priceY, `${options.priceCaps} 筹`, {
      fontSize: `${Math.max(compact ? 9 : 10, Math.round(11 * (scale / 0.82)))}px`,
      color: '#f0d878',
      backgroundColor: '#3a3020',
      padding: compact ? { x: 3, y: 0 } : { x: 6, y: 2 },
    });
    price.setOrigin(0.5, 0);
    container.add(price);
    if (below) totalH = h / 2 + priceY + price.height + (compact ? 1 : 4);
  }

  container.setSize(w, totalH);
  container.setData('thumbW', w);
  container.setData('thumbH', totalH);
  container.setData('thumbCardH', h);
  return container;
}

function resolveIconKey(scene: Phaser.Scene, def: CardDefinition): string {
  return resolveCardIconKey(scene, def);
}
