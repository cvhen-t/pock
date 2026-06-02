import Phaser from 'phaser';
import GameCard from '../objects/GameCard';
/** Switches configured cards between card face (drag) and world sprite (placed). */
export class PlacedVisualSystem {
    stacks;
    dragging = new Set();
    constructor(scene, stacks) {
        this.stacks = stacks;
        scene.events.on('card-spawned', (card) => this.refreshCard(card));
        scene.events.on('card-drag-start', ({ cards }) => {
            for (const card of cards)
                this.dragging.add(card);
            this.refreshCards(cards);
        });
        scene.events.on('card-drag-end', ({ cards }) => {
            for (const card of cards)
                this.dragging.delete(card);
            this.refreshCards(cards);
        });
        scene.events.on('stack-changed', (stack) => {
            this.refreshCard(stack.base);
            for (const member of stack.members)
                this.refreshCard(member);
        });
        scene.events.once(Phaser.Scenes.Events.SHUTDOWN, () => this.dragging.clear());
        for (const child of scene.children.list) {
            if (child instanceof GameCard)
                this.refreshCard(child);
        }
    }
    refreshCards(cards) {
        for (const card of cards)
            this.refreshCard(card);
    }
    refreshCard(card) {
        if (!card.hasPlacedVisual() || !card.active || !card.scene)
            return;
        const stack = this.stacks.getStackAt(card);
        const isBase = !stack || stack.base === card;
        const shouldPlace = !this.dragging.has(card) && isBase;
        card.setDisplayMode(shouldPlace ? 'placed' : 'card');
    }
}
