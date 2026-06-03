import { findSortHandsViaGraph, getSortHandDownstream, } from './automationNetwork';
import { getModeTargetRole, getSortMode, packetMatchesSortHand, } from './sortHandRules';
/** 可向传送节点注入包裹的源角色 */
export const SOURCE_ROLES = [
    'logistics_collect',
    'logistics_facility',
    'warehouse',
    'logistics_depot',
];
export function sortHandHasMatchingDownstream(graph, sortHand) {
    const mode = getSortMode(sortHand);
    if (mode === 'feed') {
        return !!(getSortHandDownstream(graph, sortHand, 'logistics_facility') ||
            getSortHandDownstream(graph, sortHand, 'logistics_depot'));
    }
    const role = getModeTargetRole(mode);
    return !!getSortHandDownstream(graph, sortHand, role);
}
/** 传送节点上是否存在能投递该 cardId 的分拣手（含模式与下游匹配） */
export function canRelayDispatchPacket(graph, relayCard, cardId) {
    const relayDev = graph.devices.find((d) => d.card === relayCard && d.role === 'auto_relay');
    if (!relayDev)
        return false;
    for (const sortHand of findSortHandsViaGraph(graph.edges, relayDev)) {
        if (!packetMatchesSortHand({ cardId }, sortHand))
            continue;
        const mode = getSortMode(sortHand);
        const targetRole = getModeTargetRole(mode);
        let target = getSortHandDownstream(graph, sortHand, targetRole);
        if (mode === 'feed' && !target) {
            target =
                getSortHandDownstream(graph, sortHand, 'logistics_depot') ??
                    getSortHandDownstream(graph, sortHand, 'logistics_facility');
        }
        if (target)
            return true;
    }
    return false;
}
/** 源 → 传送 → 分拣手(模式匹配下游) 路径完整 */
export function isSourceRelayPathActive(graph, sourceDev) {
    const relayEdge = graph.edges.find((e) => e.from.id === sourceDev.id && e.toRole === 'auto_relay');
    if (!relayEdge)
        return false;
    const sortHands = findSortHandsViaGraph(graph.edges, relayEdge.to);
    return sortHands.some((sh) => sortHandHasMatchingDownstream(graph, sh));
}
export function getRelayDeviceForSource(graph, sourceDev) {
    return graph.edges.find((e) => e.from.id === sourceDev.id && e.toRole === 'auto_relay')?.to;
}
export function getRelayDeviceForSortHand(graph, sortHand) {
    return graph.edges.find((e) => e.to.card === sortHand && e.fromRole === 'auto_relay' && e.toRole === 'logistics_sorter')?.from;
}
export function listSourcesOnRelay(graph, relayDev) {
    return graph.edges
        .filter((e) => e.to.id === relayDev.id &&
        e.toRole === 'auto_relay' &&
        SOURCE_ROLES.includes(e.from.role))
        .map((e) => e.from);
}
export function isAutomationEdgeActive(graph, edge) {
    if (edge.from.role === 'logistics_sorter') {
        return sortHandHasMatchingDownstream(graph, edge.from.card);
    }
    if (edge.toRole === 'auto_relay' &&
        SOURCE_ROLES.includes(edge.from.role)) {
        return isSourceRelayPathActive(graph, edge.from);
    }
    if (edge.from.role === 'auto_relay' && edge.toRole === 'logistics_sorter') {
        const hasActiveSource = listSourcesOnRelay(graph, edge.from).some((src) => isSourceRelayPathActive(graph, src));
        return hasActiveSource && sortHandHasMatchingDownstream(graph, edge.to.card);
    }
    if (edge.from.role === 'logistics_depot' && edge.toRole === 'logistics_facility') {
        return true;
    }
    return true;
}
/** @deprecated 使用 isSourceRelayPathActive */
export function isActiveCollectorChain(graph, collectorDevice) {
    return (collectorDevice.role === 'logistics_collect' &&
        isSourceRelayPathActive(graph, collectorDevice));
}
/** @deprecated 使用 isSourceRelayPathActive */
export function isActiveFacilityRelayChain(graph, facilityDevice) {
    return (facilityDevice.role === 'logistics_facility' &&
        isSourceRelayPathActive(graph, facilityDevice));
}
/** @deprecated 使用 isSourceRelayPathActive */
export function isActiveWarehouseRelayChain(graph, warehouseDevice) {
    return (warehouseDevice.role === 'warehouse' && isSourceRelayPathActive(graph, warehouseDevice));
}
export function getSortHandPathStatus(graph, sortHand) {
    if (!graph)
        return 'no_relay';
    if (!sortHandHasMatchingDownstream(graph, sortHand))
        return 'no_downstream';
    const relay = getRelayDeviceForSortHand(graph, sortHand);
    if (!relay)
        return 'no_relay';
    const mode = getSortMode(sortHand);
    const hasSource = listSourcesOnRelay(graph, relay).some((src) => {
        if (!isSourceRelayPathActive(graph, src))
            return false;
        if (mode === 'buy')
            return src.role === 'logistics_collect';
        if (mode === 'sell' || mode === 'store') {
            return src.role === 'warehouse' || src.role === 'logistics_depot';
        }
        if (mode === 'feed') {
            return (src.role === 'warehouse' ||
                src.role === 'logistics_depot' ||
                src.role === 'logistics_facility' ||
                src.role === 'logistics_collect');
        }
        return false;
    });
    if (mode === 'buy') {
        return listSourcesOnRelay(graph, relay).some((s) => s.role === 'logistics_collect')
            ? 'ok'
            : 'no_matching_source';
    }
    if (mode === 'sell' || mode === 'store') {
        const storageOnRelay = listSourcesOnRelay(graph, relay).filter((s) => s.role === 'warehouse' || s.role === 'logistics_depot');
        if (storageOnRelay.length === 0)
            return 'no_matching_source';
        return hasSource ? 'ok' : 'no_matching_source';
    }
    return hasSource ? 'ok' : 'no_matching_source';
}
export function sortHandPathHintSubtitle(status, mode) {
    switch (status) {
        case 'no_downstream':
            return '请连接与当前模式匹配的下游（商店/储物棚/工房/投放仓储）';
        case 'no_relay':
            return '请先连接传送节点';
        case 'no_matching_source':
            if (mode === 'sell' || mode === 'store') {
                return '经传送连接储物棚或投放仓储，并确保内有货物';
            }
            if (mode === 'buy') {
                return '买入需收集探头 → 传送 → 本分拣手 → 商店';
            }
            return '连接上游收集/仓储/工房，并确保传送与分拣手连通';
        default:
            return '';
    }
}
