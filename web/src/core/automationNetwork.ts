import Phaser from 'phaser';

import GameCard from '../objects/GameCard';

import type { AutomationConfig } from './automationConfig';

import { getLogisticsRole, parseLinkRules, type LinkConnectionRule } from './linkRules';

import type { LogisticsDevice } from './sortHandRules';



export const REGISTRY_AUTOMATION_GRAPH = 'automationGraph';

export const EVENT_AUTOMATION_GRAPH_UPDATED = 'automation-graph-updated';



export interface AutomationEdge {

  from: LogisticsDevice;

  to: LogisticsDevice;

  fromRole: string;

  toRole: string;

}



export interface AutomationGraph {

  devices: LogisticsDevice[];

  edges: AutomationEdge[];

  relaySortHands: Map<GameCard, GameCard[]>;

  builtAt: number;

}



function dist(a: LogisticsDevice, b: LogisticsDevice): number {

  return Phaser.Math.Distance.Between(a.card.x, a.card.y, b.card.x, b.card.y);

}



function outKey(fromId: string, toRole: string): string {

  return `${fromId}→${toRole}`;

}



function inKey(toId: string, fromRole: string): string {

  return `${toId}←${fromRole}`;

}



export function collectLogisticsDevices(scene: Phaser.Scene): LogisticsDevice[] {

  const devices: LogisticsDevice[] = [];

  for (const obj of scene.children.list) {

    if (!(obj instanceof GameCard)) continue;

    const tags = obj.definition.tags ?? [];

    const role = getLogisticsRole(tags);

    if (!role) continue;

    devices.push({

      card: obj,

      role,

      tags,

      id: obj.stackId ?? `solo_${obj.x}_${obj.y}`,

    });

  }

  return devices;

}



function sorterTotalInKey(toId: string): string {
  return `sorter:in:${toId}`;
}

function hasSorterDownstream(edges: AutomationEdge[], sorterId: string): boolean {
  return edges.some((e) => e.from.id === sorterId && e.fromRole === 'logistics_sorter');
}

/** 分拣手下游只连最近的一个目标 */
function attachSorterDownstreams(
  devices: LogisticsDevice[],
  edges: AutomationEdge[],
  rules: LinkConnectionRule[],
  linkRadius: number,
): void {
  const downRules = rules.filter((r) => r.from === 'logistics_sorter');
  for (const sorter of devices.filter((d) => d.role === 'logistics_sorter')) {
    if (hasSorterDownstream(edges, sorter.id)) continue;

    let best: { to: LogisticsDevice; rule: LinkConnectionRule; d: number } | null = null;
    for (const rule of downRules) {
      for (const to of devices.filter((d) => d.role === rule.to)) {
        if (to.card === sorter.card) continue;
        const d = dist(sorter, to);
        if (d > linkRadius) continue;
        if (!best || d < best.d) best = { to, rule, d };
      }
    }
    if (!best) continue;

    const inn = edges.filter((e) => e.to.id === best.to.id && e.fromRole === best.rule.from).length;
    if (inn >= best.rule.maxIn) continue;

    edges.push({
      from: sorter,
      to: best.to,
      fromRole: best.rule.from,
      toRole: best.rule.to,
    });
  }
}

export function buildProximityEdges(
  devices: LogisticsDevice[],
  rules: LinkConnectionRule[],
  linkRadius: number,
): AutomationEdge[] {
  const edges: AutomationEdge[] = [];
  const outCount = new Map<string, number>();
  const inCount = new Map<string, number>();
  const sortedRules = [...rules].sort((a, b) => b.priority - a.priority);

  for (const rule of sortedRules) {
    if (rule.from === 'logistics_sorter') continue;

    const fromList = devices.filter((d) => d.role === rule.from);
    const toList = devices.filter((d) => d.role === rule.to);
    for (const from of fromList) {
      const candidates = toList
        .filter((to) => to.card !== from.card)
        .map((to) => ({ to, d: dist(from, to) }))
        .filter((x) => x.d <= linkRadius)
        .sort((a, b) => a.d - b.d);

      for (const { to } of candidates) {
        const oKey = outKey(from.id, rule.to);
        const iKey = inKey(to.id, rule.from);
        const out = outCount.get(oKey) ?? 0;
        const inn = inCount.get(iKey) ?? 0;
        if (out >= rule.maxOut || inn >= rule.maxIn) continue;

        if (to.role === 'logistics_sorter') {
          if ((inCount.get(sorterTotalInKey(to.id)) ?? 0) >= 1) continue;
        }

        if (edges.some((e) => e.from.id === from.id && e.to.id === to.id)) continue;

        edges.push({ from, to, fromRole: rule.from, toRole: rule.to });
        outCount.set(oKey, out + 1);
        inCount.set(iKey, inn + 1);
        if (to.role === 'logistics_sorter') {
          inCount.set(sorterTotalInKey(to.id), 1);
        }
      }
    }
  }

  attachSorterDownstreams(devices, edges, rules, linkRadius);
  return edges;
}



/** 传送节点 → 分拣手（图边，可多条并行） */

export function findSortHandsViaGraph(

  edges: AutomationEdge[],

  relay: LogisticsDevice,

): GameCard[] {

  return edges

    .filter((e) => e.from.id === relay.id && e.toRole === 'logistics_sorter')

    .map((e) => e.to.card);

}



/** 储物棚 → 下游传送节点 */

