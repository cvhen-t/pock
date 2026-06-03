import { computeLogisticsDragSnapshot } from './logisticsLinkDragSnapshot';
import { REGISTRY_LINK_VISUAL } from './linkVisualConfig';
import { edgeStyleKey, getLogisticsRole } from './linkRules';
/** Whether this board card should show logistics range rings while dragging. */
export function getLogisticsRangeSpec(card, config) {
    const tags = card.definition.tags ?? [];
    const role = getLogisticsRole(tags);
    if (role === 'logistics_collect') {
        const effect = card.definition.effects?.find((e) => e.type === 'auto_collector');
        const pickupRadius = Number(effect?.pickupRadius);
        return {
            pickupRadius: pickupRadius > 0 ? pickupRadius : config.collectorPickupRadius,
            linkRadius: config.linkRadius,
        };
    }
    if (role === 'auto_relay' ||
        role === 'logistics_sorter' ||
        role === 'logistics_depot' ||
        role === 'shop' ||
        role === 'warehouse' ||
        role === 'logistics_facility') {
        return { linkRadius: config.linkRadius };
    }
    return null;
}
/**
 * 拖拽预览：与松手后相同的 stable 建图，返回涉及本次 mover 的连边。
 */
export function findLogisticsPreviewLinksStable(scene, dragged, linkRadius, dragCards, rules) {
    const visual = scene.registry.get(REGISTRY_LINK_VISUAL);
    const snapshot = computeLogisticsDragSnapshot(scene, dragged, linkRadius, dragCards, visual, rules);
    return snapshot.active;
}
export { computeLogisticsDragSnapshot } from './logisticsLinkDragSnapshot';
/** @deprecated 请用 findLogisticsPreviewLinksStable */
export function findLogisticsPreviewLinks(scene, dragged, linkRadius, rules) {
    return findLogisticsPreviewLinksStable(scene, dragged, linkRadius, [dragged], rules);
}
export function previewLinkStyleKey(link) {
    return edgeStyleKey(link.fromRole, link.toRole);
}
/** @deprecated Use findLogisticsPreviewLinksStable */
export function findLogisticsLinkCandidates(scene, dragged, linkRadius, rules) {
    return findLogisticsPreviewLinksStable(scene, dragged, linkRadius, [dragged], rules).map((l) => l.other);
}
