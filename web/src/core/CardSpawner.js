import GameCard, { boardDepthFromY } from '../objects/GameCard';
import { clampCardCenter } from '../ui/playfieldClamp';
import { dataStore } from './DataStore';
export class CardSpawner {
    scene;
    stacks;
    drag;
    constructor(scene, stacks, drag) {
        this.scene = scene;
        this.stacks = stacks;
        this.drag = drag;
    }
    spawn(cardId, x, y) {
        const def = dataStore.getCard(cardId);
        if (!def) {
            console.warn('Unknown card:', cardId);
            return null;
        }
        const card = new GameCard(this.scene, x, y, def);
        const pf = this.scene.registry.get('playfield');
        if (pf) {
            clampCardCenter(pf, card);
        }
        card.setDepth(boardDepthFromY(card.y));
        this.stacks.registerBase(card);
        this.drag.registerCard(card);
        this.scene.events.emit('card-spawned', card);
        return card;
    }
    spawnToHand(cardId) {
        const def = dataStore.getCard(cardId);
        if (!def) {
            console.warn('Unknown card:', cardId);
            return false;
        }
        this.scene.events.emit('hand-add', { cardId });
        return true;
    }
}
