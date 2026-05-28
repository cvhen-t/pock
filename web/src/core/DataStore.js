class DataStore {
    cards = new Map();
    recipes = [];
    setCards(list) {
        this.cards.clear();
        this.mergeCards(list);
    }
    mergeCards(list) {
        for (const card of list) {
            this.cards.set(card.id, card);
        }
    }
    getCardsByDeck(deck) {
        return [...this.cards.values()].filter((c) => c.deck === deck);
    }
    setRecipes(list) {
        this.recipes = list;
    }
    getCard(id) {
        return this.cards.get(id);
    }
    getAllCards() {
        return [...this.cards.values()];
    }
    getRecipes() {
        return this.recipes;
    }
}
export const dataStore = new DataStore();
