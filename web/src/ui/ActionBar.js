import Phaser from 'phaser';
import { ACTION_SLOT_SCALE, HAND_DRAG_THRESHOLD, } from '../config/layoutConfig';
import { dataStore } from '../core/DataStore';
import { describeStackDrop } from '../core/stackOutcomePreview';
import GameCard, { boardDepthFromY } from '../objects/GameCard';
import { ActionBarStackSystem } from '../systems/ActionBarStackSystem';
import { clampCardCenter } from './playfieldClamp';
import { setPanelDropHover, tweenCardEnter, tweenCardSettle, tweenDragPickup } from './dragFx';
const HUD_DEPTH = 2100;
const BAR_CARD_SCALE = ACTION_SLOT_SCALE;
const WORKSPACE_PAD = 10;
/**
 * Bottom blueprint workspace — drag cards in, stack freely (no effects).
 * Double-tap then drag out to materialize on the playfield.
 */
export default class ActionBar extends Phaser.GameObjects.Container {
    stacks;
    spawner;
    options;
    barStacks;
    bg;
    titleText;
    hintText;
    workspace;
    workspaceRect = new Phaser.Geom.Rectangle(0, 0, 100, 60);
    layoutRects;
    panelRect;
    pending = null;
    activeDrag = null;
    gameOver = false;
    dropHint;
    dropHover = false;
    constructor(scene, stacks, spawner, options) {
        super(scene, 0, 0);
        this.stacks = stacks;
        this.spawner = spawner;
        this.options = options;
        this.barStacks = new ActionBarStackSystem(stacks);
        scene.add.existing(this);
        this.setScrollFactor(0);
        this.setDepth(HUD_DEPTH);
        this.bg = scene.add.rectangle(0, 0, 100, 72, 0x1a1814, 0.94);
        this.bg.setStrokeStyle(1, 0x4a4034, 0.75);
        this.titleText = scene.add.text(0, 0, '操作栏', {
            fontSize: '9px',
            color: '#7a7064',
        });
        this.titleText.setOrigin(0, 0);
        this.hintText = scene.add.text(0, 0, '拖入叠放蓝图 · 叠牌双击拖出', {
            fontSize: '9px',
            color: '#5a5248',
        });
        this.hintText.setOrigin(1, 0.5);
        this.workspace = scene.add.container(0, 0);
        this.add([this.bg, this.titleText, this.hintText, this.workspace]);
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
    setDropHint(hint) {
        this.dropHint = hint;
    }
    setGameOver(over) {
        this.gameOver = over;
    }
    getBlueprintStackSystem() {
        return this.barStacks;
    }
    setDropHover(active) {
        if (this.dropHover === active)
            return;
        this.dropHover = active;
        setPanelDropHover(this.scene, this.bg, active);
    }
    applyLayout(rects, panelRect) {
        this.layoutRects = rects;
        this.panelRect = panelRect;
        this.setPosition(panelRect.x, panelRect.y);
        this.bg.setPosition(panelRect.width / 2, panelRect.height / 2);
        this.bg.setSize(panelRect.width, panelRect.height);
        const padX = WORKSPACE_PAD;
        const titleW = 36;
        this.titleText.setPosition(padX, 8);
        const areaX = padX + titleW + 4;
        const areaW = panelRect.width - areaX - padX;
        const areaH = panelRect.height - 16;
        this.workspaceRect.setTo(areaX, 8, areaW, areaH);
        this.hintText.setPosition(panelRect.width - padX, panelRect.height / 2);
    }
    containsScreenPoint(sx, sy) {
        return this.panelRect?.contains(sx, sy) ?? false;
    }
    isDraggingFromBar() {
        return this.activeDrag !== null;
    }
    inventory() {
        return this.options.getInventory();
    }
    /** Drop from backpack into the workspace (consumes inventory). */
    acceptFromBackpack(cardId, sx, sy) {
        if (this.gameOver || !this.containsScreenPoint(sx, sy))
            return false;
        if (!this.inventory().consumeOne(cardId))
            return false;
        const pos = this.clampLocal(sx - this.x, sy - this.y);
        const card = this.spawnBlueprintCard(cardId, pos.x, pos.y);
        if (!card)
            return false;
        const target = this.barStacks.findCardUnder(pos.x, pos.y, card);
        if (target && this.barStacks.tryStack(card, target)) {
            tweenCardEnter(this.scene, card, BAR_CARD_SCALE);
            this.playStackLand(card);
        }
        else {
            this.barStacks.registerBase(card, pos.x, pos.y);
            tweenCardEnter(this.scene, card, BAR_CARD_SCALE);
        }
        this.scene.events.emit('hand-slot-changed', {
            cardId,
            count: this.inventory().getCount(cardId),
        });
        return true;
    }
    /** Move a board card into the blueprint workspace. */
    acceptFromBoard(card, drag, sx, sy) {
        if (this.gameOver || !this.containsScreenPoint(sx, sy))
            return false;
        const tags = card.definition.tags ?? [];
        if (tags.includes('base') || tags.includes('enemy'))
            return false;
        const boardStack = this.stacks.getStackAt(card);
        if (boardStack?.base === card && boardStack.members.length > 0)
            return false;
        if (!this.stacks.removeCardFromPlay(card))
            return false;
        drag.unregisterCard(card);
        this.adoptBoardCard(card, sx, sy);
        return true;
    }
    adoptBoardCard(card, sx, sy) {
        const end = this.clampLocal(sx - this.x, sy - this.y);
        const fromScale = card.scaleX;
        card.setScrollFactor(0);
        card.setDepth(HUD_DEPTH + 10);
        this.workspace.add(card);
        const target = this.barStacks.findCardUnder(end.x, end.y, card);
        if (target && this.barStacks.tryStack(card, target)) {
            tweenCardSettle(this.scene, card, card.x, card.y, BAR_CARD_SCALE);
            this.playStackLand(card);
            return;
        }
        this.barStacks.registerBase(card, end.x, end.y);
        card.setPosition(end.x, end.y);
        card.setScale(fromScale);
        tweenCardSettle(this.scene, card, end.x, end.y, BAR_CARD_SCALE);
    }
    playStackLand(card) {
        const s = card.scaleX;
        this.scene.tweens.killTweensOf(card);
        this.scene.tweens.add({
            targets: card,
            scaleX: s * 1.05,
            scaleY: s * 1.05,
            duration: 80,
            yoyo: true,
            ease: 'Sine.easeOut',
        });
    }
    spawnBlueprintCard(cardId, x, y) {
        const def = dataStore.getCard(cardId);
        if (!def)
            return null;
        const card = new GameCard(this.scene, x, y, def);
        card.setScrollFactor(0);
        card.setScale(BAR_CARD_SCALE);
        card.setDepth(HUD_DEPTH + 10);
        this.workspace.add(card);
        return card;
    }
    clampLocal(lx, ly) {
        const r = this.workspaceRect;
        const hw = CARD_HALF_W;
        const hh = CARD_HALF_H;
        return new Phaser.Math.Vector2(Phaser.Math.Clamp(lx, r.left + hw, r.right - hw), Phaser.Math.Clamp(ly, r.top + hh, r.bottom - hh));
    }
    onPointerDown(pointer) {
        if (this.gameOver || !this.panelRect)
            return;
        if (pointer.button !== 0 && pointer.button !== 2)
            return;
        if (!this.containsScreenPoint(pointer.x, pointer.y))
            return;
        const hit = this.barStacks.hitCard(pointer.x, pointer.y, this.x, this.y);
        if (!hit)
            return;
        const stack = this.barStacks.findStackOf(hit);
        if (!stack)
            return;
        const isPile = stack.members.length > 0;
        const deployMode = pointer.button === 2 && isPile;
        this.pending = {
            stack,
            leader: this.barStacks.getTopCard(stack),
            deployMode,
            originX: pointer.x,
            originY: pointer.y,
        };
    }
    onPointerMove(pointer) {
        if (this.activeDrag) {
            if (pointer.isDown)
                this.applyDrag(pointer);
            return;
        }
        if (!this.pending || !pointer.isDown)
            return;
        const dx = pointer.x - this.pending.originX;
        const dy = pointer.y - this.pending.originY;
        if (dx * dx + dy * dy < HAND_DRAG_THRESHOLD * HAND_DRAG_THRESHOLD)
            return;
        this.startDrag(this.pending);
        this.pending = null;
        this.applyDrag(pointer);
    }
    onPointerUp() {
        this.pending = null;
        if (this.activeDrag)
            this.finishDrag();
    }
    startDrag(press) {
        const { stack, deployMode } = press;
        const leader = this.barStacks.getTopCard(stack);
        const isPile = stack.members.length > 0;
        let mode;
        let cards;
        if (deployMode) {
            mode = 'pile';
            cards = this.barStacks.pileCards(stack);
            this.scene.events.emit('drag-toast', '右键拖出整摞', '#8a9a7a');
        }
        else if (!isPile) {
            mode = 'solo';
            cards = [leader];
        }
        else {
            mode = 'top';
            this.barStacks.detach(leader);
            cards = [leader];
        }
        const starts = new Map();
        for (const c of cards) {
            starts.set(c, { x: c.x, y: c.y });
        }
        this.activeDrag = {
            mode,
            stack,
            leader,
            cards,
            originX: press.originX - this.x,
            originY: press.originY - this.y,
            starts,
            deployMode,
        };
        for (const c of cards) {
            c.setDepth(HUD_DEPTH + 200 + cards.indexOf(c));
            tweenDragPickup(this.scene, c, c.scaleX * 1.06);
        }
    }
    applyDrag(pointer) {
        const drag = this.activeDrag;
        if (!drag)
            return;
        const lx = pointer.x - this.x;
        const ly = pointer.y - this.y;
        const dx = lx - drag.originX;
        const dy = ly - drag.originY;
        if (drag.mode === 'pile') {
            const baseStart = drag.starts.get(drag.stack.base);
            drag.stack.base.x = baseStart.x + dx;
            drag.stack.base.y = baseStart.y + dy;
            this.barStacks.layoutStack(drag.stack);
        }
        else {
            const start = drag.starts.get(drag.leader);
            drag.leader.x = start.x + dx;
            drag.leader.y = start.y + dy;
        }
        if (!drag.deployMode) {
            this.updateBlueprintHint(drag.leader);
        }
        else {
            this.dropHint?.hide();
        }
    }
    updateBlueprintHint(card) {
        if (!this.dropHint)
            return;
        const target = this.barStacks.findCardUnder(card.x, card.y, card);
        if (!target) {
            this.dropHint.hide();
            return;
        }
        const preview = describeStackDrop(this.stacks, card, target);
        if (!preview) {
            this.dropHint.hide();
            return;
        }
        this.dropHint.show(this.x + target.x, this.y + target.y, {
            primary: preview.primary,
            secondary: preview.secondary ? `${preview.secondary} · 蓝图` : '蓝图预览',
        });
    }
    finishDrag() {
        const drag = this.activeDrag;
        if (!drag)
            return;
        this.activeDrag = null;
        this.dropHint?.hide();
        this.setDropHover(false);
        const pointer = this.scene.input.activePointer;
        const pf = this.layoutRects?.playfield;
        if (pf && !this.containsScreenPoint(pointer.x, pointer.y)) {
            const world = this.worldPoint(pointer);
            if (this.isOverPlayfield(world.x, world.y, pf)) {
                if (drag.deployMode || drag.mode === 'solo') {
                    this.materializePile(drag.stack, world.x, world.y);
                    return;
                }
            }
        }
        if (this.containsScreenPoint(pointer.x, pointer.y)) {
            this.resolveBarDrop(drag);
            return;
        }
        this.snapBack(drag);
    }
    resolveBarDrop(drag) {
        const card = drag.leader;
        if (drag.mode === 'pile') {
            const pos = this.clampLocal(drag.stack.base.x, drag.stack.base.y);
            this.tweenStackBase(drag.stack, pos.x, pos.y);
            return;
        }
        const pos = this.clampLocal(card.x, card.y);
        const target = this.barStacks.findCardUnder(pos.x, pos.y, card);
        if (target && this.barStacks.tryStack(card, target)) {
            tweenCardSettle(this.scene, card, card.x, card.y, BAR_CARD_SCALE);
            this.playStackLand(card);
            return;
        }
        this.barStacks.registerBase(card, pos.x, pos.y);
        tweenCardSettle(this.scene, card, pos.x, pos.y, BAR_CARD_SCALE);
    }
    snapBack(drag) {
        if (drag.mode === 'pile') {
            const baseStart = drag.starts.get(drag.stack.base);
            this.tweenStackBase(drag.stack, baseStart.x, baseStart.y);
            return;
        }
        const start = drag.starts.get(drag.leader);
        tweenCardSettle(this.scene, drag.leader, start.x, start.y, BAR_CARD_SCALE, () => {
            if (drag.mode === 'top') {
                const stack = this.barStacks.findStackOf(drag.stack.base);
                if (stack) {
                    stack.members.push(drag.leader);
                    this.barStacks.layoutStack(stack);
                }
                else {
                    this.barStacks.registerBase(drag.leader, drag.leader.x, drag.leader.y);
                }
            }
        });
    }
    materializePile(stack, dropWx, dropWy) {
        const pile = this.barStacks.pileCards(stack);
        const base = stack.base;
        const baseWorld = this.cardToWorld(base);
        const deltaX = dropWx - baseWorld.x;
        const deltaY = dropWy - baseWorld.y;
        const spawned = [];
        for (const blueprint of pile) {
            const w = this.cardToWorld(blueprint);
            const card = this.spawner.spawn(blueprint.definition.id, w.x + deltaX, w.y + deltaY);
            if (card) {
                spawned.push(card);
            }
            blueprint.destroy();
        }
        this.barStacks.clearStack(stack);
        if (spawned.length === 0)
            return;
        const pf = this.layoutRects?.playfield;
        if (pf) {
            for (const card of spawned) {
                clampCardCenter(pf, card);
                card.setDepth(boardDepthFromY(card.y));
                tweenCardEnter(this.scene, card, 1);
            }
        }
        let anchor = spawned[0];
        for (let i = 1; i < spawned.length; i++) {
            const card = spawned[i];
            if (this.stacks.tryStack(card, anchor)) {
                const s = this.stacks.getStackAt(anchor);
                if (s)
                    anchor = this.stacks.getTopCard(s);
            }
        }
        this.scene.events.emit('card-placed-from-hand', {
            cardId: spawned[0].definition.id,
            card: spawned[0],
        });
        this.scene.events.emit('drag-toast', '蓝图已放置到牌桌', '#6a9a6a');
    }
    cardToWorld(card) {
        const out = new Phaser.Math.Vector2();
        this.scene.cameras.main.getWorldPoint(this.x + card.x, this.y + card.y, out);
        return out;
    }
    isOverPlayfield(wx, wy, pf) {
        return pf.contains(wx, wy);
    }
    tweenStackBase(stack, x, y) {
        this.scene.tweens.killTweensOf(stack.base);
        this.scene.tweens.add({
            targets: stack.base,
            x,
            y,
            duration: 200,
            ease: 'Back.easeOut',
            onUpdate: () => this.barStacks.layoutStack(stack),
            onComplete: () => this.barStacks.layoutStack(stack),
        });
    }
    cancelDrag() {
        this.dropHint?.hide();
        this.setDropHover(false);
        if (this.activeDrag) {
            this.snapBack(this.activeDrag);
            this.activeDrag = null;
        }
        this.pending = null;
    }
    worldPoint(pointer) {
        const out = new Phaser.Math.Vector2();
        this.scene.cameras.main.getWorldPoint(pointer.x, pointer.y, out);
        return out;
    }
}
const CARD_HALF_W = 26;
const CARD_HALF_H = 30;
