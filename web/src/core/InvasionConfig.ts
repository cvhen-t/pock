import { pickWeightedOutcome } from './GrowthTables';

export interface EnemyConfig {
  id: string;
  cardId: string;
  speed: number;
  hp: number;
  contactDamage: number;
  contactCooldownSec: number;
  targetPreference?: string;
}

export interface WaveTier {
  moonMin: number;
  moonMax: number;
  spawnIntervalSec: number;
  maxAlive: number;
  pool: { result: string; weight: number }[];
  surgeOnMoonEnd?: { count: number; leadSec: number };
}

export interface WavesFile {
  defaultSpawnIntervalSec: number;
  defaultMaxAlive: number;
  firstSpawnDelaySec: number;
  tiers: WaveTier[];
}

interface EnemyJsonRow {
  id: string;
  cardId: string;
  speed: number;
  hp: number;
  contactDamage: number | { amount?: number };
  contactCooldownSec: number;
  targetPreference?: string;
}

export class InvasionConfig {
  private enemies = new Map<string, EnemyConfig>();

  private tiers: WaveTier[] = [];

  private defaults = { spawnIntervalSec: 28, maxAlive: 3, firstSpawnDelaySec: 18 };

  load(enemiesJson: { enemies?: EnemyJsonRow[] }, wavesJson: WavesFile): void {
    this.enemies.clear();
    for (const raw of enemiesJson.enemies ?? []) {
      const dmg =
        typeof raw.contactDamage === 'object'
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

  getEnemy(id: string): EnemyConfig | undefined {
    return this.enemies.get(id);
  }

  getTierForMoon(moon: number): WaveTier {
    const tier = this.tiers.find((t) => moon >= t.moonMin && moon <= t.moonMax);
    return (
      tier ?? {
        moonMin: 1,
        moonMax: 99,
        spawnIntervalSec: this.defaults.spawnIntervalSec,
        maxAlive: this.defaults.maxAlive,
        pool: [{ result: 'mutant_hound', weight: 100 }],
      }
    );
  }

  pickEnemyId(moon: number): string {
    const tier = this.getTierForMoon(moon);
    return pickWeightedOutcome(tier.pool);
  }

  get firstSpawnDelaySec(): number {
    return this.defaults.firstSpawnDelaySec;
  }
}
