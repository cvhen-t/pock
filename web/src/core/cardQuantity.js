/** Resource cards stack by quantity badge instead of physical pile. */
export function isQuantityStackable(def) {
    return (def.tags ?? []).includes('resource');
}
export function getCardQuantity(card) {
    return card.quantity;
}
export function isQuantityMergePair(a, b) {
    if (a === b)
        return false;
    if (a.definition.id !== b.definition.id)
        return false;
    return isQuantityStackable(a.definition) && isQuantityStackable(b.definition);
}
/** Whether this card can receive merged quantity from a spawn or drag. */
export function canAcceptQuantityMerge(card, stacks) {
    const stack = stacks.getStackAt(card);
    if (!stack)
        return true;
    const baseTags = stack.base.definition.tags ?? [];
    if (stack.base === card) {
        return stack.members.length === 0 && isQuantityStackable(stack.base.definition);
    }
    return (baseTags.includes('craft_station') ||
        baseTags.includes('warehouse') ||
        baseTags.includes('ranch'));
}
/** Reduce quantity or remove card from play when fully consumed. */
export function consumeCardQuantity(card, amount, stacks) {
    const left = getCardQuantity(card) - amount;
    if (left > 0) {
        card.setQuantity(left);
        return;
    }
    stacks.removeCardFromPlay(card);
    card.scene.events.emit('card-removed', card);
    card.destroy();
}
