import {
  collectLogisticsDevices,
  loadLinkRulesFromRegistry,
  REGISTRY_AUTOMATION_GRAPH,
  type AutomationGraph,
} from './automationNetwork';
import {
  buildProximityEdgesStable,
  deviceDist,
  diffAutomationEdges,
  type AutomationEdgeLite,
} from './automationNetworkEdges';
import { buildLogisticsDragOptions, logisticsDeviceId } from './logisticsDragContext';
import type { LinkConnectionRule } from './linkRules';
import { formatLinkHint, parseLinkVisual, type LinkVisualConfig } from './linkVisualConfig';
import type { LogisticsPreviewLink } from './logisticsRangePreview';
import type { StackDropPreview } from './stackOutcomePreview';
import type { LogisticsDevice } from './sortHandRules';
import type GameCard from '../objects/GameCard';

export interface BlockedLogisticsLink {
  other: GameCard;
  fromRole: string;
  toRole: string;
  fromCard: GameCard;
  toCard: GameCard;
  reason: 'maxIn' | 'maxOut' | 'sorterTaken';
  incumbent?: GameCard;
}

export interface LogisticsDragSnapshot {
  added: LogisticsPreviewLink[];
  removed: LogisticsPreviewLink[];
  blocked: BlockedLogisticsLink[];
  /** 范围内将保持/新增的连边（用于绘制预览线） */
  active: LogisticsPreviewLink[];
  hint: StackDropPreview | null;
}

function edgeTouchesMover(e: AutomationEdgeLite, moverIds: Set<string>): boolean {
  return moverIds.has(e.from.id) || moverIds.has(e.to.id);
}

function edgeToPreviewLink(e: AutomationEdgeLite, moverIds: Set<string>): LogisticsPreviewLink {
  const moverIsFrom = moverIds.has(e.from.id);
  return {
    other: moverIsFrom ? e.to.card : e.from.card,
    fromRole: e.fromRole,
    toRole: e.toRole,
    fromCard: e.from.card,
    toCard: e.to.card,
  };
}

function isConnected(
  nextEdges: AutomationEdgeLite[],
  fromId: string,
  toId: string,
): boolean {
  return nextEdges.some((e) => e.from.id === fromId && e.to.id === toId);
}

function findBlockedLinks(
  devices: LogisticsDevice[],
  moverIds: Set<string>,
  linkRadius: number,
  rules: LinkConnectionRule[],
  nextEdges: AutomationEdgeLite[],
  dragOpts: ReturnType<typeof buildLogisticsDragOptions>,
): BlockedLogisticsLink[] {
  const blocked: BlockedLogisticsLink[] = [];
  const movers = devices.filter((d) => moverIds.has(d.id));

  for (const mover of movers) {
    for (const rule of rules) {
      if (rule.from === 'logistics_sorter') continue;

      if (mover.role === rule.from) {
        for (const to of devices.filter((d) => d.role === rule.to && d.id !== mover.id)) {
          const d = deviceDist(mover, to, dragOpts);
          if (d > linkRadius) continue;
          if (isConnected(nextEdges, mover.id, to.id)) continue;

          const incoming = nextEdges.filter(
            (e) => e.to.id === to.id && e.fromRole === rule.from && e.toRole === rule.to,
          );
          if (incoming.length >= rule.maxIn) {
            const incumbent = incoming.reduce((best, e) => {
              if (!best) return e;
              return deviceDist(e.from, to, dragOpts) < deviceDist(best.from, to, dragOpts)
                ? e
                : best;
            }, null as AutomationEdgeLite | null);
            if (incumbent && incumbent.from.id !== mover.id) {
              blocked.push({
                other: to.card,
                fromRole: rule.from,
                toRole: rule.to,
                fromCard: mover.card,
                toCard: to.card,
                reason: to.role === 'logistics_sorter' ? 'sorterTaken' : 'maxIn',
                incumbent: incumbent.from.card,
              });
            }
          }
        }
      }

      if (mover.role === rule.to) {
        for (const from of devices.filter((d) => d.role === rule.from && d.id !== mover.id)) {
          const d = deviceDist(from, mover, dragOpts);
          if (d > linkRadius) continue;
          if (isConnected(nextEdges, from.id, mover.id)) continue;

          const incoming = nextEdges.filter(
            (e) => e.to.id === mover.id && e.fromRole === rule.from && e.toRole === rule.to,
          );
          if (incoming.length >= rule.maxIn) {
            const incumbent = incoming[0];
            if (incumbent.from.id !== from.id) {
              blocked.push({
                other: from.card,
                fromRole: rule.from,
                toRole: rule.to,
                fromCard: from.card,
                toCard: mover.card,
                reason: mover.role === 'logistics_sorter' ? 'sorterTaken' : 'maxIn',
                incumbent: incumbent.from.card,
              });
            }
          }
        }
      }
    }
  }

  const seen = new Set<string>();
  return blocked.filter((b) => {
    const k = `${logisticsDeviceId(b.fromCard)}→${logisticsDeviceId(b.other)}`;
    if (seen.has(k)) return false;
    seen.add(k);
    return true;
  });
}

