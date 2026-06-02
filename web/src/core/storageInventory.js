import { isQuantityStackable } from './cardQuantity';
import { dataStore } from './DataStore';
const STORAGE_MEMBER_KEY = 'storageMember';
const WAREHOUSE_BLOCKED_TAGS = ['survivor', 'shop', 'enemy', 'base', 'building'];
/** 储物棚可存入的卡牌（除人物/商店/敌人/本营/建筑外均可） */
export function isWarehouseStorable(tags) {
    return !WAREHOUSE_BLOCKED_TAGS.some((t) => tags.includes(t));
}
export function isAutoDepotCard(card) {
    return (card.definition.tags ?? []).includes('logistics_depot');
}
export function isPlayerWarehouseCard(card) {
    return (card.definition.effects ?? []).some((e) => e.type === 'warehouse');
}
export function isStorageMember(card) {
    return card.getData(STORAGE_MEMBER_KEY) === true;
}
export function markWarehouseMember(card) {
    card.setData(STORAGE_MEMBER_KEY, true);
    card.visible = false;
}
export function getDepotCapacity(base) {
    const effect = base.definition.effects?.find((e) => e.type === 'auto_storage');
    return Number(effect?.maxStored ?? 16);
}
export function getPlayerWarehouseCapacity(base) {
    const effect = base.definition.effects?.find((e) => e.type === 'warehouse');
    return Number(effect?.maxStored ?? 8);
}
export function getStorageCapacity(base) {
    if (isPlayerWarehouseCard(base))
        return getPlayerWarehouseCapacity(base);
    return getDepotCapacity(base);
}
export function countStoredQuantity(stack) {
    let n = 0;
    for (const m of stack.members)
        n += m.quantity;
    return n;
}
export function storageHasRoom(stack, addQty = 1) {
    return countStoredQuantity(stack) + addQty <= getStorageCapacity(stack.base);
}
export function getWarehouseInventory(stack) {
    const map = new Map();
    for (const m of stack.members) {
        map.set(m.definition.id, (map.get(m.definition.id) ?? 0) + m.quantity);
    }
    return [...map.entries()]
        .map(([cardId, qty]) => ({ cardId, qty }))
        .sort((a, b) => {
        const da = dataStore.getCard(a.cardId);
        const db = dataStore.getCard(b.cardId);
        return (da?.name ?? a.cardId).localeCompare(db?.name ?? b.cardId, 'zh');
    });
}
export function deliverToAutoDepot(stacks, spawner, drag, depotBase, cardId, qty = 1) {
    const stack = stacks.getStackAt(depotBase);
    if (!stack || !storageHasRoom(stack, qty))
        return false;
    const existing = stack.members.find((m) => m.definition.id === cardId);
    if (existing && isQuantityStackable(existing.definition)) {
        existing.addQuantity(qty);
        stacks.layoutStack(stack);
        depotBase.scene.events.emit('stack-changed', stack);
        return true;
    }
    const card = spawner.spawn(cardId, depotBase.x, depotBase.y - 8, qty);
    if (!card)
        return false;
    stacks.removeCardFromPlay(card);
    markWarehouseMember(card);
    stack.members.push(card);
    card.stackId = stack.id;
    stacks.layoutStack(stack);
    drag.registerCard(card);
    depotBase.scene.events.emit('stack-changed', stack);
    return true;
}
export function pullFromWarehouse(stacks, warehouseBase, cardId, qty = 1) {
    const stack = stacks.getStackAt(warehouseBase);
    if (!stack)
        return 0;
    const member = stack.members.find((m) => m.definition.id === cardId);
    if (!member)
        return 0;
    const take = Math.min(qty, member.quantity);
    if (take <= 0)
        return 0;
    if (member.quantity > take) {
        member.setQuantity(member.quantity - take);
    }
    else {
        stack.members = stack.members.filter((m) => m !== member);
        member.stackId = null;
        member.destroy();
    }
    stacks.layoutStack(stack);
    warehouseBase.scene.events.emit('stack-changed', stack);
    return take;
}
export function pullFromAutoDepot(stacks, depotBase, cardId, qty = 1) {
    return pullFromWarehouse(stacks, depotBase, cardId, qty) > 0;
}
