import Phaser from 'phaser';

import { dataStore } from '../core/DataStore';
import {
  countStoredQuantity,
  getStorageCapacity,
  getWarehouseInventory,
  type StorageEntry,
} from '../core/storageInventory';
import { createCardThumb } from './compactCardThumb';
import type { CardStackSystem } from '../systems/CardStackSystem';
import GameCard from '../objects/GameCard';

const PANEL_DEPTH = 2400;
const PANEL_W = 500;
const PANEL_H = 400;
const HEADER_TOP = -PANEL_H / 2;
const TITLE_BAR_H = 32;
const SHELF_COLS = 6;
const SHELF_GAP_MIN = 4;
const SHELF_GAP_MAX = 28;
const THUMB_SCALE = 0.88;
const DRAG_THRESHOLD = 8;
const SHELF_TOP = 70;
const SHELF_BOTTOM_PAD = 4;
const SHELF_SCROLL_END_PAD = 4;
const SHELF_VIEW_INSET = 0;
const SHELF_VIEW_H = PANEL_H - SHELF_TOP - SHELF_BOTTOM_PAD;
const SHELF_CONTENT_PAD = 2;
const SHELF_PAD_X = 12;
const SHELF_CLIP_W = PANEL_W - SHELF_PAD_X * 2;

export interface StoragePanelCallbacks {
  isPlayfieldPoint: (sx: number, sy: number) => boolean;
  onWithdrawToPlayfield: (
    warehouse: GameCard,
    cardId: string,
    count: number,
    sx: number,
    sy: number,
    label: string,
  ) => boolean;
}

interface WithdrawDrag {
  entry: StorageEntry;
  ghost: GameCard;
  originX: number;
  originY: number;
  pointerId: number;
}

interface PanelDrag {
  originPanelX: number;
  originPanelY: number;
  originPointerX: number;
  originPointerY: number;
}

export default class StoragePanel extends Phaser.GameObjects.Container {
  private panelBg!: Phaser.GameObjects.Rectangle;

  private titleBar!: Phaser.GameObjects.Rectangle;

  private titleText!: Phaser.GameObjects.Text;

  private capacityText!: Phaser.GameObjects.Text;

  private shelf!: Phaser.GameObjects.Container;

  private shelfBottomCover!: Phaser.GameObjects.Rectangle;

  private shelfEntries: StorageEntry[] = [];

  private shelfMaxThumbH = 112;

  private shelfMaxThumbW = 56;

  private shelfRowStride = 117;

  private shelfColGap = SHELF_GAP_MIN;

  private shelfRowGap = SHELF_GAP_MIN;

  private shelfMask?: Phaser.Display.Masks.GeometryMask;

  private shelfScroll = 0;

  private shelfMaxScroll = 0;

  private shelfViewBounds = new Phaser.Geom.Rectangle();

  private hintText!: Phaser.GameObjects.Text;

  private closeBtn!: Phaser.GameObjects.Text;

  private panelScreenBounds = new Phaser.Geom.Rectangle();

  private withdrawHint?: Phaser.GameObjects.Text;

  private withdrawDrag: WithdrawDrag | null = null;

  private withdrawDragPointerMove?: (e: PointerEvent) => void;

  private withdrawDragPointerUp?: (e: PointerEvent) => void;

  private thumbHits: Array<{
    entry: StorageEntry;
    bounds: Phaser.Geom.Rectangle;
  }> = [];

  private boundPointerDown = (pointer: Phaser.Input.Pointer) => {
    this.onPanelPointerDown(pointer);
  };

  private boundDragUpdate = () => {
    this.onWithdrawDragUpdate();
  };

  private boundDragSync = () => {
    this.syncDragState();
  };

  private boundBlurCancel = () => {
    this.panelDrag = null;
    this.cancelWithdrawDrag();
  };

  private panelDrag: PanelDrag | null = null;

  private open = false;

  private activeWarehouse: GameCard | null = null;

  private screenW = 800;

  private screenH = 600;

