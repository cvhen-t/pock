import Phaser from 'phaser';

import { REGISTRY } from '../config/gameConfig';
import type { ShopCatalog, ShopCategory, ShopListing } from '../core/ShopCatalog';
import { dataStore } from '../core/DataStore';
import { createCardThumb } from './compactCardThumb';
import GameCard from '../objects/GameCard';

const PANEL_DEPTH = 2400;
const PANEL_W = 500;
const PANEL_H = 400;
const HEADER_TOP = -PANEL_H / 2;
const TITLE_BAR_H = 32;
const BUY_COLS = 6;
const SHELF_GAP_MIN = 4;
const SHELF_GAP_MAX = 28;
const SHOP_THUMB_SCALE = 0.88;
const DRAG_THRESHOLD = 8;
const SHELF_TOP = 76;
const SHELF_BOTTOM_PAD = 10;
const SHELF_VIEW_INSET = 0;
const SHELF_VIEW_H = PANEL_H - SHELF_TOP - SHELF_BOTTOM_PAD;
const SHELF_CONTENT_PAD = 2;
const SHELF_PAD_X = 12;
const SHELF_CLIP_W = PANEL_W - SHELF_PAD_X * 2;

export interface TradePanelCallbacks {
  getCaps: () => number;
  trySpendCaps: (amount: number) => boolean;
  refundCaps: (amount: number) => boolean;
  isPlayfieldPoint: (sx: number, sy: number) => boolean;
  onBuyCardToPlayfield: (
    cardId: string,
    count: number,
    sx: number,
    sy: number,
    label: string,
  ) => boolean;
  onSellCard: (cardId: string) => number;
}

interface BuyDrag {
  listing: ShopListing;
  displayCardId: string;
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

export default class TradePanel extends Phaser.GameObjects.Container {
  private panelBg!: Phaser.GameObjects.Rectangle;

  private titleBar!: Phaser.GameObjects.Rectangle;

  private buyShelf!: Phaser.GameObjects.Container;

  private shelfBottomCover!: Phaser.GameObjects.Rectangle;

  private shelfListings: ShopListing[] = [];

  private shelfMaxThumbH = 112;

  private shelfMaxThumbW = 56;

  private shelfRowStride = 117;

  private shelfColGap = SHELF_GAP_MIN;

  private shelfRowGap = SHELF_GAP_MIN;

  private shelfMask?: Phaser.Display.Masks.GeometryMask;

  private shelfScroll = 0;

  private shelfMaxScroll = 0;

  private shelfViewBounds = new Phaser.Geom.Rectangle();

  private tabRow!: Phaser.GameObjects.Container;

  private tabBarShield!: Phaser.GameObjects.Rectangle;

  private capsText!: Phaser.GameObjects.Text;

  private closeBtn!: Phaser.GameObjects.Text;

  private buyHint!: Phaser.GameObjects.Text;

  private panelScreenBounds = new Phaser.Geom.Rectangle();

  private buyPriceHint?: Phaser.GameObjects.Text;

  private buyDrag: BuyDrag | null = null;

  private buyDragPointerMove?: (e: PointerEvent) => void;

  private buyDragPointerUp?: (e: PointerEvent) => void;

  private thumbHits: Array<{
    listing: ShopListing;
    cardId: string;
    bounds: Phaser.Geom.Rectangle;
  }> = [];

  private boundTradePointerDown = (pointer: Phaser.Input.Pointer) => {
    this.onTradePointerDown(pointer);
  };

  private boundBuyDragUpdate = () => {
    this.onBuyDragUpdate();
  };

  private boundDragSync = () => {
    this.syncDragState();
  };

  private boundBlurCancel = () => {
    this.panelDrag = null;
    this.cancelBuyDrag();
  };

  private panelDrag: PanelDrag | null = null;

  private open = false;

  private activeCategory = '';

  private activeShopCard: GameCard | null = null;

  private tabButtons = new Map<string, Phaser.GameObjects.Text>();

  private screenW = 800;

  private screenH = 600;

  private positioned = false;

