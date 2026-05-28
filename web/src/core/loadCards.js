const CARD_CACHE_KEYS = ['cards_resource', 'cards_attack', 'cards_defense'];
export function collectCardsFromCache(cache) {
    const all = [];
    for (const key of CARD_CACHE_KEYS) {
        const chunk = cache.json.get(key);
        if (chunk?.cards)
            all.push(...chunk.cards);
    }
    return all;
}
export const CARD_JSON_PATHS = {
    cards_resource: 'data/cards/deck_resource.json',
    cards_attack: 'data/cards/deck_attack.json',
    cards_defense: 'data/cards/deck_defense.json',
};
