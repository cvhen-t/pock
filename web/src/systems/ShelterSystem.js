import Phaser from 'phaser';
/**
 * Survivors on shelter cards reduce base camp damage.
 */
export class ShelterSystem {
    stacks;
    chargesLeft = 0;
    maxChargesPerMoon = 2;
    reduction = 0;
    constructor(scene, stacks) {
        this.stacks = stacks;
        scene.events.on('stack-changed', () => this.refresh());
        scene.events.on('moon-end', () => {
            if (this.maxChargesPerMoon > 0)
                this.chargesLeft = this.maxChargesPerMoon;
        });
        scene.events.once(Phaser.Scenes.Events.SHUTDOWN, () => { });
        this.refresh();
    }
    resetCharges() {
        this.chargesLeft = this.maxChargesPerMoon;
    }
    /** Multiplier applied to base damage (e.g. 0.5 = half). */
    getBaseDamageMultiplier() {
        if (!this.isShelterActive() || this.chargesLeft <= 0)
            return 1;
        return 1 - this.reduction;
    }
    consumeCharge() {
        if (this.chargesLeft > 0)
            this.chargesLeft -= 1;
    }
    isShelterActive() {
        for (const stack of this.stacks.getAllStacks()) {
            if (!this.stackHasShelter(stack))
                continue;
            const pile = [stack.base, ...stack.members];
            if (pile.some((c) => (c.definition.tags ?? []).includes('survivor'))) {
                return true;
            }
        }
        return false;
    }
    stackHasShelter(stack) {
        const tags = stack.base.definition.tags ?? [];
        if (tags.includes('shelter')) {
            const effect = stack.base.definition.effects?.find((e) => e.type === 'shelter');
            this.reduction = Phaser.Math.Clamp(effect?.damageReduction ?? 0.5, 0, 0.9);
            this.maxChargesPerMoon = effect?.chargesPerMoon ?? 2;
            return true;
        }
        return false;
    }
    refresh() {
        this.isShelterActive();
    }
}
