import { pickWeightedOutcome } from './GrowthTables';
function normalizeTier(raw) {
    return {
        dayMin: raw.dayMin ?? raw.moonMin ?? 1,
        dayMax: raw.dayMax ?? raw.moonMax ?? 99,
        spawnIntervalSec: raw.spawnIntervalSec,
        maxAlive: raw.maxAlive,
        pool: raw.pool.map((p) => ({
            result: p.result ?? p.enemyId ?? 'mutant_hound',
            weight: p.weight,
        })),
        surgeOnDayEnd: raw.surgeOnDayEnd ?? raw.surgeOnMoonEnd,
    };
}
export class InvasionConfig {
    enemies = new Map();
    tiers = [];
    defaults = { spawnIntervalSec: 28, maxAlive: 3, firstSpawnDelaySec: 18 };
    load(enemiesJson, wavesJson) {
        this.enemies.clear();
        for (const raw of enemiesJson.enemies ?? []) {
            const dmg = typeof raw.contactDamage === 'object'
                ? raw.contactDamage.amount ?? 1
                : raw.contactDamage;
            this.enemies.set(raw.id, {
                id: raw.id,
                cardId: raw.cardId,
                speed: raw.speed,
                hp: raw.hp,
                contactDamage: dmg,
                contactCooldownSec: raw.contactCooldownSec,
                targetPreference: raw.targetPreference,
                tags: raw.tags,
            });
        }
        this.tiers = (wavesJson.tiers ?? []).map(normalizeTier);
        this.defaults = {
            spawnIntervalSec: wavesJson.defaultSpawnIntervalSec ?? 28,
            maxAlive: wavesJson.defaultMaxAlive ?? 3,
            firstSpawnDelaySec: wavesJson.firstSpawnDelaySec ?? 18,
        };
    }
    getEnemy(id) {
        return this.enemies.get(id);
    }
    getTierForDay(day) {
        const tier = this.tiers.find((t) => day >= t.dayMin && day <= t.dayMax);
        return (tier ?? {
            dayMin: 1,
            dayMax: 99,
            spawnIntervalSec: this.defaults.spawnIntervalSec,
            maxAlive: this.defaults.maxAlive,
            pool: [{ result: 'mutant_hound', weight: 100 }],
        });
    }
    pickEnemyId(day) {
        const tier = this.getTierForDay(day);
        return pickWeightedOutcome(tier.pool);
    }
    get firstSpawnDelaySec() {
        return this.defaults.firstSpawnDelaySec;
    }
}
