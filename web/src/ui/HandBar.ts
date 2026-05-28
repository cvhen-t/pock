import Phaser from 'phaser';

import { CARD_SHAPES, resolveCardMetrics } from '../config/cardLayout';
import {
  HAND_DRAG_THRESHOLD,
  HAND_SCROLL_THRESHOLD,
  HAND_SLOT_GAP,
  HAND_SLOT_SCALE,
} from '../config/layoutConfig';
import { HandInventory } from '../core/HandInventory';
import { CardSpawner } from '../core/CardSpawner';
import { dataStore } from '../core/DataStore';
import GameCard, { boardDepthFromY } from '../objects/GameCard';
import { TEX } from '../art/textureKeys';
import type { CardDragSystem } from '../systems/CardDragSystem';
import type { CardStackSystem } from '../systems/CardStackSystem';
import { clampCardCenter } from './playfieldClamp';
import type { GameLayoutRects } from './LayoutManager';

const HUD_DEPTH = 2100;

interface SlotView {
  cardId: string;
  container: Phaser.GameObjects.Container;
  badge: Phaser.GameObjects.Text;
}

type HandPointerMode = 'idle' | 'scroll' | 'drag';

export default class HandBar extends Phaser.GameObjects.Container {
  readonly inventory = new HandInventory();

  private bg!: Phaser.GameObjects.Rectangle;

  private viewport!: Phaser.GameObjects.Container;

  private emptyHint!: Phaser.GameObjects.Text;

  private slotViews = new Map<string, SlotView>();

  private scrollOffset = 0;

  private viewW = 0;

  private layoutRects!: GameLayoutRects;

  private pointerMode: HandPointerMode = 'idle';

  private activeSlotId: string | null = null;

  private pointerOriginX = 0;

  private pointerOriginY = 0;

  private scrollOrigin = 0;

  private dragGhost: GameCard | null = null;

  private dragCardId: string | null = null;

  private gameOver = false;

