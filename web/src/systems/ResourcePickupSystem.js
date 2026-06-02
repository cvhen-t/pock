import Phaser from 'phaser';
import { isHudTapPickupCard } from '../core/cardPickup';
import GameCard from '../objects/GameCard';
/**
 * Tap a solo water card (no drag) to collect into the resource bar.
 * Food / currency cards stay on the board for facility interactions.
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
        const card = this.findPickupCard(wx, wy);
        if (!card)
            return;
        if (!isHudTapPickupCard(card.definition))
            return;
        const delta = { food: 0, water: 0, caps: 0 };
        delta.water = 1;
        this.onCollect(delta, card);
        this.scene.events.emit('card-removed', card);
        card.destroy();
        this.scene.events.emit('resource-collected', { cardId: card.definition.id, delta });
    }
    findPickupCard(wx, wy) {
        const cards = this.scene.children.list.filter((c) => {
            if (!(c instanceof GameCard))
                return false;
            return isHudTapPickupCard(c.definition);
        });
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