  constructor(
    scene: Phaser.Scene,
    private readonly shop: ShopCatalog,
    private readonly callbacks: TradePanelCallbacks,
  ) {
    super(scene, 0, 0);
    scene.add.existing(this);
    this.setScrollFactor(0);
    this.setDepth(PANEL_DEPTH);
    this.setVisible(false);

    this.panelBg = scene.add
      .rectangle(0, 0, PANEL_W, PANEL_H, 0x2a2620, 0.96)
      .setOrigin(0.5)
      .setStrokeStyle(2, 0x8b6914, 0.9);

    this.titleBar = scene.add
      .rectangle(0, HEADER_TOP + TITLE_BAR_H / 2, PANEL_W - 4, TITLE_BAR_H, 0x3a3228, 0.95)
      .setOrigin(0.5)
      .setInteractive({ draggable: false, useHandCursor: true });

    const title = scene.add.text(-PANEL_W / 2 + 16, HEADER_TOP + 8, '流浪商人', {
      fontSize: '16px',
      color: '#c9b896',
    });
    title.setOrigin(0, 0);

    this.capsText = scene.add.text(0, HEADER_TOP + 10, '', {
      fontSize: '14px',
      color: '#f0d878',
    });
    this.capsText.setOrigin(0.5, 0);

    this.closeBtn = scene.add
      .text(PANEL_W / 2 - 24, HEADER_TOP + 12, '×', {
        fontSize: '22px',
        color: '#c9b896',
        backgroundColor: '#4a4030',
        padding: { x: 8, y: 2 },
      })
      .setOrigin(0.5)
      .setInteractive({ useHandCursor: true });
    this.closeBtn.on('pointerdown', (p: Phaser.Input.Pointer) => {
      p.event.stopPropagation();
      this.close();
    });

    this.tabRow = scene.add.container(0, HEADER_TOP + 42);
    this.buildCategoryTabs();

    this.tabBarShield = scene.add
      .rectangle(0, HEADER_TOP + 62, PANEL_W - 20, 44, 0x000000, 0)
      .setInteractive({ useHandCursor: false });
    this.tabBarShield.on('pointerdown', (p: Phaser.Input.Pointer) => {
      p.event.stopPropagation();
    });

    this.buyHint = scene.add.text(0, HEADER_TOP + 66, '拖入牌桌松手购买 · 滚轮浏览商品', {
      fontSize: '10px',
      color: '#8a9a7a',
    });
    this.buyHint.setOrigin(0.5, 0);

    const shelfViewTop = this.getShelfViewTop();
    const shelfBottom = shelfViewTop + SHELF_VIEW_H;
    const bottomCoverH = PANEL_H / 2 - shelfBottom;

    this.buyShelf = scene.add.container(0, shelfViewTop);
    const shelfMaskGfx = scene.make.graphics({ x: 0, y: 0 });
    shelfMaskGfx.fillStyle(0xffffff);
    shelfMaskGfx.fillRect(
      -SHELF_CLIP_W / 2,
      0,
      SHELF_CLIP_W,
      SHELF_VIEW_H,
    );
    this.shelfMask = shelfMaskGfx.createGeometryMask();
    this.buyShelf.setMask(this.shelfMask);

    this.shelfBottomCover = scene.add
      .rectangle(0, shelfBottom + bottomCoverH / 2, PANEL_W - 4, bottomCoverH + 4, 0x2a2620, 1)
      .setInteractive({ useHandCursor: false });
    this.shelfBottomCover.on('pointerdown', (p: Phaser.Input.Pointer) => {
      p.event.stopPropagation();
    });

    this.add([
      this.panelBg,
      this.buyShelf,
      this.shelfBottomCover,
      this.tabBarShield,
      this.titleBar,
      title,
      this.capsText,
      this.closeBtn,
      this.buyHint,
      this.tabRow,
    ]);

    this.titleBar.on('pointerdown', (p: Phaser.Input.Pointer) => {
      if (this.buyDrag) return;
      p.event.stopPropagation();
      this.panelDrag = {
        originPanelX: this.x,
        originPanelY: this.y,
        originPointerX: p.x,
        originPointerY: p.y,
      };
    });

    this.buyPriceHint = scene.add.text(0, 0, '', {
      fontSize: '12px',
      color: '#f0d878',
      backgroundColor: '#2a2620cc',
      padding: { x: 8, y: 4 },
    });
    this.buyPriceHint.setOrigin(0.5);
    this.buyPriceHint.setDepth(PANEL_DEPTH + 60);
    this.buyPriceHint.setScrollFactor(0);
    this.buyPriceHint.setVisible(false);

    const input = scene.input;
    input.on('pointerdown', this.boundTradePointerDown);
    input.on('pointermove', this.onPointerMove, this);
    input.on('pointerup', this.onPointerUp, this);
    input.on('wheel', this.onWheel, this);
    scene.events.on(Phaser.Scenes.Events.UPDATE, this.boundBuyDragUpdate);
    scene.events.on(Phaser.Scenes.Events.UPDATE, this.boundDragSync);
    scene.game.events.on(Phaser.Core.Events.BLUR, this.boundBlurCancel);
    scene.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      input.off('pointerdown', this.boundTradePointerDown);
      input.off('pointermove', this.onPointerMove, this);
      input.off('pointerup', this.onPointerUp, this);
      input.off('wheel', this.onWheel, this);
      scene.events.off(Phaser.Scenes.Events.UPDATE, this.boundBuyDragUpdate);
      scene.events.off(Phaser.Scenes.Events.UPDATE, this.boundDragSync);
      scene.game.events.off(Phaser.Core.Events.BLUR, this.boundBlurCancel);
      this.detachBuyDragListeners();
    });

