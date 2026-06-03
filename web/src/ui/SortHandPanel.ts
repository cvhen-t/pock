import Phaser from 'phaser';

import {
  getSortHandPathStatus,
  sortHandPathHintSubtitle,
} from '../core/automationPath';
import { REGISTRY_AUTOMATION_GRAPH, type AutomationGraph } from '../core/automationNetwork';
import { dataStore } from '../core/DataStore';
import {
  SORT_MODES,
  buildStoreGridEntries,
  clearSortFilterCardId,
  clampSortHandWeight,
  deriveAvailableModes,
  firstInputCardId,
  formatRecipeInputs,
  formatSortHandSummary,
  getSortFilterCardId,
  getSortHandWeight,
  getSortMode,
  listBuyCandidates,
  listFeedRecipesForSortHand,
  listSellableCardIds,
  resolveDefaultSortMode,
  setSortFilterCardId,
  setSortHandWeight,
  setSortMode,
  type SortHandGridEntry,
  type SortModeId,
} from '../core/sortHandRules';
import type { ShopCatalog } from '../core/ShopCatalog';
import type { CardStackSystem } from '../systems/CardStackSystem';
import type { RecipeDefinition } from '../types/gameData';
import GameCard from '../objects/GameCard';
import { createCardThumb } from './compactCardThumb';

const PANEL_DEPTH = 2400;
const PANEL_W = 500;
const PANEL_H = 400;
const HEADER_TOP = -PANEL_H / 2;
const TITLE_BAR_H = 32;
const GRID_COLS = 6;
const SHELF_GAP_MIN = 4;
const SHELF_GAP_MAX = 28;
const SHOP_THUMB_SCALE = 0.88;
const SHELF_TOP = 70;
const SHELF_BOTTOM_PAD = 4;
const SHELF_SCROLL_END_PAD = 4;
const SHELF_VIEW_H = PANEL_H - SHELF_TOP - SHELF_BOTTOM_PAD;
const SHELF_PAD_X = 12;
const SHELF_CLIP_W = PANEL_W - SHELF_PAD_X * 2;
const SHELF_CONTENT_PAD = 2;
const PANEL_STROKE = 0x8b6914;
const TITLE_COLOR = '#c9b896';
const STATUS_COLOR = '#f0d878';
const SELECT_STROKE = 0x8b6914;

export class SortHandPanel extends Phaser.GameObjects.Container {
  private panelBg!: Phaser.GameObjects.Rectangle;

  private titleBar!: Phaser.GameObjects.Rectangle;

  private titleText!: Phaser.GameObjects.Text;

  private statusText!: Phaser.GameObjects.Text;

  private closeBtn!: Phaser.GameObjects.Text;

  private weightStepper!: Phaser.GameObjects.Container;

  private weightValueText!: Phaser.GameObjects.Text;

  private tabRow!: Phaser.GameObjects.Container;

  private tabBarShield!: Phaser.GameObjects.Rectangle;

  private showAllBtn!: Phaser.GameObjects.Text;

  private gridShelf!: Phaser.GameObjects.Container;

  private hoverDetailHint?: Phaser.GameObjects.Text;

  private shelfBottomCover!: Phaser.GameObjects.Rectangle;

  private shelfMask?: Phaser.Display.Masks.GeometryMask;

  private shelfMaxThumbH = 112;

  private shelfMaxThumbW = 56;

  private shelfColGap = SHELF_GAP_MIN;

  private shelfRowGap = SHELF_GAP_MIN;

  private shelfRowStride = 117;

  private shelfScroll = 0;

  private shelfMaxScroll = 0;

  private shelfViewBounds = new Phaser.Geom.Rectangle();

  private panelScreenBounds = new Phaser.Geom.Rectangle();

  private panelDrag: {
    originPanelX: number;
    originPanelY: number;
    originPointerX: number;
    originPointerY: number;
  } | null = null;

  private panelOpen = false;

  private activeCard: GameCard | null = null;

  private availableModes: SortModeId[] = [];

  private activeMode: SortModeId = 'feed';

  private showAllStorable = false;

  private screenW = 800;

  private screenH = 600;

  private tabButtons = new Map<SortModeId, Phaser.GameObjects.Text>();