export function getRelayForWarehouse(

  graph: AutomationGraph,

  warehouse: GameCard,

): GameCard | null {

  const dev = findDevice(graph, warehouse);

  if (!dev) return null;

  return (

    graph.edges.find((e) => e.from.id === dev.id && e.toRole === 'auto_relay')?.to.card ?? null

  );

}



/** 与设施直连的储物棚（供料边） */

export function getWarehousesLinkedToFacility(

  graph: AutomationGraph,

  facility: GameCard,

): GameCard[] {

  const dev = findDevice(graph, facility);

  if (!dev) return [];

  return graph.edges

    .filter(

      (e) =>

        e.to.id === dev.id &&

        e.fromRole === 'warehouse' &&

        e.toRole === 'logistics_facility',

    )

    .map((e) => e.from.card);

}



/** 工房 → 下游传送节点 */

export function getRelayForFacility(

  graph: AutomationGraph,

  facility: GameCard,

): GameCard | null {

  const dev = findDevice(graph, facility);

  if (!dev) return null;

  return graph.edges.find(

    (e) => e.from.id === dev.id && e.toRole === 'auto_relay',

  )?.to.card ?? null;

}



/** 分拣手下游目标（商店 / 工房 / 仓储等） */
export function getSortHandDownstream(
  graph: AutomationGraph,
  sortHand: GameCard,
  targetRole?: string,
): GameCard | null {
  const outEdges = graph.edges.filter(
    (e) => e.from.card === sortHand && e.fromRole === 'logistics_sorter',
  );
  if (outEdges.length === 0) return null;
  if (targetRole) {
    const edge = outEdges.find((e) => e.toRole === targetRole);
    return edge?.to.card ?? null;
  }
  return outEdges[0]?.to.card ?? null;
}



/** 分拣手 → 工房 */

export function getLinkedFacilityForSortHand(

  graph: AutomationGraph,

  sortHand: GameCard,

): GameCard | null {

  return getSortHandDownstream(graph, sortHand, 'logistics_facility');

}



/** 分拣手 → 投放仓储 */

export function getLinkedDepotForSortHand(

  graph: AutomationGraph,

  sortHand: GameCard,

): GameCard | null {

  return getSortHandDownstream(graph, sortHand, 'logistics_depot');

}



export function buildAutomationGraph(

  scene: Phaser.Scene,

  config: AutomationConfig,

  rules: LinkConnectionRule[],

): AutomationGraph {

  const devices = collectLogisticsDevices(scene);

  const edges = buildProximityEdges(devices, rules, config.linkRadius);

  const relaySortHands = new Map<GameCard, GameCard[]>();

  for (const d of devices) {

    if (d.role === 'auto_relay') {

      relaySortHands.set(d.card, findSortHandsViaGraph(edges, d));

    }

  }

  return { devices, edges, relaySortHands, builtAt: scene.time.now };

}



export function findDevice(graph: AutomationGraph, card: GameCard): LogisticsDevice | undefined {

  return graph.devices.find((d) => d.card === card);

}



const DOWNSTREAM_ROLES = ['shop', 'warehouse', 'logistics_facility', 'logistics_depot'] as const;



export function isActiveCollectorChain(

  graph: AutomationGraph,

  collectorDevice: LogisticsDevice,

): boolean {

  const relayEdge = graph.edges.find(

    (e) => e.from.id === collectorDevice.id && e.toRole === 'auto_relay',

  );

  if (!relayEdge) return false;

  const sortHands = findSortHandsViaGraph(graph.edges, relayEdge.to);

  if (sortHands.length === 0) return false;

  return sortHands.some((sh) =>

    graph.edges.some(

      (e) => e.from.card === sh && DOWNSTREAM_ROLES.includes(e.toRole as (typeof DOWNSTREAM_ROLES)[number]),

    ),

  );

}



/** 工房 → 传送 → 分拣手 → 下游 为有效产出链 */

export function isActiveFacilityRelayChain(

  graph: AutomationGraph,

  facilityDevice: LogisticsDevice,

): boolean {

  const relayEdge = graph.edges.find(

    (e) => e.from.id === facilityDevice.id && e.toRole === 'auto_relay',

  );

  if (!relayEdge) return false;

  const sortHands = findSortHandsViaGraph(graph.edges, relayEdge.to);

  if (sortHands.length === 0) return false;

  return sortHands.some((sh) =>

    graph.edges.some(

      (e) => e.from.card === sh && DOWNSTREAM_ROLES.includes(e.toRole as (typeof DOWNSTREAM_ROLES)[number]),

    ),

  );

}



/** 储物棚 → 传送 → 分拣手 → 生产设施 为有效出库链 */

export function isActiveWarehouseRelayChain(

  graph: AutomationGraph,

  warehouseDevice: LogisticsDevice,

): boolean {

  const relayEdge = graph.edges.find(

    (e) => e.from.id === warehouseDevice.id && e.toRole === 'auto_relay',

  );

  if (!relayEdge) return false;

  const sortHands = findSortHandsViaGraph(graph.edges, relayEdge.to);

  if (sortHands.length === 0) return false;

  return sortHands.some((sh) =>

    graph.edges.some((e) => e.from.card === sh && e.toRole === 'logistics_facility'),

  );

}



export function loadLinkRulesFromRegistry(scene: Phaser.Scene): LinkConnectionRule[] {

  return parseLinkRules(scene.cache.json.get('logistics_link_rules'));

}

