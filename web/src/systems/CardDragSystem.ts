import Phaser from 'phaser';

import GameCard, { boardDepthFromY } from '../objects/GameCard';

import { canRotateBoardCard } from '../core/cardRotate';
import { isQuantityStackable } from '../core/cardQuantity';
import { describeStackDrop } from '../core/stackOutcomePreview';
import { clampCardCenter, clampDraggedCards, clampStackToPlayfield } from '../ui/playfieldClamp';
import { getDefenseTurretRange } from '../core/defenseTurretRange';
import { tweenDragPickup } from '../ui/dragFx';
import { parseAutomationConfig, REGISTRY_AUTOMATION_CONFIG } from '../core/automationConfig';
import { buildLogisticsDragOptions } from '../core/logisticsDragContext';
import type { BuildEdgeOptions } from '../core/automationNetworkEdges';
import { computeLogisticsDragSnapshot } from '../core/logisticsLinkDragSnapshot';
import { getLogisticsRangeSpec } from '../core/logisticsRangePreview';
import { REGISTRY_LINK_VISUAL, type LinkVisualConfig } from '../core/linkVisualConfig';
import type { StackDropPreview } from '../core/stackOutcomePreview';
import { LogisticsRangePreview } from '../ui/LogisticsRangePreview';
import { PlantAttackRangePreview } from '../ui/PlantAttackRangePreview';
import type { StackDropHint } from '../ui/StackDropHint';
import type { CardStack, CardStackSystem } from './CardStackSystem';

const DRAG_THRESHOLD = 6;
const DOUBLE_TAP_MS = 400;

type DragMode = 'solo' | 'top' | 'pile';

interface HitResult {
  stack: CardStack;
  leader: GameCard;
}

interface ActiveDrag {
  mode: DragMode;
  stack: CardStack | null;
  leader: GameCard;
  cards: GameCard[];
  originX: number;
  originY: number;
  starts: Map<GameCard, { x: number; y: number }>;
}

interface PendingPress {
  hit: HitResult;
  pileMode: boolean;
  originX: number;
  originY: number;
  button: number;
}

export interface CardDropResult {
  card: GameCard;
  stacked: boolean;
  targetName?: string;
  wholePile: boolean;
  storedInHand?: boolean;
  storedInActionBar?: boolean;
}

export type SellDropFn = (card: GameCard, sx: number, sy: number) => boolean;

export type SellHintFn = (
  card: GameCard,
  wx: number,
  wy: number,
) => import('../core/stackOutcomePreview').StackDropPreview | null;

export type StoreInHandFn = (
  card: GameCard,
  screenX: number,
  screenY: number,
) => boolean;

/**
 * Scene-level pointer drag. Uses activePointer while dragging so move events
 * never "lose" the touch on mobile; always clears state on pointerup/cancel.
 */
export class CardDragSystem {
  private readonly cards = new Set<GameCard>();

  private active: ActiveDrag | null = null;

  private pending: PendingPress | null = null;

  private lastUpMs = 0;

  private lastUpCard: GameCard | null = null;

  private readonly boundSync = () => this.syncDragState();

  private readonly boundContextMenu = (e: Event) => e.preventDefault();

  private storeInHand?: StoreInHandFn;

  private getPlayfield?: () => Phaser.Geom.Rectangle | undefined;

  private dropHint?: StackDropHint;

  private sellDrop?: SellDropFn;

  private sellHint?: SellHintFn;

  private dropToActionBar?: (card: GameCard, sx: number, sy: number) => boolean;

  private hoverScreen?: (sx: number, sy: number) => void;

  private readonly attackRangePreview: PlantAttackRangePreview;

  private readonly logisticsRangePreview: LogisticsRangePreview;

  private lastAutomationGraphRefreshMs = 0;

  private logisticsDragHint: StackDropPreview | null = null;

  constructor(
    private readonly scene: Phaser.Scene,
    private readonly stacks: CardStackSystem,
    private readonly onDrop: (result: CardDropResult) => void,
    private readonly blocksScreenPoint?: (sx: number, sy: number) => boolean,
  ) {
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
    this.attackRangePreview = new PlantAttackRangePreview(scene);
    this.logisticsRangePreview = new LogisticsRangePreview(scene);
  }

  destroy(): void {
    this.attackRangePreview.destroy();
    this.logisticsRangePreview.destroy();
    this.forceRelease();
    this.scene.events.off(Phaser.Scenes.Events.UPDATE, this.boundSync);
    this.scene.game.events.off(Phaser.Core.Events.BLUR, this.forceRelease, this);
    this.scene.game.canvas.removeEventListener('contextmenu', this.boundContextMenu);
  }

  registerCard(card: GameCard): void {
    this.cards.add(card);
  }

