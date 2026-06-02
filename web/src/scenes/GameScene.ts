import Phaser from 'phaser';



import { CardSpawner } from '../core/CardSpawner';
import { getCardQuantity } from '../core/cardQuantity';

import { collectCardsFromCache } from '../core/loadCards';

import { dataStore } from '../core/DataStore';

import type { GrowthTables } from '../core/GrowthTables';

import { effectRunner } from '../core/EffectRunner';

import GameCard, { boardDepthFromY } from '../objects/GameCard';

import { CardDragSystem } from '../systems/CardDragSystem';

import { CardStackSystem } from '../systems/CardStackSystem';

import { DefenseTurretSystem } from '../systems/DefenseTurretSystem';

import { EnemyStatusSystem } from '../systems/EnemyStatusSystem';

import { PlantActivationSystem } from '../systems/PlantActivationSystem';
import { PlacedVisualSystem } from '../systems/PlacedVisualSystem';

import { PlantAttackVfxSystem } from '../systems/PlantAttackVfxSystem';

import { InvasionSystem } from '../systems/InvasionSystem';

import { MutantGrowthSystem } from '../systems/MutantGrowthSystem';

import { CraftStationSystem } from '../systems/CraftStationSystem';

import { RanchSystem } from '../systems/RanchSystem';


import { InvasionConfig } from '../core/InvasionConfig';
import { BaseCampSystem } from '../systems/BaseCampSystem';
import { BarrierSystem } from '../systems/BarrierSystem';
import { DefenseCraftSystem } from '../systems/DefenseCraftSystem';
import { ShelterSystem } from '../systems/ShelterSystem';
import { TrapSystem } from '../systems/TrapSystem';
import { WorkSiteSystem } from '../systems/WorkSiteSystem';

import GameBackground from '../ui/GameBackground';
import HandBar from '../ui/HandBar';
import ActionBar from '../ui/ActionBar';

import {

  computeLayout,

  readSafeBottom,

  readSafeTop,

  type GameLayoutRects,

} from '../ui/LayoutManager';

import {
  computeStarterBoardLayout,
  computeStarterLogisticsLayout,
} from '../config/starterBoardLayout';
import { parseAutomationConfig, REGISTRY_AUTOMATION_CONFIG } from '../core/automationConfig';
import { parseLinkVisual, REGISTRY_LINK_VISUAL } from '../core/linkVisualConfig';
import { setSortFilterCardId, setSortMode } from '../core/sortHandRules';
import { AutomationSystem } from '../systems/AutomationSystem';
import { SortHandBuildingSystem } from '../systems/SortHandBuildingSystem';
import { SortHandHudSystem } from '../systems/SortHandHudSystem';
import { ConveyorLinkRenderer } from '../ui/ConveyorLinkRenderer';
import { SortHandPanel } from '../ui/SortHandPanel';
import { clampCardCenter, clampStackToPlayfield } from '../ui/playfieldClamp';
import { tweenCardEnter } from '../ui/dragFx';

import StackLane from '../ui/StackLane';
import { StackDropHint } from '../ui/StackDropHint';
import type { StackDropPreview } from '../core/stackOutcomePreview';

import TopHud, { type ResourceSnapshot } from '../ui/TopHud';
import { DropConfig } from '../core/DropConfig';
import { ShopCatalog } from '../core/ShopCatalog';
import { DropSystem } from '../systems/DropSystem';
import { ShopBuildingSystem } from '../systems/ShopBuildingSystem';
import { StorageBuildingSystem } from '../systems/StorageBuildingSystem';
import TradePanel from '../ui/TradePanel';
import StoragePanel from '../ui/StoragePanel';
import GuidePanel, { type PlayerGuideData } from '../ui/GuidePanel';
import { deliverToPlayerWarehouse } from '../core/automationDelivery';
import { pullFromWarehouse } from '../core/storageInventory';



export default class GameScene extends Phaser.Scene {

  private stackSystem!: CardStackSystem;



  private dragSystem!: CardDragSystem;



  private background?: GameBackground;



  private topHud!: TopHud;

  private backpackBar!: HandBar;

  private actionBar!: ActionBar;

  private stackLane!: StackLane;



  private layout!: GameLayoutRects;



  private spawner!: CardSpawner;



  private workSites!: WorkSiteSystem;



  private mutantGrowth!: MutantGrowthSystem;



  private invasion!: InvasionSystem;



