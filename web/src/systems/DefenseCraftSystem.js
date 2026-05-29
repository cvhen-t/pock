import { consumeCardQuantity } from '../core/cardQuantity';
/**
 * Stack-triggered defense interactions: repair base, reinforce barriers.
 */
export class DefenseCraftSystem {
    scene;
    stacks;
    baseCamp;
    barriers;
    constructor(scene, stacks, baseCamp, barriers) {
        this.scene = scene;
        this.stacks = stacks;
        this.baseCamp = baseCamp;
        this.barriers = barriers;
        scene.events.on('stack-changed', (stack) => this.onStackChanged(stack));
    }
    onStackChanged(stack) {
        this.tryBaseRepair(stack);
        this.tryBarbedRoll(stack);
    }
    tryBaseRepair(stack) {
        const healed = this.baseCamp.tryRepairFromStack(stack, this.stacks);
        if (healed) {
            this.scene.events.emit('stack-changed', stack);
        }
    }
    tryBarbedRoll(stack) {
        const baseTags = stack.base.definition.tags ?? [];
        if (!baseTags.includes('barrier'))
            return;
        const roll = stack.members.find((m) => m.definition.id === 'barbed_roll');
        if (!roll)
            return;
        consumeCardQuantity(roll, 1, this.stacks);
        stack.members = stack.members.filter((m) => m.active);
        this.barriers.healBarrier(stack.base, 4);
        this.scene.events.emit('drag-toast', '铁丝网加固：路障 +4 耐久');
        this.scene.events.emit('stack-changed', stack);
    }
}
