import Phaser from 'phaser';
import GameCard from '../objects/GameCard';
/**
 * Tap a solo food card (no drag) to collect into the resource bar.
 */
export class ResourcePickupSystem {
    scene;
    onCollect;
    constructor(scene, onCollect) {
        this.scene = scene;
        this.onCollect = onCollect;
        scene.input.on('pointerup', this.onPointerUp, this);
        scene.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
            scene.input.off('pointerup', this.onPointerUp, this);
        });
    }
    onPointerUp(pointer) {
        if (!pointer.wasTouch && pointer.button !== 0)
            return;
        const wx = pointer.worldX;
        const wy = pointer.worldY;
        const card = this.findTopFoodCard(wx, wy);
        if (!card)
            return;
        const delta = { food: 0, water: 0, caps: 0 };
        const tags = card.definition.tags ?? [];
        if (tags.includes('food'))
            delta.food = 1;
        else
            return;
        this.onCollect(delta, card);
        card.destroy();
        this.scene.events.emit('resource-collected', { cardId: card.definition.id, delta });
    }
    findTopFoodCard(wx, wy) {
        const cards = this.scene.children.list.filter((c) => c instanceof GameCard && (c.definition.tags ?? []).includes('food'));
        let best;
        let bestDepth = -1;
        for (const card of cards) {
            if (wx < card.x - card.cardWidth / 2 ||
                wx > card.x + card.cardWidth / 2 ||
                wy < card.y - card.cardHeight / 2 ||
                wy > card.y + card.cardHeight / 2) {
                continue;
            }
            if (card.depth > bestDepth) {
                bestDepth = card.depth;
                best = card;
            }
        }
        return best;
    }
}
