import Phaser from 'phaser';
import GameCard, { boardDepthFromY } from '../objects/GameCard';
import { CARD_DROP_RADIUS } from '../config/cardLayout';
import { canAcceptQuantityMerge, isQuantityStackable } from './cardQuantity';
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
    spawn(cardId, x, y, quantity = 1) {
        const def = dataStore.getCard(cardId);
        if (!def) {
            console.warn('Unknown card:', cardId);
            return null;
        }
        const amount = Math.max(1, Math.floor(quantity));
        if (isQuantityStackable(def)) {
            const existing = this.findNearbyMergeTarget(cardId, x, y);
            if (existing) {
                existing.addQuantity(amount);
                this.scene.events.emit('card-spawned', existing);
                return existing;
            }
        }
        const card = new GameCard(this.scene, x, y, def);
        if (amount > 1) {
            card.setQuantity(amount);
        }
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
    spawnNearStack(cardId, stack, quantity = 1) {
        const top = this.stacks.getTopCard(stack);
        const angle = Phaser.Math.FloatBetween(0, Math.PI * 2);
        const dist = Phaser.Math.Between(40, 58);
        const x = top.x + Math.cos(angle) * dist;
        const y = top.y + Math.sin(angle) * dist;
        return this.spawn(cardId, x, y, quantity);
    }
    findNearbyMergeTarget(cardId, x, y) {
        let best = null;
        let bestDist = CARD_DROP_RADIUS;
        for (const obj of this.scene.children.list) {
            if (!(obj instanceof GameCard))
                continue;
            if (obj.definition.id !== cardId)
                continue;
            if (!isQuantityStackable(obj.definition))
                continue;
            if (!canAcceptQuantityMerge(obj, this.stacks))
                continue;
            const dist = Phaser.Math.Distance.Between(x, y, obj.x, obj.y);
            if (dist < bestDist) {
                bestDist = dist;
                best = obj;
            }
        }
        return best;
    }
    /** Add to backpack inventory (shop purchases, etc.). */
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
