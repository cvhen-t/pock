import type { WeightedRow } from './weightedPick';
import { pickWeightedCardId } from './weightedPick';

export interface PackDefinition {
  id: string;
  name: string;
  description?: string;
  costCaps: number;
  draws: number;
  pool: WeightedRow[];
}

export class PackCatalog {
  private packs = new Map<string, PackDefinition>();

  load(raw: { packs?: PackDefinition[] } | undefined): void {
    this.packs.clear();
    for (const pack of raw?.packs ?? []) {
      this.packs.set(pack.id, pack);
    }
  }

  get(id: string): PackDefinition | undefined {
    return this.packs.get(id);
  }

  getAll(): PackDefinition[] {
    return [...this.packs.values()];
  }

  openPack(packId: string, rng: () => number = Math.random): string[] {
    const pack = this.packs.get(packId);
    if (!pack) return [];
    const results: string[] = [];
    for (let i = 0; i < pack.draws; i++) {
      const cardId = pickWeightedCardId(pack.pool, rng);
      if (cardId) results.push(cardId);
    }
    return results;
  }
}
