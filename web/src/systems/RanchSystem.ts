import Phaser from 'phaser';

import { CardSpawner } from '../core/CardSpawner';
import { dataStore } from '../core/DataStore';
import type GameCard from '../objects/GameCard';
import type { CardStack, CardStackSystem } from './CardStackSystem';

interface FeedRequirement {
  tag?: string;
  cardId?: string;
  count: number;
}

interface RanchProduce {
  outputCardId: string;
  intervalSeconds: number;
  feed: FeedRequirement[];
  bonus?: { outputCardId: string; chance: number };
  everyNCycles?: { n: number; outputCardId: string; count?: number };
  extraOutputs?: { cardId: string; count?: number }[];
}

interface RanchBreed {
  sameTag: string;
  minCount: number;
  outputCardId: string;
  intervalSeconds: number;
  feed: FeedRequirement[];
  breedCooldownSec?: number;
}

interface RanchPenEffect {
  type: 'ranch_pen';
  acceptTags?: string[];
  maxAnimals?: number;
  produce?: RanchProduce;
  breed?: RanchBreed;
}

interface ActiveRanch {
  stackId: string;
  mode: 'produce' | 'breed';
  timer: Phaser.Time.TimerEvent;
  cycleCount: number;
}

export class RanchSystem {
  private readonly active = new Map<string, ActiveRanch>();

  private readonly breedCooldowns = new Map<string, number>();

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
    for (const ranch of this.active.values()) {
      ranch.timer.remove();
    }
    this.active.clear();
  }

  private refresh(): void {
    const needed = new Set<string>();

    for (const stack of this.stacks.getAllStacks()) {
      const effect = getRanchEffect(stack.base.definition);
      if (!effect) continue;

      const animals = countAnimals(stack, effect);
      if (animals > (effect.maxAnimals ?? 99)) continue;

      const breed = effect.breed;
      if (breed && !this.breedCooldowns.has(stack.id)) {
        const breedAnimals = countByTag(stack, breed.sameTag);
        if (breedAnimals >= breed.minCount && hasFeed(stack, breed.feed)) {
          needed.add(stack.id);
          if (!this.active.has(stack.id)) {
            this.startTimer(stack, effect, 'breed');
          }
          continue;
        }
      }

      const produce = effect.produce;
      if (produce && animals > 0 && hasFeed(stack, produce.feed)) {
        needed.add(stack.id);
        if (!this.active.has(stack.id)) {
          this.startTimer(stack, effect, 'produce');
        }
        continue;
      }

      this.stopRanch(stack.id);
    }

    for (const stackId of this.active.keys()) {
      if (!needed.has(stackId)) this.stopRanch(stackId);
    }
  }

  private startTimer(stack: CardStack, effect: RanchPenEffect, mode: 'produce' | 'breed'): void {
    const cfg = mode === 'breed' ? effect.breed! : effect.produce!;
    const seconds = cfg.intervalSeconds;

    const timer = this.scene.time.addEvent({
      delay: seconds * 1000,
      callback: () => this.onCycle(stack, effect, mode),
    });

    this.active.set(stack.id, { stackId: stack.id, mode, timer, cycleCount: 0 });
  }

  private onCycle(stack: CardStack, effect: RanchPenEffect, mode: 'produce' | 'breed'): void {
    const state = this.active.get(stack.id);
    if (!state) return;

    if (mode === 'breed' && effect.breed) {
      if (!consumeFeed(stack, effect.breed.feed)) {
        this.scene.events.emit('drag-toast', '缺少饲料');
        this.stopRanch(stack.id);
        this.scene.events.emit('stack-changed', stack);
        return;
      }
      const px = stack.base.x + Phaser.Math.Between(-20, 20);
      const py = stack.base.y + 56;
      this.spawner.spawn(effect.breed.outputCardId, px, py);
      const name = dataStore.getCard(effect.breed.outputCardId)?.name ?? effect.breed.outputCardId;
      this.scene.events.emit('drag-toast', `繁殖完成：${name}`);
      this.stopRanch(stack.id);
      if (effect.breed.breedCooldownSec) {
        this.breedCooldowns.set(stack.id, Date.now() + effect.breed.breedCooldownSec * 1000);
        this.scene.time.delayedCall(effect.breed.breedCooldownSec * 1000, () => {
          this.breedCooldowns.delete(stack.id);
          this.refresh();
        });
      }
      this.scene.events.emit('stack-changed', stack);
      return;
    }

    if (mode === 'produce' && effect.produce) {
      if (!consumeFeed(stack, effect.produce.feed)) {
        this.scene.events.emit('drag-toast', '缺少饲料');
        this.stopRanch(stack.id);
        this.scene.events.emit('stack-changed', stack);
        return;
      }

      state.cycleCount++;
      const px = stack.base.x + Phaser.Math.Between(-20, 20);
      const py = stack.base.y + 56;
      this.spawner.spawn(effect.produce.outputCardId, px, py);

      if (effect.produce.bonus && Math.random() < effect.produce.bonus.chance) {
        this.spawner.spawn(effect.produce.bonus.outputCardId, px + 16, py);
      }

      const everyN = effect.produce.everyNCycles;
      if (everyN && state.cycleCount % everyN.n === 0) {
        for (let i = 0; i < (everyN.count ?? 1); i++) {
          this.spawner.spawn(everyN.outputCardId, px - 16, py + i * 8);
        }
      }

      for (const extra of effect.produce.extraOutputs ?? []) {
        for (let i = 0; i < (extra.count ?? 1); i++) {
          this.spawner.spawn(extra.cardId, px, py + 20 + i * 8);
        }
      }

      this.scene.events.emit('stack-changed', stack);
    }
  }

  private stopRanch(stackId: string): void {
    const ranch = this.active.get(stackId);
    if (!ranch) return;
    ranch.timer.remove();
    this.active.delete(stackId);
  }
}

