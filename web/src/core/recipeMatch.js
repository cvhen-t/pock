import { getCardQuantity } from './cardQuantity';
function recipeDayMin(r) {
    return r.dayMin ?? r.moonPhaseMin;
}
function cardMatchesInput(card, input) {
    const tags = card.definition.tags ?? [];
    if (input.cardId && card.definition.id === input.cardId)
        return true;
    if (input.tag && tags.includes(input.tag))
        return true;
    return false;
}
function tryMatchRecipe(recipe, members) {
    const pool = [...members];
    const remaining = new Map();
    for (const card of pool) {
        remaining.set(card, getCardQuantity(card));
    }
    const consumed = [];
    let seedCardId;
    for (const input of recipe.inputs) {
        let needed = input.count;
        for (let i = pool.length - 1; i >= 0 && needed > 0; i--) {
            const card = pool[i];
            const left = remaining.get(card) ?? 0;
            if (left <= 0 || !cardMatchesInput(card, input))
                continue;
            if (input.tag === 'seed' && !seedCardId) {
                seedCardId = card.definition.id;
            }
            const take = Math.min(needed, left);
            consumed.push({ card, amount: take });
            remaining.set(card, left - take);
            needed -= take;
        }
        if (needed > 0)
            return null;
    }
    if (recipe.consumeAnimals) {
        const hasAnimal = consumed.some(({ card }) => (card.definition.tags ?? []).includes('animal'));
        if (!hasAnimal)
            return null;
    }
    return { recipe, consumed, seedCardId };
}
export function findFacilityRecipe(stationId, members, recipes, currentDay) {
    const candidates = recipes
        .filter((r) => {
        const minDay = recipeDayMin(r);
        return r.stationId === stationId && (!minDay || currentDay >= minDay);
    })
        .sort((a, b) => b.inputs.length - a.inputs.length);
    for (const recipe of candidates) {
        const match = tryMatchRecipe(recipe, members);
        if (match)
            return match;
    }
    return null;
}
export function previewFacilityRecipe(stationId, members, recipes, currentDay) {
    return findFacilityRecipe(stationId, members, recipes, currentDay)?.recipe ?? null;
}
