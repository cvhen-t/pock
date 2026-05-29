export function pickWeightedCardId(pool, rng = Math.random) {
    if (pool.length === 0)
        return null;
    const total = pool.reduce((sum, row) => sum + row.weight, 0);
    if (total <= 0)
        return pool[0]?.cardId ?? null;
    let roll = rng() * total;
    for (const row of pool) {
        roll -= row.weight;
        if (roll <= 0)
            return row.cardId;
    }
    return pool[pool.length - 1].cardId;
}