  private positioned = false;

  constructor(
    scene: Phaser.Scene,
    private readonly stacks: CardStackSystem,
    private readonly callbacks: StoragePanelCallbacks,
  ) {
    super(scene, 0, 0);
    scene.add.existing(this);
    this.setScrollFactor(0);
    this.setDepth(PANEL_DEPTH);
    this.setVisible(false);

    this.panelBg = scene.add
      .rectangle(0, 0, PANEL_W, PANEL_H, 0x2a2620, 0.96)
      .setOrigin(0.5)
      .setStrokeStyle(2, 0x6a6560, 0.9);

    this.titleBar = scene.add
      .rectangle(0, HEADER_TOP + TITLE_BAR_H / 2, PANEL_W - 4, TITLE_BAR_H, 0x3a3228, 0.95)
      .setOrigin(0.5)
      .setInteractive({ draggable: false, useHandCursor: true });

    this.titleText = scene.add.text(-PANEL_W / 2 + 16, HEADER_TOP + 8, '储物棚', {
      fontSize: '16px',
      color: '#c9c0b0',
    });
    this.titleText.setOrigin(0, 0);

    this.capacityText = scene.add.text(0, HEADER_TOP + 10, '', {
      fontSize: '14px',
      color: '#a0b090',
    });
    this.capacityText.setOrigin(0.5, 0);

    this.closeBtn = scene.add
      .text(PANEL_W / 2 - 24, HEADER_TOP + 12, '×', {
        fontSize: '22px',
        color: '#c9c0b0',
        backgroundColor: '#4a4030',
        padding: { x: 8, y: 2 },
      })
      .setOrigin(0.5)
      .setInteractive({ useHandCursor: true });
    this.closeBtn.on('pointerdown', (p: Phaser.Input.Pointer) => {
      p.event.stopPropagation();
      this.close();
    });

    this.hintText = scene.add.text(0, HEADER_TOP + 42, '拖入牌桌松手取出 · 滚轮浏览库存', {
      fontSize: '10px',
      color: '#8a9a7a',
    });
    this.hintText.setOrigin(0.5, 0);

    const shelfViewTop = this.getShelfViewTop();
    const shelfBottom = shelfViewTop + SHELF_VIEW_H;
    const panelBottom = PANEL_H / 2;
    const bottomCoverH = Math.max(0, panelBottom - shelfBottom);

    this.shelf = scene.add.container(0, shelfViewTop);
    const shelfMaskGfx = scene.make.graphics({ x: 0, y: 0 });
    shelfMaskGfx.fillStyle(0xffffff);
    shelfMaskGfx.fillRect(-SHELF_CLIP_W / 2, 0, SHELF_CLIP_W, SHELF_VIEW_H);
    this.shelfMask = shelfMaskGfx.createGeometryMask();
    this.shelf.setMask(this.shelfMask);

    this.shelfBottomCover = scene.add
      .rectangle(0, shelfBottom + bottomCoverH / 2, PANEL_W - 4, bottomCoverH, 0x2a2620, 1)
      .setInteractive({ useHandCursor: false });
    this.shelfBottomCover.on('pointerdown', (p: Phaser.Input.Pointer) => {
      p.event.stopPropagation();
    });

    this.add([
      this.panelBg,
      this.shelf,
      this.shelfBottomCover,
      this.titleBar,
      this.titleText,
      this.capacityText,
      this.closeBtn,
      this.hintText,
    ]);

    this.titleBar.on('pointerdown', (p: Phaser.Input.Pointer) => {
      if (this.withdrawDrag) return;
      p.event.stopPropagation();
      this.panelDrag = {
        originPanelX: this.x,
        originPanelY: this.y,
        originPointerX: p.x,
        originPointerY: p.y,
      };
    });

    this.withdrawHint = scene.add.text(0, 0, '', {
      fontSize: '12px',
      color: '#a0b090',
      backgroundColor: '#2a2620cc',
      padding: { x: 8, y: 4 },
    });
    this.withdrawHint.setOrigin(0.5);
    this.withdrawHint.setDepth(PANEL_DEPTH + 60);
    this.withdrawHint.setScrollFactor(0);
    this.withdrawHint.setVisible(false);

    const input = scene.input;
    input.on('pointerdown', this.boundPointerDown);
    input.on('pointermove', this.onPointerMove, this);
    input.on('pointerup', this.onPointerUp, this);
    input.on('wheel', this.onWheel, this);
    scene.events.on(Phaser.Scenes.Events.UPDATE, this.boundDragUpdate);
    scene.events.on(Phaser.Scenes.Events.UPDATE, this.boundDragSync);
    scene.game.events.on(Phaser.Core.Events.BLUR, this.boundBlurCancel);
    scene.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      input.off('pointerdown', this.boundPointerDown);
      input.off('pointermove', this.onPointerMove, this);
      input.off('pointerup', this.onPointerUp, this);
      input.off('wheel', this.onWheel, this);
      scene.events.off(Phaser.Scenes.Events.UPDATE, this.boundDragUpdate);
      scene.events.off(Phaser.Scenes.Events.UPDATE, this.boundDragSync);
      scene.game.events.off(Phaser.Core.Events.BLUR, this.boundBlurCancel);
      this.detachWithdrawDragListeners();
    });
  }

  openStorage(warehouseCard: GameCard): void {
    if (!this.positioned) {
      this.setPosition(this.screenW / 2, this.screenH * 0.38);
      this.positioned = true;
    }

    this.activeWarehouse = warehouseCard;
    this.titleText.setText(warehouseCard.definition.name);
    this.refreshShelf();

    if (this.open) {
      this.syncPanelBounds();
      this.rebuildThumbHits();
      return;
    }

    this.open = true;
    this.setVisible(true);
    this.syncPanelBounds();
    this.rebuildThumbHits();
    this.scene.events.emit(
      'drag-toast',
      `${warehouseCard.definition.name}：拖入牌桌松手取出`,
      '#8a9a7a',
    );
  }

  refreshIfOpen(warehouseBase?: GameCard): void {
    if (!this.open || !this.activeWarehouse) return;
    if (warehouseBase && warehouseBase !== this.activeWarehouse) return;
    this.refreshShelf();
  }

  close(): void {
    if (!this.open) return;
    this.cancelWithdrawDrag();
    this.panelDrag = null;
    this.open = false;
    this.activeWarehouse = null;
    this.setVisible(false);
  }

  isOpen(): boolean {
    return this.open;
  }

  containsPanelPoint(sx: number, sy: number): boolean {
    if (!this.open) return false;
    return this.panelScreenBounds.contains(sx, sy);
  }

  applyLayout(_centerX: number, _centerY: number, width: number, height: number): void {
    this.screenW = width;
    this.screenH = height;
    if (this.open) {
      const halfW = PANEL_W / 2;
      const halfH = PANEL_H / 2;
      const pad = 8;
      this.x = Phaser.Math.Clamp(this.x, halfW + pad, width - halfW - pad);
      this.y = Phaser.Math.Clamp(this.y, halfH + pad + 40, height - halfH - pad);
      this.syncPanelBounds();
      this.rebuildThumbHits();
    }
  }

  private refreshShelf(): void {
    const stack = this.activeWarehouse ? this.stacks.getStackAt(this.activeWarehouse) : undefined;
    const cap = this.activeWarehouse ? getStorageCapacity(this.activeWarehouse) : 0;
    const stored = stack ? countStoredQuantity(stack) : 0;
    this.capacityText.setText(`${stored}/${cap}`);

    this.shelfScroll = 0;
    this.shelfEntries = stack ? getWarehouseInventory(stack) : [];
    this.measureShelfThumbSlot(this.shelfEntries);
    this.layoutShelfSpacing();

    const rows = Math.ceil(this.shelfEntries.length / SHELF_COLS);
    const h = this.shelfMaxThumbH;
    const contentH =
      rows > 0 ? SHELF_CONTENT_PAD * 2 + rows * h + (rows - 1) * this.shelfRowGap : 0;
    const overflow = contentH - SHELF_VIEW_H;
    this.shelfMaxScroll = Math.max(0, overflow + (overflow > 0 ? SHELF_SCROLL_END_PAD : 0));
    this.applyShelfScroll();
    this.bringChromeToFront();
    this.rebuildThumbHits();
  }

  private getShelfViewTop(): number {
    return -PANEL_H / 2 + SHELF_TOP;
  }

  private colGapFor(countInRow: number): number {
    const w = this.shelfMaxThumbW;
    if (countInRow <= 1) return 0;
    return Phaser.Math.Clamp(
      (SHELF_CLIP_W - countInRow * w) / (countInRow - 1),
      SHELF_GAP_MIN,
      SHELF_GAP_MAX,
    );
  }

  private shelfColX(col: number): number {
    const w = this.shelfMaxThumbW;
    const gap = this.shelfColGap;
    const rowLeft = -SHELF_CLIP_W / 2;
    return rowLeft + col * (w + gap) + w / 2;
  }

  private layoutShelfSpacing(): void {
    const h = this.shelfMaxThumbH;
    const rows = Math.ceil(this.shelfEntries.length / SHELF_COLS);
    this.shelfColGap = this.colGapFor(SHELF_COLS);

    if (rows <= 1) {
      this.shelfRowGap = 0;
    } else {
      const minContentH = SHELF_CONTENT_PAD * 2 + rows * h + (rows - 1) * SHELF_GAP_MIN;
      if (minContentH <= SHELF_VIEW_H) {
        let gap = (SHELF_VIEW_H - SHELF_CONTENT_PAD * 2 - rows * h) / (rows - 1);
        gap = Phaser.Math.Clamp(gap, SHELF_GAP_MIN, SHELF_GAP_MAX);
        const total = SHELF_CONTENT_PAD * 2 + rows * h + (rows - 1) * gap;
        this.shelfRowGap = total > SHELF_VIEW_H ? SHELF_GAP_MIN : gap;
      } else {
        this.shelfRowGap = SHELF_GAP_MIN;
      }
    }
    this.shelfRowStride = h + this.shelfRowGap;
  }

  private shelfThumbOptions(entry: StorageEntry): Parameters<typeof createCardThumb>[2] {
    const def = dataStore.getCard(entry.cardId);
    return {
      scale: THUMB_SCALE,
      uniformStandard: true,
      compactPrice: true,
      title: def?.name ?? entry.cardId,
      subtitle: entry.qty > 1 ? `×${entry.qty}` : undefined,
      priceBelowCard: true,
    };
  }

  private measureShelfThumbSlot(entries: StorageEntry[]): void {
    const probeId = entries[0]?.cardId;
    if (!probeId) {
      this.shelfMaxThumbH = 112;
      this.shelfMaxThumbW = 56;
      return;
    }
    const thumb = createCardThumb(this.scene, probeId, this.shelfThumbOptions(entries[0]));
    if (!thumb) {
      this.shelfMaxThumbH = 112;
      this.shelfMaxThumbW = 56;
      return;
    }
    this.shelfMaxThumbH = (thumb.getData('thumbH') as number) || 112;
    this.shelfMaxThumbW = (thumb.getData('thumbW') as number) || 56;
    thumb.destroy(true);
  }

  private populateVisibleShelf(): void {
    this.shelf.removeAll(true);

    if (this.shelfEntries.length === 0) {
      const empty = this.scene.add.text(0, 20, '暂无库存', {
        fontSize: '11px',
        color: '#6a6058',
      });
      empty.setOrigin(0.5);
      this.shelf.add(empty);
      return;
    }

    const maxThumbH = this.shelfMaxThumbH;
    const scrollTop = this.shelfScroll;
    const scrollBottom = this.shelfScroll + SHELF_VIEW_H;
    const totalRows = Math.ceil(this.shelfEntries.length / SHELF_COLS);
    const rowStride = this.shelfRowStride;
    const firstRow = Math.max(0, Math.floor((scrollTop - SHELF_CONTENT_PAD) / rowStride) - 1);
    const lastRow = Math.min(
      totalRows - 1,
      Math.ceil((scrollBottom - SHELF_CONTENT_PAD) / rowStride) + 1,
    );

    for (let row = firstRow; row <= lastRow; row++) {
      const rowTop = SHELF_CONTENT_PAD + row * rowStride;
      const rowBottom = rowTop + maxThumbH;
      if (rowBottom < scrollTop || rowTop > scrollBottom) continue;

      const rowStart = row * SHELF_COLS;
      const countInRow = Math.min(SHELF_COLS, this.shelfEntries.length - rowStart);

      for (let col = 0; col < countInRow; col++) {
        const index = rowStart + col;
        const entry = this.shelfEntries[index];
        const x = this.shelfColX(col);

        const thumb = createCardThumb(this.scene, entry.cardId, this.shelfThumbOptions(entry));
        if (!thumb) continue;

        const thumbH = maxThumbH;
        const thumbTop = rowTop - scrollTop;
        const thumbBottom = thumbTop + thumbH;
        if (thumbTop < SHELF_VIEW_INSET || thumbBottom > SHELF_VIEW_H - SHELF_VIEW_INSET) {
          continue;
        }

        thumb.setPosition(x, rowTop + thumbH / 2 - scrollTop);
        thumb.setData('storageEntry', entry);
        this.shelf.add(thumb);
      }
    }
  }

  private applyShelfScroll(): void {
    this.populateVisibleShelf();
    this.rebuildThumbHits();
  }

  private rebuildThumbHits(): void {
    this.thumbHits = [];
    if (!this.open) return;

    const viewTop = this.getShelfViewTop();
    const viewBottom = viewTop + SHELF_VIEW_H;
    const children = this.shelf.getAll() as Phaser.GameObjects.Container[];
    for (const child of children) {
      const entry = child.getData('storageEntry') as StorageEntry | undefined;
      if (!entry) continue;

      const hitW = (child.getData('thumbW') as number) || 56;
      const hitH = (child.getData('thumbH') as number) || 112;
      const panelCy = this.getShelfViewTop() + child.y;
      if (
        panelCy + hitH / 2 < viewTop + SHELF_VIEW_INSET ||
        panelCy - hitH / 2 > viewBottom - SHELF_VIEW_INSET
      ) {
        continue;
      }

      const cx = this.x + child.x;
      const cy = this.y + panelCy;
      this.thumbHits.push({
        entry,
        bounds: new Phaser.Geom.Rectangle(cx - hitW / 2, cy - hitH / 2, hitW, hitH),
      });
    }
  }

  private onPanelPointerDown(pointer: Phaser.Input.Pointer): void {
    if (!this.open || pointer.button !== 0 || this.withdrawDrag || this.panelDrag) return;
    if (!this.shelfViewBounds.contains(pointer.x, pointer.y)) return;

    this.rebuildThumbHits();
    for (const hit of this.thumbHits) {
      if (!hit.bounds.contains(pointer.x, pointer.y)) continue;
      this.startWithdrawDrag(hit.entry, pointer);
      return;
    }
  }

  private startWithdrawDrag(entry: StorageEntry, pointer: Phaser.Input.Pointer): void {
    if (this.withdrawDrag || this.panelDrag) return;

    const def = dataStore.getCard(entry.cardId);
    if (!def) return;

    const sx = pointer.x;
    const sy = pointer.y;
    const ghost = new GameCard(this.scene, sx, sy, def);
    ghost.setScale(1.06);
    ghost.setDepth(PANEL_DEPTH + 50);
    ghost.setScrollFactor(0);

    this.withdrawDrag = {
      entry,
      ghost,
      originX: sx,
      originY: sy,
      pointerId: this.nativePointerId(pointer),
    };
    this.capturePointer(pointer);
    this.attachWithdrawDragListeners();
    this.updateWithdrawHint(sx, sy);
  }

  private finishWithdrawDrag(x: number, y: number): void {
    const drag = this.withdrawDrag;
    if (!drag) return;

    this.releasePointerCapture(drag.pointerId);
    this.withdrawDrag = null;
    this.detachWithdrawDragListeners();
    this.withdrawHint?.setVisible(false);
    drag.ghost.destroy();

    const moved = Phaser.Math.Distance.Between(drag.originX, drag.originY, x, y);
    if (moved < DRAG_THRESHOLD) return;
    if (!this.isValidWithdrawDrop(x, y)) return;

    this.completeWithdraw(drag.entry, x, y);
  }

  private completeWithdraw(entry: StorageEntry, sx: number, sy: number): void {
    const warehouse = this.activeWarehouse;
    if (!warehouse) return;

    const def = dataStore.getCard(entry.cardId);
    const label = def?.name ?? entry.cardId;
    const ok = this.callbacks.onWithdrawToPlayfield(warehouse, entry.cardId, 1, sx, sy, label);
    if (!ok) {
      this.scene.events.emit('drag-toast', '无法取出');
    }
    this.refreshShelf();
  }

  private isValidWithdrawDrop(sx: number, sy: number): boolean {
    if (this.panelScreenBounds.contains(sx, sy)) return false;
    return this.callbacks.isPlayfieldPoint(sx, sy);
  }

  private updateWithdrawHint(x: number, y: number): void {
    const drag = this.withdrawDrag;
    if (!drag || !this.withdrawHint) return;
    const outside = this.isValidWithdrawDrop(x, y);
    this.withdrawHint.setVisible(true);
    this.withdrawHint.setPosition(x, y - 48);
    this.withdrawHint.setText(outside ? '松手取出' : '拖入牌桌取出');
  }

  private onWithdrawDragUpdate(): void {
    const drag = this.withdrawDrag;
    if (!drag) return;

    const p = this.scene.input.activePointer;
    if (!p.isDown) {
      this.finishWithdrawDrag(p.x, p.y);
      return;
    }

    drag.ghost.setPosition(p.x, p.y);
    this.updateWithdrawHint(p.x, p.y);
  }

  private syncDragState(): void {
    if (this.scene.input.activePointer.isDown) return;
    if (this.panelDrag) this.panelDrag = null;
    if (this.withdrawDrag) {
      const p = this.scene.input.activePointer;
      this.finishWithdrawDrag(p.x, p.y);
    }
  }

  private onPointerMove(): void {
    const p = this.scene.input.activePointer;
    if (!p.isDown) return;

    if (this.panelDrag) {
      const dx = p.x - this.panelDrag.originPointerX;
      const dy = p.y - this.panelDrag.originPointerY;
      let nx = this.panelDrag.originPanelX + dx;
      let ny = this.panelDrag.originPanelY + dy;
      const halfW = PANEL_W / 2;
      const halfH = PANEL_H / 2;
      const pad = 8;
      nx = Phaser.Math.Clamp(nx, halfW + pad, this.screenW - halfW - pad);
      ny = Phaser.Math.Clamp(ny, halfH + pad + 40, this.screenH - halfH - pad);
      this.setPosition(nx, ny);
      this.syncPanelBounds();
      this.rebuildThumbHits();
    }
  }

  private onPointerUp(): void {
    if (this.panelDrag) {
      this.panelDrag = null;
      return;
    }
    if (this.withdrawDrag) {
      const p = this.scene.input.activePointer;
      this.finishWithdrawDrag(p.x, p.y);
    }
  }

  private onWheel(
    _pointer: Phaser.Input.Pointer,
    _gameObjects: Phaser.GameObjects.GameObject[],
    _deltaX: number,
    deltaY: number,
  ): void {
    if (!this.open || this.shelfMaxScroll <= 0) return;
    const p = this.scene.input.activePointer;
    if (!this.shelfViewBounds.contains(p.x, p.y)) return;
    this.shelfScroll = Phaser.Math.Clamp(this.shelfScroll + deltaY * 0.35, 0, this.shelfMaxScroll);
    this.applyShelfScroll();
  }

  private bringChromeToFront(): void {
    this.bringToTop(this.shelfBottomCover);
    this.bringToTop(this.hintText);
    this.bringToTop(this.titleBar);
    this.bringToTop(this.titleText);
    this.bringToTop(this.capacityText);
    this.bringToTop(this.closeBtn);
  }

  private syncPanelBounds(): void {
    const panelLeft = this.x - PANEL_W / 2;
    const panelTop = this.y - PANEL_H / 2;
    this.panelScreenBounds.setTo(panelLeft, panelTop, PANEL_W, PANEL_H);

    const shelfTop = this.y + this.getShelfViewTop();
    this.shelfViewBounds.setTo(
      this.x - PANEL_W / 2 + SHELF_PAD_X,
      shelfTop,
      SHELF_CLIP_W,
      SHELF_VIEW_H,
    );
  }

  private cancelWithdrawDrag(): void {
    if (this.withdrawDrag) {
      this.releasePointerCapture(this.withdrawDrag.pointerId);
    }
    this.detachWithdrawDragListeners();
    if (this.withdrawDrag) {
      this.withdrawDrag.ghost.destroy();
      this.withdrawDrag = null;
    }
    this.withdrawHint?.setVisible(false);
  }

  private nativePointerId(pointer: Phaser.Input.Pointer): number {
    const ev = pointer.event as PointerEvent | undefined;
    if (ev && typeof ev.pointerId === 'number') return ev.pointerId;
    return pointer.id;
  }

  private capturePointer(pointer: Phaser.Input.Pointer): void {
    const ev = pointer.event as PointerEvent | undefined;
    const canvas = this.scene.game.canvas;
    try {
      canvas.setPointerCapture(ev?.pointerId ?? 1);
    } catch {
      // optional
    }
  }

  private releasePointerCapture(pointerId: number): void {
    const canvas = this.scene.game.canvas;
    try {
      canvas.releasePointerCapture(pointerId);
    } catch {
      // optional
    }
  }

  private clientToCanvas(clientX: number, clientY: number): { x: number; y: number } {
    const canvas = this.scene.game.canvas;
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    return {
      x: (clientX - rect.left) * scaleX,
      y: (clientY - rect.top) * scaleY,
    };
  }

  private detachWithdrawDragListeners(): void {
    if (this.withdrawDragPointerMove) {
      window.removeEventListener('pointermove', this.withdrawDragPointerMove, { capture: true });
      this.withdrawDragPointerMove = undefined;
    }
    if (this.withdrawDragPointerUp) {
      window.removeEventListener('pointerup', this.withdrawDragPointerUp, { capture: true });
      window.removeEventListener('pointercancel', this.withdrawDragPointerUp, { capture: true });
      this.withdrawDragPointerUp = undefined;
    }
  }

  private attachWithdrawDragListeners(): void {
    this.detachWithdrawDragListeners();
    this.withdrawDragPointerMove = (e: PointerEvent) => {
      const drag = this.withdrawDrag;
      if (!drag) return;
      const { x, y } = this.clientToCanvas(e.clientX, e.clientY);
      drag.ghost.setPosition(x, y);
      this.updateWithdrawHint(x, y);
    };
    this.withdrawDragPointerUp = (e: PointerEvent) => {
      const drag = this.withdrawDrag;
      if (!drag) return;
      const { x, y } = this.clientToCanvas(e.clientX, e.clientY);
      this.finishWithdrawDrag(x, y);
    };
    window.addEventListener('pointermove', this.withdrawDragPointerMove, { capture: true });
    window.addEventListener('pointerup', this.withdrawDragPointerUp, { capture: true });
    window.addEventListener('pointercancel', this.withdrawDragPointerUp, { capture: true });
  }
}
