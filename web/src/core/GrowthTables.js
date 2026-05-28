export function pickWeightedOutcome(table, rng = Math.random) {
    const total = table.reduce((sum, row) => sum + row.weight, 0);
    let roll = rng() * total;
    for (const row of table) {
        roll -= row.weight;
        if (roll <= 0)
            return row.result;
    }
    return table[table.length - 1]?.result ?? '';
}
