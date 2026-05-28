import { pickWeightedOutcome } from './GrowthTables';
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
            });
        }
        this.tiers = wavesJson.tiers ?? [];
        this.defaults = {
            spawnIntervalSec: wavesJson.defaultSpawnIntervalSec ?? 28,
            maxAlive: wavesJson.defaultMaxAlive ?? 3,
            firstSpawnDelaySec: wavesJson.firstSpawnDelaySec ?? 18,
        };
    }
    getEnemy(id) {
        return this.enemies.get(id);
    }
    getTierForMoon(moon) {
        const tier = this.tiers.find((t) => moon >= t.moonMin && moon <= t.moonMax);
        return (tier ?? {
            moonMin: 1,
            moonMax: 99,
            spawnIntervalSec: this.defaults.spawnIntervalSec,
            maxAlive: this.defaults.maxAlive,
            pool: [{ result: 'mutant_hound', weight: 100 }],
        });
    }
    pickEnemyId(moon) {
        const tier = this.getTierForMoon(moon);
        return pickWeightedOutcome(tier.pool);
    }
    get firstSpawnDelaySec() {
        return this.defaults.firstSpawnDelaySec;
    }
}
