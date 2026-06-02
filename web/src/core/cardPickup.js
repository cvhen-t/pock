/** Survival supplies are deposited by dragging onto the base camp, not tap pickup. */
export function isHudTapPickupCard(_def) {
    return false;
}
export function isBaseSupplyCard(def) {
    const tags = def.tags ?? [];
    return tags.includes('food') || tags.includes('water');
}
