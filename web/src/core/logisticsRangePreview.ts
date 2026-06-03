import type { AutomationConfig } from './automationConfig';
import { computeLogisticsDragSnapshot } from './logisticsLinkDragSnapshot';
import { REGISTRY_LINK_VISUAL, type LinkVisualConfig } from './linkVisualConfig';
import { edgeStyleKey, getLogisticsRole, type LinkConnectionRule } from './linkRules';
import type GameCard from '../objects/GameCard';

export interface LogisticsRangeSpec {
  pickupRadius?: number;
  linkRadius: number;
}

export interface LogisticsPreviewLink {
  other: GameCard;
  fromRole: string;
  toRole: string;
  fromCard: GameCard;
  toCard: GameCard;
}

/** Whether this board card should show logistics range rings while dragging. */
export function getLogisticsRangeSpec(
  card: GameCard,
  config: AutomationConfig,
): LogisticsRangeSpec | null {
  const tags = card.definition.tags ?? [];
  const role = getLogisticsRole(tags);

  if (role === 'logistics_collect') {
    const effect = card.definition.effects?.find((e) => e.type === 'auto_collector');
    const pickupRadius = Number(
      (effect as { pickupRadius?: number } | undefined)?.pickupRadius,
    );
    return {
      pickupRadius: pickupRadius > 0 ? pickupRadius : config.collectorPickupRadius,
      linkRadius: config.linkRadius,
    };
  }

  if (
    role === 'auto_relay' ||
    role === 'logistics_sorter' ||
    role === 'logistics_depot' ||
    role === 'shop' ||
    role === 'warehouse' ||
    role === 'logistics_facility'
  ) {
    return { linkRadius: config.linkRadius };
  }

  return null;
}

/**
 * 拖拽预览：与松手后相同的 stable 建图，返回涉及本次 mover 的连边。
 */
export function findLogisticsPreviewLinksStable(
  scene: Phaser.Scene,
  dragged: GameCard,
  linkRadius: number,
  dragCards: GameCard[],
  rules?: LinkConnectionRule[],
): LogisticsPreviewLink[] {
  const visual = scene.registry.get(REGISTRY_LINK_VISUAL) as LinkVisualConfig;
  const snapshot = computeLogisticsDragSnapshot(
    scene,
    dragged,
    linkRadius,
    dragCards,
    visual,
    rules,
  );
  return snapshot.active;
}

export { computeLogisticsDragSnapshot } from './logisticsLinkDragSnapshot';
export type {
  BlockedLogisticsLink,
  LogisticsDragSnapshot,
} from './logisticsLinkDragSnapshot';

/** @deprecated 请用 findLogisticsPreviewLinksStable */
export function findLogisticsPreviewLinks(
  scene: Phaser.Scene,
  dragged: GameCard,
  linkRadius: number,
  rules?: LinkConnectionRule[],
): LogisticsPreviewLink[] {
  return findLogisticsPreviewLinksStable(scene, dragged, linkRadius, [dragged], rules);
}

export function previewLinkStyleKey(link: LogisticsPreviewLink): string {
  return edgeStyleKey(link.fromRole, link.toRole);
}

/** @deprecated Use findLogisticsPreviewLinksStable */
export function findLogisticsLinkCandidates(
  scene: Phaser.Scene,
  dragged: GameCard,
  linkRadius: number,
  rules?: LinkConnectionRule[],
): GameCard[] {
  return findLogisticsPreviewLinksStable(scene, dragged, linkRadius, [dragged], rules).map(
    (l) => l.other,
  );
}
