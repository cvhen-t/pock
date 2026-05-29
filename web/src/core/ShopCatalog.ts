export interface ShopCategory {
  id: string;
  name: string;
}

export interface ShopListing {
  id: string;
  category: string;
  cardId: string;
  count?: number;
  costCaps: number;
  dayMin?: number;
  /** @deprecated Use dayMin — kept for legacy shop JSON. */
  moonPhaseMin?: number;
}

export interface SellPriceRow {
  cardId?: string;
  tag?: string;
  caps: number;
}

export interface ShopData {
  categories?: ShopCategory[];
  buyListings?: ShopListing[];
  sellPrices?: SellPriceRow[];
}

export class ShopCatalog {
  private categories: ShopCategory[] = [];

  private listings: ShopListing[] = [];

  private sellPrices: SellPriceRow[] = [];

  load(raw: ShopData | undefined): void {
    if (!raw) return;
    this.categories = raw.categories ?? [];
    this.listings = raw.buyListings ?? [];
    this.sellPrices = raw.sellPrices ?? [];
  }

  getCategories(): ShopCategory[] {
    return this.categories;
  }

  getBuyListings(categoryId?: string): ShopListing[] {
    if (!categoryId) return this.listings;
    return this.listings.filter((l) => l.category === categoryId);
  }

  getSellPrices(): SellPriceRow[] {
    return this.sellPrices;
  }

  getListing(id: string): ShopListing | undefined {
    return this.listings.find((l) => l.id === id);
  }

  resolveSellCaps(cardId: string, tags: string[]): number {
    const byId = this.sellPrices.find((r) => r.cardId === cardId);
    if (byId) return byId.caps;
    for (const row of this.sellPrices) {
      if (row.tag && tags.includes(row.tag)) return row.caps;
    }
    return 0;
  }
}
