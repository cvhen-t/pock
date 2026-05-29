import { pickWeightedOutcome } from './GrowthTables';

export interface EnemyConfig {
  id: string;
  cardId: string;
  speed: number;
  hp: number;
  contactDamage: number;
  contactCooldownSec: number;
  targetPreference?: string;
  tags?: string[];
}

export interface WaveTier {
  dayMin: number;
  dayMax: number;
  spawnIntervalSec: number;
  maxAlive: number;
  pool: { result: string; weight: number }[];
  surgeOnDayEnd?: { count: number; leadSec: number };
}

/** Raw tier row from JSON — supports legacy moon* field names. */
interface WaveTierJson {
  dayMin?: number;
  dayMax?: number;
  moonMin?: number;
  moonMax?: number;
  spawnIntervalSec: number;
  maxAlive: number;
  pool: { enemyId?: string; result?: string; weight: number }[];
  surgeOnDayEnd?: { count: number; leadSec: number };
  surgeOnMoonEnd?: { count: number; leadSec: number };
}

export interface WavesFile {
  defaultSpawnIntervalSec: number;
  defaultMaxAlive: number;
  firstSpawnDelaySec: number;
  tiers: WaveTierJson[];
}

interface EnemyJsonRow {
  id: string;
  cardId: string;
  speed: number;
  hp: number;
  contactDamage: number | { amount?: number };
  contactCooldownSec: number;
  targetPreference?: string;
  tags?: string[];
}

function normalizeTier(raw: WaveTierJson): WaveTier {
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

  getEnemy(id: string): EnemyConfig | undefined {
    return this.enemies.get(id);
  }

  getTierForDay(day: number): WaveTier {
    const tier = this.tiers.find((t) => day >= t.dayMin && day <= t.dayMax);
    return (
      tier ?? {
        dayMin: 1,
        dayMax: 99,
        spawnIntervalSec: this.defaults.spawnIntervalSec,
        maxAlive: this.defaults.maxAlive,
        pool: [{ result: 'mutant_hound', weight: 100 }],
      }
    );
  }

  pickEnemyId(day: number): string {
    const tier = this.getTierForDay(day);
    return pickWeightedOutcome(tier.pool);
  }

  get firstSpawnDelaySec(): number {
    return this.defaults.firstSpawnDelaySec;
  }
}
