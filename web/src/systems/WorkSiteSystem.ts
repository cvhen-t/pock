import Phaser from 'phaser';

import { CardSpawner } from '../core/CardSpawner';
import type { CardDefinition } from '../types/gameData';
import GameCard from '../objects/GameCard';
import type { CardStack, CardStackSystem } from './CardStackSystem';

interface SpawnTimerEffect {
  type: 'spawn_timer';
  requiresStackTag?: string;
  outputCardId?: string;
  intervalSeconds?: number;
  /** Stop after this many successful outputs; node stays on board but greyed out. */
  maxOutputs?: number;
}

interface ActiveWork {
  stackId: string;
  outputCardId: string;
  maxOutputs?: number;
  outputCount: number;
  timer: Phaser.Time.TimerEvent;
}

const DEPLETED_DATA_KEY = 'worksiteDepleted';

export class WorkSiteSystem {
  private readonly active = new Map<string, ActiveWork>();

  constructor(
    private readonly scene: Phaser.Scene,
    private readonly stacks: CardStackSystem,
    private readonly spawner: CardSpawner,
  ) {
    scene.events.on('stack-changed', () => this.refresh());
    scene.events.once(Phaser.Scenes.Events.SHUTDOWN, () => this.destroy());
    this.refresh();
  }

  destroy(): void {
    for (const work of this.active.values()) {
      work.timer.remove();
    }
    this.active.clear();
  }

  isNodeDepleted(stackId: string): boolean {
    const stack = this.stacks.getAllStacks().find((s) => s.id === stackId);
    return stack?.base.getData(DEPLETED_DATA_KEY) === true;
  }

  private refresh(): void {
    const needed = new Set<string>();

    for (const stack of this.stacks.getAllStacks()) {
      if (stack.base.getData(DEPLETED_DATA_KEY) === true) continue;

      const effect = getSpawnEffect(stack.base.definition);
      if (!effect?.outputCardId || !effect.intervalSeconds) continue;

      const reqTag = effect.requiresStackTag ?? 'survivor';
      if (!stackHasTag(stack, reqTag)) continue;

      needed.add(stack.id);
      if (this.active.has(stack.id)) continue;

      const intervalMs = effect.intervalSeconds * 1000;
      const timer = this.scene.time.addEvent({
        delay: intervalMs,
        loop: true,
        callback: () => this.produce(stack, effect),
      });

      this.active.set(stack.id, {
        stackId: stack.id,
        outputCardId: effect.outputCardId,
        maxOutputs: effect.maxOutputs,
        outputCount: 0,
        timer,
      });

      this.scene.time.delayedCall(intervalMs * 0.35, () => {
        const work = this.active.get(stack.id);
        if (!work || stack.base.getData(DEPLETED_DATA_KEY) === true) return;
        this.produce(stack, effect);
      });
    }

    for (const [id, work] of this.active) {
      if (!needed.has(id)) {
        work.timer.remove();
        this.active.delete(id);
      }
    }
  }

  private produce(stack: CardStack, effect: SpawnTimerEffect): void {
    if (!this.stacks.getAllStacks().some((s) => s.id === stack.id)) return;
    if (stack.base.getData(DEPLETED_DATA_KEY) === true) return;
    if (!effect.outputCardId) return;

    const work = this.active.get(stack.id);
    if (!work) return;

    this.spawner.spawnNearStack(effect.outputCardId, stack);
    work.outputCount += 1;

    this.scene.events.emit('worksite-produced', {
      stackId: stack.id,
      outputCardId: effect.outputCardId,
      outputCount: work.outputCount,
    });

    if (work.maxOutputs !== undefined && work.outputCount >= work.maxOutputs) {
      this.depleteNode(stack, work);
    }
  }

  private depleteNode(stack: CardStack, work: ActiveWork): void {
    work.timer.remove();
    this.active.delete(stack.id);
    stack.base.setData(DEPLETED_DATA_KEY, true);
    stack.base.setAlpha(0.42);
    this.scene.events.emit('worksite-depleted', {
      stackId: stack.id,
      nodeCardId: stack.base.definition.id,
      nodeName: stack.base.definition.name,
      totalOutputs: work.outputCount,
    });
  }

  /** Seconds until next worksite output, or null if inactive. */
  getWorkRemainingSec(stackId: string): number | null {
    const work = this.active.get(stackId);
    if (!work?.timer) return null;
    const remainingMs = Math.max(0, (work.timer.delay ?? 0) - work.timer.elapsed);
    return Math.ceil(remainingMs / 1000);
  }

  getOutputProgress(stackId: string): { count: number; max?: number } | null {
    const work = this.active.get(stackId);
    if (!work) return null;
    return { count: work.outputCount, max: work.maxOutputs };
  }
}

function getSpawnEffect(def: CardDefinition): SpawnTimerEffect | undefined {
  return def.effects?.find((e) => e.type === 'spawn_timer') as SpawnTimerEffect | undefined;
}

function stackHasTag(stack: CardStack, tag: string): boolean {
  const cards: GameCard[] = [stack.base, ...stack.members];
  return cards.some((c) => (c.definition.tags ?? []).includes(tag));
}
