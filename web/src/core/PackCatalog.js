import { pickWeightedCardId } from './weightedPick';
export class PackCatalog {
    packs = new Map();
    load(raw) {
        this.packs.clear();
        for (const pack of raw?.packs ?? []) {
            this.packs.set(pack.id, pack);
        }
    }
    get(id) {
        return this.packs.get(id);
    }
    getAll() {
        return [...this.packs.values()];
    }
    openPack(packId, rng = Math.random) {
        const pack = this.packs.get(packId);
        if (!pack)
            return [];
        const results = [];
        for (let i = 0; i < pack.draws; i++) {
            const cardId = pickWeightedCardId(pack.pool, rng);
            if (cardId)
                results.push(cardId);
        }
        return results;
    }
}