  constructor(
    scene: Phaser.Scene,
    private readonly stacks: CardStackSystem,
    private readonly shopCatalog: ShopCatalog,
    private readonly onClose: () => void,
  ) {
    super(scene, 0, 0);
    scene.add.existing(this);
    this.setScrollFactor(0);
    this.setDepth(PANEL_DEPTH);
    this.setVisible(false);
    this.buildChrome();
    this.wireInput();
  }

  destroy(fromScene?: boolean): void {
    this.detachInput();
    super.destroy(fromScene);
  }

  open(card: GameCard): void {
    if (this.panelOpen && this.activeCard === card) {
      this.close();
      return;
    }

    this.activeCard = card;
    this.showAllStorable = false;
    this.shelfScroll = 0;
    this.positionNearCard(card);

    const graph = this.scene.registry.get(REGISTRY_AUTOMATION_GRAPH) as
      | AutomationGraph
      | undefined;
    this.availableModes = deriveAvailableModes(graph, card);
    const resolved = resolveDefaultSortMode(this.availableModes, getSortMode(card));
    if (resolved !== getSortMode(card)) {
      setSortMode(card, resolved);
      this.scene.events.emit('sort-hand-config-changed', { card });
    }
    this.activeMode = getSortMode(card);

    this.titleText.setText(card.definition.name);
    this.refreshChrome();
    this.panelOpen = true;
    this.setVisible(true);
    this.syncPanelBounds();
  }

  close(): void {
    if (!this.panelOpen) return;
    this.panelDrag = null;
    this.panelOpen = false;
    this.activeCard = null;
    this.hideHoverDetail();
    this.setVisible(false);
    this.onClose();
  }

  isOpen(): boolean {
    return this.panelOpen;
  }

  getActiveCard(): GameCard | null {
    return this.activeCard;
  }

  containsPanelPoint(sx: number, sy: number): boolean {
    if (!this.panelOpen) return false;
    return this.panelScreenBounds.contains(sx, sy);
  }

  applyLayout(_centerX: number, _centerY: number, width: number, height: number): void {
    this.screenW = width;
    this.screenH = height;
    if (this.panelOpen) {
      if (this.activeCard) this.positionNearCard(this.activeCard);
      const halfW = PANEL_W / 2;
      const halfH = PANEL_H / 2;
      const pad = 8;
      this.x = Phaser.Math.Clamp(this.x, halfW + pad, width - halfW - pad);
      this.y = Phaser.Math.Clamp(this.y, halfH + pad + 40, height - halfH - pad);
      this.syncPanelBounds();
    }
  }

  /** 面板锚定在卡牌旁，避免遮挡导致连续点击失效 */
  private positionNearCard(card: GameCard): void {
    const halfW = PANEL_W / 2;
    const halfH = PANEL_H / 2;
    const pad = 8;
    const gap = 14;
    const cardHw = card.cardWidth / 2;
    const cardHh = card.cardHeight / 2;

    const candidates = [
      { x: card.x, y: card.y - cardHh - halfH - gap },
      { x: card.x, y: card.y + cardHh + halfH + gap },
      { x: card.x + cardHw + halfW + gap, y: card.y },
      { x: card.x - cardHw - halfW - gap, y: card.y },
      { x: this.screenW / 2, y: this.screenH * 0.32 },
    ];

    for (const candidate of candidates) {
      const px = Phaser.Math.Clamp(candidate.x, halfW + pad, this.screenW - halfW - pad);
      const py = Phaser.Math.Clamp(candidate.y, halfH + pad + 40, this.screenH - halfH - pad);
      if (!this.panelOverlapsCard(card, px, py)) {
        this.setPosition(px, py);
        return;
      }
    }

    this.setPosition(
      Phaser.Math.Clamp(this.screenW / 2, halfW + pad, this.screenW - halfW - pad),
      Phaser.Math.Clamp(this.screenH * 0.32, halfH + pad + 40, this.screenH - halfH - pad),
    );
  }

