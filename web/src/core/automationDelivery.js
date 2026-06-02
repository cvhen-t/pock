import { isQuantityStackable } from './cardQuantity';
import { dataStore } from './DataStore';
import { deliverToAutoDepot, isWarehouseStorable, markWarehouseMember, storageHasRoom, } from './storageInventory';
export function deliverToPlayerWarehouse(stacks, spawner, drag, warehouseBase, cardId, qty = 1) {
    const cardDef = dataStore.getCard(cardId);
    const tags = cardDef?.tags ?? [];
    if (!isWarehouseStorable(tags))
        return false;
    const stack = stacks.getStackAt(warehouseBase);
    if (!stack || !storageHasRoom(stack, qty))
        return false;
    const existing = stack.members.find((m) => m.definition.id === cardId);
    if (existing && isQuantityStackable(existing.definition)) {
        existing.addQuantity(qty);
        stacks.layoutStack(stack);
        warehouseBase.scene.events.emit('stack-changed', stack);
        return true;
    }
    const card = spawner.spawn(cardId, warehouseBase.x, warehouseBase.y - 8, qty);
    if (!card)
        return false;
    stacks.removeCardFromPlay(card);
    markWarehouseMember(card);
    stack.members.push(card);
    card.stackId = stack.id;
    stacks.layoutStack(stack);
    drag.registerCard(card);
    warehouseBase.scene.events.emit('stack-changed', stack);
    return true;
}
export function deliverPacketToDepot(ctx, depotCard, packet) {
    return deliverToAutoDepot(ctx.stacks, ctx.spawner, ctx.drag, depotCard, packet.cardId, packet.qty ?? 1);
}
export function deliverToCraftStation(stacks, spawner, drag, facilityBase, cardId, qty = 1) {
    const stack = stacks.getStackAt(facilityBase);
    if (!stack)
        return false;
    if (!(facilityBase.definition.tags ?? []).includes('craft_station'))
        return false;
    const existing = stack.members.find((m) => m.definition.id === cardId);
    if (existing && isQuantityStackable(existing.definition)) {
        existing.addQuantity(qty);
        facilityBase.scene.events.emit('stack-changed', stack);
        return true;
    }
    const card = spawner.spawn(cardId, facilityBase.x, facilityBase.y - 12, qty);
    if (!card)
        return false;
    stacks.removeCardFromPlay(card);
    stack.members.push(card);
    card.stackId = stack.id;
    stacks.layoutStack(stack);
    drag.registerCard(card);
    facilityBase.scene.events.emit('stack-changed', stack);
    return true;
}
export function stationNeedsCard(facilityBase, cardId, recipes, dayIndex) {
    const effect = facilityBase.definition.effects?.find((e) => e.type === 'craft_station');
    const stationId = effect?.stationId;
    if (!stationId)
        return false;
    return recipes.some((r) => {
        if (r.stationId !== stationId)
            return false;
        if (r.dayMin != null && dayIndex < r.dayMin)
            return false;
        return r.inputs?.some((i) => i.cardId === cardId);
    });
}
