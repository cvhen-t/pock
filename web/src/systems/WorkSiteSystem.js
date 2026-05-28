import Phaser from 'phaser';
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
    refresh() {
        const needed = new Set();
        for (const stack of this.stacks.getAllStacks()) {
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
                callback: () => this.produce(stack, effect.outputCardId),
            });
            this.active.set(stack.id, {
                stackId: stack.id,
                outputCardId: effect.outputCardId,
                timer,
            });
            this.scene.time.delayedCall(intervalMs * 0.35, () => {
                if (this.active.has(stack.id))
                    this.produce(stack, effect.outputCardId);
            });
        }
        for (const [id, work] of this.active) {
            if (!needed.has(id)) {
                work.timer.remove();
                this.active.delete(id);
            }
        }
    }
    produce(stack, outputCardId) {
        if (!this.stacks.getAllStacks().some((s) => s.id === stack.id))
            return;
        this.spawner.spawnToHand(outputCardId);
        this.scene.events.emit('worksite-produced', {
            stackId: stack.id,
            outputCardId,
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
}
function getSpawnEffect(def) {
    return def.effects?.find((e) => e.type === 'spawn_timer');
}
function stackHasTag(stack, tag) {
    const cards = [stack.base, ...stack.members];
    return cards.some((c) => (c.definition.tags ?? []).includes(tag));
}