function nearestOutOfRangePartner(
  devices: LogisticsDevice[],
  mover: LogisticsDevice,
  rules: LinkConnectionRule[],
  linkRadius: number,
  dragOpts: ReturnType<typeof buildLogisticsDragOptions>,
): { partner: LogisticsDevice; toRole: string; gap: number } | null {
  let best: { partner: LogisticsDevice; toRole: string; d: number } | null = null;

  for (const rule of rules) {
    if (rule.from === 'logistics_sorter') continue;
    if (mover.role === rule.from) {
      for (const to of devices.filter((d) => d.role === rule.to && d.id !== mover.id)) {
        const d = deviceDist(mover, to, dragOpts);
        if (d <= linkRadius) continue;
        if (!best || d < best.d) best = { partner: to, toRole: rule.to, d };
      }
    }
  }

  if (!best) return null;
  return { partner: best.partner, toRole: best.toRole, gap: Math.ceil(best.d - linkRadius) };
}

function buildDragHint(
  snapshot: Omit<LogisticsDragSnapshot, 'hint'>,
  visual: LinkVisualConfig,
  anchor: GameCard,
  linkRadius: number,
  devices: LogisticsDevice[],
  rules: LinkConnectionRule[],
  dragOpts: ReturnType<typeof buildLogisticsDragOptions>,
): StackDropPreview | null {
  const labels = visual.roleLabels;
  const moverId = logisticsDeviceId(anchor);
  const moverDev = devices.find((d) => d.id === moverId);

  if (snapshot.added.length > 0) {
    const link = snapshot.added[0];
    const targetRole = moverId === logisticsDeviceId(link.fromCard) ? link.toRole : link.fromRole;
    const targetLabel = labels[targetRole] ?? targetRole;
    let secondary: string | undefined;
    if (snapshot.removed.length > 0) {
      const r = snapshot.removed[0];
      const fromLabel = labels[r.fromRole] ?? r.fromRole;
      const toLabel = labels[r.toRole] ?? r.toRole;
      secondary = formatLinkHint(visual.linkHints.willDisconnect, {
        from: fromLabel,
        to: toLabel,
      });
    }
    return {
      primary: formatLinkHint(visual.linkHints.willConnect, { target: targetLabel }),
      secondary,
    };
  }

  if (snapshot.blocked.length > 0) {
    const b = snapshot.blocked[0];
    const targetLabel = labels[b.toRole] ?? b.toRole;
    const occupantLabel = b.incumbent?.definition.name ?? labels[b.fromRole] ?? '其它设备';
    return {
      primary: formatLinkHint(visual.linkHints.slotTaken, {
        target: targetLabel,
        occupant: occupantLabel,
      }),
    };
  }

  if (snapshot.removed.length > 0) {
    const r = snapshot.removed[0];
    const fromLabel = labels[r.fromRole] ?? r.fromRole;
    const toLabel = labels[r.toRole] ?? r.toRole;
    return {
      primary: formatLinkHint(visual.linkHints.willDisconnect, { from: fromLabel, to: toLabel }),
    };
  }

  if (snapshot.active.length > 0) {
    const link = snapshot.active[0];
    const targetRole = moverId === logisticsDeviceId(link.fromCard) ? link.toRole : link.fromRole;
    const targetLabel = labels[targetRole] ?? targetRole;
    return {
      primary: formatLinkHint(visual.linkHints.inRangeConnect, { target: targetLabel }),
    };
  }

  if (moverDev) {
    const near = nearestOutOfRangePartner(devices, moverDev, rules, linkRadius, dragOpts);
    if (near) {
      const targetLabel = labels[near.toRole] ?? near.toRole;
      return {
        primary: formatLinkHint(visual.linkHints.tooFar, {
          target: targetLabel,
          distance: String(near.gap),
        }),
      };
    }
  }

  return null;
}

export function computeLogisticsDragSnapshot(
  scene: Phaser.Scene,
  anchor: GameCard,
  linkRadius: number,
  dragCards: GameCard[],
  visual?: LinkVisualConfig,
  rules?: LinkConnectionRule[],
): LogisticsDragSnapshot {
  const resolvedVisual = visual ?? parseLinkVisual(undefined);
  const linkRules = rules ?? loadLinkRulesFromRegistry(scene);
  const devices = collectLogisticsDevices(scene);
  const prevGraph = scene.registry.get(REGISTRY_AUTOMATION_GRAPH) as AutomationGraph | undefined;
  const prevEdges = prevGraph?.edges ?? [];
  const dragOpts = buildLogisticsDragOptions(dragCards);
  const moverIds = dragOpts?.moverIds ?? new Set([logisticsDeviceId(anchor)]);

  const nextEdges = buildProximityEdgesStable(devices, linkRules, linkRadius, {
    prevEdges,
    moverIds: dragOpts?.moverIds,
    dragPositions: dragOpts?.dragPositions,
  });

  const { added: addedEdges, removed: removedEdges } = diffAutomationEdges(prevEdges, nextEdges);

  const added = addedEdges
    .filter((e) => edgeTouchesMover(e, moverIds))
    .map((e) => edgeToPreviewLink(e, moverIds));

  const removed = removedEdges
    .filter((e) => edgeTouchesMover(e, moverIds))
    .map((e) => edgeToPreviewLink(e, moverIds));

  const active = nextEdges
    .filter((e) => edgeTouchesMover(e, moverIds))
    .map((e) => edgeToPreviewLink(e, moverIds));

  const blocked = findBlockedLinks(
    devices,
    moverIds,
    linkRadius,
    linkRules,
    nextEdges,
    dragOpts,
  );

  const core = { added, removed, blocked, active };
  const hint = buildDragHint(core, resolvedVisual, anchor, linkRadius, devices, linkRules, dragOpts);

  return { ...core, hint };
}