  unregisterCard(card: GameCard): void {
    this.cards.delete(card);
  }

  setStoreInHand(handler: StoreInHandFn): void {
    this.storeInHand = handler;
  }

  setDropToActionBar(handler: (card: GameCard, sx: number, sy: number) => boolean): void {
    this.dropToActionBar = handler;
  }

  setHoverScreen(handler: (sx: number, sy: number) => void): void {
    this.hoverScreen = handler;
  }

  setPlayfieldBounds(getter: () => Phaser.Geom.Rectangle | undefined): void {
    this.getPlayfield = getter;
  }

  setDropHint(hint: StackDropHint): void {
    this.dropHint = hint;
  }

  setSellDrop(handler: SellDropFn): void {
    this.sellDrop = handler;
  }

  setSellHint(handler: SellHintFn): void {
    this.sellHint = handler;
  }

  /** 拖拽中的物流设备，供 AutomationSystem stable 建图 */
  getLogisticsDragContext(): BuildEdgeOptions | undefined {
    if (!this.active) return undefined;
    return buildLogisticsDragOptions(this.getDraggedLogisticsCards(this.active));
  }

  private getDraggedLogisticsCards(drag: ActiveDrag): GameCard[] {
    const config = parseAutomationConfig(
      this.scene.registry.get(REGISTRY_AUTOMATION_CONFIG) as Record<string, unknown>,
    );
    return drag.cards.filter((c) => getLogisticsRangeSpec(c, config) != null);
  }

  private maybeRefreshAutomationGraph(drag: ActiveDrag): void {
    if (this.getDraggedLogisticsCards(drag).length === 0) return;
    const now = this.scene.time.now;
    if (now - this.lastAutomationGraphRefreshMs < 80) return;
    this.lastAutomationGraphRefreshMs = now;
    this.scene.events.emit('automation-graph-refresh-request');
  }

  private forceRelease(): void {
    this.pending = null;
    this.attackRangePreview.hide();
    this.logisticsRangePreview.hide();
    this.logisticsDragHint = null;
    this.dropHint?.hide();
    this.hoverScreen?.(-1, -1);
    if (this.active) this.finishDrag();
  }

  /** Recover if pointerup was missed (tab switch, browser gesture, lost touch). */
  private syncDragState(): void {
    if (!this.active) return;
    if (!this.scene.input.activePointer.isDown) {
      this.finishDrag();
    }
  }

  private worldPoint(pointer: Phaser.Input.Pointer): Phaser.Math.Vector2 {
    const out = new Phaser.Math.Vector2();
    this.scene.cameras.main.getWorldPoint(pointer.x, pointer.y, out);
    return out;
  }

  private hitTest(wx: number, wy: number): HitResult | null {
    this.stacks.reconcile(this.cards);

    let best: (HitResult & { depth: number }) | null = null;

    for (const stack of this.stacks.getAllStacks()) {
      if (!this.stacks.getPileBounds(stack).contains(wx, wy)) continue;
      const leader = this.stacks.getTopCard(stack);
      if (!best || leader.depth > best.depth) {
        best = { stack, leader, depth: leader.depth };
      }
    }

    if (!best) {
      for (const card of this.cards) {
        if (!this.cardContains(card, wx, wy)) continue;
        const stack = this.stacks.resolveStackForCard(card);
        const leader = this.stacks.getTopCard(stack);
        if (!best || leader.depth > best.depth) {
          best = { stack, leader, depth: leader.depth };
        }
      }
    }

    if (!best) return null;
    const { depth: _, ...hit } = best;
    return hit;
  }

  private cardContains(card: GameCard, wx: number, wy: number): boolean {
    const hw = card.cardWidth / 2;
    const hh = card.cardHeight / 2;
    return wx >= card.x - hw && wx <= card.x + hw && wy >= card.y - hh && wy <= card.y + hh;
  }

