const TEST_SHOP_CATEGORIES = [
    { id: 'resource', name: '资源' },
    { id: 'weapon', name: '武器' },
    { id: 'defense', name: '防御' },
    { id: 'plant', name: '种植' },
    { id: 'facility', name: '设施' },
    { id: 'ranch', name: '畜牧' },
    { id: 'other', name: '其他' },
];
const TEST_SHOP_EXCLUDE_TAGS = new Set(['enemy', 'base']);
function inferTestShopCategory(card) {
    const tags = card.tags ?? [];
    if (tags.includes('ranch') || tags.includes('poultry') || tags.includes('livestock')) {
        return 'ranch';
    }
    if (tags.includes('mutant_seed') ||
        tags.includes('farm') ||
        tags.includes('attack_plant') ||
        tags.includes('blight_plot')) {
        return 'plant';
    }
    if (card.deck === 'resource' || card.deck === 'wilderness')
        return 'resource';
    if (card.deck === 'attack')
        return 'weapon';
    if (card.deck === 'defense')
        return 'defense';
    if (card.deck === 'facility')
        return 'facility';
    return 'other';
}
export class ShopCatalog {
    categories = [];
    listings = [];
    sellPrices = [];
    testListings = [];
    load(raw) {
        if (!raw)
            return;
        this.categories = raw.categories ?? [];
        this.listings = raw.buyListings ?? [];
        this.sellPrices = raw.sellPrices ?? [];
    }
    buildTestFreeListings(cards) {
        this.testListings = cards
            .filter((c) => {
            if (c.id === 'test_shop')
                return false;
            const tags = c.tags ?? [];
            return !tags.some((t) => TEST_SHOP_EXCLUDE_TAGS.has(t));
        })
            .sort((a, b) => a.name.localeCompare(b.name, 'zh'))
            .map((c) => ({
            id: `test_free_${c.id}`,
            category: inferTestShopCategory(c),
            cardId: c.id,
            count: 1,
            costCaps: 0,
        }));
    }
    isTestFreeShop(card) {
        if (card.id === 'test_shop')
            return true;
        return (card.effects?.some((e) => e.type === 'shop_building' && e.freeAll === true) ?? false);
    }
    getTestCategories() {
        return TEST_SHOP_CATEGORIES;
    }
    getTestBuyListings(categoryId) {
        if (!categoryId)
            return this.testListings;
        return this.testListings.filter((l) => l.category === categoryId);
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
