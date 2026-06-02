import Phaser from 'phaser';
import { consumeCardQuantity } from '../core/cardQuantity';
import { dataStore } from '../core/DataStore';
import { findFacilityRecipe } from '../core/recipeMatch';
import { CardProgressBar } from '../ui/CardProgressBar';
const REGISTRY_DAY = 'dayIndex';
export class CraftStationSystem {
    scene;
    stacks;
    spawner;
    active = new Map();
    recipes;
    constructor(scene, stacks, spawner) {
        this.scene = scene;
        this.stacks = stacks;
        this.spawner = spawner;
        this.recipes = dataStore.getRecipes().filter((r) => r.stationId);
        scene.events.on('stack-changed', () => this.refresh());
        scene.events.once(Phaser.Scenes.Events.SHUTDOWN, () => this.destroy());
        this.refresh();
    }
    destroy() {
        for (const craft of this.active.values()) {
            craft.timer.remove();
            craft.progressBar?.destroy();
        }
        this.active.clear();
    }
    getCraftRemainingSec(stackId) {
        const craft = this.active.get(stackId);
        if (!craft?.timer)
            return null;
        const remainingMs = Math.max(0, (craft.timer.delay ?? 0) - craft.timer.elapsed);
        return Math.ceil(remainingMs / 1000);
    }
    getDayIndex() {
        return this.scene.registry.get(REGISTRY_DAY) ?? 1;
    }
    refresh() {
        const needed = new Set();
        for (const stack of this.stacks.getAllStacks()) {
            const effect = getCraftEffect(stack.base.definition);
            if (!effect?.stationId)
                continue;
            const match = findFacilityRecipe(effect.stationId, stack.members, this.recipes, this.getDayIndex());
            if (!match) {
                this.cancelCraft(stack.id);
                continue;
            }
            needed.add(stack.id);
            const existing = this.active.get(stack.id);
            if (existing?.recipeId === match.recipe.id)
                continue;
            this.cancelCraft(stack.id);
            this.startCraft(stack, match.recipe);
        }
        for (const stackId of this.active.keys()) {
            if (!needed.has(stackId))
                this.cancelCraft(stackId);
        }
    }
    startCraft(stack, recipe) {
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
    completeCraft(stack, recipe, bar) {
        bar.destroy();
        this.active.delete(stack.id);
        const effect = getCraftEffect(stack.base.definition);
        if (!effect?.stationId)
            return;
        const match = findFacilityRecipe(effect.stationId, stack.members, this.recipes, this.getDayIndex());
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
        const outputs = [{ cardId: outputId, qty: count }];
        for (const extra of recipe.extraOutputs ?? []) {
            outputs.push({ cardId: extra.cardId, qty: extra.count ?? 1 });
        }
        const payload = { facility: stack.base, outputs, absorbed: false };
        this.scene.events.emit('craft-output', payload);
        if (!payload.absorbed) {
            const px = stack.base.x + Phaser.Math.Between(-24, 24);
            const py = stack.base.y + 56;
            this.spawner.spawn(outputId, px, py, count);
            for (const extra of recipe.extraOutputs ?? []) {
                const extraCount = extra.count ?? 1;
                const ex = stack.base.x + Phaser.Math.Between(-24, 24);
                const ey = stack.base.y + 72;
                this.spawner.spawn(extra.cardId, ex, ey, extraCount);
            }
        }
        const outName = dataStore.getCard(outputId)?.name ?? outputId;
        this.scene.events.emit('drag-toast', `合成完成：${outName}`);
        this.scene.events.emit('craft-complete', { stackId: stack.id, recipeId: recipe.id });
        this.scene.events.emit('stack-changed', stack);
        this.refresh();
    }
    cancelCraft(stackId) {
        const craft = this.active.get(stackId);
        if (!craft)
            return;
        craft.timer.remove();
        craft.progressBar?.destroy();
        this.active.delete(stackId);
    }
}
function getCraftEffect(def) {
    return def.effects?.find((e) => e.type === 'craft_station');
}
function resolveOutputCardId(recipe, seedCardId) {
    if (recipe.output.cardId === '_same_seed' && seedCardId)
        return seedCardId;
    return recipe.output.cardId;
}
export function getCraftStationId(def) {
    return getCraftEffect(def)?.stationId;
}
