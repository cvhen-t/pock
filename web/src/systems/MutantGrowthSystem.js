import Phaser from 'phaser';
import { pickWeightedOutcome } from '../core/GrowthTables';
import { CardProgressBar } from '../ui/CardProgressBar';
export class MutantGrowthSystem {
    scene;
    stacks;
    spawner;
    growing = new Map();
    tables;
    constructor(scene, stacks, spawner, growthTables) {
        this.scene = scene;
        this.stacks = stacks;
        this.spawner = spawner;
        this.tables = growthTables;
        scene.events.on('stack-changed', () => this.refresh());
        scene.events.once(Phaser.Scenes.Events.SHUTDOWN, () => this.destroy());
        this.refresh();
    }
    destroy() {
        for (const state of this.growing.values()) {
            state.timer.remove();
            state.progressBar?.destroy();
        }
        this.growing.clear();
    }
    refresh() {
        for (const stack of this.stacks.getAllStacks()) {
            const effect = getPlantEffect(stack.base.definition);
            if (!effect?.outcomes)
                continue;
            const baseTags = stack.base.definition.tags ?? [];
            const seed = stack.members.find((m) => {
                const tags = m.definition.tags ?? [];
                if (baseTags.includes('blight_plot'))
                    return tags.includes('mutant_seed');
                if (baseTags.includes('farmland')) {
                    return tags.includes('seed') && !tags.includes('mutant_seed');
                }
                return tags.includes('mutant_seed') || tags.includes('seed');
            });
            if (!seed || this.growing.has(stack.id))
                continue;
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
    startGrowth(stack, seed, effect) {
        const seconds = effect.growthSeconds ?? 12;
        const bar = new CardProgressBar(seed, this.scene, 0x6a8a4a, seconds * 1000);
        const timer = this.scene.time.addEvent({
            delay: seconds * 1000,
            callback: () => this.completeGrowth(stack, seed, effect, bar),
        });
        this.growing.set(stack.id, { stackId: stack.id, seed, progressBar: bar, timer });
        this.scene.events.emit('mutant-growth-started', { stackId: stack.id });
    }
    completeGrowth(stack, seed, effect, bar) {
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
    removeSeedFromStack(stack, seed) {
        stack.members = stack.members.filter((m) => m !== seed);
        seed.destroy();
        this.stacks.layoutStack(stack);
        this.scene.events.emit('stack-changed', stack);
    }
    cancelGrowth(stackId) {
        const state = this.growing.get(stackId);
        if (!state)
            return;
        state.timer.remove();
        state.progressBar?.destroy();
        this.growing.delete(stackId);
    }
    /** Seconds until growth completes, or null if not growing. */
    getGrowthRemainingSec(stackId) {
        const state = this.growing.get(stackId);
        if (!state?.timer)
            return null;
        const remainingMs = Math.max(0, (state.timer.delay ?? 0) - state.timer.elapsed);
        return Math.ceil(remainingMs / 1000);
    }
}
function getPlantEffect(def) {
    return def.effects?.find((e) => e.type === 'plant_mutant');
}
function getFarmSeedEffect(def) {
    return def.effects?.find((e) => e.type === 'farm_seed');
}
