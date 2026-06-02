import Phaser from 'phaser';
import { edgeStyleKey, getLogisticsRole } from './linkRules';
import { collectLogisticsDevices, loadLinkRulesFromRegistry, REGISTRY_AUTOMATION_GRAPH } from './automationNetwork';
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
function distCards(a, b) {
    return Phaser.Math.Distance.Between(a.x, a.y, b.x, b.y);
}
function deviceMatchesRole(device, role) {
    return device.role === role || device.tags.includes(role);
}
/** Preview links when dragged card is within linkRadius of a valid partner. */
export function findLogisticsPreviewLinks(scene, dragged, linkRadius, rules) {
    const linkRules = rules ?? loadLinkRulesFromRegistry(scene);
    const devices = collectLogisticsDevices(scene);
    const draggedRole = getLogisticsRole(dragged.definition.tags ?? []);
    const draggedTags = dragged.definition.tags ?? [];
    const found = new Map();
    for (const rule of linkRules) {
        const draggedIsFrom = draggedRole === rule.from;
        const draggedIsTo = draggedRole === rule.to || draggedTags.includes(rule.to);
        if (!draggedIsFrom && !draggedIsTo)
            continue;
        for (const device of devices) {
            if (device.card === dragged)
                continue;
            if (distCards(dragged, device.card) > linkRadius)
                continue;
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
function limitSortHandPreviewLinks(scene, dragged, draggedRole, found) {
    const graph = scene.registry.get(REGISTRY_AUTOMATION_GRAPH);
    if (draggedRole === 'logistics_sorter') {
        const hasOut = graph?.edges.some((e) => e.from.card === dragged && e.fromRole === 'logistics_sorter') ?? false;
        const hasIn = graph?.edges.some((e) => e.to.card === dragged && e.toRole === 'logistics_sorter') ?? false;
        const downstream = [...found.values()].filter((l) => l.fromCard === dragged && l.fromRole === 'logistics_sorter');
        if (downstream.length > 1 || hasOut) {
            const keep = hasOut ? null : downstream.sort((a, b) => distCards(dragged, a.other) - distCards(dragged, b.other))[0];
            for (const link of downstream) {
                if (link !== keep)
                    found.delete(link.other);
            }
        }
        const upstream = [...found.values()].filter((l) => l.toCard === dragged && l.toRole === 'logistics_sorter');
        if (upstream.length > 1 || hasIn) {
            const keep = hasIn ? null : upstream.sort((a, b) => distCards(dragged, a.other) - distCards(dragged, b.other))[0];
            for (const link of upstream) {
                if (link !== keep)
                    found.delete(link.other);
            }
        }
        return;
    }
    for (const [other, link] of [...found.entries()]) {
        if (link.toRole !== 'logistics_sorter' || link.toCard === dragged)
            continue;
        const sortHand = link.toCard;
        const alreadyOut = graph?.edges.some((e) => e.from.card === sortHand && e.fromRole === 'logistics_sorter');
        if (alreadyOut)
            found.delete(other);
    }
}
export function previewLinkStyleKey(link) {
    return edgeStyleKey(link.fromRole, link.toRole);
}
/** @deprecated Use findLogisticsPreviewLinks */
export function findLogisticsLinkCandidates(scene, dragged, linkRadius, rules) {
    return findLogisticsPreviewLinks(scene, dragged, linkRadius, rules).map((l) => l.other);
}
