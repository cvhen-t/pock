export class HandInventory {
    slots = [];
    nextOrder = 0;
    getSlots() {
        return this.slots;
    }
    getCount(cardId) {
        return this.slots.find((s) => s.cardId === cardId)?.count ?? 0;
    }
    add(cardId, amount = 1) {
        if (amount <= 0)
            return;
        const existing = this.slots.find((s) => s.cardId === cardId);
        if (existing) {
            existing.count += amount;
        }
        else {
            this.slots.push({ cardId, count: amount, order: this.nextOrder++ });
        }
        this.slots.sort((a, b) => a.order - b.order);
    }
    /** Remove one card of this id. Returns false if none available. */
    consumeOne(cardId) {
        const slot = this.slots.find((s) => s.cardId === cardId);
        if (!slot || slot.count <= 0)
            return false;
        slot.count -= 1;
        if (slot.count <= 0) {
            this.slots = this.slots.filter((s) => s.cardId !== cardId);
        }
        return true;
    }
}
