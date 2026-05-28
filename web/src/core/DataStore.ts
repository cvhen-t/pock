import type { CardDefinition, RecipeDefinition } from '../types/gameData';

class DataStore {
  private cards = new Map<string, CardDefinition>();
  private recipes: RecipeDefinition[] = [];

  setCards(list: CardDefinition[]): void {
    this.cards.clear();
    this.mergeCards(list);
  }

  mergeCards(list: CardDefinition[]): void {
    for (const card of list) {
      this.cards.set(card.id, card);
    }
  }

  getCardsByDeck(deck: CardDefinition['deck']): CardDefinition[] {
    return [...this.cards.values()].filter((c) => c.deck === deck);
  }

  setRecipes(list: RecipeDefinition[]): void {
    this.recipes = list;
  }

  getCard(id: string): CardDefinition | undefined {
    return this.cards.get(id);
  }

  getAllCards(): CardDefinition[] {
    return [...this.cards.values()];
  }

  getRecipes(): RecipeDefinition[] {
    return this.recipes;
  }
}

export const dataStore = new DataStore();