    const cats = this.shop.getCategories();
    this.activeCategory = cats[0]?.id ?? '';
    this.buildBuyShelf();
  }

  private buildCategoryTabs(): void {
    this.tabRow.removeAll(true);
    this.tabButtons.clear();

    const cats = this.getActiveCategories();
    const tabs: Phaser.GameObjects.Text[] = [];
    for (const cat of cats) {
      const active = cat.id === this.activeCategory;
      const tab = this.scene.add
        .text(0, 0, cat.name, {
          fontSize: '12px',
          color: active ? '#f0e8d8' : '#8a8070',
          backgroundColor: active ? '#5c4a32' : '#2a2620',
          padding: { x: 10, y: 4 },
        })
        .setOrigin(0, 0)
        .setInteractive({ useHandCursor: true });
      tab.on('pointerdown', (p: Phaser.Input.Pointer) => {
        p.event.stopPropagation();
        if (this.activeCategory === cat.id) return;
        this.activeCategory = cat.id;
        this.buildCategoryTabs();
        this.buildBuyShelf();
      });
      this.tabRow.add(tab);
      this.tabButtons.set(cat.id, tab);
      tabs.push(tab);
    }

    const tabGap = 6;
    const totalW = tabs.reduce((sum, tab, i) => sum + tab.width + (i > 0 ? tabGap : 0), 0);
    let x = -totalW / 2;
    for (const tab of tabs) {
      tab.setX(x);
      x += tab.width + tabGap;
    }
    this.bringChromeToFront();
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

  /** 每行从左到右排列，与货架左缘对齐 */
  private shelfColX(col: number): number {
    const w = this.shelfMaxThumbW;
    const gap = this.shelfColGap;
    const rowLeft = -SHELF_CLIP_W / 2;
    return rowLeft + col * (w + gap) + w / 2;
  }

  /** 卡牌尺寸固定；列/行间距按货架宽高在 [min,max] 内自适应 */
  private layoutShelfSpacing(): void {
    const h = this.shelfMaxThumbH;
    const rows = Math.ceil(this.shelfListings.length / BUY_COLS);
    this.shelfColGap = this.colGapFor(BUY_COLS);

    if (rows <= 1) {
      this.shelfRowGap = 0;
    } else {
      const minContentH =
        SHELF_CONTENT_PAD * 2 + rows * h + (rows - 1) * SHELF_GAP_MIN;
      if (minContentH <= SHELF_VIEW_H) {
        this.shelfRowGap = Phaser.Math.Clamp(
          (SHELF_VIEW_H - SHELF_CONTENT_PAD * 2 - rows * h) / (rows - 1),
          SHELF_GAP_MIN,
          SHELF_GAP_MAX,
        );
      } else {
        this.shelfRowGap = SHELF_GAP_MIN;
      }
    }
    this.shelfRowStride = h + this.shelfRowGap;
  }

  private shelfThumbOptions(
    cardId: string,
    listing: Pick<ShopListing, 'count' | 'costCaps'>,
  ): Parameters<typeof createCardThumb>[2] {
    const def = dataStore.getCard(cardId);
    const count = listing.count ?? 1;
    return {
      scale: SHOP_THUMB_SCALE,
      uniformStandard: true,
      compactPrice: true,
      title: def?.name ?? cardId,
      subtitle: count > 1 ? `×${count}` : undefined,
      priceCaps: listing.costCaps,
      priceBelowCard: true,
    };
  }

  private measureShelfThumbSlot(listings: ShopListing[]): void {
    const probeId = listings[0]?.cardId;
    if (!probeId) {
      this.shelfMaxThumbH = 112;
      this.shelfMaxThumbW = 56;
      return;
    }
    const thumb = createCardThumb(
      this.scene,
      probeId,
      this.shelfThumbOptions(probeId, listings[0]),
    );
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
    this.buyShelf.removeAll(true);

    const listings = this.shelfListings;
    if (listings.length === 0) {
      const empty = this.scene.add.text(0, 20, '暂无商品', {
        fontSize: '11px',
        color: '#6a6058',
      });
      empty.setOrigin(0.5);
      this.buyShelf.add(empty);
      return;
    }

    const maxThumbH = this.shelfMaxThumbH;
    const scrollTop = this.shelfScroll;
    const scrollBottom = this.shelfScroll + SHELF_VIEW_H;
    const totalRows = Math.ceil(listings.length / BUY_COLS);
    const rowStride = this.shelfRowStride;
    const firstRow = Math.max(
      0,
      Math.floor((scrollTop - SHELF_CONTENT_PAD) / rowStride) - 1,
    );
    const lastRow = Math.min(
      totalRows - 1,
      Math.ceil((scrollBottom - SHELF_CONTENT_PAD) / rowStride) + 1,
    );

    for (let row = firstRow; row <= lastRow; row++) {
      const rowTop = SHELF_CONTENT_PAD + row * rowStride;
      const rowBottom = rowTop + maxThumbH;
      if (rowBottom < scrollTop || rowTop > scrollBottom) continue;

      const rowStart = row * BUY_COLS;
      const countInRow = Math.min(BUY_COLS, listings.length - rowStart);

      for (let col = 0; col < countInRow; col++) {
        const index = rowStart + col;
        const listing = listings[index];
        const displayId = listing.cardId;
        const x = this.shelfColX(col);

        const thumb = createCardThumb(
          this.scene,
          displayId,
          this.shelfThumbOptions(displayId, listing),
        );
        if (!thumb) continue;

        const thumbH = maxThumbH;
        const thumbTop = rowTop - scrollTop;
        const thumbBottom = thumbTop + thumbH;
        if (
          thumbTop < SHELF_VIEW_INSET ||
          thumbBottom > SHELF_VIEW_H - SHELF_VIEW_INSET
        ) {
          continue;
        }

        thumb.setPosition(x, rowTop + thumbH / 2 - scrollTop);
        thumb.setData('listing', listing);
        this.buyShelf.add(thumb);
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
    const children = this.buyShelf.getAll() as Phaser.GameObjects.Container[];
    for (const child of children) {
      const listing = child.getData('listing') as ShopListing | undefined;
      if (!listing) continue;

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
        listing,
        cardId: listing.cardId,
        bounds: new Phaser.Geom.Rectangle(cx - hitW / 2, cy - hitH / 2, hitW, hitH),
      });
    }
  }

  private onTradePointerDown(pointer: Phaser.Input.Pointer): void {
    if (!this.open || pointer.button !== 0 || this.buyDrag || this.panelDrag) return;
    if (!this.shelfViewBounds.contains(pointer.x, pointer.y)) return;

    this.rebuildThumbHits();
    for (const hit of this.thumbHits) {
      if (!hit.bounds.contains(pointer.x, pointer.y)) continue;
      this.startBuyDrag(hit.listing, hit.cardId, pointer);
      return;
    }
  }

  private onBuyDragUpdate(): void {
    const drag = this.buyDrag;
    if (!drag) return;

    const p = this.scene.input.activePointer;
    if (!p.isDown) {
      this.finishBuyDrag(p.x, p.y);
      return;
    }

    drag.ghost.setPosition(p.x, p.y);
    this.updateBuyPriceHint(p.x, p.y);
  }

  /** Recover if pointerup was missed (tab switch, lost capture). */
  private syncDragState(): void {
    if (this.scene.input.activePointer.isDown) return;
    if (this.panelDrag) this.panelDrag = null;
    if (this.buyDrag) {
      const p = this.scene.input.activePointer;
      this.finishBuyDrag(p.x, p.y);
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

  /** Tab / 标题等 UI 始终在商品卡牌之上，避免误触购买 */
  private bringChromeToFront(): void {
    this.bringToTop(this.shelfBottomCover);
    this.bringToTop(this.tabBarShield);
    this.bringToTop(this.buyHint);
    this.bringToTop(this.tabRow);
    this.bringToTop(this.titleBar);
    this.bringToTop(this.capsText);
    this.bringToTop(this.closeBtn);
  }

  private buildBuyShelf(): void {
    this.shelfScroll = 0;
    this.shelfListings = this.getActiveBuyListings(this.activeCategory);
    this.measureShelfThumbSlot(this.shelfListings);
    this.layoutShelfSpacing();

    const rows = Math.ceil(this.shelfListings.length / BUY_COLS);
    const contentH =
      rows > 0
        ? SHELF_CONTENT_PAD + (rows - 1) * this.shelfRowStride + this.shelfMaxThumbH
        : 0;
    this.shelfMaxScroll = Math.max(0, contentH - SHELF_VIEW_H);
    this.applyShelfScroll();
    this.bringChromeToFront();
    this.rebuildThumbHits();
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

  private detachBuyDragListeners(): void {
    if (this.buyDragPointerMove) {
      window.removeEventListener('pointermove', this.buyDragPointerMove, { capture: true });
      this.buyDragPointerMove = undefined;
    }
    if (this.buyDragPointerUp) {
      window.removeEventListener('pointerup', this.buyDragPointerUp, { capture: true });
      window.removeEventListener('pointercancel', this.buyDragPointerUp, { capture: true });
      this.buyDragPointerUp = undefined;
    }
  }

  private attachBuyDragListeners(): void {
    this.detachBuyDragListeners();
    this.buyDragPointerMove = (e: PointerEvent) => {
      const drag = this.buyDrag;
      if (!drag) return;
      const { x, y } = this.clientToCanvas(e.clientX, e.clientY);
      drag.ghost.setPosition(x, y);
      this.updateBuyPriceHint(x, y);
    };
    this.buyDragPointerUp = (e: PointerEvent) => {
      const drag = this.buyDrag;
      if (!drag) return;
      const { x, y } = this.clientToCanvas(e.clientX, e.clientY);
      this.finishBuyDrag(x, y);
    };
    window.addEventListener('pointermove', this.buyDragPointerMove, { capture: true });
    window.addEventListener('pointerup', this.buyDragPointerUp, { capture: true });
    window.addEventListener('pointercancel', this.buyDragPointerUp, { capture: true });
  }

  private updateBuyPriceHint(x: number, y: number): void {
    const drag = this.buyDrag;
    if (!drag || !this.buyPriceHint) return;
    const outside = this.isValidBuyDrop(x, y);
    this.buyPriceHint.setVisible(true);
    this.buyPriceHint.setPosition(x, y - 48);
    this.buyPriceHint.setText(
      outside
        ? `买入 -${drag.listing.costCaps} 筹 · 松手放入牌桌`
        : `拖入牌桌购买 · ${drag.listing.costCaps} 筹`,
    );
  }

  private startBuyDrag(listing: ShopListing, displayCardId: string, pointer: Phaser.Input.Pointer): void {
    if (this.buyDrag || this.panelDrag) return;

    const def = dataStore.getCard(displayCardId);
    if (!def) return;

    const sx = pointer.x;
    const sy = pointer.y;
    const ghost = new GameCard(this.scene, sx, sy, def);
    ghost.setScale(1.06);
    ghost.setDepth(PANEL_DEPTH + 50);
    ghost.setScrollFactor(0);

    this.buyDrag = {
      listing,
      displayCardId,
      ghost,
      originX: sx,
      originY: sy,
      pointerId: this.nativePointerId(pointer),
    };
    this.capturePointer(pointer);
    this.attachBuyDragListeners();
    this.updateBuyPriceHint(sx, sy);
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

  private finishBuyDrag(x: number, y: number): void {
    const drag = this.buyDrag;
    if (!drag) return;

    this.releasePointerCapture(drag.pointerId);
    this.buyDrag = null;
    this.detachBuyDragListeners();
    this.buyPriceHint?.setVisible(false);
    drag.ghost.destroy();

    const moved = Phaser.Math.Distance.Between(drag.originX, drag.originY, x, y);
    if (moved < DRAG_THRESHOLD) return;
    if (!this.isValidBuyDrop(x, y)) return;

    this.completeBuy(drag.listing, x, y);
  }

  private onPointerUp(): void {
    if (this.panelDrag) {
      this.panelDrag = null;
      return;
    }
    if (this.buyDrag) {
      const p = this.scene.input.activePointer;
      this.finishBuyDrag(p.x, p.y);
    }
  }

  private isValidBuyDrop(sx: number, sy: number): boolean {
    if (this.isInPanel(sx, sy)) return false;
    return this.callbacks.isPlayfieldPoint(sx, sy);
  }

  private completeBuy(listing: ShopListing, sx: number, sy: number): void {
    if (listing.costCaps > 0 && !this.callbacks.trySpendCaps(listing.costCaps)) {
      this.scene.events.emit('drag-toast', '筹码不足');
      return;
    }

    const def = dataStore.getCard(listing.cardId);
    const label = def?.name ?? listing.cardId;
    const ok = this.callbacks.onBuyCardToPlayfield(
      listing.cardId,
      listing.count ?? 1,
      sx,
      sy,
      label,
    );

    if (!ok) {
      this.callbacks.refundCaps(listing.costCaps);
      return;
    }

    this.refreshCaps();
  }

  refreshCapsIfOpen(): void {
    if (this.open) this.refreshCaps();
  }

  openTrade(shopCard: GameCard): void {
    if (!this.positioned) {
      this.setPosition(this.screenW / 2, this.screenH * 0.38);
      this.positioned = true;
    }

    const modeChanged =
      this.activeShopCard !== null &&
      this.shop.isTestFreeShop(this.activeShopCard.definition) !==
        this.shop.isTestFreeShop(shopCard.definition);

    this.activeShopCard = shopCard;

    if (modeChanged || !this.open) {
      const cats = this.getActiveCategories();
      this.activeCategory = cats[0]?.id ?? '';
      this.buildCategoryTabs();
      this.buildBuyShelf();
    }

    if (this.open) {
      this.refreshCaps();
      this.syncPanelBounds();
      this.rebuildThumbHits();
      return;
    }

    this.open = true;
    this.setVisible(true);
    this.scene.registry.set(REGISTRY.TRADE_OPEN, true);
    this.refreshCaps();
    this.syncPanelBounds();
    this.rebuildThumbHits();
    const hint = this.shop.isTestFreeShop(shopCard.definition)
      ? `${shopCard.definition.name}：免费购入所有卡牌 · 拖入牌桌松手`
      : `${shopCard.definition.name}：拖入牌桌松手购买`;
    this.scene.events.emit('drag-toast', hint, '#8a9a7a');
  }

  private getActiveCategories(): ShopCategory[] {
    if (this.activeShopCard && this.shop.isTestFreeShop(this.activeShopCard.definition)) {
      return this.shop.getTestCategories();
    }
    return this.shop.getCategories();
  }

  private getActiveBuyListings(categoryId?: string): ShopListing[] {
    if (this.activeShopCard && this.shop.isTestFreeShop(this.activeShopCard.definition)) {
      return this.shop.getTestBuyListings(categoryId);
    }
    return this.shop.getBuyListings(categoryId);
  }

  close(): void {
    if (!this.open) return;
    this.cancelBuyDrag();
    this.panelDrag = null;
    this.open = false;
    this.setVisible(false);
    this.scene.registry.set(REGISTRY.TRADE_OPEN, false);
  }

  private cancelBuyDrag(): void {
    if (this.buyDrag) {
      this.releasePointerCapture(this.buyDrag.pointerId);
    }
    this.detachBuyDragListeners();
    if (this.buyDrag) {
      this.buyDrag.ghost.destroy();
      this.buyDrag = null;
    }
    this.buyPriceHint?.setVisible(false);
  }

  private refreshCaps(): void {
    this.capsText.setText(`筹码 ${this.callbacks.getCaps()}`);
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

  isOpen(): boolean {
    return this.open;
  }

  isInPanel(sx: number, sy: number): boolean {
    return this.panelScreenBounds.contains(sx, sy);
  }

  containsPanelPoint(sx: number, sy: number): boolean {
    if (!this.open) return false;
    return this.isInPanel(sx, sy);
  }
}