  constructor(
    scene: Phaser.Scene,
    private readonly stacks: CardStackSystem,
    private readonly spawner: CardSpawner,
  ) {
    super(scene, 0, 0);
    scene.add.existing(this);
    this.setScrollFactor(0);
    this.setDepth(HUD_DEPTH);

    this.bg = scene.add.rectangle(0, 0, 100, 72, 0x1e1b16, 0.94);
    this.bg.setStrokeStyle(1, 0x4a4034, 0.8);

    this.viewport = scene.add.container(0, 0);
    this.emptyHint = scene.add.text(0, 0, '待放置卡牌会出现在这里', {
      fontSize: '11px',
      color: '#5a5248',
    });
    this.emptyHint.setOrigin(0.5);

    this.add([this.bg, this.viewport, this.emptyHint]);

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

  setGameOver(over: boolean): void {
    this.gameOver = over;
  }

  applyLayout(rects: GameLayoutRects): void {
    this.layoutRects = rects;
    const { handBar } = rects;
    this.setPosition(handBar.x, handBar.y);

    this.bg.setPosition(handBar.width / 2, handBar.height / 2);
    this.bg.setSize(handBar.width, handBar.height);

    const padX = 10;
    const viewW = handBar.width - padX * 2;
    const viewH = handBar.height - 12;
    const viewX = padX;
    const viewY = 6;

    this.viewport.setPosition(viewX, viewY);
    this.emptyHint.setPosition(viewX + viewW / 2, viewY + viewH / 2);

    this.viewW = viewW;
    this.clampScroll();
    this.rebuildSlots(viewH);
  }

  containsScreenPoint(sx: number, sy: number): boolean {
    return this.layoutRects?.handBar.contains(sx, sy) ?? false;
  }

  isDraggingFromHand(): boolean {
    return this.pointerMode === 'drag';
  }

  canStoreBoardCard(card: GameCard): boolean {
    if (this.gameOver) return false;
    const tags = card.definition.tags ?? [];
    if (tags.includes('base') || tags.includes('enemy')) return false;
    const stack = this.stacks.getStackAt(card);
    if (stack?.base === card && stack.members.length > 0) return false;
    return true;
  }

  /** Move a board card into the hand bar (destroys the GameCard). */
  storeBoardCard(card: GameCard, drag: CardDragSystem): boolean {
    if (!this.canStoreBoardCard(card)) return false;
    if (!this.stacks.removeCardFromPlay(card)) return false;

    const cardId = card.definition.id;
    drag.unregisterCard(card);
    card.destroy();
    this.addCard(cardId, 1);
    this.scene.events.emit('card-stored-to-hand', { cardId });
    return true;
  }

  addCard(cardId: string, amount = 1): void {
    this.inventory.add(cardId, amount);
    this.scene.events.emit('hand-slot-changed', { cardId, count: this.inventory.getCount(cardId) });
    if (this.layoutRects) {
      this.viewW = this.layoutRects.handBar.width - 20;
      this.rebuildSlots(this.layoutRects.handBar.height - 12);
    }
  }

  private slotStep(): number {
    const w = CARD_SHAPES.compact.w * HAND_SLOT_SCALE;
    return w + HAND_SLOT_GAP;
  }

  private rebuildSlots(viewH: number): void {
    for (const view of this.slotViews.values()) {
      view.container.destroy();
    }
    this.slotViews.clear();

    const slots = this.inventory.getSlots();
    this.emptyHint.setVisible(slots.length === 0);

    for (const slot of slots) {
      const def = dataStore.getCard(slot.cardId);
      if (!def) continue;

      const container = this.scene.add.container(0, viewH / 2);
      const metrics = CARD_SHAPES.compact;
      const scale = HAND_SLOT_SCALE;
      const w = metrics.w * scale;
      const h = metrics.h * scale;

      const shell = this.scene.add.image(0, 0, TEX.CARD_SHELL_COMPACT);
      shell.setDisplaySize(w + 2, h + 2);

      const color = Phaser.Display.Color.HexStringToColor(def.color ?? '#4a4540').color;
      const inner = this.scene.add.rectangle(0, 0, w - 6, h - 8, color, 0.88);

      const iconKey = this.resolveIconKey(def.id, def.artKey, def.icon);
      const icon = this.scene.add.image(0, -4, iconKey);
      icon.setDisplaySize(metrics.icon * scale, metrics.icon * scale);

      const name = this.scene.add.text(0, h * 0.32, def.name, {
        fontSize: '7px',
        color: '#e8e0d4',
        align: 'center',
        wordWrap: { width: w - 4 },
      });
      name.setOrigin(0.5, 0);

      const badge = this.scene.add.text(w * 0.38, -h * 0.42, '', {
        fontSize: '10px',
        color: '#f0e8d8',
        backgroundColor: '#3a3028',
        padding: { x: 4, y: 1 },
      });
      badge.setOrigin(0.5);
      badge.setVisible(slot.count > 1);
      badge.setText(slot.count > 99 ? '99+' : String(slot.count));

      container.add([shell, inner, icon, name, badge]);
      container.setSize(w, h);
      container.setInteractive(
        new Phaser.Geom.Rectangle(-w / 2, -h / 2, w, h),
        Phaser.Geom.Rectangle.Contains,
      );
      container.setData('cardId', slot.cardId);

      this.viewport.add(container);
      this.slotViews.set(slot.cardId, { cardId: slot.cardId, container, badge });
    }

    this.clampScroll();
    this.layoutSlotPositions();
  }

  /** 以底栏中线为基准排布：少牌居中，多牌可横滑。 */
  private layoutSlotPositions(): void {
    const step = this.slotStep();
    const slots = this.inventory.getSlots();
    const contentW = slots.length * step;
    const viewW = this.viewW;
    const fits = contentW <= viewW;

    let startX: number;
    if (fits) {
      startX = (viewW - contentW) / 2 + step / 2;
    } else {
      startX = (viewW - contentW) / 2 - this.scrollOffset + step / 2;
    }

    let i = 0;
    for (const slot of slots) {
      const view = this.slotViews.get(slot.cardId);
      if (view) {
        view.container.x = startX + i * step;
      }
      i += 1;
    }
  }

  private contentWidth(): number {
    return this.inventory.getSlots().length * this.slotStep();
  }

  private maxScroll(): number {
    return Math.max(0, this.contentWidth() - this.viewW);
  }

  private resolveIconKey(id: string, artKey?: string, icon?: string): string {
    if (artKey && this.scene.textures.exists(TEX.cardArt(artKey))) {
      return TEX.cardArt(artKey);
    }
    const iconId = icon ?? id;
    const procedural = TEX.icon(iconId);
    if (this.scene.textures.exists(procedural)) {
      return procedural;
    }
    return TEX.icon(id);
  }

  private clampScroll(): void {
    const max = this.maxScroll();
    this.scrollOffset = Phaser.Math.Clamp(this.scrollOffset, -max, max);
    this.layoutSlotPositions();
  }

  private hitSlot(sx: number, sy: number): string | null {
    if (!this.layoutRects?.handBar.contains(sx, sy)) return null;

    const lx = sx - this.x - this.viewport.x;
    const ly = sy - this.y - this.viewport.y;

    for (const slot of this.inventory.getSlots()) {
      const view = this.slotViews.get(slot.cardId);
      if (!view) continue;
      const { container } = view;
      const hw = container.width / 2;
      const hh = container.height / 2;
      if (
        lx >= container.x - hw &&
        lx <= container.x + hw &&
        ly >= container.y - hh &&
        ly <= container.y + hh
      ) {
        return slot.cardId;
      }
    }
    return null;
  }

  private onPointerDown(pointer: Phaser.Input.Pointer): void {
    if (this.gameOver || !this.layoutRects) return;
    const cardId = this.hitSlot(pointer.x, pointer.y);
    if (!cardId) return;
    if (this.inventory.getCount(cardId) <= 0) return;

    this.activeSlotId = cardId;
    this.pointerOriginX = pointer.x;
    this.pointerOriginY = pointer.y;
    this.scrollOrigin = this.scrollOffset;
    this.pointerMode = 'idle';
  }

  private onPointerMove(pointer: Phaser.Input.Pointer): void {
    if (!this.activeSlotId || !pointer.isDown) return;

    const dx = pointer.x - this.pointerOriginX;
    const dy = pointer.y - this.pointerOriginY;
    const handTop = this.layoutRects?.handBar.top ?? 0;

    if (this.pointerMode === 'idle') {
      if (
        Math.abs(dx) > HAND_SCROLL_THRESHOLD &&
        Math.abs(dx) > Math.abs(dy) * 1.1
      ) {
        this.pointerMode = 'scroll';
      } else if (pointer.y < handTop - 8 || dy < -HAND_DRAG_THRESHOLD) {
        this.startDrag(this.activeSlotId);
      }
    }

    if (this.pointerMode === 'scroll') {
      this.scrollOffset = this.scrollOrigin - dx;
      this.clampScroll();
      return;
    }

    if (this.pointerMode === 'drag' && this.dragGhost) {
      const { x, y } = this.worldPoint(pointer);
      this.dragGhost.setPosition(x, y);
      this.dragGhost.setDepth(1600);
    }
  }

  private onPointerUp(): void {
    if (this.pointerMode === 'drag') {
      this.finishDrag();
    }
    this.pointerMode = 'idle';
    this.activeSlotId = null;
  }

  private startDrag(cardId: string): void {
    if (this.gameOver || this.pointerMode === 'drag') return;
    const def = dataStore.getCard(cardId);
    if (!def) return;

    this.pointerMode = 'drag';
    this.dragCardId = cardId;

    const pointer = this.scene.input.activePointer;
    const { x, y } = this.worldPoint(pointer);
    this.dragGhost = new GameCard(this.scene, x, y, def);
    this.dragGhost.setScale(1.06);
    this.dragGhost.setDepth(1600);
    this.scene.children.bringToTop(this.dragGhost);
  }

  private finishDrag(): void {
    const cardId = this.dragCardId;
    const ghost = this.dragGhost;
    this.dragGhost = null;
    this.dragCardId = null;
    this.pointerMode = 'idle';

    if (!cardId || !ghost) return;

    const pf = this.layoutRects?.playfield;
    const dropX = ghost.x;
    const dropY = ghost.y;
    ghost.destroy();

    if (!pf || this.gameOver) return;
    if (this.inventory.getCount(cardId) <= 0) return;

    const def = dataStore.getCard(cardId);
    if (!def) return;
    const metrics = resolveCardMetrics(def);
    const hw = metrics.w / 2;
    const hh = metrics.h / 2;
    if (
      dropX < pf.left + hw ||
      dropX > pf.right - hw ||
      dropY < pf.top + hh ||
      dropY > pf.bottom - hh
    ) {
      return;
    }

    const card = this.spawner.spawn(cardId, dropX, dropY);
    if (!card) return;

    clampCardCenter(pf, card);
    card.setDepth(boardDepthFromY(card.y));

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

    if (this.layoutRects) {
      this.viewW = this.layoutRects.handBar.width - 20;
      this.rebuildSlots(this.layoutRects.handBar.height - 12);
    }
  }

  private cancelDrag(): void {
    this.dragGhost?.destroy();
    this.dragGhost = null;
    this.dragCardId = null;
    this.pointerMode = 'idle';
    this.activeSlotId = null;
  }

  private worldPoint(pointer: Phaser.Input.Pointer): Phaser.Math.Vector2 {
    const out = new Phaser.Math.Vector2();
    this.scene.cameras.main.getWorldPoint(pointer.x, pointer.y, out);
    return out;
  }
}
