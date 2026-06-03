import Phaser from 'phaser';

import GameCard from '../objects/GameCard';

import type { AutomationConfig } from './automationConfig';

import { getLogisticsRole, parseLinkRules, type LinkConnectionRule } from './linkRules';

import {
  buildProximityEdgesStable,
  type AutomationEdgeLite,
  type BuildEdgeOptions,
} from './automationNetworkEdges';

import type { LogisticsDevice } from './sortHandRules';

export {
  buildProximityEdgesStable,
  diffAutomationEdges,
  deviceDist,
} from './automationNetworkEdges';
export type { AutomationEdgeLite, BuildEdgeOptions, EdgeDiff } from './automationNetworkEdges';



export const REGISTRY_AUTOMATION_GRAPH = 'automationGraph';

export const EVENT_AUTOMATION_GRAPH_UPDATED = 'automation-graph-updated';



export type AutomationEdge = AutomationEdgeLite;



export interface AutomationGraph {

  devices: LogisticsDevice[];

  edges: AutomationEdge[];

  relaySortHands: Map<GameCard, GameCard[]>;

  builtAt: number;

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



export { buildProximityEdges } from './automationNetworkEdges';

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

  opts?: BuildEdgeOptions,

): AutomationGraph {

  const devices = collectLogisticsDevices(scene);

  const prevGraph = scene.registry.get(REGISTRY_AUTOMATION_GRAPH) as AutomationGraph | undefined;

  const prevEdges = opts?.prevEdges ?? prevGraph?.edges ?? [];

  const edges = buildProximityEdgesStable(devices, rules, config.linkRadius, {
    prevEdges,
    moverIds: opts?.moverIds,
    dragPositions: opts?.dragPositions,
  });

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