  private panelOverlapsCard(card: GameCard, px: number, py: number): boolean {
    const panel = new Phaser.Geom.Rectangle(px - PANEL_W / 2, py - PANEL_H / 2, PANEL_W, PANEL_H);
    const cardRect = new Phaser.Geom.Rectangle(
      card.x - card.cardWidth / 2,
      card.y - card.cardHeight / 2,
      card.cardWidth,
      card.cardHeight,
    );
    return Phaser.Geom.Intersects.RectangleToRectangle(panel, cardRect);
  }

  private buildChrome(): void {
    const scene = this.scene;

    this.panelBg = scene.add
      .rectangle(0, 0, PANEL_W, PANEL_H, 0x2a2620, 0.96)
      .setOrigin(0.5)
      .setStrokeStyle(2, PANEL_STROKE, 0.9);

    this.titleBar = scene.add
      .rectangle(0, HEADER_TOP + TITLE_BAR_H / 2, PANEL_W - 4, TITLE_BAR_H, 0x3a3228, 0.95)
      .setOrigin(0.5)
      .setInteractive({ draggable: false, useHandCursor: true });

    this.titleText = scene.add.text(-PANEL_W / 2 + 16, HEADER_TOP + 8, '分拣手', {
      fontSize: '16px',
      color: TITLE_COLOR,
    });
    this.titleText.setOrigin(0, 0);

    this.statusText = scene.add.text(-24, HEADER_TOP + 10, '', {
      fontSize: '13px',
      color: STATUS_COLOR,
    });
    this.statusText.setOrigin(0.5, 0);

    this.weightStepper = scene.add.container(PANEL_W / 2 - 58, HEADER_TOP + 16);
    const weightLabel = scene.add.text(-22, 0, '优先级', {
      fontSize: '9px',
      color: '#8a8070',
    });
    weightLabel.setOrigin(1, 0.5);

    const stepBtnStyle = {
      fontSize: '10px',
      color: TITLE_COLOR,
      backgroundColor: '#4a4030',
      padding: { x: 5, y: 1 },
    };
    this.weightValueText = scene.add.text(0, 0, '1', {
      fontSize: '13px',
      color: STATUS_COLOR,
      backgroundColor: '#3a3228',
      padding: { x: 6, y: 2 },
    });
    this.weightValueText.setOrigin(0.5);

    const weightUpBtn = scene.add
      .text(0, -12, '▲', stepBtnStyle)
      .setOrigin(0.5)
      .setInteractive({ useHandCursor: true });
    weightUpBtn.on('pointerdown', (p: Phaser.Input.Pointer) => {
      p.event.stopPropagation();
      this.bumpWeight(1);
    });

    const weightDownBtn = scene.add
      .text(0, 12, '▼', stepBtnStyle)
      .setOrigin(0.5)
      .setInteractive({ useHandCursor: true });
    weightDownBtn.on('pointerdown', (p: Phaser.Input.Pointer) => {
      p.event.stopPropagation();
      this.bumpWeight(-1);
    });

    this.weightStepper.add([weightLabel, weightUpBtn, this.weightValueText, weightDownBtn]);

    this.closeBtn = scene.add
      .text(PANEL_W / 2 - 24, HEADER_TOP + 12, '×', {
        fontSize: '22px',
        color: TITLE_COLOR,
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
    this.tabBarShield = scene.add
      .rectangle(0, HEADER_TOP + 62, PANEL_W - 20, 44, 0x000000, 0)
      .setInteractive({ useHandCursor: false });
    this.tabBarShield.on('pointerdown', (p: Phaser.Input.Pointer) => p.event.stopPropagation());

    this.showAllBtn = scene.add
      .text(PANEL_W / 2 - 14, HEADER_TOP + 66, '显示全部', {
        fontSize: '10px',
        color: '#8a8070',
        backgroundColor: '#2a2620',
        padding: { x: 4, y: 1 },
      })
      .setOrigin(1, 0.5)
      .setInteractive({ useHandCursor: true });
    this.showAllBtn.on('pointerdown', (p: Phaser.Input.Pointer) => {
      p.event.stopPropagation();
      this.showAllStorable = true;
      this.buildGrid();
    });

    const shelfViewTop = this.getShelfViewTop();
    this.gridShelf = scene.add.container(0, shelfViewTop);
    const shelfMaskGfx = scene.make.graphics({ x: 0, y: 0 });
    shelfMaskGfx.fillStyle(0xffffff);
    shelfMaskGfx.fillRect(-SHELF_CLIP_W / 2, 0, SHELF_CLIP_W, SHELF_VIEW_H);
    this.shelfMask = shelfMaskGfx.createGeometryMask();
    this.gridShelf.setMask(this.shelfMask);

    const shelfBottom = shelfViewTop + SHELF_VIEW_H;
    const panelBottom = PANEL_H / 2;
    const bottomCoverH = Math.max(0, panelBottom - shelfBottom);
    this.shelfBottomCover = scene.add
      .rectangle(0, shelfBottom + bottomCoverH / 2, PANEL_W - 4, bottomCoverH, 0x2a2620, 1)
      .setInteractive({ useHandCursor: false });
    this.shelfBottomCover.setVisible(bottomCoverH > 0);
    this.shelfBottomCover.on('pointerdown', (p: Phaser.Input.Pointer) => p.event.stopPropagation());

    this.add([
      this.panelBg,
      this.gridShelf,
      this.shelfBottomCover,
      this.tabBarShield,
      this.titleBar,
      this.titleText,
      this.statusText,
      this.weightStepper,
      this.closeBtn,
      this.tabRow,
      this.showAllBtn,
    ]);

    this.titleBar.on('pointerdown', (p: Phaser.Input.Pointer) => {
      p.event.stopPropagation();
      this.panelDrag = {
        originPanelX: this.x,
        originPanelY: this.y,
        originPointerX: p.x,
        originPointerY: p.y,
      };
    });
  }

  private wireInput(): void {
    const input = this.scene.input;
    input.on('pointermove', this.onPointerMove, this);
    input.on('pointerup', this.onPointerUp, this);
    input.on('wheel', this.onWheel, this);
    this.scene.game.events.on(Phaser.Core.Events.BLUR, this.onBlur, this);
    this.scene.events.once(Phaser.Scenes.Events.SHUTDOWN, () => this.detachInput());
  }

  private detachInput(): void {
    const input = this.scene.input;
    input.off('pointermove', this.onPointerMove, this);
    input.off('pointerup', this.onPointerUp, this);
    input.off('wheel', this.onWheel, this);
    this.scene.game.events.off(Phaser.Core.Events.BLUR, this.onBlur, this);
  }

  private onBlur = (): void => {
    this.panelDrag = null;
  };

  private onPointerMove(): void {
    const p = this.scene.input.activePointer;
    if (!p.isDown || !this.panelDrag) return;
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
  }

  private onPointerUp(): void {
    if (this.panelDrag) this.panelDrag = null;
  }

  private onWheel(
    _pointer: Phaser.Input.Pointer,
    _gameObjects: Phaser.GameObjects.GameObject[],
    _deltaX: number,
    deltaY: number,
  ): void {
    if (!this.panelOpen || this.shelfMaxScroll <= 0) return;
    const p = this.scene.input.activePointer;
    if (!this.shelfViewBounds.contains(p.x, p.y)) return;
    this.hideHoverDetail();
    this.shelfScroll = Phaser.Math.Clamp(this.shelfScroll + deltaY * 0.35, 0, this.shelfMaxScroll);
    this.populateGrid();
  }

  private getShelfViewTop(): number {
    return -PANEL_H / 2 + SHELF_TOP;
  }

  private getGraph(): AutomationGraph | undefined {
    return this.scene.registry.get(REGISTRY_AUTOMATION_GRAPH) as AutomationGraph | undefined;
  }

  private pathHintEntry(card: GameCard, graph: AutomationGraph | undefined): SortHandGridEntry | null {
    const status = getSortHandPathStatus(graph, card);
    if (status === 'ok') return null;
    const mode = getSortMode(card);
    const subtitle = sortHandPathHintSubtitle(status, mode);
    const title =
      status === 'no_downstream'
        ? '下游与模式不匹配'
        : status === 'no_relay'
          ? '未连接传送'
          : '上游未就绪';
    return {
      key: '__path__',
      cardId: null,
      title,
      subtitle,
      filterCardId: getSortFilterCardId(card),
    };
  }

  private refreshChrome(): void {
    if (!this.activeCard) return;
    const graph = this.getGraph();
    this.titleText.setText(this.activeCard.definition.name);
    this.statusText.setText(formatSortHandSummary(this.activeCard, graph));
    this.refreshWeightStepper();
    this.buildModeTabs();
    this.showAllBtn.setVisible(false);
    this.buildGrid();
    this.bringChromeToFront();
  }

  private buildModeTabs(): void {
    this.tabRow.removeAll(true);
    this.tabButtons.clear();
    const showTabs = this.availableModes.length > 1;
    this.tabRow.setVisible(showTabs);
    this.tabBarShield.setVisible(showTabs);
    if (!showTabs) return;

    const tabs: Phaser.GameObjects.Text[] = [];
    for (const modeId of this.availableModes) {
      const def = SORT_MODES.find((m) => m.id === modeId);
      if (!def) continue;
      const active = modeId === this.activeMode;
      const tab = this.scene.add
        .text(0, 0, def.label, {
          fontSize: '12px',
          color: active ? '#f0e8d8' : '#8a8070',
          backgroundColor: active ? '#5c4a32' : '#2a2620',
          padding: { x: 10, y: 4 },
        })
        .setOrigin(0, 0)
        .setInteractive({ useHandCursor: true });
      tab.on('pointerdown', (p: Phaser.Input.Pointer) => {
        p.event.stopPropagation();
        if (!this.activeCard || this.activeMode === modeId) return;
        this.activeMode = modeId;
        setSortMode(this.activeCard, modeId);
        this.showAllStorable = false;
        this.shelfScroll = 0;
        this.scene.events.emit('sort-hand-config-changed', { card: this.activeCard });
        this.refreshChrome();
      });
      this.tabRow.add(tab);
      this.tabButtons.set(modeId, tab);
      tabs.push(tab);
    }

    const tabGap = 6;
    const totalW = tabs.reduce((sum, tab, i) => sum + tab.width + (i > 0 ? tabGap : 0), 0);
    let x = -totalW / 2;
    for (const tab of tabs) {
      tab.setX(x);
      x += tab.width + tabGap;
    }
  }

  private refreshWeightStepper(): void {
    if (!this.activeCard) return;
    this.weightValueText.setText(String(getSortHandWeight(this.activeCard)));
  }

  private bumpWeight(delta: number): void {
    if (!this.activeCard) return;
    const current = getSortHandWeight(this.activeCard);
    const next = clampSortHandWeight(current + delta);
    if (next === current) return;
    setSortHandWeight(this.activeCard, next);
    this.refreshWeightStepper();
    this.scene.events.emit('sort-hand-config-changed', { card: this.activeCard });
    this.scene.events.emit('drag-toast', `分拣优先级：${next}`);
  }

  private buildGrid(): void {
    if (!this.activeCard) return;
    const entries = this.collectGridEntries();
    this.measureThumbSlot(entries);
    this.layoutGridSpacing(entries.length);
    const rows = Math.ceil(entries.length / GRID_COLS);
    const h = this.shelfMaxThumbH;
    const contentH =
      rows > 0
        ? SHELF_CONTENT_PAD * 2 + rows * h + (rows - 1) * this.shelfRowGap
        : 0;
    const overflow = contentH - SHELF_VIEW_H;
    this.shelfMaxScroll = Math.max(
      0,
      overflow + (overflow > 0 ? SHELF_SCROLL_END_PAD : 0),
    );
    this.shelfScroll = Phaser.Math.Clamp(this.shelfScroll, 0, this.shelfMaxScroll);
    this.populateGrid();
  }

  private collectGridEntries(): SortHandGridEntry[] {
    const card = this.activeCard!;
    const graph = this.getGraph();
    const dayIndex = (this.scene.registry.get('dayIndex') as number) ?? 1;
    const filterId = getSortFilterCardId(card);

    if (this.availableModes.length === 0) {
      return [
        {
          key: '__hint__',
          cardId: null,
          title: '未连接',
          subtitle: '靠近商店、生产设施或储物棚后重试',
          filterCardId: filterId,
        },
      ];
    }

    if (this.activeMode === 'buy') {
      return listBuyCandidates(this.shopCatalog, null).slice(0, 24).map((listing) => {
        const def = dataStore.getCard(listing.cardId);
        return {
          key: listing.cardId,
          cardId: listing.cardId,
          title: def?.name ?? listing.cardId,
          priceCaps: listing.costCaps,
          filterCardId: listing.cardId,
        };
      });
    }

    if (this.activeMode === 'feed') {
      if (!graph) {
        return [
          {
            key: '__hint__',
            cardId: null,
            title: '物流未就绪',
            subtitle: '请稍后再试',
            filterCardId: filterId,
          },
        ];
      }
      const recipes = listFeedRecipesForSortHand(
        card,
        graph,
        dataStore.getRecipes(),
        dayIndex,
      );
      const pathHint = this.pathHintEntry(card, graph);
      if (recipes.length === 0) {
        const emptyHint: SortHandGridEntry = {
          key: '__hint__',
          cardId: null,
          title: '无法供料',
          subtitle: '连接生产设施或投放仓储，并确保上游有货',
          filterCardId: filterId,
        };
        return pathHint ? [pathHint, emptyHint] : [emptyHint];
      }
      return this.withPathHint(
        pathHint,
        recipes.slice(0, 24).map((recipe) => this.recipeToEntry(recipe)),
      );
    }

    if (this.activeMode === 'store') {
      return this.withPathHint(
        this.pathHintEntry(card, graph),
        buildStoreGridEntries(
          card,
          graph,
          this.stacks,
          dataStore.getAllCards(),
          this.showAllStorable,
        ),
      );
    }

    const sellPathHint = this.pathHintEntry(card, graph);
    return this.withPathHint(
      sellPathHint,
      listSellableCardIds(this.shopCatalog, dataStore.getAllCards())
      .slice(0, 24)
      .map((id) => {
        const def = dataStore.getCard(id);
        return {
          key: id,
          cardId: id,
          title: def?.name ?? id,
          filterCardId: id,
        };
      }),
    );
  }

  private withPathHint(
    hint: SortHandGridEntry | null,
    entries: SortHandGridEntry[],
  ): SortHandGridEntry[] {
    return hint ? [hint, ...entries] : entries;
  }

  private isNonSelectableGridKey(key: string): boolean {
    return key === '__hint__' || key === '__path__';
  }

  private recipeToEntry(recipe: RecipeDefinition): SortHandGridEntry {
    const outId = recipe.output?.cardId ?? recipe.id;
    const inputId = firstInputCardId(recipe);
    const out = dataStore.getCard(outId);
    return {
      key: recipe.id,
      cardId: outId,
      title: out?.name ?? recipe.id,
      hoverDetail: inputId ? `供料 ${formatRecipeInputs(recipe)}` : undefined,
      filterCardId: inputId,
    };
  }

  private measureThumbSlot(entries: SortHandGridEntry[]): void {
    const probe = entries.find((e) => e.cardId)?.cardId;
    if (!probe) {
      this.shelfMaxThumbH = 112;
      this.shelfMaxThumbW = 56;
      return;
    }
    const thumb = createCardThumb(this.scene, probe, {
      scale: SHOP_THUMB_SCALE,
      uniformStandard: true,
      compactPrice: true,
      priceBelowCard: true,
    });
    if (!thumb) {
      this.shelfMaxThumbH = 112;
      this.shelfMaxThumbW = 56;
      return;
    }
    this.shelfMaxThumbH = (thumb.getData('thumbH') as number) || 112;
    this.shelfMaxThumbW = (thumb.getData('thumbW') as number) || 56;
    thumb.destroy(true);
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

  private layoutGridSpacing(count: number): void {
    const h = this.shelfMaxThumbH;
    const rows = Math.ceil(Math.max(count, 1) / GRID_COLS);
    this.shelfColGap = this.colGapFor(GRID_COLS);
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

  private populateGrid(): void {
    this.hideHoverDetail();
    this.gridShelf.removeAll(true);
    if (!this.activeCard) return;

    const entries = this.collectGridEntries();
    const filterId = getSortFilterCardId(this.activeCard);
    const maxThumbH = this.shelfMaxThumbH;
    const scrollTop = this.shelfScroll;
    const scrollBottom = scrollTop + SHELF_VIEW_H;
    const totalRows = Math.ceil(entries.length / GRID_COLS);
    const rowStride = this.shelfRowStride;
    const firstRow = Math.max(0, Math.floor((scrollTop - SHELF_CONTENT_PAD) / rowStride) - 1);
    const lastRow = Math.min(
      totalRows - 1,
      Math.ceil((scrollBottom - SHELF_CONTENT_PAD) / rowStride) + 1,
    );

    for (let row = firstRow; row <= lastRow; row++) {
      const rowTop = SHELF_CONTENT_PAD + row * rowStride;
      const rowStart = row * GRID_COLS;
      const countInRow = Math.min(GRID_COLS, entries.length - rowStart);

      for (let col = 0; col < countInRow; col++) {
        const entry = entries[rowStart + col];
        const x = this.shelfColX(col);
        const selected =
          this.isNonSelectableGridKey(entry.key)
            ? false
            : entry.filterCardId === filterId ||
              (entry.filterCardId === null && filterId === null);

        const tile =
          entry.cardId != null
            ? this.createCardTile(entry, selected)
            : this.createTextTile(entry, selected);

        const thumbTop = rowTop - scrollTop;
        const thumbBottom = thumbTop + maxThumbH;
        if (thumbTop < 0 || thumbBottom > SHELF_VIEW_H) continue;

        tile.setPosition(x, rowTop + maxThumbH / 2 - scrollTop);
        this.gridShelf.add(tile);
      }
    }
  }

  private createCardTile(entry: SortHandGridEntry, selected: boolean): Phaser.GameObjects.Container {
    const container = this.scene.add.container(0, 0);
    const thumb = createCardThumb(this.scene, entry.cardId!, {
      scale: SHOP_THUMB_SCALE,
      uniformStandard: true,
      compactPrice: true,
      title: entry.title,
      subtitle: entry.subtitle,
      priceCaps: entry.priceCaps,
      priceBelowCard: true,
    });
    if (thumb) container.add(thumb);

    const hitW = (thumb?.getData('thumbW') as number) || this.shelfMaxThumbW;
    const hitH = (thumb?.getData('thumbH') as number) || this.shelfMaxThumbH;
    container.setData('gridEntry', entry);
    container.setData('thumbW', hitW);
    container.setData('thumbH', hitH);

    const ring = this.scene.add.rectangle(0, 0, hitW + 6, hitH + 6);
    ring.setStrokeStyle(2, SELECT_STROKE, 1);
    ring.setFillStyle(0x000000, 0);
    ring.setVisible(selected);
    container.addAt(ring, 0);
    container.setData('selectionRing', ring);

    if (!this.isNonSelectableGridKey(entry.key)) {
      container.setSize(hitW, hitH);
      container.setInteractive(
        new Phaser.Geom.Rectangle(-hitW / 2, -hitH / 2, hitW, hitH),
        Phaser.Geom.Rectangle.Contains,
      );
      container.on('pointerdown', (p: Phaser.Input.Pointer) => {
        p.event.stopPropagation();
        this.selectEntry(entry);
      });
      if (entry.hoverDetail) {
        const detail = entry.hoverDetail;
        container.on('pointerover', () => this.showHoverDetail(detail, container));
        container.on('pointerout', () => this.hideHoverDetail());
      }
    }

    return container;
  }

  private createTextTile(entry: SortHandGridEntry, selected: boolean): Phaser.GameObjects.Container {
    const container = this.scene.add.container(0, 0);
    const w = this.shelfMaxThumbW;
    const h = this.shelfMaxThumbH;
    const bg = this.scene.add.rectangle(0, 0, w, h, selected ? 0x3a3228 : 0x2a2620, 1);
    bg.setStrokeStyle(2, selected ? SELECT_STROKE : 0x4a4030, 1);
    const title = this.scene.add.text(0, -8, entry.title, {
      fontSize: '11px',
      color: selected ? TITLE_COLOR : '#c9c0b0',
      align: 'center',
      wordWrap: { width: w - 8 },
    });
    title.setOrigin(0.5);
    const sub = entry.subtitle
      ? this.scene.add.text(0, 18, entry.subtitle, {
          fontSize: '9px',
          color: '#8a8070',
          align: 'center',
          wordWrap: { width: w - 8 },
        })
      : null;
    sub?.setOrigin(0.5);
    container.add([bg, title]);
    if (sub) container.add(sub);

    container.setData('gridEntry', entry);
    container.setData('thumbW', w);
    container.setData('thumbH', h);
    container.setData('selectionRing', bg);

    if (!this.isNonSelectableGridKey(entry.key)) {
      container.setSize(w, h);
      container.setInteractive(
        new Phaser.Geom.Rectangle(-w / 2, -h / 2, w, h),
        Phaser.Geom.Rectangle.Contains,
      );
      container.on('pointerdown', (p: Phaser.Input.Pointer) => {
        p.event.stopPropagation();
        this.selectEntry(entry);
      });
      if (entry.hoverDetail) {
        const detail = entry.hoverDetail;
        container.on('pointerover', () => this.showHoverDetail(detail, container));
        container.on('pointerout', () => this.hideHoverDetail());
      }
    }

    return container;
  }

  private updateGridSelection(): void {
    if (!this.activeCard) return;
    const filterId = getSortFilterCardId(this.activeCard);
    for (const child of this.gridShelf.getAll() as Phaser.GameObjects.Container[]) {
      const entry = child.getData('gridEntry') as SortHandGridEntry | undefined;
      if (!entry || this.isNonSelectableGridKey(entry.key)) continue;
      const selected =
        entry.filterCardId === filterId ||
        (entry.filterCardId === null && filterId === null);
      const ring = child.getData('selectionRing') as Phaser.GameObjects.Rectangle | undefined;
      if (!ring) continue;
      ring.setVisible(selected);
      if (entry.cardId == null) {
        ring.setStrokeStyle(2, selected ? SELECT_STROKE : 0x4a4030, 1);
        ring.setFillStyle(selected ? 0x3a3228 : 0x2a2620, 1);
      }
    }
  }

  private showHoverDetail(text: string, tile: Phaser.GameObjects.Container): void {
    if (!this.hoverDetailHint) {
      this.hoverDetailHint = this.scene.add.text(0, 0, '', {
        fontSize: '11px',
        color: '#f0e8d8',
        backgroundColor: '#2a2620ee',
        padding: { x: 8, y: 4 },
      });
      this.hoverDetailHint.setOrigin(0.5, 1);
      this.hoverDetailHint.setDepth(PANEL_DEPTH + 80);
      this.hoverDetailHint.setScrollFactor(0);
    }
    const thumbH = (tile.getData('thumbH') as number) || this.shelfMaxThumbH;
    const sx = this.x + this.gridShelf.x + tile.x;
    const sy = this.y + this.gridShelf.y + tile.y - thumbH / 2 - 6;
    this.hoverDetailHint.setText(text);
    this.hoverDetailHint.setPosition(sx, sy);
    this.hoverDetailHint.setVisible(true);
    this.bringToTop(this.hoverDetailHint);
  }

  private hideHoverDetail(): void {
    this.hoverDetailHint?.setVisible(false);
  }

  private selectEntry(entry: SortHandGridEntry): void {
    if (!this.activeCard || this.isNonSelectableGridKey(entry.key)) return;
    if (entry.filterCardId) {
      setSortFilterCardId(this.activeCard, entry.filterCardId);
    } else {
      clearSortFilterCardId(this.activeCard);
    }
    this.updateGridSelection();
    this.statusText.setText(formatSortHandSummary(this.activeCard, this.getGraph()));
    this.scene.events.emit('sort-hand-config-changed', { card: this.activeCard });
  }

  private bringChromeToFront(): void {
    this.bringToTop(this.shelfBottomCover);
    this.bringToTop(this.tabBarShield);
    this.bringToTop(this.tabRow);
    this.bringToTop(this.titleBar);
    this.bringToTop(this.statusText);
    this.bringToTop(this.weightStepper);
    this.bringToTop(this.titleText);
    this.bringToTop(this.closeBtn);
    this.bringToTop(this.showAllBtn);
    if (this.hoverDetailHint?.visible) {
      this.bringToTop(this.hoverDetailHint);
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
}
