import Phaser from 'phaser';
const DEPLETED_DATA_KEY = 'worksiteDepleted';
export class WorkSiteSystem {
    scene;
    stacks;
    spawner;
    active = new Map();
    constructor(scene, stacks, spawner) {
        this.scene = scene;
        this.stacks = stacks;
        this.spawner = spawner;
        scene.events.on('stack-changed', () => this.refresh());
        scene.events.once(Phaser.Scenes.Events.SHUTDOWN, () => this.destroy());
        this.refresh();
    }
    destroy() {
        for (const work of this.active.values()) {
            work.timer.remove();
        }
        this.active.clear();
    }
    isNodeDepleted(stackId) {
        const stack = this.stacks.getAllStacks().find((s) => s.id === stackId);
        return stack?.base.getData(DEPLETED_DATA_KEY) === true;
    }
    refresh() {
        const needed = new Set();
        for (const stack of this.stacks.getAllStacks()) {
            if (stack.base.getData(DEPLETED_DATA_KEY) === true)
                continue;
            const effect = getSpawnEffect(stack.base.definition);
            if (!effect?.outputCardId || !effect.intervalSeconds)
                continue;
            const reqTag = effect.requiresStackTag ?? 'survivor';
            if (!stackHasTag(stack, reqTag))
                continue;
            needed.add(stack.id);
            if (this.active.has(stack.id))
                continue;
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
                if (!work || stack.base.getData(DEPLETED_DATA_KEY) === true)
                    return;
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
    produce(stack, effect) {
        if (!this.stacks.getAllStacks().some((s) => s.id === stack.id))
            return;
        if (stack.base.getData(DEPLETED_DATA_KEY) === true)
            return;
        if (!effect.outputCardId)
            return;
        const work = this.active.get(stack.id);
        if (!work)
            return;
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
    depleteNode(stack, work) {
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
    getWorkRemainingSec(stackId) {
        const work = this.active.get(stackId);
        if (!work?.timer)
            return null;
        const remainingMs = Math.max(0, (work.timer.delay ?? 0) - work.timer.elapsed);
        return Math.ceil(remainingMs / 1000);
    }
    getOutputProgress(stackId) {
        const work = this.active.get(stackId);
        if (!work)
            return null;
        return { count: work.outputCount, max: work.maxOutputs };
    }
}
function getSpawnEffect(def) {
    return def.effects?.find((e) => e.type === 'spawn_timer');
}
function stackHasTag(stack, tag) {
    const cards = [stack.base, ...stack.members];
    return cards.some((c) => (c.definition.tags ?? []).includes(tag));
}
