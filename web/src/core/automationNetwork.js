import Phaser from 'phaser';
import GameCard from '../objects/GameCard';
import { getLogisticsRole, parseLinkRules } from './linkRules';
export const REGISTRY_AUTOMATION_GRAPH = 'automationGraph';
export const EVENT_AUTOMATION_GRAPH_UPDATED = 'automation-graph-updated';
function dist(a, b) {
    return Phaser.Math.Distance.Between(a.card.x, a.card.y, b.card.x, b.card.y);
}
function outKey(fromId, toRole) {
    return `${fromId}→${toRole}`;
}
function inKey(toId, fromRole) {
    return `${toId}←${fromRole}`;
}
export function collectLogisticsDevices(scene) {
    const devices = [];
    for (const obj of scene.children.list) {
        if (!(obj instanceof GameCard))
            continue;
        const tags = obj.definition.tags ?? [];
        const role = getLogisticsRole(tags);
        if (!role)
            continue;
        devices.push({
            card: obj,
            role,
            tags,
            id: obj.stackId ?? `solo_${obj.x}_${obj.y}`,
        });
    }
    return devices;
}
function sorterTotalInKey(toId) {
    return `sorter:in:${toId}`;
}
function hasSorterDownstream(edges, sorterId) {
    return edges.some((e) => e.from.id === sorterId && e.fromRole === 'logistics_sorter');
}
/** 分拣手下游只连最近的一个目标 */
function attachSorterDownstreams(devices, edges, rules, linkRadius) {
    const downRules = rules.filter((r) => r.from === 'logistics_sorter');
    for (const sorter of devices.filter((d) => d.role === 'logistics_sorter')) {
        if (hasSorterDownstream(edges, sorter.id))
            continue;
        let best = null;
        for (const rule of downRules) {
            for (const to of devices.filter((d) => d.role === rule.to)) {
                if (to.card === sorter.card)
                    continue;
                const d = dist(sorter, to);
                if (d > linkRadius)
                    continue;
                if (!best || d < best.d)
                    best = { to, rule, d };
            }
        }
        if (!best)
            continue;
        const inn = edges.filter((e) => e.to.id === best.to.id && e.fromRole === best.rule.from).length;
        if (inn >= best.rule.maxIn)
            continue;
        edges.push({
            from: sorter,
            to: best.to,
            fromRole: best.rule.from,
            toRole: best.rule.to,
        });
    }
}
export function buildProximityEdges(devices, rules, linkRadius) {
    const edges = [];
    const outCount = new Map();
    const inCount = new Map();
    const sortedRules = [...rules].sort((a, b) => b.priority - a.priority);
    for (const rule of sortedRules) {
        if (rule.from === 'logistics_sorter')
            continue;
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
                if (out >= rule.maxOut || inn >= rule.maxIn)
                    continue;
                if (to.role === 'logistics_sorter') {
                    if ((inCount.get(sorterTotalInKey(to.id)) ?? 0) >= 1)
                        continue;
                }
                if (edges.some((e) => e.from.id === from.id && e.to.id === to.id))
                    continue;
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
export function findSortHandsViaGraph(edges, relay) {
    return edges
        .filter((e) => e.from.id === relay.id && e.toRole === 'logistics_sorter')
        .map((e) => e.to.card);
}
/** 工房 → 下游传送节点 */
export function getRelayForFacility(graph, facility) {
    const dev = findDevice(graph, facility);
    if (!dev)
        return null;
    return graph.edges.find((e) => e.from.id === dev.id && e.toRole === 'auto_relay')?.to.card ?? null;
}
/** 分拣手下游目标（商店 / 工房 / 仓储等） */
export function getSortHandDownstream(graph, sortHand, targetRole) {
    const outEdges = graph.edges.filter((e) => e.from.card === sortHand && e.fromRole === 'logistics_sorter');
    if (outEdges.length === 0)
        return null;
    if (targetRole) {
        const edge = outEdges.find((e) => e.toRole === targetRole);
        return edge?.to.card ?? null;
    }
    return outEdges[0]?.to.card ?? null;
}
/** 分拣手 → 工房 */
export function getLinkedFacilityForSortHand(graph, sortHand) {
    return getSortHandDownstream(graph, sortHand, 'logistics_facility');
}
/** 分拣手 → 投放仓储 */
export function getLinkedDepotForSortHand(graph, sortHand) {
    return getSortHandDownstream(graph, sortHand, 'logistics_depot');
}
export function buildAutomationGraph(scene, config, rules) {
    const devices = collectLogisticsDevices(scene);
    const edges = buildProximityEdges(devices, rules, config.linkRadius);
    const relaySortHands = new Map();
    for (const d of devices) {
        if (d.role === 'auto_relay') {
            relaySortHands.set(d.card, findSortHandsViaGraph(edges, d));
        }
    }
    return { devices, edges, relaySortHands, builtAt: scene.time.now };
}
export function findDevice(graph, card) {
    return graph.devices.find((d) => d.card === card);
}
const DOWNSTREAM_ROLES = ['shop', 'warehouse', 'logistics_facility', 'logistics_depot'];
export function isActiveCollectorChain(graph, collectorDevice) {
    const relayEdge = graph.edges.find((e) => e.from.id === collectorDevice.id && e.toRole === 'auto_relay');
    if (!relayEdge)
        return false;
    const sortHands = findSortHandsViaGraph(graph.edges, relayEdge.to);
    if (sortHands.length === 0)
        return false;
    return sortHands.some((sh) => graph.edges.some((e) => e.from.card === sh && DOWNSTREAM_ROLES.includes(e.toRole)));
}
/** 工房 → 传送 → 分拣手 → 下游 为有效产出链 */
export function isActiveFacilityRelayChain(graph, facilityDevice) {
    const relayEdge = graph.edges.find((e) => e.from.id === facilityDevice.id && e.toRole === 'auto_relay');
    if (!relayEdge)
        return false;
    const sortHands = findSortHandsViaGraph(graph.edges, relayEdge.to);
    if (sortHands.length === 0)
        return false;
    return sortHands.some((sh) => graph.edges.some((e) => e.from.card === sh && DOWNSTREAM_ROLES.includes(e.toRole)));
}
export function loadLinkRulesFromRegistry(scene) {
    return parseLinkRules(scene.cache.json.get('logistics_link_rules'));
}
