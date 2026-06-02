import type { CardDefinition } from '../types/gameData';

const CARD_CACHE_KEYS = [
  'cards_resource',
  'cards_attack',
  'cards_defense',
  'cards_wilderness',
  'cards_facility',
  'cards_automation',
] as const;

export function collectCardsFromCache(
  cache: Phaser.Cache.CacheManager,
): CardDefinition[] {
  const all: CardDefinition[] = [];
  for (const key of CARD_CACHE_KEYS) {
    const chunk = cache.json.get(key) as { cards?: CardDefinition[] } | undefined;
    if (chunk?.cards) all.push(...chunk.cards);
  }
  return all;
}

export const CARD_JSON_PATHS: Record<(typeof CARD_CACHE_KEYS)[number], string> = {
  cards_resource: 'data/cards/deck_resource.json',
  cards_attack: 'data/cards/deck_attack.json',
  cards_defense: 'data/cards/deck_defense.json',
  cards_wilderness: 'data/cards/deck_wilderness.json',
  cards_facility: 'data/cards/deck_facility.json',
  cards_automation: 'data/cards/deck_automation.json',
};
