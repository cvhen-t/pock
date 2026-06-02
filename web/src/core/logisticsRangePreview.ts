import Phaser from 'phaser';
import type { AutomationConfig } from './automationConfig';
import { edgeStyleKey, getLogisticsRole, type LinkConnectionRule } from './linkRules';
import { collectLogisticsDevices, loadLinkRulesFromRegistry, REGISTRY_AUTOMATION_GRAPH } from './automationNetwork';
import type { LogisticsDevice } from './sortHandRules';
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

function distCards(a: GameCard, b: GameCard): number {
  return Phaser.Math.Distance.Between(a.x, a.y, b.x, b.y);
}

function deviceMatchesRole(device: LogisticsDevice, role: string): boolean {
  return device.role === role || device.tags.includes(role);
}

/** Preview links when dragged card is within linkRadius of a valid partner. */
export function findLogisticsPreviewLinks(
  scene: Phaser.Scene,
  dragged: GameCard,
  linkRadius: number,
  rules?: LinkConnectionRule[],
): LogisticsPreviewLink[] {
  const linkRules = rules ?? loadLinkRulesFromRegistry(scene);
  const devices = collectLogisticsDevices(scene);
  const draggedRole = getLogisticsRole(dragged.definition.tags ?? []);
  const draggedTags = dragged.definition.tags ?? [];
  const found = new Map<GameCard, LogisticsPreviewLink>();

  for (const rule of linkRules) {
    const draggedIsFrom = draggedRole === rule.from;
    const draggedIsTo = draggedRole === rule.to || draggedTags.includes(rule.to);
    if (!draggedIsFrom && !draggedIsTo) continue;

    for (const device of devices) {
      if (device.card === dragged) continue;
      if (distCards(dragged, device.card) > linkRadius) continue;

      if (draggedIsFrom && deviceMatchesRole(device, rule.to)) {
        found.set(device.card, {
          other: device.card,
          fromRole: rule.from,
          toRole: rule.to,
          fromCard: dragged,
          toCard: device.card,
        });
      }
      if (draggedIsTo && deviceMatchesRole(device, rule.from)) {
        found.set(device.card, {
          other: device.card,
          fromRole: rule.from,
          toRole: rule.to,
          fromCard: device.card,
          toCard: dragged,
        });
      }
    }
  }

  limitSortHandPreviewLinks(scene, dragged, draggedRole, found);

  return [...found.values()];
}

/** 分拣手拖拽预览：上游/下游各最多一条 */
function limitSortHandPreviewLinks(
  scene: Phaser.Scene,
  dragged: GameCard,
  draggedRole: string | null,
  found: Map<GameCard, LogisticsPreviewLink>,
): void {
  const graph = scene.registry.get(REGISTRY_AUTOMATION_GRAPH) as
    | { edges: { from: { card: GameCard }; to: { card: GameCard }; fromRole: string; toRole: string }[] }
    | undefined;

  if (draggedRole === 'logistics_sorter') {
    const hasOut =
      graph?.edges.some((e) => e.from.card === dragged && e.fromRole === 'logistics_sorter') ?? false;
    const hasIn =
      graph?.edges.some((e) => e.to.card === dragged && e.toRole === 'logistics_sorter') ?? false;

    const downstream = [...found.values()].filter(
      (l) => l.fromCard === dragged && l.fromRole === 'logistics_sorter',
    );
    if (downstream.length > 1 || hasOut) {
      const keep =
        hasOut ? null : downstream.sort((a, b) => distCards(dragged, a.other) - distCards(dragged, b.other))[0];
      for (const link of downstream) {
        if (link !== keep) found.delete(link.other);
      }
    }

    const upstream = [...found.values()].filter(
      (l) => l.toCard === dragged && l.toRole === 'logistics_sorter',
    );
    if (upstream.length > 1 || hasIn) {
      const keep =
        hasIn ? null : upstream.sort((a, b) => distCards(dragged, a.other) - distCards(dragged, b.other))[0];
      for (const link of upstream) {
        if (link !== keep) found.delete(link.other);
      }
    }
    return;
  }

  for (const [other, link] of [...found.entries()]) {
    if (link.toRole !== 'logistics_sorter' || link.toCard === dragged) continue;
    const sortHand = link.toCard;
    const alreadyOut = graph?.edges.some(
      (e) => e.from.card === sortHand && e.fromRole === 'logistics_sorter',
    );
    if (alreadyOut) found.delete(other);
  }
}

export function previewLinkStyleKey(link: LogisticsPreviewLink): string {
  return edgeStyleKey(link.fromRole, link.toRole);
}

/** @deprecated Use findLogisticsPreviewLinks */
export function findLogisticsLinkCandidates(
  scene: Phaser.Scene,
  dragged: GameCard,
  linkRadius: number,
  rules?: LinkConnectionRule[],
): GameCard[] {
  return findLogisticsPreviewLinks(scene, dragged, linkRadius, rules).map((l) => l.other);
}
