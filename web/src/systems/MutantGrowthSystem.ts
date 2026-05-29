import Phaser from 'phaser';

import { CardSpawner } from '../core/CardSpawner';
import { pickWeightedOutcome, type GrowthTables } from '../core/GrowthTables';
import type GameCard from '../objects/GameCard';
import { CardProgressBar } from '../ui/CardProgressBar';
import type { CardStack, CardStackSystem } from './CardStackSystem';

interface PlantMutantEffect {
  type: 'plant_mutant';
  growthSeconds?: number;
  outcomes?: string;
}

interface FarmSeedEffect {
  type: 'farm_seed';
  outcomes?: string;
}

interface GrowingState {
  stackId: string;
  seed: GameCard;
  progressBar?: CardProgressBar;
  timer: Phaser.Time.TimerEvent;
}

export class MutantGrowthSystem {
  private readonly growing = new Map<string, GrowingState>();

  private readonly tables: GrowthTables;

  constructor(
    private readonly scene: Phaser.Scene,
    private readonly stacks: CardStackSystem,
    private readonly spawner: CardSpawner,
    growthTables: GrowthTables,
  ) {
    this.tables = growthTables;
    scene.events.on('stack-changed', () => this.refresh());
    scene.events.once(Phaser.Scenes.Events.SHUTDOWN, () => this.destroy());
    this.refresh();
  }

  destroy(): void {
    for (const state of this.growing.values()) {
      state.timer.remove();
      state.progressBar?.destroy();
    }
    this.growing.clear();
  }

  private refresh(): void {
    for (const stack of this.stacks.getAllStacks()) {
      const effect = getPlantEffect(stack.base.definition);
      if (!effect?.outcomes) continue;

      const baseTags = stack.base.definition.tags ?? [];
      const seed = stack.members.find((m) => {
        const tags = m.definition.tags ?? [];
        if (baseTags.includes('blight_plot')) return tags.includes('mutant_seed');
        if (baseTags.includes('farmland')) {
          return tags.includes('seed') && !tags.includes('mutant_seed');
        }
        return tags.includes('mutant_seed') || tags.includes('seed');
      });
      if (!seed || this.growing.has(stack.id)) continue;

      this.startGrowth(stack, seed, effect);
    }

    for (const [stackId, state] of this.growing) {
      const stack = this.stacks.getAllStacks().find((s) => s.id === stackId);
      const stillHasSeed = stack?.members.includes(state.seed);
      if (!stack || !stillHasSeed) {
        this.cancelGrowth(stackId);
      }
    }
  }

  private startGrowth(stack: CardStack, seed: GameCard, effect: PlantMutantEffect): void {
    const seconds = effect.growthSeconds ?? 12;
    const bar = new CardProgressBar(seed, this.scene, 0x6a8a4a, seconds * 1000);

    const timer = this.scene.time.addEvent({
      delay: seconds * 1000,
      callback: () => this.completeGrowth(stack, seed, effect, bar),
    });

    this.growing.set(stack.id, { stackId: stack.id, seed, progressBar: bar, timer });
    this.scene.events.emit('mutant-growth-started', { stackId: stack.id });
  }

  private completeGrowth(
    stack: CardStack,
    seed: GameCard,
    effect: PlantMutantEffect,
    bar: CardProgressBar,
  ): void {
    bar.destroy();
    this.growing.delete(stack.id);

    this.removeSeedFromStack(stack, seed);

    const seedEffect = getFarmSeedEffect(seed.definition);
    const tableKey = seedEffect?.outcomes ?? effect.outcomes ?? '';
    const table = this.tables[tableKey];
    const result = table?.length ? pickWeightedOutcome(table) : 'plant_thornvine';

    if (result === 'fail_contaminate') {
      this.scene.events.emit('mutant-growth-failed', { stackId: stack.id });
      return;
    }

    const px = stack.base.x + Phaser.Math.Between(-20, 20);
    const py = stack.base.y + 56;
    const plant = this.spawner.spawn(result, px, py);
    if (plant) {
      this.scene.events.emit('mutant-growth-complete', {
        stackId: stack.id,
        plantId: result,
        card: plant,
      });
    }
  }

  private removeSeedFromStack(stack: CardStack, seed: GameCard): void {
    stack.members = stack.members.filter((m) => m !== seed);
    seed.destroy();
    this.stacks.layoutStack(stack);
    this.scene.events.emit('stack-changed', stack);
  }

  private cancelGrowth(stackId: string): void {
    const state = this.growing.get(stackId);
    if (!state) return;
    state.timer.remove();
    state.progressBar?.destroy();
    this.growing.delete(stackId);
  }

  /** Seconds until growth completes, or null if not growing. */
  getGrowthRemainingSec(stackId: string): number | null {
    const state = this.growing.get(stackId);
    if (!state?.timer) return null;
    const remainingMs = Math.max(0, (state.timer.delay ?? 0) - state.timer.elapsed);
    return Math.ceil(remainingMs / 1000);
  }
}

function getPlantEffect(def: { effects?: { type: string }[] }): PlantMutantEffect | undefined {
  return def.effects?.find((e) => e.type === 'plant_mutant') as PlantMutantEffect | undefined;
}

function getFarmSeedEffect(def: { effects?: { type: string }[] }): FarmSeedEffect | undefined {
  return def.effects?.find((e) => e.type === 'farm_seed') as FarmSeedEffect | undefined;
}
