import Phaser from 'phaser';
import { REGISTRY_AUTOMATION_GRAPH } from '../core/automationNetwork';
import { dataStore } from '../core/DataStore';
import { SORT_MODES, SORT_WEIGHT_MAX, SORT_WEIGHT_MIN, buildStoreGridEntries, clearSortFilterCardId, deriveAvailableModes, firstInputCardId, formatRecipeInputs, formatSortHandSummary, getDownstreamTargetName, getSortFilterCardId, getSortHandWeight, getSortMode, listBuyCandidates, listFeedRecipesForSortHand, listSellableCardIds, resolveDefaultSortMode, setSortFilterCardId, setSortHandWeight, setSortMode, } from '../core/sortHandRules';
import { createCardThumb } from './compactCardThumb';
const PANEL_DEPTH = 2400;
const PANEL_W = 500;
const PANEL_H = 430;
const HEADER_TOP = -PANEL_H / 2;
const TITLE_BAR_H = 32;
const GRID_COLS = 5;
const SHELF_GAP_MIN = 4;
const SHELF_GAP_MAX = 28;
const THUMB_SCALE = 0.82;
const SHELF_TOP = 118;
const SHELF_BOTTOM_PAD = 52;
const SHELF_VIEW_H = PANEL_H - SHELF_TOP - SHELF_BOTTOM_PAD;
const SHELF_PAD_X = 12;
const SHELF_CLIP_W = PANEL_W - SHELF_PAD_X * 2;
const SHELF_CONTENT_PAD = 2;
export class SortHandPanel extends Phaser.GameObjects.Container {
    stacks;
    shopCatalog;
    onClose;
    panelBg;
    titleBar;
    titleText;
    summaryText;
    hintText;
    closeBtn;
    doneBtn;
    tabRow;
    tabBarShield;
    advancedRow;
    advancedToggle;
    weightRow;
    showAllBtn;
    gridShelf;
    shelfBottomCover;
    shelfMask;
    shelfMaxThumbH = 112;
    shelfMaxThumbW = 56;
    shelfColGap = SHELF_GAP_MIN;
    shelfRowGap = SHELF_GAP_MIN;
    shelfRowStride = 117;
    shelfScroll = 0;
    shelfMaxScroll = 0;
    shelfViewBounds = new Phaser.Geom.Rectangle();
    panelScreenBounds = new Phaser.Geom.Rectangle();
    panelDrag = null;
    panelOpen = false;
    activeCard = null;
    availableModes = [];
    activeMode = 'feed';
    advancedOpen = false;
    showAllStorable = false;
    screenW = 800;
    screenH = 600;
    positioned = false;
    tabButtons = new Map();
    constructor(scene, stacks, shopCatalog, onClose) {
        super(scene, 0, 0);
        this.stacks = stacks;
        this.shopCatalog = shopCatalog;
        this.onClose = onClose;
        scene.add.existing(this);
        this.setScrollFactor(0);
        this.setDepth(PANEL_DEPTH);
        this.setVisible(false);
        this.buildChrome();
        this.wireInput();
    }
    destroy(fromScene) {
        this.detachInput();
        super.destroy(fromScene);
    }
    open(card) {
        if (!this.positioned) {
            this.setPosition(this.screenW / 2, this.screenH * 0.38);
            this.positioned = true;
        }
        this.activeCard = card;
        this.advancedOpen = false;
        this.showAllStorable = false;
        this.shelfScroll = 0;
        const graph = this.scene.registry.get(REGISTRY_AUTOMATION_GRAPH);
        this.availableModes = deriveAvailableModes(graph, card);
        const resolved = resolveDefaultSortMode(this.availableModes, getSortMode(card));
        if (resolved !== getSortMode(card))
            setSortMode(card, resolved);
        this.activeMode = getSortMode(card);
        this.titleText.setText(card.definition.name);
        this.refreshChrome();
        this.panelOpen = true;
        this.setVisible(true);
        this.syncPanelBounds();
    }
    close() {
        if (!this.panelOpen)
            return;
        this.panelDrag = null;
        this.panelOpen = false;
        this.activeCard = null;
        this.setVisible(false);
        this.onClose();
    }
    isOpen() {
        return this.panelOpen;
    }
    containsPanelPoint(sx, sy) {
        if (!this.panelOpen)
            return false;
        return this.panelScreenBounds.contains(sx, sy);
    }
    applyLayout(_centerX, _centerY, width, height) {
        this.screenW = width;
        this.screenH = height;
        if (this.panelOpen)
            this.syncPanelBounds();
    }
    buildChrome() {
        const scene = this.scene;
        this.panelBg = scene.add
            .rectangle(0, 0, PANEL_W, PANEL_H, 0x2a2620, 0.96)
            .setOrigin(0.5)
            .setStrokeStyle(2, 0x6a6560, 0.9);
        this.titleBar = scene.add
            .rectangle(0, HEADER_TOP + TITLE_BAR_H / 2, PANEL_W - 4, TITLE_BAR_H, 0x3a3228, 0.95)
            .setOrigin(0.5)
            .setInteractive({ useHandCursor: true });
        this.titleText = scene.add.text(-PANEL_W / 2 + 16, HEADER_TOP + 8, '分拣手', {
            fontSize: '16px',
            color: '#c9c0b0',
        });
        this.titleText.setOrigin(0, 0);
        this.closeBtn = scene.add
            .text(PANEL_W / 2 - 24, HEADER_TOP + 12, '×', {
            fontSize: '22px',
            color: '#c9c0b0',
            backgroundColor: '#4a4030',
            padding: { x: 8, y: 2 },
        })
            .setOrigin(0.5)
            .setInteractive({ useHandCursor: true });
        this.closeBtn.on('pointerdown', (p) => {
            p.event.stopPropagation();
            this.close();
        });
        this.summaryText = scene.add.text(0, HEADER_TOP + 40, '', {
            fontSize: '12px',
            color: '#a0b090',
        });
        this.summaryText.setOrigin(0.5, 0);
        this.tabRow = scene.add.container(0, HEADER_TOP + 58);
        this.tabBarShield = scene.add
            .rectangle(0, HEADER_TOP + 58, PANEL_W - 24, 26, 0x2a2620, 0.01)
            .setInteractive({ useHandCursor: false });
        this.tabBarShield.on('pointerdown', (p) => p.event.stopPropagation());
        this.hintText = scene.add.text(0, HEADER_TOP + 88, '点击选择 · 滚轮浏览', {
            fontSize: '10px',
            color: '#8a8070',
        });
        this.hintText.setOrigin(0.5, 0);
        this.advancedToggle = scene.add
            .text(-PANEL_W / 2 + 16, PANEL_H / 2 - 40, '高级 ▼', {
            fontSize: '11px',
            color: '#8a8070',
            backgroundColor: '#2a2620',
            padding: { x: 6, y: 2 },
        })
            .setOrigin(0, 0.5)
            .setInteractive({ useHandCursor: true });
        this.advancedToggle.on('pointerdown', (p) => {
            p.event.stopPropagation();
            this.advancedOpen = !this.advancedOpen;
            this.refreshAdvanced();
        });
        this.advancedRow = scene.add.container(0, PANEL_H / 2 - 40);
        this.weightRow = scene.add.container(-PANEL_W / 2 + 80, 0);
        this.showAllBtn = scene.add
            .text(PANEL_W / 2 - 16, PANEL_H / 2 - 40, '显示全部', {
            fontSize: '11px',
            color: '#8a8070',
            backgroundColor: '#2a2620',
            padding: { x: 6, y: 2 },
        })
            .setOrigin(1, 0.5)
            .setInteractive({ useHandCursor: true });
        this.showAllBtn.on('pointerdown', (p) => {
            p.event.stopPropagation();
            this.showAllStorable = true;
            this.buildGrid();
        });
        this.doneBtn = scene.add
            .text(0, PANEL_H / 2 - 14, '完成', {
            fontSize: '13px',
            color: '#f0e8d8',
            backgroundColor: '#5c4a32',
            padding: { x: 18, y: 6 },
        })
            .setOrigin(0.5)
            .setInteractive({ useHandCursor: true });
        this.doneBtn.on('pointerdown', (p) => {
            p.event.stopPropagation();
            this.close();
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
        this.shelfBottomCover.on('pointerdown', (p) => p.event.stopPropagation());
        this.advancedRow.add(this.weightRow);
        this.add([
            this.panelBg,
            this.gridShelf,
            this.shelfBottomCover,
            this.tabBarShield,
            this.titleBar,
            this.titleText,
            this.closeBtn,
            this.summaryText,
            this.tabRow,
            this.hintText,
            this.advancedToggle,
            this.advancedRow,
            this.showAllBtn,
            this.doneBtn,
        ]);
        this.titleBar.on('pointerdown', (p) => {
            p.event.stopPropagation();
            this.panelDrag = {
                originPanelX: this.x,
                originPanelY: this.y,
                originPointerX: p.x,
                originPointerY: p.y,
            };
        });
    }
    wireInput() {
        const input = this.scene.input;
        input.on('pointermove', this.onPointerMove, this);
        input.on('pointerup', this.onPointerUp, this);
        input.on('wheel', this.onWheel, this);
        this.scene.game.events.on(Phaser.Core.Events.BLUR, this.onBlur, this);
        this.scene.events.once(Phaser.Scenes.Events.SHUTDOWN, () => this.detachInput());
    }
    detachInput() {
        const input = this.scene.input;
        input.off('pointermove', this.onPointerMove, this);
        input.off('pointerup', this.onPointerUp, this);
        input.off('wheel', this.onWheel, this);
        this.scene.game.events.off(Phaser.Core.Events.BLUR, this.onBlur, this);
    }
    onBlur = () => {
        this.panelDrag = null;
    };
    onPointerMove() {
        const p = this.scene.input.activePointer;
        if (!p.isDown || !this.panelDrag)
            return;
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
    onPointerUp() {
        if (this.panelDrag)
            this.panelDrag = null;
    }
    onWheel(_pointer, _gameObjects, _deltaX, deltaY) {
        if (!this.panelOpen || this.shelfMaxScroll <= 0)
            return;
        const p = this.scene.input.activePointer;
        if (!this.shelfViewBounds.contains(p.x, p.y))
            return;
        this.shelfScroll = Phaser.Math.Clamp(this.shelfScroll + deltaY * 0.35, 0, this.shelfMaxScroll);
        this.populateGrid();
    }
    getShelfViewTop() {
        return -PANEL_H / 2 + SHELF_TOP;
    }
    getGraph() {
        return this.scene.registry.get(REGISTRY_AUTOMATION_GRAPH);
    }
    refreshChrome() {
        if (!this.activeCard)
            return;
        const graph = this.getGraph();
        const modeLabel = SORT_MODES.find((m) => m.id === this.activeMode)?.label ?? '';
        const targetName = getDownstreamTargetName(graph, this.activeCard, this.activeMode);
        const suffix = targetName ? ` → ${targetName}` : ' · 待连接';
        this.summaryText.setText(formatSortHandSummary(this.activeCard, graph));
        this.titleText.setText(`${this.activeCard.definition.name} · ${modeLabel}${suffix}`);
        this.buildModeTabs();
        this.refreshAdvanced();
        this.showAllBtn.setVisible(this.activeMode === 'store' && !this.showAllStorable);
        this.buildGrid();
        this.bringChromeToFront();
    }
    buildModeTabs() {
        this.tabRow.removeAll(true);
        this.tabButtons.clear();
        const showTabs = this.availableModes.length > 1;
        this.tabRow.setVisible(showTabs);
        this.tabBarShield.setVisible(showTabs);
        if (!showTabs)
            return;
        const tabs = [];
        for (const modeId of this.availableModes) {
            const def = SORT_MODES.find((m) => m.id === modeId);
            if (!def)
                continue;
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
            tab.on('pointerdown', (p) => {
                p.event.stopPropagation();
                if (!this.activeCard || this.activeMode === modeId)
                    return;
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
    refreshAdvanced() {
        this.advancedToggle.setText(this.advancedOpen ? '高级 ▲' : '高级 ▼');
        this.weightRow.removeAll(true);
        this.advancedRow.setVisible(this.advancedOpen);
        if (!this.advancedOpen || !this.activeCard)
            return;
        const current = getSortHandWeight(this.activeCard);
        for (let w = SORT_WEIGHT_MIN; w <= SORT_WEIGHT_MAX; w += 1) {
            const btn = this.scene.add
                .text((w - 1) * 30, 0, String(w), {
                fontSize: '11px',
                color: current === w ? '#f0e8d8' : '#8a8070',
                backgroundColor: current === w ? '#6a7a5a' : '#2a2620',
                padding: { x: 6, y: 3 },
            })
                .setOrigin(0, 0.5)
                .setInteractive({ useHandCursor: true });
            btn.on('pointerdown', (p) => {
                p.event.stopPropagation();
                if (!this.activeCard)
                    return;
                setSortHandWeight(this.activeCard, w);
                this.refreshAdvanced();
                this.scene.events.emit('sort-hand-config-changed', { card: this.activeCard });
                this.scene.events.emit('drag-toast', `分拣优先级：${w}`);
            });
            this.weightRow.add(btn);
        }
    }
    buildGrid() {
        if (!this.activeCard)
            return;
        const entries = this.collectGridEntries();
        this.measureThumbSlot(entries);
        this.layoutGridSpacing(entries.length);
        this.shelfMaxScroll = Math.max(0, SHELF_CONTENT_PAD * 2 +
            Math.ceil(entries.length / GRID_COLS) * this.shelfRowStride -
            SHELF_VIEW_H);
        this.shelfScroll = Phaser.Math.Clamp(this.shelfScroll, 0, this.shelfMaxScroll);
        this.populateGrid();
    }
    collectGridEntries() {
        const card = this.activeCard;
        const graph = this.getGraph();
        const dayIndex = this.scene.registry.get('dayIndex') ?? 1;
        const filterId = getSortFilterCardId(card);
        if (this.availableModes.length === 0) {
            return [
                {
                    key: '__hint__',
                    cardId: null,
                    title: '未连接',
                    subtitle: '靠近商店、工房或储物棚后重试',
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
                    subtitle: `${listing.costCaps} 筹`,
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
            const recipes = listFeedRecipesForSortHand(card, graph, dataStore.getRecipes(), dayIndex);
            if (recipes.length === 0) {
                return [
                    {
                        key: '__hint__',
                        cardId: null,
                        title: '无法供料',
                        subtitle: '连接工房，并确保上游有投放仓储',
                        filterCardId: filterId,
                    },
                ];
            }
            return recipes.slice(0, 24).map((recipe) => this.recipeToEntry(recipe));
        }
        if (this.activeMode === 'store') {
            return buildStoreGridEntries(card, graph, this.stacks, dataStore.getAllCards(), this.showAllStorable);
        }
        return listSellableCardIds(this.shopCatalog, dataStore.getAllCards())
            .slice(0, 24)
            .map((id) => {
            const def = dataStore.getCard(id);
            return {
                key: id,
                cardId: id,
                title: def?.name ?? id,
                subtitle: '可收购',
                filterCardId: id,
            };
        });
    }
    recipeToEntry(recipe) {
        const outId = recipe.output?.cardId ?? recipe.id;
        const inputId = firstInputCardId(recipe);
        const out = dataStore.getCard(outId);
        return {
            key: recipe.id,
            cardId: outId,
            title: out?.name ?? recipe.id,
            subtitle: inputId ? `供料 ${formatRecipeInputs(recipe)}` : undefined,
            filterCardId: inputId,
        };
    }
    measureThumbSlot(entries) {
        const probe = entries.find((e) => e.cardId)?.cardId;
        if (!probe) {
            this.shelfMaxThumbH = 112;
            this.shelfMaxThumbW = 56;
            return;
        }
        const thumb = createCardThumb(this.scene, probe, {
            scale: THUMB_SCALE,
            uniformStandard: true,
            compactPrice: true,
        });
        if (!thumb) {
            this.shelfMaxThumbH = 112;
            this.shelfMaxThumbW = 56;
            return;
        }
        this.shelfMaxThumbH = thumb.getData('thumbH') || 112;
        this.shelfMaxThumbW = thumb.getData('thumbW') || 56;
        thumb.destroy(true);
    }
    colGapFor(countInRow) {
        const w = this.shelfMaxThumbW;
        if (countInRow <= 1)
            return 0;
        return Phaser.Math.Clamp((SHELF_CLIP_W - countInRow * w) / (countInRow - 1), SHELF_GAP_MIN, SHELF_GAP_MAX);
    }
    shelfColX(col) {
        const w = this.shelfMaxThumbW;
        const gap = this.shelfColGap;
        const rowLeft = -SHELF_CLIP_W / 2;
        return rowLeft + col * (w + gap) + w / 2;
    }
    layoutGridSpacing(count) {
        const h = this.shelfMaxThumbH;
        const rows = Math.ceil(Math.max(count, 1) / GRID_COLS);
        this.shelfColGap = this.colGapFor(GRID_COLS);
        if (rows <= 1) {
            this.shelfRowGap = 0;
        }
        else {
            const minContentH = SHELF_CONTENT_PAD * 2 + rows * h + (rows - 1) * SHELF_GAP_MIN;
            if (minContentH <= SHELF_VIEW_H) {
                let gap = (SHELF_VIEW_H - SHELF_CONTENT_PAD * 2 - rows * h) / (rows - 1);
                gap = Phaser.Math.Clamp(gap, SHELF_GAP_MIN, SHELF_GAP_MAX);
                const total = SHELF_CONTENT_PAD * 2 + rows * h + (rows - 1) * gap;
                this.shelfRowGap = total > SHELF_VIEW_H ? SHELF_GAP_MIN : gap;
            }
            else {
                this.shelfRowGap = SHELF_GAP_MIN;
            }
        }
        this.shelfRowStride = h + this.shelfRowGap;
    }
    populateGrid() {
        this.gridShelf.removeAll(true);
        if (!this.activeCard)
            return;
        const entries = this.collectGridEntries();
        const filterId = getSortFilterCardId(this.activeCard);
        const maxThumbH = this.shelfMaxThumbH;
        const scrollTop = this.shelfScroll;
        const scrollBottom = scrollTop + SHELF_VIEW_H;
        const totalRows = Math.ceil(entries.length / GRID_COLS);
        const rowStride = this.shelfRowStride;
        const firstRow = Math.max(0, Math.floor((scrollTop - SHELF_CONTENT_PAD) / rowStride) - 1);
        const lastRow = Math.min(totalRows - 1, Math.ceil((scrollBottom - SHELF_CONTENT_PAD) / rowStride) + 1);
        for (let row = firstRow; row <= lastRow; row++) {
            const rowTop = SHELF_CONTENT_PAD + row * rowStride;
            const rowStart = row * GRID_COLS;
            const countInRow = Math.min(GRID_COLS, entries.length - rowStart);
            for (let col = 0; col < countInRow; col++) {
                const entry = entries[rowStart + col];
                const x = this.shelfColX(col);
                const selected = entry.key === '__hint__'
                    ? false
                    : entry.filterCardId === filterId ||
                        (entry.filterCardId === null && filterId === null);
                const tile = entry.cardId != null
                    ? this.createCardTile(entry, selected)
                    : this.createTextTile(entry, selected);
                const thumbTop = rowTop - scrollTop;
                const thumbBottom = thumbTop + maxThumbH;
                if (thumbTop < 0 || thumbBottom > SHELF_VIEW_H)
                    continue;
                tile.setPosition(x, rowTop + maxThumbH / 2 - scrollTop);
                this.gridShelf.add(tile);
            }
        }
    }
    createCardTile(entry, selected) {
        const container = this.scene.add.container(0, 0);
        const thumb = createCardThumb(this.scene, entry.cardId, {
            scale: THUMB_SCALE,
            uniformStandard: true,
            compactPrice: true,
            title: entry.title,
            subtitle: entry.subtitle,
            priceBelowCard: true,
        });
        if (thumb)
            container.add(thumb);
        if (selected) {
            const w = thumb?.getData('thumbW') || this.shelfMaxThumbW;
            const h = thumb?.getData('thumbH') || this.shelfMaxThumbH;
            const ring = this.scene.add.rectangle(0, 0, w + 6, h + 6);
            ring.setStrokeStyle(2, 0x6a7a5a, 1);
            ring.setFillStyle(0x000000, 0);
            container.addAt(ring, 0);
        }
        if (entry.key !== '__hint__') {
            const hitW = thumb?.getData('thumbW') || this.shelfMaxThumbW;
            const hitH = thumb?.getData('thumbH') || this.shelfMaxThumbH;
            container.setSize(hitW, hitH);
            container.setInteractive(new Phaser.Geom.Rectangle(-hitW / 2, -hitH / 2, hitW, hitH), Phaser.Geom.Rectangle.Contains);
            container.on('pointerdown', (p) => {
                p.event.stopPropagation();
                this.selectEntry(entry);
            });
        }
        return container;
    }
    createTextTile(entry, selected) {
        const container = this.scene.add.container(0, 0);
        const w = this.shelfMaxThumbW;
        const h = this.shelfMaxThumbH;
        const bg = this.scene.add.rectangle(0, 0, w, h, selected ? 0x3a4030 : 0x2a2820, 1);
        bg.setStrokeStyle(2, selected ? 0x6a7a5a : 0x4a4840, 1);
        const title = this.scene.add.text(0, -8, entry.title, {
            fontSize: '11px',
            color: '#c9c0b0',
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
        if (sub)
            container.add(sub);
        if (entry.key !== '__hint__') {
            container.setSize(w, h);
            container.setInteractive(new Phaser.Geom.Rectangle(-w / 2, -h / 2, w, h), Phaser.Geom.Rectangle.Contains);
            container.on('pointerdown', (p) => {
                p.event.stopPropagation();
                this.selectEntry(entry);
            });
        }
        return container;
    }
    selectEntry(entry) {
        if (!this.activeCard || entry.key === '__hint__')
            return;
        if (entry.filterCardId) {
            setSortFilterCardId(this.activeCard, entry.filterCardId);
        }
        else {
            clearSortFilterCardId(this.activeCard);
        }
        this.scene.events.emit('sort-hand-config-changed', { card: this.activeCard });
        const def = entry.filterCardId ? dataStore.getCard(entry.filterCardId) : null;
        const label = def?.name ?? entry.title;
        this.scene.events.emit('drag-toast', `已选：${label}`);
        this.refreshChrome();
    }
    bringChromeToFront() {
        this.bringToTop(this.shelfBottomCover);
        this.bringToTop(this.tabBarShield);
        this.bringToTop(this.titleBar);
        this.bringToTop(this.titleText);
        this.bringToTop(this.closeBtn);
        this.bringToTop(this.summaryText);
        this.bringToTop(this.tabRow);
        this.bringToTop(this.hintText);
        this.bringToTop(this.advancedToggle);
        this.bringToTop(this.advancedRow);
        this.bringToTop(this.showAllBtn);
        this.bringToTop(this.doneBtn);
    }
    syncPanelBounds() {
        const panelLeft = this.x - PANEL_W / 2;
        const panelTop = this.y - PANEL_H / 2;
        this.panelScreenBounds.setTo(panelLeft, panelTop, PANEL_W, PANEL_H);
        const shelfTop = this.y + this.getShelfViewTop();
        this.shelfViewBounds.setTo(this.x - PANEL_W / 2 + SHELF_PAD_X, shelfTop, SHELF_CLIP_W, SHELF_VIEW_H);
    }
}
