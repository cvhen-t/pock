import Phaser from 'phaser';

import { CardSpawner } from '../core/CardSpawner';
import { consumeCardQuantity } from '../core/cardQuantity';
import { dataStore } from '../core/DataStore';
import { findFacilityRecipe } from '../core/recipeMatch';
import type { RecipeDefinition } from '../types/gameData';
import { CardProgressBar } from '../ui/CardProgressBar';
import type { CardStack, CardStackSystem } from './CardStackSystem';

const REGISTRY_DAY = 'dayIndex';

interface CraftStationEffect {
  type: 'craft_station';
  stationId?: string;
}

interface ActiveCraft {
  stackId: string;
  recipeId: string;
  timer: Phaser.Time.TimerEvent;
  progressBar?: CardProgressBar;
}

export class CraftStationSystem {
  private readonly active = new Map<string, ActiveCraft>();

  private readonly recipes: RecipeDefinition[];

  constructor(
    private readonly scene: Phaser.Scene,
    private readonly stacks: CardStackSystem,
    private readonly spawner: CardSpawner,
  ) {
    this.recipes = dataStore.getRecipes().filter((r) => r.stationId);
    scene.events.on('stack-changed', () => this.refresh());
    scene.events.once(Phaser.Scenes.Events.SHUTDOWN, () => this.destroy());
    this.refresh();
  }

  destroy(): void {
    for (const craft of this.active.values()) {
      craft.timer.remove();
      craft.progressBar?.destroy();
    }
    this.active.clear();
  }

  getCraftRemainingSec(stackId: string): number | null {
    const craft = this.active.get(stackId);
    if (!craft?.timer) return null;
    const remainingMs = Math.max(0, (craft.timer.delay ?? 0) - craft.timer.elapsed);
    return Math.ceil(remainingMs / 1000);
  }

  private getDayIndex(): number {
    return (this.scene.registry.get(REGISTRY_DAY) as number) ?? 1;
  }

  private refresh(): void {
    const needed = new Set<string>();

    for (const stack of this.stacks.getAllStacks()) {
      const effect = getCraftEffect(stack.base.definition);
      if (!effect?.stationId) continue;

      const match = findFacilityRecipe(
        effect.stationId,
        stack.members,
        this.recipes,
        this.getDayIndex(),
      );
      if (!match) {
        this.cancelCraft(stack.id);
        continue;
      }

      needed.add(stack.id);
      const existing = this.active.get(stack.id);
      if (existing?.recipeId === match.recipe.id) continue;

      this.cancelCraft(stack.id);
      this.startCraft(stack, match.recipe);
    }

    for (const stackId of this.active.keys()) {
      if (!needed.has(stackId)) this.cancelCraft(stackId);
    }
  }

  private startCraft(stack: CardStack, recipe: RecipeDefinition): void {
    const seconds = recipe.workSeconds ?? 8;
    const anchor = this.stacks.getTopCard(stack);
    const bar = new CardProgressBar(anchor, this.scene, 0x8a7a50, seconds * 1000);

    const timer = this.scene.time.addEvent({
      delay: seconds * 1000,
      callback: () => this.completeCraft(stack, recipe, bar),
    });

    this.active.set(stack.id, {
      stackId: stack.id,
      recipeId: recipe.id,
      timer,
      progressBar: bar,
    });
    this.scene.events.emit('craft-started', { stackId: stack.id, recipeId: recipe.id });
  }

  private completeCraft(
    stack: CardStack,
    recipe: RecipeDefinition,
    bar: CardProgressBar,
  ): void {
    bar.destroy();
    this.active.delete(stack.id);

    const effect = getCraftEffect(stack.base.definition);
    if (!effect?.stationId) return;

    const match = findFacilityRecipe(
      effect.stationId,
      stack.members,
      this.recipes,
      this.getDayIndex(),
    );
    if (!match || match.recipe.id !== recipe.id) {
      this.refresh();
      return;
    }

    for (const entry of match.consumed) {
      consumeCardQuantity(entry.card, entry.amount, this.stacks);
    }
    stack.members = stack.members.filter((m) => m.active);
    this.stacks.layoutStack(stack);

    const outputId = resolveOutputCardId(recipe, match.seedCardId);
    const count = recipe.output.count ?? 1;
    const px = stack.base.x + Phaser.Math.Between(-24, 24);
    const py = stack.base.y + 56;
    this.spawner.spawn(outputId, px, py, count);

    for (const extra of recipe.extraOutputs ?? []) {
      const extraCount = extra.count ?? 1;
      const ex = stack.base.x + Phaser.Math.Between(-24, 24);
      const ey = stack.base.y + 72;
      this.spawner.spawn(extra.cardId, ex, ey, extraCount);
    }

    const outName = dataStore.getCard(outputId)?.name ?? outputId;
    this.scene.events.emit('drag-toast', `合成完成：${outName}`);
    this.scene.events.emit('craft-complete', { stackId: stack.id, recipeId: recipe.id });
    this.scene.events.emit('stack-changed', stack);
    this.refresh();
  }

  private cancelCraft(stackId: string): void {
    const craft = this.active.get(stackId);
    if (!craft) return;
    craft.timer.remove();
    craft.progressBar?.destroy();
    this.active.delete(stackId);
  }
}

function getCraftEffect(def: { effects?: { type: string }[] }): CraftStationEffect | undefined {
  return def.effects?.find((e) => e.type === 'craft_station') as CraftStationEffect | undefined;
}

function resolveOutputCardId(recipe: RecipeDefinition, seedCardId?: string): string {
  if (recipe.output.cardId === '_same_seed' && seedCardId) return seedCardId;
  return recipe.output.cardId;
}

export function getCraftStationId(def: { effects?: { type: string }[] }): string | undefined {
  return getCraftEffect(def)?.stationId;
}
