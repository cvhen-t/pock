export class ShopCatalog {
    categories = [];
    listings = [];
    sellPrices = [];
    load(raw) {
        if (!raw)
            return;
        this.categories = raw.categories ?? [];
        this.listings = raw.buyListings ?? [];
        this.sellPrices = raw.sellPrices ?? [];
    }
    getCategories() {
        return this.categories;
    }
    getBuyListings(categoryId) {
        if (!categoryId)
            return this.listings;
        return this.listings.filter((l) => l.category === categoryId);
    }
    getSellPrices() {
        return this.sellPrices;
    }
    getListing(id) {
        return this.listings.find((l) => l.id === id);
    }
    resolveSellCaps(cardId, tags) {
        const byId = this.sellPrices.find((r) => r.cardId === cardId);
        if (byId)
            return byId.caps;
        for (const row of this.sellPrices) {
            if (row.tag && tags.includes(row.tag))
                return row.caps;
        }
        return 0;
    }
}