  private onPointerDown(pointer: Phaser.Input.Pointer): void {
    if (!pointer.isDown) return;

    if (pointer.button !== 0 && pointer.button !== 2) return;

    if (this.blocksScreenPoint?.(pointer.x, pointer.y)) {
      this.pending = null;
      return;
    }

    if (this.active) {
      if (this.scene.input.activePointer.isDown) return;
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

    const canWholeStackDrag =
      hit.stack.members.length > 0 ||
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

  private onPointerMove(): void {
    const pointer = this.scene.input.activePointer;

    if (this.active) {
      if (pointer.isDown) this.applyDrag(pointer);
      return;
    }

    if (!this.pending || !pointer.isDown) return;

    const { x, y } = this.worldPoint(pointer);
    const dx = x - this.pending.originX;
    const dy = y - this.pending.originY;
    if (dx * dx + dy * dy < DRAG_THRESHOLD * DRAG_THRESHOLD) return;

    this.startDrag(this.pending, x, y);
    this.pending = null;
    this.applyDrag(pointer);
  }

  private onPointerUp(pointer: Phaser.Input.Pointer): void {
    if (this.pending && !this.active && pointer.button === 0) {
      const { hit } = this.pending;
      const card = hit.leader;
      const now = this.scene.time.now;
      const isRotateTap =
        this.lastUpCard === card &&
        now - this.lastUpMs < DOUBLE_TAP_MS &&
        canRotateBoardCard(hit.stack, card);

      this.lastUpMs = now;
      this.lastUpCard = card;

      if (isRotateTap) {
        card.toggleRotation();
        this.clampBoardCard(card);
        this.scene.events.emit('drag-toast', '已旋转');
      } else {
        this.scene.events.emit('board-card-tap', { card });
      }
    }
    this.pending = null;
    if (this.active) this.finishDrag();
  }

  private startDrag(press: PendingPress, wx: number, wy: number): void {
    const { hit, pileMode } = press;
    const { stack } = hit;
    let leader = hit.leader;

    let mode: DragMode;
    let cards: GameCard[];

    if (pileMode && stack.members.length > 0) {
      mode = 'pile';
      cards = [stack.base, ...stack.members];
    } else if (stack.members.length > 0) {
      mode = 'top';
      this.stacks.detachCardForDrag(leader);
      cards = [leader];
    } else if (leader.quantity > 1 && isQuantityStackable(leader.definition)) {
      mode = 'solo';
      if (!pileMode) {
        leader = this.splitQuantityForDrag(leader);
      }
      cards = [leader];
    } else {
      mode = 'solo';
      cards = [leader];
    }

    const starts = new Map<GameCard, { x: number; y: number }>();
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

    this.scene.events.emit('card-drag-start', { cards });
    this.updateRangePreviews();

    if (pileMode) {
      this.scene.events.emit(
        'drag-toast',
        stack.members.length > 0 ? '右键：整摞拖动' : '右键：整组拖动',
      );
    }
  }

  /** Peel one resource card off a quantity stack for solo drag. */
  private splitQuantityForDrag(source: GameCard): GameCard {
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

  private applyDrag(pointer: Phaser.Input.Pointer): void {
    const drag = this.active;
    if (!drag) return;

    const { x, y } = this.worldPoint(pointer);
    const dx = x - drag.originX;
    const dy = y - drag.originY;

    if (drag.mode === 'pile' && drag.stack) {
      const baseStart = drag.starts.get(drag.stack.base)!;
      drag.stack.base.x = baseStart.x + dx;
      drag.stack.base.y = baseStart.y + dy;
      this.clampActiveDrag(drag);
      this.updateDropHint(drag.leader);
      this.updateRangePreviews();
      this.hoverScreen?.(pointer.x, pointer.y);
      return;
    }

    const card = drag.leader;
    const start = drag.starts.get(card)!;
    card.x = start.x + dx;
    card.y = start.y + dy;

    const stack = this.stacks.getStackAt(card);
    if (stack?.base === card) {
      this.stacks.layoutStack(stack);
    }
    this.clampActiveDrag(drag);
    this.updateDropHint(drag.leader);
    this.updateRangePreviews();
    this.hoverScreen?.(pointer.x, pointer.y);
  }

  private updateRangePreviews(): void {
    const drag = this.active;
    if (!drag) {
      this.attackRangePreview.hide();
      this.logisticsRangePreview.hide();
      this.logisticsDragHint = null;
      return;
    }

    const logisticsAnchor = this.logisticsRangeAnchor(drag);
    if (logisticsAnchor) {
      this.attackRangePreview.hide();
      const dragCards = this.getDraggedLogisticsCards(drag);
      const visual = this.scene.registry.get(REGISTRY_LINK_VISUAL) as LinkVisualConfig;
      const snapshot = computeLogisticsDragSnapshot(
        this.scene,
        logisticsAnchor.card,
        logisticsAnchor.spec.linkRadius,
        dragCards.length > 0 ? dragCards : [logisticsAnchor.card],
        visual,
      );
      this.logisticsDragHint = snapshot.hint;
      this.logisticsRangePreview.show(
        logisticsAnchor.card.x,
        logisticsAnchor.card.y,
        logisticsAnchor.spec,
        snapshot,
      );
      this.maybeRefreshAutomationGraph(drag);
      return;
    }

    this.logisticsRangePreview.hide();
    this.logisticsDragHint = null;
    const attackAnchor = this.attackRangeAnchor(drag);
    if (!attackAnchor) {
      this.attackRangePreview.hide();
      return;
    }
    this.attackRangePreview.show(attackAnchor.card.x, attackAnchor.card.y, attackAnchor.range);
  }

  private logisticsRangeAnchor(
    drag: ActiveDrag,
  ): { card: GameCard; spec: import('../core/logisticsRangePreview').LogisticsRangeSpec } | null {
    const config = parseAutomationConfig(
      this.scene.registry.get(REGISTRY_AUTOMATION_CONFIG) as Record<string, unknown>,
    );

    if (drag.mode === 'pile' && drag.stack) {
      const spec = getLogisticsRangeSpec(drag.stack.base, config);
      if (spec) return { card: drag.stack.base, spec };
    }

    for (const card of drag.cards) {
      const spec = getLogisticsRangeSpec(card, config);
      if (spec) return { card, spec };
    }

    return null;
  }

  private attackRangeAnchor(
    drag: ActiveDrag,
  ): { card: GameCard; range: number } | null {
    if (drag.mode === 'pile' && drag.stack) {
      const range = getDefenseTurretRange(drag.stack.base.definition);
      if (range != null) return { card: drag.stack.base, range };
    }

    for (const card of drag.cards) {
      const range = getDefenseTurretRange(card.definition);
      if (range != null) return { card, range };
    }

    return null;
  }

  private updateDropHint(dragged: GameCard): void {
    if (!this.dropHint) return;

    const sellPreview = this.sellHint?.(dragged, dragged.x, dragged.y);
    if (sellPreview) {
      this.dropHint.show(dragged.x, dragged.y, sellPreview);
      return;
    }

    const target = this.stacks.findCardUnder(dragged.x, dragged.y, dragged);
    if (target) {
      const preview = describeStackDrop(this.stacks, dragged, target);
      if (preview) {
        this.dropHint.show(target.x, target.y, preview);
        return;
      }
    }

    if (this.logisticsDragHint && this.active && this.logisticsRangeAnchor(this.active)) {
      this.dropHint.show(dragged.x, dragged.y, this.logisticsDragHint);
      return;
    }

    this.dropHint.hide();
  }

  private clampActiveDrag(drag: ActiveDrag): void {
    const pf = this.getPlayfield?.();
    if (!pf) return;
    clampDraggedCards(this.stacks, pf, drag.mode, drag.leader, drag.stack);
  }

  private finishDrag(): void {
    const drag = this.active;
    if (!drag) return;

    const draggedCards = [...drag.cards];
    this.active = null;
    this.attackRangePreview.hide();
    this.logisticsRangePreview.hide();
    this.logisticsDragHint = null;
    this.dropHint?.hide();
    this.hoverScreen?.(-1, -1);

    for (const c of draggedCards) {
      this.scene.tweens.killTweensOf(c);
      c.setScale(1);
      c.setDepth(boardDepthFromY(c.y));
    }

    const card = drag.leader;
    const wholePile = drag.mode === 'pile';

    const pointer = this.scene.input.activePointer;

    const emitDragEnd = (result: CardDropResult) => {
      this.onDrop(result);
      this.scene.events.emit('card-drag-end', { cards: draggedCards, result });
    };

    if (this.sellDrop?.(card, pointer.x, pointer.y)) {
      this.stacks.removeCardFromPlay(card);
      card.destroy();
      this.cards.delete(card);
      this.stacks.reconcile(this.cards);
      emitDragEnd({ card, stacked: false, wholePile });
      return;
    }

    if (wholePile) {
      const stack = this.stacks.getStackAt(card);
      if (stack) this.stacks.layoutStack(stack);
      this.clampBoardCard(card);
      this.stacks.reconcile(this.cards);
      emitDragEnd({ card, stacked: false, wholePile: true });
      return;
    }

    if (this.storeInHand?.(card, pointer.x, pointer.y)) {
      this.stacks.reconcile(this.cards);
      emitDragEnd({ card, stacked: false, wholePile: false, storedInHand: true });
      return;
    }

    if (this.dropToActionBar?.(card, pointer.x, pointer.y)) {
      this.stacks.reconcile(this.cards);
      emitDragEnd({ card, stacked: false, wholePile: false, storedInActionBar: true });
      return;
    }

    const target = this.stacks.findCardUnder(card.x, card.y, card);
    if (target && this.stacks.tryStack(card, target)) {
      this.clampBoardCard(card);
      this.stacks.reconcile(this.cards);
      emitDragEnd({
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
    } else {
      this.stacks.resolveStackForCard(card);
    }

    this.clampBoardCard(card);
    this.stacks.reconcile(this.cards);
    emitDragEnd({ card, stacked: false, wholePile: false });
  }

  private clampBoardCard(card: GameCard): void {
    const pf = this.getPlayfield?.();
    if (!pf) return;
    const stack = this.stacks.getStackAt(card);
    if (stack) {
      clampStackToPlayfield(this.stacks, stack, pf);
    } else {
      clampCardCenter(pf, card);
    }
  }
}