  private baseCamp!: BaseCampSystem;

  private barriers!: BarrierSystem;

  private shelter!: ShelterSystem;

  private invasionConfig!: InvasionConfig;

  private readonly dropConfig = new DropConfig();

  private readonly shopCatalog = new ShopCatalog();

  private tradePanel?: TradePanel;

  private storagePanel?: StoragePanel;

  private guidePanel?: GuidePanel;

  private shopBuilding!: ShopBuildingSystem;

  private sortHandPanel?: SortHandPanel;

  private resources: ResourceSnapshot = { food: 4, water: 3, caps: 2 };



  private gameOver = false;



  private toast?: Phaser.GameObjects.Text;



  constructor() {

    super({ key: 'Game' });

  }



  create(): void {

    if (dataStore.getAllCards().length === 0) {

      dataStore.setCards(collectCardsFromCache(this.cache));

    }

    this.dropConfig.load(this.cache.json.get('invasion_drops'));
    this.shopCatalog.load(this.cache.json.get('shop'));
    this.shopCatalog.buildTestFreeListings(dataStore.getAllCards());
    this.registry.set(
      REGISTRY_AUTOMATION_CONFIG,
      parseAutomationConfig(this.cache.json.get('logistics_automation')),
    );
    this.registry.set(
      REGISTRY_LINK_VISUAL,
      parseLinkVisual(this.cache.json.get('logistics_link_visual')),
    );
    const starterRecipes = this.cache.json.get('recipes_starter') as {
      recipes: import('../types/gameData').RecipeDefinition[];
    };
    const facilityRecipes = this.cache.json.get('recipes_facility') as {
      recipes: import('../types/gameData').RecipeDefinition[];
    };
    dataStore.setRecipes([
      ...(starterRecipes?.recipes ?? []),
      ...(facilityRecipes?.recipes ?? []),
    ]);



    this.layout = this.computeCurrentLayout();



    this.stackSystem = new CardStackSystem(this);

    const stackDropHint = new StackDropHint(this);

    this.dragSystem = new CardDragSystem(

      this,

      this.stackSystem,

      (result) => {
        if (result.stacked && result.targetName) {
          this.showToast(`已叠放：${result.card.definition.name} → ${result.targetName}`);
        }
      },
      (sx, sy) => this.blocksBoardDrag(sx, sy),
    );

    this.dragSystem.setDropHint(stackDropHint);

    this.spawner = new CardSpawner(this, this.stackSystem, this.dragSystem);

    this.actionBar = new ActionBar(this, this.stackSystem, this.spawner, {
      getInventory: () => this.backpackBar.inventory,
    });

    this.backpackBar = new HandBar(this, this.stackSystem, this.spawner, {
      orientation: 'vertical',
      title: '背包',
      emptyHint: '获得的卡牌\n拖出放置',
      onTradeSellDrop: (cardId, sx, sy, wx, wy) => this.tryTradeSell(cardId, sx, sy, wx, wy),
      onTradeSellHint: (cardId, wx, wy) => this.getSellDropPreview(cardId, wx, wy),
      onActionBarDrop: (cardId, sx, sy) => this.actionBar.acceptFromBackpack(cardId, sx, sy),
      onDragHover: (sx, sy) => this.updateActionBarDropHover(sx, sy),
    });
    this.backpackBar.setDropHint(stackDropHint);
    this.actionBar.setDropHint(stackDropHint);

    this.dragSystem.setStoreInHand((card, sx, sy) => {
      if (!this.backpackBar.containsScreenPoint(sx, sy)) return false;
      if (!this.backpackBar.canStoreBoardCard(card)) {
        this.showToast('该卡无法收入背包', '#8b5a3a');
        return false;
      }
      const name = card.definition.name;
      if (!this.backpackBar.storeBoardCard(card, this.dragSystem)) return false;
      this.showToast(`已收入背包：${name}`, '#8a9a7a');
      return true;
    });

    this.dragSystem.setDropToActionBar((card, sx, sy) => {
      if (!this.actionBar.containsScreenPoint(sx, sy)) return false;
      if (!this.actionBar.acceptFromBoard(card, this.dragSystem, sx, sy)) return false;
      this.showToast(`已放入操作栏：${card.definition.name}`, '#8a9a7a');
      return true;
    });

    this.dragSystem.setHoverScreen((sx, sy) => this.updateActionBarDropHover(sx, sy));

    this.dragSystem.setPlayfieldBounds(() => this.layout?.playfield);

    this.dragSystem.setSellDrop((card, sx, sy) => this.tryTradeSellBoard(card, sx, sy));

    new PlacedVisualSystem(this, this.stackSystem);

    const growthTables = this.cache.json.get('growth') as GrowthTables;

    this.workSites = new WorkSiteSystem(this, this.stackSystem, this.spawner);

    this.mutantGrowth = new MutantGrowthSystem(

      this,

      this.stackSystem,

      this.spawner,

      growthTables,

    );

    this.events.on('worksite-produced', ({ outputCardId }: { outputCardId: string }) => {
      const def = dataStore.getCard(outputCardId);
      this.showToast(`产出：${def?.name ?? outputCardId}`, '#8a9a7a');
    });

    this.events.on('hand-add', ({ cardId }: { cardId: string }) => {
      this.backpackBar.addCard(cardId, 1);
    });

    this.events.on('card-removed', (card: GameCard) => {
      this.dragSystem.unregisterCard(card);
    });

    this.events.on('drag-toast', (msg: string) => this.showToast(msg, '#8a9a7a'));

    this.events.on('mutant-growth-started', () => {

      this.showToast('变异种子生长中…', '#6a8a5a');

    });

    this.events.on('mutant-growth-complete', ({ plantId }: { plantId: string }) => {

      const def = dataStore.getCard(plantId);

      this.showToast(`长成：${def?.name ?? plantId}`, '#6a9a6a');
      if (plantId === 'plant_acid_bloom') {
        this.showToast('叠加强酸瓶以激活酸蚀花', '#8a9a7a');
      }

    });

    this.events.on('mutant-growth-failed', () => {

      this.showToast('生长失败：污壤污染', '#8b5a3a');

    });

    this.events.on(
      'worksite-depleted',
      (payload: { nodeName: string }) => {
        this.showToast(`${payload.nodeName} 已采尽`, '#8a7a5a');
      },
    );

    this.events.on('invasion-spawn', () => {

      this.showToast('变异体逼近！', '#9a4a4a');

    });

    this.invasionConfig = new InvasionConfig();
    this.invasionConfig.load(
      this.cache.json.get('invasion_enemies'),
      this.cache.json.get('invasion_waves'),
    );

    this.baseCamp = new BaseCampSystem(this);
    this.barriers = new BarrierSystem(this);
    this.shelter = new ShelterSystem(this, this.stackSystem);

    this.events.on('base-hp-changed', () => this.syncBaseHud());
    this.events.on('base-repaired', ({ amount }: { amount: number }) => {
      this.showToast(`大本营修复 +${amount}`, '#6a9a6a');
    });
    this.events.on('base-supply-deposited', ({ food, water }: { food: number; water: number }) => {
      if (food > 0) {
        this.resources.food += food;
        this.showToast(food > 1 ? `食物 +${food}` : '食物 +1', '#8a9a7a');
      }
      if (water > 0) {
        this.resources.water += water;
        this.showToast(water > 1 ? `净水 +${water}` : '净水 +1', '#8a9a7a');
      }
      if (food > 0 || water > 0) {
        this.topHud.setResources(this.resources);
      }
    });
    this.events.on('base-day-regen', ({ amount }: { amount: number }) => {
      this.showToast(`每日休整：本营 +${amount}`, '#8a9a7a');
    });
    this.events.on('barrier-destroyed', ({ name }: { name: string }) => {
      this.showToast(`${name} 被毁！`, '#8b5a3a');
    });
    this.events.on('trap-triggered', ({ damage, killed }: { damage: number; killed: boolean }) => {
      if (killed) this.showToast(`陷阱命中！消灭入侵者`, '#6a8a5a');
      else this.showToast(`陷阱造成 ${damage} 伤害`, '#8a9a7a');
    });
    this.events.on('invasion-surge', () => {
      this.showToast('日末涌动！大量变异体来袭', '#b04040');
    });

    this.events.on('enemy-reached-base', ({ damage }: { damage: number }) => {
      if (this.gameOver) return;
      const mult = this.shelter.getBaseDamageMultiplier();
      if (mult < 1) {
        this.shelter.consumeCharge();
        this.showToast('掩体减伤！', '#8a9a7a');
      }
      this.baseCamp.setDamageMultiplier(mult);
      this.baseCamp.damage(damage);
      this.baseCamp.setDamageMultiplier(1);
      this.syncBaseHud();
      const applied = Math.max(1, Math.round(damage * mult));
      this.showToast(`大本营遭袭！耐久 -${applied}`, '#b04040');
    });

    this.events.on('base-destroyed', () => this.onBaseDestroyed());

    this.events.on('enemy-reached-survivor', () => {

      if (this.gameOver) return;

      this.resources.food = Math.max(0, this.resources.food - 1);

      this.syncBaseHud();

      this.showToast('幸存者遭到袭击！食物 -1', '#b04040');

    });



    this.drawBackground();

    this.setupHud();

    this.setupMetaUi();

    this.stackLane = new StackLane(
      this,
      this.stackSystem,
      this.workSites,
      this.mutantGrowth,
    );

    this.applyLayout();



    this.spawnStarterBoard();



    const traps = new TrapSystem(this);
    this.invasion = new InvasionSystem(
      this,
      this.spawner,
      this.baseCamp,
      this.barriers,
      traps,
      this.invasionConfig,
    );
    traps.bindInvasion(this.invasion);

    const enemyStatus = new EnemyStatusSystem(this, this.invasion);
    this.invasion.bindStatusSystem(enemyStatus);

    new DefenseCraftSystem(this, this.stackSystem, this.baseCamp, this.barriers);

    new CraftStationSystem(this, this.stackSystem, this.spawner);

    new RanchSystem(this, this.stackSystem, this.spawner);

    new DropSystem(this, this.spawner, this.dropConfig, this.invasionConfig);

    this.shopBuilding = new ShopBuildingSystem(this, this.stackSystem);
    new StorageBuildingSystem(this, this.stackSystem);
    this.wireShopTradeHandlers();

    new SortHandBuildingSystem(this);
    new SortHandHudSystem(this);
    new AutomationSystem(
      this,
      this.stackSystem,
      this.spawner,
      this.dragSystem,
      this.shopCatalog,
      this.resources,
    );
    new ConveyorLinkRenderer(this);
    this.events.on('automation-sold', () => this.syncBaseHud());
    this.events.on('automation-bought', () => this.syncBaseHud());

    const plantActivation = new PlantActivationSystem(this, this.stackSystem);
    const plantAttackVfx = new PlantAttackVfxSystem(this, this.invasion, enemyStatus);
    new DefenseTurretSystem(
      this,
      this.invasion,
      plantAttackVfx,
      enemyStatus,
      plantActivation,
    );



    this.setupDayCycle();



    this.events.on('day-end', () => this.onDayEnd());



    this.scale.on('resize', this.handleResize, this);

    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {

      this.scale.off('resize', this.handleResize, this);

      this.dragSystem.destroy();

      this.workSites.destroy();

      this.mutantGrowth.destroy();

      this.invasion.destroy();

    });

  }



  private blocksBoardDrag(sx: number, sy: number): boolean {
    if (this.backpackBar.isDraggingFromHand() || this.actionBar.isDraggingFromBar()) {
      return false;
    }
    if (this.sortHandPanel?.containsPanelPoint(sx, sy) === true) {
      const active = this.sortHandPanel.getActiveCard();
      if (active && this.isScreenPointOnCard(sx, sy, active)) {
        return false;
      }
      return true;
    }
    return (
      this.layout.topHud.contains(sx, sy) ||
      this.layout.stackLane.contains(sx, sy) ||
      this.layout.backpackBar.contains(sx, sy) ||
      this.layout.actionBar.contains(sx, sy) ||
      this.tradePanel?.containsPanelPoint(sx, sy) === true ||
      this.storagePanel?.containsPanelPoint(sx, sy) === true ||
      this.guidePanel?.containsPanelPoint(sx, sy) === true
    );
  }

  private isScreenPointOnCard(sx: number, sy: number, card: GameCard): boolean {
    const out = new Phaser.Math.Vector2();
    this.cameras.main.getWorldPoint(sx, sy, out);
    const hw = card.cardWidth / 2;
    const hh = card.cardHeight / 2;
    return (
      out.x >= card.x - hw &&
      out.x <= card.x + hw &&
      out.y >= card.y - hh &&
      out.y <= card.y + hh
    );
  }



  private computeCurrentLayout(): GameLayoutRects {

    const { width, height } = this.scale;

    return computeLayout(

      width,

      height,

      readSafeTop(this.game.canvas),

      readSafeBottom(),

    );

  }



  private applyLayout(): void {

    this.layout = this.computeCurrentLayout();

    const { width, height } = this.scale;

    const { topHud, playfield } = this.layout;

    this.topHud.applyLayout(topHud.centerX, topHud.y + topHud.height / 2, width, topHud.height);

    this.backpackBar.applyLayout(this.layout, this.layout.backpackBar);
    this.actionBar.applyLayout(this.layout, this.layout.actionBar);

    this.stackLane.applyLayout(this.layout);

    this.tradePanel?.applyLayout(width / 2, height / 2, width, height);
    this.storagePanel?.applyLayout(width / 2, height / 2, width, height);
    this.sortHandPanel?.applyLayout(width / 2, height / 2, width, height);
    this.guidePanel?.applyLayout(width / 2, height / 2, width, height);

    this.background?.layoutPlayfield(playfield);

    this.registry.set('playfield', playfield);
    this.clampAllBoardCards();

    this.events.emit('layout-changed', this.layout);
  }

  private clampAllBoardCards(): void {
    const pf = this.layout.playfield;
    for (const stack of this.stackSystem.getAllStacks()) {
      clampStackToPlayfield(this.stackSystem, stack, pf);
    }
  }



  private drawBackground(): void {

    const { width, height } = this.scale;

    this.background = new GameBackground(this, width, height);

  }



  private setupHud(): void {

    const { width } = this.scale;

    const { topHud } = this.layout;

    this.topHud = new TopHud(

      this,

      topHud.centerX,

      topHud.y + topHud.height / 2,

      width,

    );

    this.topHud.setResources(this.resources);

    this.events.on('hud-action', ({ key }: { key: string; speed?: number }) => {
      if (key === 'guide') {
        this.guidePanel?.toggle();
      } else if (key === 'settings') {
        this.showToast('设置（即将推出）', '#8a9a7a');
      } else if (key === 'speed') {
        this.showToast('加速（即将推出）', '#8a9a7a');
      }
    });
  }

  private setupMetaUi(): void {
    const { width, height } = this.scale;

    this.tradePanel = new TradePanel(this, this.shopCatalog, {
      getCaps: () => this.resources.caps,
      trySpendCaps: (amount) => {
        if (this.resources.caps < amount) return false;
        this.resources.caps -= amount;
        this.syncBaseHud();
        return true;
      },
      refundCaps: (amount) => {
        this.resources.caps += amount;
        this.syncBaseHud();
        return true;
      },
      onBuyCardToPlayfield: (cardId, count, sx, sy, label) => {
        if (!dataStore.getCard(cardId)) return false;
        const pf = this.layout?.playfield;
        if (!pf || !pf.contains(sx, sy)) return false;

        const card = this.spawner.spawn(cardId, sx, sy, count);
        if (!card) return false;

        clampCardCenter(pf, card);
        card.setDepth(boardDepthFromY(card.y));
        tweenCardEnter(this, card, 1);
        this.showToast(`购入：${label}`, '#8a9a7a');
        return true;
      },
      isPlayfieldPoint: (sx, sy) => {
        const pf = this.layout?.playfield;
        return pf ? pf.contains(sx, sy) : false;
      },
      onSellCard: (cardId) => {
        const def = dataStore.getCard(cardId);
        if (!def) return 0;
        const caps = this.shopCatalog.resolveSellCaps(cardId, def.tags ?? []);
        if (caps <= 0) return 0;
        this.resources.caps += caps;
        this.syncBaseHud();
        return caps;
      },
    });

    const cx = width / 2;
    const cy = height / 2;
    this.tradePanel.applyLayout(cx, cy, width, height);

    this.storagePanel = new StoragePanel(this, this.stackSystem, {
      isPlayfieldPoint: (sx, sy) => {
        const pf = this.layout?.playfield;
        return pf ? pf.contains(sx, sy) : false;
      },
      onWithdrawToPlayfield: (warehouse, cardId, count, sx, sy, label) => {
        if (!dataStore.getCard(cardId)) return false;
        const pf = this.layout?.playfield;
        if (!pf || !pf.contains(sx, sy)) return false;

        const taken = pullFromWarehouse(this.stackSystem, warehouse, cardId, count);
        if (taken <= 0) return false;

        const card = this.spawner.spawn(cardId, sx, sy, taken);
        if (!card) {
          deliverToPlayerWarehouse(
            this.stackSystem,
            this.spawner,
            this.dragSystem,
            warehouse,
            cardId,
            taken,
          );
          return false;
        }

        clampCardCenter(pf, card);
        card.setDepth(boardDepthFromY(card.y));
        tweenCardEnter(this, card, 1);
        this.dragSystem.registerCard(card);
        this.showToast(`取出：${label}`, '#8a9a7a');
        return true;
      },
    });
    this.storagePanel.applyLayout(cx, cy, width, height);

    this.events.on('shop-trade-open', ({ card }: { card: GameCard }) => {
      this.tradePanel?.openTrade(card);
    });

    this.events.on('storage-panel-open', ({ card }: { card: GameCard }) => {
      this.storagePanel?.openStorage(card);
    });

    this.events.on('stack-changed', (stack: { base: GameCard }) => {
      this.storagePanel?.refreshIfOpen(stack.base);
    });

    const guideData = this.cache.json.get('player_guide') as PlayerGuideData | undefined;
    if (guideData?.tabs?.length) {
      this.guidePanel = new GuidePanel(this, guideData);
      this.guidePanel.applyLayout(cx, cy, width, height);
    }

    this.sortHandPanel = new SortHandPanel(this, this.stackSystem, this.shopCatalog, () => {});
    this.sortHandPanel.applyLayout(cx, cy, width, height);
    this.events.on('sort-hand-panel-open', ({ card }: { card: GameCard }) => {
      this.tradePanel?.close();
      this.storagePanel?.close();
      this.sortHandPanel?.open(card);
    });
  }

  private updateActionBarDropHover(sx: number, sy: number): void {
    if (sx < 0) {
      this.actionBar.setDropHover(false);
      return;
    }
    this.actionBar.setDropHover(this.actionBar.containsScreenPoint(sx, sy));
  }

  private wireShopTradeHandlers(): void {
    this.dragSystem.setSellHint((card, wx, wy) =>
      this.getSellDropPreview(card.definition.id, wx, wy, card, getCardQuantity(card)),
    );
  }

  private isSellDropTarget(
    sx: number,
    sy: number,
    dragged?: GameCard,
    wx?: number,
    wy?: number,
  ): boolean {
    if (this.shopBuilding.findShopAtScreen(sx, sy)) return true;
    if (dragged && this.shopBuilding.findShopForSell(dragged)) return true;
    if (wx !== undefined && wy !== undefined && this.shopBuilding.findShopAtWorld(wx, wy)) {
      return true;
    }
    return false;
  }

  private getSellDropPreview(
    cardId: string,
    wx: number,
    wy: number,
    dragged?: GameCard,
    quantity = 1,
  ): StackDropPreview | null {
    const ptr = this.input.activePointer;
    const overTarget =
      (dragged && this.shopBuilding.findShopForSell(dragged) !== null) ||
      this.shopBuilding.findShopAtWorld(wx, wy) !== null ||
      this.shopBuilding.findShopAtScreen(ptr.x, ptr.y) !== null;

    if (!overTarget) return null;

    const def = dataStore.getCard(cardId);
    const unitCaps = this.shopCatalog.resolveSellCaps(cardId, def?.tags ?? []);
    if (unitCaps <= 0) {
      return { primary: '无法收购', secondary: '商人不要' };
    }
    const caps = unitCaps * quantity;
    const primary =
      quantity > 1 ? `收购 +${caps} 筹 (×${quantity})` : `收购 +${caps} 筹`;
    return { primary, secondary: '松手卖出' };
  }

  private executeSell(cardId: string, quantity = 1): boolean {
    const def = dataStore.getCard(cardId);
    if (!def) return false;
    const unitCaps = this.shopCatalog.resolveSellCaps(cardId, def.tags ?? []);
    if (unitCaps <= 0) {
      this.showToast('商人不要这个', '#8b5a3a');
      return false;
    }
    const caps = unitCaps * quantity;
    this.resources.caps += caps;
    this.syncBaseHud();
    this.tradePanel?.refreshCapsIfOpen();
    this.showToast(`出售 +${caps} 筹码`, '#8a9a7a');
    return true;
  }

  private tryTradeSell(
    cardId: string,
    sx: number,
    sy: number,
    wx?: number,
    wy?: number,
  ): boolean {
    if (!this.isSellDropTarget(sx, sy, undefined, wx, wy)) return false;
    return this.executeSell(cardId);
  }

  private tryTradeSellBoard(card: GameCard, sx: number, sy: number): boolean {
    const tags = card.definition.tags ?? [];
    if (tags.includes('shop') || tags.includes('base')) return false;
    if (!this.isSellDropTarget(sx, sy, card)) return false;
    return this.executeSell(card.definition.id, getCardQuantity(card));
  }

  private handleResize(gameSize: Phaser.Structs.Size): void {

    const { width, height } = gameSize;

    this.background?.resize(width, height);

    this.applyLayout();



    if (this.toast) {

      const pf = this.layout.playfield;

      this.toast.setPosition(pf.centerX, pf.bottom - 24);

    }

  }



  private spawnStarterBoard(): void {
    const layout = computeStarterBoardLayout(this.layout.playfield);
    for (const item of layout) {
      this.placeStarterCard(item);
    }

    const logistics = computeStarterLogisticsLayout(this.layout.playfield);
    for (const item of logistics) {
      const card = this.placeStarterCard(item);
      if (item.id === 'auto_sort_hand' && card && item.sortMode) {
        setSortMode(card, item.sortMode);
        if (item.sortFilter) setSortFilterCardId(card, item.sortFilter);
      }
    }

    this.clampAllBoardCards();
    this.backpackBar.addCard('test_shop', 1);
    this.syncBaseHud();
    this.showToast('物流演示：点击分拣手配置 卖/买/存/供料', '#8a9a7a');
  }

  private placeStarterCard(item: { id: string; x: number; y: number; quantity?: number }): GameCard | null {
    const def = dataStore.getCard(item.id);
    if (!def) return null;
    const card = new GameCard(this, item.x, item.y, def);
    if (item.quantity != null && item.quantity > 1) {
      card.setQuantity(item.quantity);
    }
    card.setDepth(boardDepthFromY(item.y));
    this.stackSystem.registerBase(card);
    this.dragSystem.registerCard(card);
    effectRunner.run(def.effects, { scene: this, sourceCardId: def.id });
    this.events.emit('card-spawned', card);
    return card;
  }



  private setupDayCycle(): void {

    this.topHud.startDayCycle(() => this.events.emit('day-end'));

  }



  private syncBaseHud(): void {

    const base = this.baseCamp.isActive ? this.baseCamp.getHp() : undefined;

    this.topHud.setResources(

      this.resources,

      base ? { hp: base.hp, max: base.maxHp } : undefined,

    );

  }



  private onBaseDestroyed(): void {

    this.gameOver = true;

    this.backpackBar.setGameOver(true);
    this.actionBar.setGameOver(true);

    this.invasion.pauseSpawning();

    const pf = this.layout.playfield;

    this.add

      .text(pf.centerX, pf.centerY, '避难所陷落\n大本营已被摧毁', {

        fontSize: '22px',

        color: '#c9b896',

        align: 'center',

        backgroundColor: '#000000cc',

        padding: { x: 24, y: 16 },

      })

      .setOrigin(0.5)

      .setDepth(3000);

    this.showToast('游戏结束：守住大本营失败', '#8b3a3a');

  }



  private onDayEnd(): void {
    if (this.gameOver) return;

    const survivors = this.countTag('survivor');

    const foodNeed = survivors * 1;

    const waterNeed = survivors * 1;



    if (this.resources.food < foodNeed || this.resources.water < waterNeed) {

      this.showToast('每日结算：食物或净水不足！', '#8b3a3a');

    } else {

      this.resources.food -= foodNeed;

      this.resources.water -= waterNeed;

      this.showToast('每日结算：避难所撑过这一天');

    }



    this.syncBaseHud();

    this.topHud.advanceDay();
  }

  private countTag(tag: string): number {

    return this.children.list.filter(

      (c) => c instanceof GameCard && (c.definition.tags ?? []).includes(tag),

    ).length;

  }



  private showToast(message: string, color = '#c9b896'): void {

    this.toast?.destroy();

    const pf = this.layout?.playfield;

    const x = pf?.centerX ?? this.scale.width / 2;

    const y = pf ? pf.bottom - 24 : this.scale.height * 0.72;

    this.toast = this.add

      .text(x, y, message, {

        fontSize: '14px',

        color,

        backgroundColor: '#000000aa',

        padding: { x: 12, y: 8 },

      })

      .setOrigin(0.5)

      .setDepth(2000);



    this.time.delayedCall(2200, () => {

      this.toast?.destroy();

      this.toast = undefined;

    });

  }

}