function getRanchEffect(def: { effects?: { type: string }[] }): RanchPenEffect | undefined {
  return def.effects?.find((e) => e.type === 'ranch_pen') as RanchPenEffect | undefined;
}

export function getRanchPenEffect(def: { effects?: { type: string }[] }): RanchPenEffect | undefined {
  return getRanchEffect(def);
}

function countAnimals(stack: CardStack, effect: RanchPenEffect): number {
  const accept = effect.acceptTags ?? [];
  return stack.members.filter((m) => {
    const tags = m.definition.tags ?? [];
    if (!tags.includes('animal')) return false;
    if (accept.length === 0) return true;
    return accept.some((t) => tags.includes(t));
  }).length;
}

function countByTag(stack: CardStack, tag: string): number {
  return stack.members.filter((m) => (m.definition.tags ?? []).includes(tag)).length;
}

function cardMatchesFeed(card: GameCard, req: FeedRequirement): boolean {
  const tags = card.definition.tags ?? [];
  if (req.cardId && card.definition.id === req.cardId) return true;
  if (req.tag && tags.includes(req.tag)) return true;
  return false;
}

function hasFeed(stack: CardStack, requirements: FeedRequirement[]): boolean {
  const pool = [...stack.members];
  for (const req of requirements) {
    let needed = req.count;
    for (let i = pool.length - 1; i >= 0 && needed > 0; i--) {
      if (cardMatchesFeed(pool[i]!, req)) {
        pool.splice(i, 1);
        needed--;
      }
    }
    if (needed > 0) return false;
  }
  return true;
}

function consumeFeed(stack: CardStack, requirements: FeedRequirement[]): boolean {
  const toRemove: GameCard[] = [];
  const pool = [...stack.members];

  for (const req of requirements) {
    let needed = req.count;
    for (let i = pool.length - 1; i >= 0 && needed > 0; i--) {
      const card = pool[i]!;
      if (!cardMatchesFeed(card, req)) continue;
      toRemove.push(card);
      pool.splice(i, 1);
      needed--;
    }
    if (needed > 0) return false;
  }

  for (const card of toRemove) {
    stack.members = stack.members.filter((m) => m !== card);
    card.destroy();
  }
  return true;
}
