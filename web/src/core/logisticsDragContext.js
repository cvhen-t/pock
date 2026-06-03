import { getLogisticsRole } from './linkRules';
export function logisticsDeviceId(card) {
    return card.stackId ?? `solo_${card.x}_${card.y}`;
}
/** 拖拽中的物流设备 → stable 建图 opts */
export function buildLogisticsDragOptions(cards) {
    const moverIds = new Set();
    const dragPositions = new Map();
    for (const card of cards) {
        if (!getLogisticsRole(card.definition.tags ?? []))
            continue;
        const id = logisticsDeviceId(card);
        moverIds.add(id);
        dragPositions.set(id, { x: card.x, y: card.y });
    }
    if (moverIds.size === 0)
        return undefined;
    return { moverIds, dragPositions };
}
