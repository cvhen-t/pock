export interface HandSlot {
  cardId: string;
  count: number;
  order: number;
}

export class HandInventory {
  private slots: HandSlot[] = [];

  private nextOrder = 0;

  getSlots(): readonly HandSlot[] {
    return this.slots;
  }

  getCount(cardId: string): number {
    return this.slots.find((s) => s.cardId === cardId)?.count ?? 0;
  }

  add(cardId: string, amount = 1): void {
    if (amount <= 0) return;
    const existing = this.slots.find((s) => s.cardId === cardId);
    if (existing) {
      existing.count += amount;
    } else {
      this.slots.push({ cardId, count: amount, order: this.nextOrder++ });
    }
    this.slots.sort((a, b) => a.order - b.order);
  }

  /** Remove one card of this id. Returns false if none available. */
  consumeOne(cardId: string): boolean {
    const slot = this.slots.find((s) => s.cardId === cardId);
    if (!slot || slot.count <= 0) return false;
    slot.count -= 1;
    if (slot.count <= 0) {
      this.slots = this.slots.filter((s) => s.cardId !== cardId);
    }
    return true;
  }

  replaceAll(slots: HandSlot[]): void {
    this.slots = slots.map((s) => ({ ...s }));
    this.nextOrder = slots.reduce((max, s) => Math.max(max, s.order + 1), 0);
  }
}
