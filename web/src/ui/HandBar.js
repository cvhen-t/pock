import Phaser from 'phaser';
import { CARD_H, CARD_SHAPES, CARD_W } from '../config/cardLayout';
import { HAND_DRAG_THRESHOLD, HAND_SCROLL_THRESHOLD, HAND_SLOT_GAP, HAND_SLOT_SCALE, } from '../config/layoutConfig';
import { HandInventory } from '../core/HandInventory';
import { dataStore } from '../core/DataStore';
import { getDefenseTurretRange } from '../core/defenseTurretRange';
import { describeStackDrop } from '../core/stackOutcomePreview';
import GameCard, { boardDepthFromY } from '../objects/GameCard';
import { CARD_ICON_BG, CARD_INNER_ALPHA } from '../art/cardIconStyle';
import { resolveCardIconKey } from '../art/resolveCardIconKey';
import { TEX } from '../art/textureKeys';
import { clampCardCenter } from './playfieldClamp';
import { fadeOutGhost, tweenCardEnter, tweenDragPickup } from './dragFx';
import { PlantAttackRangePreview } from './PlantAttackRangePreview';
const HUD_DEPTH = 2100;
export default class HandBar extends Phaser.GameObjects.Container {
    stacks;
    spawner;
    inventory = new HandInventory();
    orientation;
    bg;
    titleText;
    viewport;
    emptyHint;
    slotViews = new Map();
    scrollOffset = 0;
    viewW = 0;
    viewH = 0;
    layoutRects;
    panelRect;
    pointerMode = 'idle';
    activeSlotId = null;
    pointerOriginX = 0;
    pointerOriginY = 0;
    scrollOrigin = 0;
    dragGhost = null;
    dragCardId = null;
    gameOver = false;
    dropHint;
    attackRangePreview;
    onTradeSellDrop;
    onActionBarDrop;
    onTradeSellHint;
    onDragHover;
    constructor(scene, stacks, spawner, options = {}) {
        super(scene, 0, 0);
        this.stacks = stacks;
        this.spawner = spawner;
        this.orientation = options.orientation ?? 'horizontal';
        this.onTradeSellDrop = options.onTradeSellDrop;
        this.onTradeSellHint = options.onTradeSellHint;
        this.onActionBarDrop = options.onActionBarDrop;
        this.onDragHover = options.onDragHover;
        this.attackRangePreview = new PlantAttackRangePreview(scene);
        scene.add.existing(this);
        this.setScrollFactor(0);
        this.setDepth(HUD_DEPTH);
        this.bg = scene.add.rectangle(0, 0, 100, 72, 0x1e1b16, 0.94);
        this.bg.setStrokeStyle(1, 0x4a4034, 0.8);
        this.titleText = scene.add.text(0, 0, options.title ?? '', {
            fontSize: '9px',
            color: '#7a7064',
        });
        this.titleText.setOrigin(0.5, 0);
        this.viewport = scene.add.container(0, 0);
        this.emptyHint = scene.add.text(0, 0, options.emptyHint ?? '暂无卡牌', {
            fontSize: '11px',
            color: '#5a5248',
            align: 'center',
            wordWrap: { width: 90 },
        });
        this.emptyHint.setOrigin(0.5);
        this.add([this.bg, this.titleText, this.viewport, this.emptyHint]);
        const input = scene.input;
        input.on('pointerdown', this.onPointerDown, this);
        input.on('pointermove', this.onPointerMove, this);
        input.on('pointerup', this.onPointerUp, this);
        input.on('pointerupoutside', this.onPointerUp, this);
        input.on('pointercancel', this.onPointerUp, this);
        scene.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
            input.off('pointerdown', this.onPointerDown, this);
            input.off('pointermove', this.onPointerMove, this);
            input.off('pointerup', this.onPointerUp, this);
            input.off('pointerupoutside', this.onPointerUp, this);
            input.off('pointercancel', this.onPointerUp, this);
            this.cancelDrag();
        });
    }
    setGameOver(over) {
        this.gameOver = over;
    }
    applyLayout(rects, panelRect) {
        this.layoutRects = rects;
        this.panelRect = panelRect;
        this.setPosition(panelRect.x, panelRect.y);
        this.bg.setPosition(panelRect.width / 2, panelRect.height / 2);
        this.bg.setSize(panelRect.width, panelRect.height);
        const pad = 8;
        const titleH = this.titleText.text ? 14 : 0;
        this.titleText.setPosition(panelRect.width / 2, 4);
        const viewW = panelRect.width - pad * 2;
        const viewH = panelRect.height - pad * 2 - titleH;
        const viewX = pad;
        const viewY = pad + titleH;
        this.viewport.setPosition(viewX, viewY);
        this.emptyHint.setPosition(viewX + viewW / 2, viewY + viewH / 2);
        if (this.orientation === 'vertical') {
            this.emptyHint.setWordWrapWidth(viewW - 4);
        }
        this.viewW = viewW;
        this.viewH = viewH;
        this.clampScroll();
        this.rebuildSlots();
    }
    setDropHint(hint) {
        this.dropHint = hint;
    }
    containsScreenPoint(sx, sy) {
        return this.panelRect?.contains(sx, sy) ?? false;
    }
    isDraggingFromHand() {
        return this.pointerMode === 'drag';
    }
    canStoreBoardCard(card) {
        if (this.gameOver)
            return false;
        const tags = card.definition.tags ?? [];
        if (tags.includes('base') || tags.includes('enemy'))
            return false;
        const stack = this.stacks.getStackAt(card);
        if (stack?.base === card && stack.members.length > 0)
            return false;
        return true;
    }
    /** Move a board card into this bar (destroys the GameCard). */
    storeBoardCard(card, drag) {
        if (!this.canStoreBoardCard(card))
            return false;
        if (!this.stacks.removeCardFromPlay(card))
            return false;
        const cardId = card.definition.id;
        drag.unregisterCard(card);
        card.destroy();
        this.addCard(cardId, 1);
        this.scene.events.emit('card-stored-to-hand', { cardId });
        return true;
    }
    addCard(cardId, amount = 1) {
        this.inventory.add(cardId, amount);
        this.scene.events.emit('hand-slot-changed', { cardId, count: this.inventory.getCount(cardId) });
        if (this.panelRect) {
            this.rebuildSlots();
        }
    }
    restoreInventory(slots) {
        this.inventory.replaceAll(slots);
        if (this.panelRect)
            this.rebuildSlots();
    }
    slotStep() {
        const metrics = CARD_SHAPES.compact;
        const scale = HAND_SLOT_SCALE;
        if (this.orientation === 'horizontal') {
            return metrics.w * scale + HAND_SLOT_GAP;
        }
        return metrics.h * scale + HAND_SLOT_GAP;
    }
    rebuildSlots() {
        for (const view of this.slotViews.values()) {
            view.container.destroy();
        }
        this.slotViews.clear();
        const slots = this.inventory.getSlots();
        this.emptyHint.setVisible(slots.length === 0);
        for (const slot of slots) {
            const def = dataStore.getCard(slot.cardId);
            if (!def)
                continue;
            const container = this.scene.add.container(0, 0);
            const metrics = CARD_SHAPES.compact;
            const scale = HAND_SLOT_SCALE;
            const w = metrics.w * scale;
            const h = metrics.h * scale;
            const shell = this.scene.add.image(0, 0, TEX.CARD_SHELL_COMPACT);
            shell.setDisplaySize(w + 2, h + 2);
            const inner = this.scene.add.rectangle(0, 0, w - 6, h - 8, CARD_ICON_BG, CARD_INNER_ALPHA);
            const iconKey = this.resolveIconKey(def.id, def.artKey, def.icon);
            const icon = this.scene.add.image(0, -4, iconKey);
            icon.setDisplaySize(metrics.icon * scale, metrics.icon * scale);
            const name = this.scene.add.text(0, h * 0.32, def.name, {
                fontSize: '7px',
                color: '#000000',
                align: 'center',
                wordWrap: { width: w - 4 },
            });
            name.setOrigin(0.5, 0);
            const badge = this.scene.add.text(w * 0.38, -h * 0.42, '', {
                fontSize: '10px',
                color: '#f0e8d8',
                stroke: '#1a1612',
                strokeThickness: 2,
            });
            badge.setOrigin(0.5);
            badge.setVisible(slot.count > 1);
            badge.setText(slot.count > 99 ? '99+' : String(slot.count));
            container.add([shell, inner, icon, name, badge]);
            container.setSize(w, h);
            container.setInteractive(new Phaser.Geom.Rectangle(-w / 2, -h / 2, w, h), Phaser.Geom.Rectangle.Contains);
            container.setData('cardId', slot.cardId);
            this.viewport.add(container);
            this.slotViews.set(slot.cardId, { cardId: slot.cardId, container, badge });
        }
        this.clampScroll();
        this.layoutSlotPositions();
    }
    layoutSlotPositions() {
        const step = this.slotStep();
        const slots = this.inventory.getSlots();
        const contentLen = slots.length * step;
        if (this.orientation === 'horizontal') {
            const fits = contentLen <= this.viewW;
            let startX;
            if (fits) {
                startX = (this.viewW - contentLen) / 2 + step / 2;
            }
            else {
                startX = (this.viewW - contentLen) / 2 - this.scrollOffset + step / 2;
            }
            let i = 0;
            for (const slot of slots) {
                const view = this.slotViews.get(slot.cardId);
                if (view) {
                    view.container.x = startX + i * step;
                    view.container.y = this.viewH / 2;
                }
                i += 1;
            }
            return;
        }
        const fits = contentLen <= this.viewH;
        let startY;
        if (fits) {
            startY = (this.viewH - contentLen) / 2 + step / 2;
        }
        else {
            startY = (this.viewH - contentLen) / 2 - this.scrollOffset + step / 2;
        }
        let i = 0;
        for (const slot of slots) {
            const view = this.slotViews.get(slot.cardId);
            if (view) {
                view.container.x = this.viewW / 2;
                view.container.y = startY + i * step;
            }
            i += 1;
        }
    }
    contentScrollSize() {
        return this.inventory.getSlots().length * this.slotStep();
    }
    maxScroll() {
        const viewSize = this.orientation === 'horizontal' ? this.viewW : this.viewH;
        return Math.max(0, this.contentScrollSize() - viewSize);
    }
    resolveIconKey(id, artKey, icon) {
        return resolveCardIconKey(this.scene, { id, artKey, icon });
    }
    clampScroll() {
        const max = this.maxScroll();
        this.scrollOffset = Phaser.Math.Clamp(this.scrollOffset, -max, max);
        this.layoutSlotPositions();
    }
    hitSlot(sx, sy) {
        if (!this.panelRect?.contains(sx, sy))
            return null;
        const lx = sx - this.x - this.viewport.x;
        const ly = sy - this.y - this.viewport.y;
        for (const slot of this.inventory.getSlots()) {
            const view = this.slotViews.get(slot.cardId);
            if (!view)
                continue;
            const { container } = view;
            const hw = container.width / 2;
            const hh = container.height / 2;
            if (lx >= container.x - hw &&
                lx <= container.x + hw &&
                ly >= container.y - hh &&
                ly <= container.y + hh) {
                return slot.cardId;
            }
        }
        return null;
    }
    onPointerDown(pointer) {
        if (this.gameOver || !this.panelRect)
            return;
        const cardId = this.hitSlot(pointer.x, pointer.y);
        if (!cardId)
            return;
        if (this.inventory.getCount(cardId) <= 0)
            return;
        this.activeSlotId = cardId;
        this.pointerOriginX = pointer.x;
        this.pointerOriginY = pointer.y;
        this.scrollOrigin = this.scrollOffset;
        this.pointerMode = 'idle';
    }
    onPointerMove(pointer) {
        if (!this.activeSlotId || !pointer.isDown)
            return;
        const dx = pointer.x - this.pointerOriginX;
        const dy = pointer.y - this.pointerOriginY;
        if (this.pointerMode === 'idle') {
            if (this.orientation === 'horizontal') {
                if (Math.abs(dx) > HAND_SCROLL_THRESHOLD && Math.abs(dx) > Math.abs(dy) * 1.1) {
                    this.pointerMode = 'scroll';
                }
                else if (pointer.y < this.panelRect.top - 8 ||
                    dy < -HAND_DRAG_THRESHOLD) {
                    this.startDrag(this.activeSlotId);
                }
            }
            else if (Math.abs(dy) > HAND_SCROLL_THRESHOLD &&
                Math.abs(dy) > Math.abs(dx) * 1.1) {
                this.pointerMode = 'scroll';
            }
            else if (pointer.x < this.panelRect.left - 8 ||
                dx < -HAND_DRAG_THRESHOLD) {
                this.startDrag(this.activeSlotId);
            }
        }
        if (this.pointerMode === 'scroll') {
            this.scrollOffset = this.scrollOrigin - (this.orientation === 'horizontal' ? dx : dy);
            this.clampScroll();
            return;
        }
        if (this.pointerMode === 'drag' && this.dragGhost) {
            const { x, y } = this.worldPoint(pointer);
            this.dragGhost.setPosition(x, y);
            this.dragGhost.setDepth(1600);
            this.onDragHover?.(pointer.x, pointer.y);
            this.updateDropHint(x, y);
            this.updateAttackRangePreview();
        }
    }
    updateAttackRangePreview() {
        if (!this.dragGhost || !this.dragCardId) {
            this.attackRangePreview.hide();
            return;
        }
        const def = dataStore.getCard(this.dragCardId);
        if (!def) {
            this.attackRangePreview.hide();
            return;
        }
        const range = getDefenseTurretRange(def);
        if (range == null) {
            this.attackRangePreview.hide();
            return;
        }
        this.attackRangePreview.show(this.dragGhost.x, this.dragGhost.y, range);
    }
    updateDropHint(wx, wy) {
        if (!this.dropHint || !this.dragGhost || !this.dragCardId)
            return;
        const sellPreview = this.onTradeSellHint?.(this.dragCardId, wx, wy);
        if (sellPreview) {
            this.dropHint.show(wx, wy, sellPreview);
            return;
        }
        const target = this.stacks.findCardUnder(wx, wy, undefined);
        if (!target) {
            this.dropHint.hide();
            return;
        }
        const preview = describeStackDrop(this.stacks, this.dragGhost, target);
        if (!preview) {
            this.dropHint.hide();
            return;
        }
        this.dropHint.show(target.x, target.y, preview);
    }
    onPointerUp() {
        if (this.pointerMode === 'drag') {
            this.finishDrag();
        }
        this.pointerMode = 'idle';
        this.activeSlotId = null;
    }
    startDrag(cardId) {
        if (this.gameOver || this.pointerMode === 'drag')
            return;
        const def = dataStore.getCard(cardId);
        if (!def)
            return;
        this.pointerMode = 'drag';
        this.dragCardId = cardId;
        const pointer = this.scene.input.activePointer;
        const { x, y } = this.worldPoint(pointer);
        this.dragGhost = new GameCard(this.scene, x, y, def);
        this.dragGhost.setScale(0.94);
        this.dragGhost.setAlpha(0.92);
        this.dragGhost.setDepth(1600);
        this.scene.children.bringToTop(this.dragGhost);
        tweenDragPickup(this.scene, this.dragGhost, 1.06);
        this.updateAttackRangePreview();
    }
    finishDrag() {
        this.attackRangePreview.hide();
        this.dropHint?.hide();
        this.onDragHover?.(-1, -1);
        const cardId = this.dragCardId;
        const ghost = this.dragGhost;
        this.dragGhost = null;
        this.dragCardId = null;
        this.pointerMode = 'idle';
        if (!cardId || !ghost)
            return;
        const pointer = this.scene.input.activePointer;
        const dropX = ghost.x;
        const dropY = ghost.y;
        if (this.onTradeSellDrop?.(cardId, pointer.x, pointer.y, dropX, dropY)) {
            ghost.destroy();
            this.inventory.consumeOne(cardId);
            this.scene.events.emit('hand-slot-changed', {
                cardId,
                count: this.inventory.getCount(cardId),
            });
            if (this.panelRect)
                this.rebuildSlots();
            return;
        }
        if (this.onActionBarDrop?.(cardId, pointer.x, pointer.y)) {
            fadeOutGhost(this.scene, ghost);
            this.scene.events.emit('hand-slot-changed', {
                cardId,
                count: this.inventory.getCount(cardId),
            });
            if (this.panelRect)
                this.rebuildSlots();
            return;
        }
        const pf = this.layoutRects?.playfield;
        if (!pf || this.gameOver) {
            fadeOutGhost(this.scene, ghost);
            return;
        }
        if (this.inventory.getCount(cardId) <= 0) {
            fadeOutGhost(this.scene, ghost);
            return;
        }
        const def = dataStore.getCard(cardId);
        if (!def) {
            fadeOutGhost(this.scene, ghost);
            return;
        }
        const hw = CARD_W / 2;
        const hh = CARD_H / 2;
        if (dropX < pf.left + hw ||
            dropX > pf.right - hw ||
            dropY < pf.top + hh ||
            dropY > pf.bottom - hh) {
            fadeOutGhost(this.scene, ghost);
            return;
        }
        fadeOutGhost(this.scene, ghost);
        const card = this.spawner.spawn(cardId, dropX, dropY);
        if (!card)
            return;
        clampCardCenter(pf, card);
        card.setDepth(boardDepthFromY(card.y));
        tweenCardEnter(this.scene, card, 1);
        const target = this.stacks.findCardUnder(card.x, card.y, card);
        if (target) {
            this.stacks.tryStack(card, target);
        }
        this.inventory.consumeOne(cardId);
        this.scene.events.emit('hand-slot-changed', {
            cardId,
            count: this.inventory.getCount(cardId),
        });
        this.scene.events.emit('card-placed-from-hand', { cardId, card });
        if (this.panelRect) {
            this.rebuildSlots();
        }
    }
    cancelDrag() {
        this.dropHint?.hide();
        this.onDragHover?.(-1, -1);
        this.dragGhost?.destroy();
        this.dragGhost = null;
        this.dragCardId = null;
        this.pointerMode = 'idle';
        this.activeSlotId = null;
    }
    worldPoint(pointer) {
        const out = new Phaser.Math.Vector2();
        this.scene.cameras.main.getWorldPoint(pointer.x, pointer.y, out);
        return out;
    }
}
