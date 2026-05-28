import Phaser from 'phaser';

import { CardSpawner } from '../core/CardSpawner';
import type { CardDefinition } from '../types/gameData';
import type GameCard from '../objects/GameCard';
import type { CardStack, CardStackSystem } from './CardStackSystem';

interface SpawnTimerEffect {
  type: 'spawn_timer';
  requiresStackTag?: string;
  outputCardId?: string;
  intervalSeconds?: number;
}

interface ActiveWork {
  stackId: string;
  outputCardId: string;
  timer: Phaser.Time.TimerEvent;
}

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

  private refresh(): void {
    const needed = new Set<string>();

    for (const stack of this.stacks.getAllStacks()) {
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
        callback: () => this.produce(stack, effect.outputCardId!),
      });

      this.active.set(stack.id, {
        stackId: stack.id,
        outputCardId: effect.outputCardId,
        timer,
      });

      this.scene.time.delayedCall(intervalMs * 0.35, () => {
        if (this.active.has(stack.id)) this.produce(stack, effect.outputCardId!);
      });
    }

    for (const [id, work] of this.active) {
      if (!needed.has(id)) {
        work.timer.remove();
        this.active.delete(id);
      }
    }
  }

  private produce(stack: CardStack, outputCardId: string): void {
    if (!this.stacks.getAllStacks().some((s) => s.id === stack.id)) return;

    this.spawner.spawnToHand(outputCardId);
    this.scene.events.emit('worksite-produced', {
      stackId: stack.id,
      outputCardId,
    });
  }

  /** Seconds until next worksite output, or null if inactive. */
  getWorkRemainingSec(stackId: string): number | null {
    const work = this.active.get(stackId);
    if (!work?.timer) return null;
    const remainingMs = Math.max(0, (work.timer.delay ?? 0) - work.timer.elapsed);
    return Math.ceil(remainingMs / 1000);
  }
}

function getSpawnEffect(def: CardDefinition): SpawnTimerEffect | undefined {
  return def.effects?.find((e) => e.type === 'spawn_timer') as SpawnTimerEffect | undefined;
}

function stackHasTag(stack: CardStack, tag: string): boolean {
  const cards: GameCard[] = [stack.base, ...stack.members];
  return cards.some((c) => (c.definition.tags ?? []).includes(tag));
}
