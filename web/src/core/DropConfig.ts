import { pickWeightedCardId, type WeightedRow } from './weightedPick';

export interface DropTablesData {
  dropChance?: number;
  default: WeightedRow[];
  byEnemyTag?: Record<string, WeightedRow[]>;
  maxDropsOnBoard?: number;
}

const TAG_PRIORITY = ['boss', 'humanoid', 'beast', 'fast', 'tank', 'melee'] as const;

export class DropConfig {
  private data: DropTablesData = {
    default: [],
    dropChance: 0.72,
    maxDropsOnBoard: 5,
  };

  load(raw: DropTablesData | undefined): void {
    if (!raw) return;
    this.data = {
      dropChance: raw.dropChance ?? 0.72,
      default: raw.default ?? [],
      byEnemyTag: raw.byEnemyTag ?? {},
      maxDropsOnBoard: raw.maxDropsOnBoard ?? 5,
    };
  }

  get dropChance(): number {
    return this.data.dropChance ?? 0.72;
  }

  get maxDropsOnBoard(): number {
    return this.data.maxDropsOnBoard ?? 5;
  }

  pickCardId(enemyTags: string[], rng: () => number = Math.random): string | null {
    for (const tag of TAG_PRIORITY) {
      if (!enemyTags.includes(tag)) continue;
      const pool = this.data.byEnemyTag?.[tag];
      if (pool?.length) return pickWeightedCardId(pool, rng);
    }
    return pickWeightedCardId(this.data.default, rng);
  }
}
