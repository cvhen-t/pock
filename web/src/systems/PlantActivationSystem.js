import Phaser from 'phaser';
import GameCard from '../objects/GameCard';
const DORMANT_ALPHA = 0.72;
export class PlantActivationSystem {
    scene;
    stacks;
    activated = new Set();
    constructor(scene, stacks) {
        this.scene = scene;
        this.stacks = stacks;
        scene.registry.set('plantActivation', this);
        scene.events.on('stack-changed', (stack) => this.onStackChanged(stack));
        scene.events.on('card-spawned', (card) => this.onCardSpawned(card));
        scene.events.on('mutant-growth-complete', ({ card }) => this.onCardSpawned(card));
        scene.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
            scene.registry.remove('plantActivation');
        });
        for (const child of scene.children.list) {
            if (child instanceof GameCard)
                this.onCardSpawned(child);
        }
    }
    isActivated(plant) {
        return this.activated.has(plant);
    }
    canStackActivator(plant) {
        if (this.isActivated(plant))
            return false;
        return plant.definition.effects?.some((e) => e.type === 'plant_activation') ?? false;
    }
    needsActivation(plant) {
        return plant.definition.effects?.some((e) => e.type === 'defense_turret' && e.requiresActivation) ?? false;
    }
    onCardSpawned(card) {
        if (!this.needsActivation(card) || this.isActivated(card))
            return;
        card.setAlpha(DORMANT_ALPHA);
    }
    onStackChanged(stack) {
        if (this.isActivated(stack.base))
            return;
        const effect = stack.base.definition.effects?.find((e) => e.type === 'plant_activation');
        if (!effect)
            return;
        const consumeId = effect.consumeCardId ?? '';
        if (!consumeId)
            return;
        const activator = stack.members.find((m) => m.definition.id === consumeId);
        if (!activator)
            return;
        if (!this.stacks.removeCardFromPlay(activator))
            return;
        activator.destroy();
        stack.members = stack.members.filter((m) => m !== activator);
        this.activated.add(stack.base);
        stack.base.setAlpha(1);
        this.scene.events.emit('plant-activated', {
            card: stack.base,
            plantId: stack.base.definition.id,
        });
        this.scene.events.emit('drag-toast', effect.toast ?? '植物已激活');
        this.stacks.layoutStack(stack);
        this.scene.events.emit('stack-changed', stack);
    }
}
