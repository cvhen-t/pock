import { pickWeightedCardId } from './weightedPick';
const TAG_PRIORITY = ['boss', 'humanoid', 'beast', 'fast', 'tank', 'melee'];
export class DropConfig {
    data = {
        default: [],
        dropChance: 0.72,
        maxDropsOnBoard: 5,
    };
    load(raw) {
        if (!raw)
            return;
        this.data = {
            dropChance: raw.dropChance ?? 0.72,
            default: raw.default ?? [],
            byEnemyTag: raw.byEnemyTag ?? {},
            maxDropsOnBoard: raw.maxDropsOnBoard ?? 5,
        };
    }
    get dropChance() {
        return this.data.dropChance ?? 0.72;
    }
    get maxDropsOnBoard() {
        return this.data.maxDropsOnBoard ?? 5;
    }
    pickCardId(enemyTags, rng = Math.random) {
        for (const tag of TAG_PRIORITY) {
            if (!enemyTags.includes(tag))
                continue;
            const pool = this.data.byEnemyTag?.[tag];
            if (pool?.length)
                return pickWeightedCardId(pool, rng);
        }
        return pickWeightedCardId(this.data.default, rng);
    }
}
