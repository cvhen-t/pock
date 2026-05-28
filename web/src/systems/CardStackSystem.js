import Phaser from 'phaser';
import { CARD_DROP_RADIUS, resolveCardMetrics, STACK_HIT_RADIUS, } from '../config/cardLayout';
import GameCard, { boardDepthFromY } from '../objects/GameCard';
export { STACK_SNAP } from '../config/cardLayout';
/**
 * Stack data + layout. Pointer hit/drag lives in CardDragSystem.
 */
export class CardStackSystem {
    scene;
    stacks = new Map();
    nextId = 1;
    constructor(scene) {
        this.scene = scene;
    }
    registerBase(card) {
        this.removeCardFromAllStacks(card);
        const id = `stack_${this.nextId++}`;
        card.stackId = id;
        const stack = { id, base: card, members: [] };
        this.stacks.set(id, stack);
        return id;
    }
    getAllStacks() {
        return [...this.stacks.values()];
    }
    getStackAt(card) {
        if (!card.stackId)
            return undefined;
        return this.stacks.get(card.stackId);
    }
    containsCard(stack, card) {
        return stack.base === card || stack.members.includes(card);
    }
    /**
     * Fix orphan stackIds / ghost members after many drag cycles.
     */
    reconcile(knownCards) {
        for (const stack of this.stacks.values()) {
            stack.members = stack.members.filter((m) => m !== stack.base && m.stackId === stack.id);
            if (stack.base.stackId !== stack.id) {
                stack.base.stackId = stack.id;
            }
        }
        for (const card of knownCards) {
            if (!card.stackId)
                continue;
            const stack = this.stacks.get(card.stackId);
            if (!stack || !this.containsCard(stack, card)) {
                card.stackId = null;
            }
        }
        for (const stack of [...this.stacks.values()]) {
            if (stack.members.length === 0 && stack.base.stackId !== stack.id) {
                this.stacks.delete(stack.id);
            }
        }
    }
    /** Valid stack for hit/drag; re-registers solo cards with no stack. */
    resolveStackForCard(card) {
        const existing = this.getStackAt(card);
        if (existing && this.containsCard(existing, card)) {
            return existing;
        }
        card.stackId = null;
        this.removeCardFromAllStacks(card);
        const id = `stack_${this.nextId++}`;
        card.stackId = id;
        const stack = { id, base: card, members: [] };
        this.stacks.set(id, stack);
        return stack;
    }
    removeCardFromAllStacks(card) {
        for (const stack of this.stacks.values()) {
            if (stack.base === card) {
                if (stack.members.length === 0) {
                    this.stacks.delete(stack.id);
                    card.stackId = null;
                }
                else {
                    const [newBase, ...rest] = stack.members;
                    stack.base = newBase;
                    stack.members = rest;
                    newBase.stackId = stack.id;
                    card.stackId = null;
                }
                continue;
            }
            if (stack.members.includes(card)) {
                stack.members = stack.members.filter((c) => c !== card);
            }
        }
    }
    getTopCard(stack) {
        return stack.members.length > 0 ? stack.members[stack.members.length - 1] : stack.base;
    }
    getPileBounds(stack) {
        const top = this.getTopCard(stack);
        const pileCards = [stack.base, ...stack.members];
        const maxW = Math.max(...pileCards.map((c) => c.cardWidth));
        const baseH = stack.base.cardHeight;
        const topH = top.cardHeight;
        const left = stack.base.x - maxW / 2;
        const topEdge = top.y - topH / 2;
        const height = Math.max(baseH, stack.base.y + baseH / 2 - topEdge);
        return new Phaser.Geom.Rectangle(left, topEdge, maxW, height);
    }
    detachCardForDrag(card) {
        const stack = this.getStackAt(card);
        if (!stack || stack.base === card)
            return;
        stack.members = stack.members.filter((c) => c !== card);
        card.stackId = null;
        this.layoutStack(stack);
    }
    /** Remove a solo card from the board (not allowed if base still has members). */
    removeCardFromPlay(card) {
        const stack = this.getStackAt(card);
        if (stack?.base === card && stack.members.length > 0) {
            return false;
        }
        const prevStack = stack;
        this.removeCardFromAllStacks(card);
        card.stackId = null;
        if (prevStack && this.stacks.has(prevStack.id)) {
            this.layoutStack(prevStack);
            this.scene.events.emit('stack-changed', prevStack);
        }
        else if (prevStack) {
            this.scene.events.emit('stack-changed', prevStack);
        }
        return true;
    }
    tryStack(dragged, target) {
        if (dragged === target)
            return false;
        const targetStack = this.resolveStackForCard(target);
        const draggedStack = dragged.stackId ? this.stacks.get(dragged.stackId) : undefined;
        if (draggedStack && this.containsCard(draggedStack, dragged)) {
            if (draggedStack.base === dragged) {
                this.detachFromStack(dragged);
            }
            else {
                return false;
            }
        }
        if (!this.isValidStackTarget(dragged, targetStack)) {
            return false;
        }
        this.removeCardFromAllStacks(dragged);
        targetStack.members.push(dragged);
        dragged.stackId = targetStack.id;
        this.layoutStack(targetStack);
        this.scene.events.emit('stack-changed', targetStack);
        return true;
    }
    detachFromStack(card) {
        const stack = card.stackId ? this.stacks.get(card.stackId) : undefined;
        if (!stack) {
            card.stackId = null;
            return;
        }
        if (stack.base === card) {
            if (stack.members.length === 0) {
                this.stacks.delete(stack.id);
                card.stackId = null;
                return;
            }
            const [newBase, ...rest] = stack.members;
            stack.base = newBase;
            stack.members = rest;
            newBase.stackId = stack.id;
            card.stackId = null;
        }
        else {
            stack.members = stack.members.filter((c) => c !== card);
            card.stackId = null;
        }
        this.layoutStack(stack);
    }
    isValidStackTarget(dragged, target) {
        const baseTags = target.base.definition.tags ?? [];
        const dragTags = dragged.definition.tags ?? [];
        if (dragTags.includes('survivor') && baseTags.includes('base'))
            return true;
        if (dragged.definition.id === 'scrap' && baseTags.includes('base'))
            return true;
        if (dragged.definition.id === 'barbed_roll' && baseTags.includes('barrier'))
            return true;
        if (dragTags.includes('survivor') && baseTags.includes('worksite'))
            return true;
        if (dragTags.includes('mutant_seed') && baseTags.includes('blight_plot'))
            return true;
        if (dragTags.includes('resource') && baseTags.includes('building'))
            return true;
        if (dragTags.includes('weapon')) {
            const pile = [target.base, ...target.members];
            return pile.some((c) => (c.definition.tags ?? []).includes('survivor'));
        }
        return Phaser.Math.Distance.Between(dragged.x, dragged.y, target.base.x, target.base.y) < STACK_HIT_RADIUS;
    }
    layoutStack(stack) {
        stack.base.setDepth(boardDepthFromY(stack.base.y));
        const snap = resolveCardMetrics(stack.base.definition).stackSnap;
        let offsetY = -snap;
        for (let i = 0; i < stack.members.length; i++) {
            const member = stack.members[i];
            member.x = stack.base.x;
            member.y = stack.base.y + offsetY;
            member.setDepth(stack.base.depth + i + 1);
            offsetY -= snap;
        }
    }
    findCardUnder(x, y, exclude) {
        const cards = this.scene.children.list.filter((c) => c instanceof GameCard && c !== exclude);
        let best;
        let bestDist = Infinity;
        for (const card of cards) {
            const dist = Phaser.Math.Distance.Between(x, y, card.x, card.y);
            if (dist < CARD_DROP_RADIUS && dist < bestDist) {
                bestDist = dist;
                best = card;
            }
        }
        return best;
    }
}
