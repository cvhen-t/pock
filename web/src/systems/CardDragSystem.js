import Phaser from 'phaser';
import GameCard, { boardDepthFromY } from '../objects/GameCard';
import { canRotateBoardCard } from '../core/cardRotate';
import { isQuantityStackable } from '../core/cardQuantity';
import { describeStackDrop } from '../core/stackOutcomePreview';
import { clampCardCenter, clampDraggedCards, clampStackToPlayfield } from '../ui/playfieldClamp';
import { tweenDragPickup } from '../ui/dragFx';
const DRAG_THRESHOLD = 6;
const DOUBLE_TAP_MS = 400;
/**
 * Scene-level pointer drag. Uses activePointer while dragging so move events
 * never "lose" the touch on mobile; always clears state on pointerup/cancel.
 */
export class CardDragSystem {
    scene;
    stacks;
    onDrop;
    blocksScreenPoint;
    cards = new Set();
    active = null;
    pending = null;
    lastUpMs = 0;
    lastUpCard = null;
    boundSync = () => this.syncDragState();
    boundContextMenu = (e) => e.preventDefault();
    storeInHand;
    getPlayfield;
    dropHint;
    sellDrop;
    sellHint;
    dropToActionBar;
    hoverScreen;
    constructor(scene, stacks, onDrop, blocksScreenPoint) {
        this.scene = scene;
        this.stacks = stacks;
        this.onDrop = onDrop;
        this.blocksScreenPoint = blocksScreenPoint;
        const input = scene.input;
        input.on('pointerdown', this.onPointerDown, this);
        input.on('pointermove', this.onPointerMove, this);
        input.on('pointerup', this.onPointerUp, this);
        input.on('pointerupoutside', this.onPointerUp, this);
        input.on('pointercancel', this.onPointerUp, this);
        scene.events.on(Phaser.Scenes.Events.UPDATE, this.boundSync);
        scene.events.once(Phaser.Scenes.Events.SHUTDOWN, this.destroy, this);
        scene.game.events.on(Phaser.Core.Events.BLUR, this.forceRelease, this);
        scene.game.canvas.addEventListener('contextmenu', this.boundContextMenu);
    }
    destroy() {
        this.forceRelease();
        this.scene.events.off(Phaser.Scenes.Events.UPDATE, this.boundSync);
        this.scene.game.events.off(Phaser.Core.Events.BLUR, this.forceRelease, this);
        this.scene.game.canvas.removeEventListener('contextmenu', this.boundContextMenu);
    }
    registerCard(card) {
        this.cards.add(card);
    }
    unregisterCard(card) {
        this.cards.delete(card);
    }
    setStoreInHand(handler) {
        this.storeInHand = handler;
    }
    setDropToActionBar(handler) {
        this.dropToActionBar = handler;
    }
    setHoverScreen(handler) {
        this.hoverScreen = handler;
    }
    setPlayfieldBounds(getter) {
        this.getPlayfield = getter;
    }
    setDropHint(hint) {
        this.dropHint = hint;
    }
    setSellDrop(handler) {
        this.sellDrop = handler;
    }
    setSellHint(handler) {
        this.sellHint = handler;
    }
    forceRelease() {
        this.pending = null;
        this.dropHint?.hide();
        this.hoverScreen?.(-1, -1);
        if (this.active)
            this.finishDrag();
    }
    /** Recover if pointerup was missed (tab switch, browser gesture, lost touch). */
    syncDragState() {
        if (!this.active)
            return;
        if (!this.scene.input.activePointer.isDown) {
            this.finishDrag();
        }
    }
    worldPoint(pointer) {
        const out = new Phaser.Math.Vector2();
        this.scene.cameras.main.getWorldPoint(pointer.x, pointer.y, out);
        return out;
    }
    hitTest(wx, wy) {
        this.stacks.reconcile(this.cards);
        let best = null;
        for (const stack of this.stacks.getAllStacks()) {
            if (!this.stacks.getPileBounds(stack).contains(wx, wy))
                continue;
            const leader = this.stacks.getTopCard(stack);
            if (!best || leader.depth > best.depth) {
                best = { stack, leader, depth: leader.depth };
            }
        }
        if (!best) {
            for (const card of this.cards) {
                if (!this.cardContains(card, wx, wy))
                    continue;
                const stack = this.stacks.resolveStackForCard(card);
                const leader = this.stacks.getTopCard(stack);
                if (!best || leader.depth > best.depth) {
                    best = { stack, leader, depth: leader.depth };
                }
            }
        }
        if (!best)
            return null;
        const { depth: _, ...hit } = best;
        return hit;
    }
    cardContains(card, wx, wy) {
        const hw = card.cardWidth / 2;
        const hh = card.cardHeight / 2;
        return wx >= card.x - hw && wx <= card.x + hw && wy >= card.y - hh && wy <= card.y + hh;
    }
    onPointerDown(pointer) {
        if (!pointer.isDown)
            return;
        if (pointer.button !== 0 && pointer.button !== 2)
            return;
        if (this.blocksScreenPoint?.(pointer.x, pointer.y))
            return;
        if (this.active) {
            if (this.scene.input.activePointer.isDown)
                return;
            this.finishDrag();
        }
        const { x, y } = this.worldPoint(pointer);
        const hit = this.hitTest(x, y);
        if (!hit) {
            this.pending = null;
            return;
        }
        if ((hit.leader.definition.tags ?? []).includes('base')) {
            if (pointer.button === 0) {
                this.scene.events.emit('drag-toast', '大本营无法移动');
            }
            return;
        }
        const canWholeStackDrag = hit.stack.members.length > 0 ||
            (hit.leader.quantity > 1 && isQuantityStackable(hit.leader.definition));
        const pileMode = pointer.button === 2 && canWholeStackDrag;
        this.pending = {
            hit,
            pileMode,
            originX: x,
            originY: y,
            button: pointer.button,
        };
    }
    onPointerMove() {
        const pointer = this.scene.input.activePointer;
        if (this.active) {
            if (pointer.isDown)
                this.applyDrag(pointer);
            return;
        }
        if (!this.pending || !pointer.isDown)
            return;
        const { x, y } = this.worldPoint(pointer);
        const dx = x - this.pending.originX;
        const dy = y - this.pending.originY;
        if (dx * dx + dy * dy < DRAG_THRESHOLD * DRAG_THRESHOLD)
            return;
        this.startDrag(this.pending, x, y);
        this.pending = null;
        this.applyDrag(pointer);
    }
    onPointerUp(pointer) {
        if (this.pending && !this.active && pointer.button === 0) {
            const { hit } = this.pending;
            const card = hit.leader;
            const now = this.scene.time.now;
            const isRotateTap = this.lastUpCard === card &&
                now - this.lastUpMs < DOUBLE_TAP_MS &&
                canRotateBoardCard(hit.stack, card);
            this.lastUpMs = now;
            this.lastUpCard = card;
            if (isRotateTap) {
                card.toggleRotation();
                this.clampBoardCard(card);
                this.scene.events.emit('drag-toast', '已旋转');
            }
            else {
                this.scene.events.emit('board-card-tap', { card });
            }
        }
        this.pending = null;
        if (this.active)
            this.finishDrag();
    }
    startDrag(press, wx, wy) {
        const { hit, pileMode } = press;
        const { stack } = hit;
        let leader = hit.leader;
        let mode;
        let cards;
        if (pileMode && stack.members.length > 0) {
            mode = 'pile';
            cards = [stack.base, ...stack.members];
        }
        else if (stack.members.length > 0) {
            mode = 'top';
            this.stacks.detachCardForDrag(leader);
            cards = [leader];
        }
        else if (leader.quantity > 1 && isQuantityStackable(leader.definition)) {
            mode = 'solo';
            if (!pileMode) {
                leader = this.splitQuantityForDrag(leader);
            }
            cards = [leader];
        }
        else {
            mode = 'solo';
            cards = [leader];
        }
        const starts = new Map();
        for (const c of cards) {
            starts.set(c, { x: c.x, y: c.y });
        }
        this.active = {
            mode,
            stack: mode === 'pile' ? stack : (this.stacks.getStackAt(leader) ?? null),
            leader,
            cards,
            originX: wx,
            originY: wy,
            starts,
        };
        for (const c of cards) {
            c.setDepth(1000 + cards.indexOf(c));
            this.scene.tweens.killTweensOf(c);
            tweenDragPickup(this.scene, c, 1.06);
        }
        if (pileMode) {
            this.scene.events.emit('drag-toast', stack.members.length > 0 ? '右键：整摞拖动' : '右键：整组拖动');
        }
    }
    /** Peel one resource card off a quantity stack for solo drag. */
    splitQuantityForDrag(source) {
        const sourceStack = this.stacks.getStackAt(source);
        source.setQuantity(source.quantity - 1);
        const split = new GameCard(this.scene, source.x, source.y, source.definition);
        split.setQuantity(1);
        split.setDepth(source.depth);
        this.stacks.registerBase(split);
        this.registerCard(split);
        if (sourceStack) {
            this.scene.events.emit('stack-changed', sourceStack);
        }
        return split;
    }
    applyDrag(pointer) {
        const drag = this.active;
        if (!drag)
            return;
        const { x, y } = this.worldPoint(pointer);
        const dx = x - drag.originX;
        const dy = y - drag.originY;
        if (drag.mode === 'pile' && drag.stack) {
            const baseStart = drag.starts.get(drag.stack.base);
            drag.stack.base.x = baseStart.x + dx;
            drag.stack.base.y = baseStart.y + dy;
            this.clampActiveDrag(drag);
            this.updateDropHint(drag.leader);
            this.hoverScreen?.(pointer.x, pointer.y);
            return;
        }
        const card = drag.leader;
        const start = drag.starts.get(card);
        card.x = start.x + dx;
        card.y = start.y + dy;
        const stack = this.stacks.getStackAt(card);
        if (stack?.base === card) {
            this.stacks.layoutStack(stack);
        }
        this.clampActiveDrag(drag);
        this.updateDropHint(drag.leader);
        this.hoverScreen?.(pointer.x, pointer.y);
    }
    updateDropHint(dragged) {
        if (!this.dropHint)
            return;
        const sellPreview = this.sellHint?.(dragged, dragged.x, dragged.y);
        if (sellPreview) {
            this.dropHint.show(dragged.x, dragged.y, sellPreview);
            return;
        }
        const target = this.stacks.findCardUnder(dragged.x, dragged.y, dragged);
        if (!target) {
            this.dropHint.hide();
            return;
        }
        const preview = describeStackDrop(this.stacks, dragged, target);
        if (!preview) {
            this.dropHint.hide();
            return;
        }
        this.dropHint.show(target.x, target.y, preview);
    }
    clampActiveDrag(drag) {
        const pf = this.getPlayfield?.();
        if (!pf)
            return;
        clampDraggedCards(this.stacks, pf, drag.mode, drag.leader, drag.stack);
    }
    finishDrag() {
        const drag = this.active;
        if (!drag)
            return;
        this.active = null;
        this.dropHint?.hide();
        this.hoverScreen?.(-1, -1);
        for (const c of drag.cards) {
            this.scene.tweens.killTweensOf(c);
            c.setScale(1);
            c.setDepth(boardDepthFromY(c.y));
        }
        const card = drag.leader;
        const wholePile = drag.mode === 'pile';
        const pointer = this.scene.input.activePointer;
        if (this.sellDrop?.(card, pointer.x, pointer.y)) {
            this.stacks.removeCardFromPlay(card);
            card.destroy();
            this.cards.delete(card);
            this.stacks.reconcile(this.cards);
            this.onDrop({ card, stacked: false, wholePile });
            return;
        }
        if (wholePile) {
            const stack = this.stacks.getStackAt(card);
            if (stack)
                this.stacks.layoutStack(stack);
            this.clampBoardCard(card);
            this.stacks.reconcile(this.cards);
            this.onDrop({ card, stacked: false, wholePile: true });
            return;
        }
        if (this.storeInHand?.(card, pointer.x, pointer.y)) {
            this.stacks.reconcile(this.cards);
            this.onDrop({ card, stacked: false, wholePile: false, storedInHand: true });
            return;
        }
        if (this.dropToActionBar?.(card, pointer.x, pointer.y)) {
            this.stacks.reconcile(this.cards);
            this.onDrop({ card, stacked: false, wholePile: false, storedInActionBar: true });
            return;
        }
        const target = this.stacks.findCardUnder(card.x, card.y, card);
        if (target && this.stacks.tryStack(card, target)) {
            this.clampBoardCard(card);
            this.stacks.reconcile(this.cards);
            this.onDrop({
                card,
                stacked: true,
                targetName: target.definition.name,
                wholePile: false,
            });
            return;
        }
        const stack = this.stacks.getStackAt(card);
        if (stack) {
            this.stacks.layoutStack(stack);
        }
        else {
            this.stacks.resolveStackForCard(card);
        }
        this.clampBoardCard(card);
        this.stacks.reconcile(this.cards);
        this.onDrop({ card, stacked: false, wholePile: false });
    }
    clampBoardCard(card) {
        const pf = this.getPlayfield?.();
        if (!pf)
            return;
        const stack = this.stacks.getStackAt(card);
        if (stack) {
            clampStackToPlayfield(this.stacks, stack, pf);
        }
        else {
            clampCardCenter(pf, card);
        }
    }
}
