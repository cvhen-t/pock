import Phaser from 'phaser';
import { CardSpawner } from '../core/CardSpawner';
import { collectCardsFromCache } from '../core/loadCards';
import { dataStore } from '../core/DataStore';
import { REGISTRY } from '../config/gameConfig';
import { effectRunner } from '../core/EffectRunner';
import GameCard, { boardDepthFromY } from '../objects/GameCard';
import { CardDragSystem } from '../systems/CardDragSystem';
import { CardStackSystem } from '../systems/CardStackSystem';
import { DefenseTurretSystem } from '../systems/DefenseTurretSystem';
import { PlantAttackVfxSystem } from '../systems/PlantAttackVfxSystem';
import { InvasionSystem } from '../systems/InvasionSystem';
import { MutantGrowthSystem } from '../systems/MutantGrowthSystem';
import { ResourcePickupSystem } from '../systems/ResourcePickupSystem';
import { InvasionConfig } from '../core/InvasionConfig';
import { BaseCampSystem } from '../systems/BaseCampSystem';
import { BarrierSystem } from '../systems/BarrierSystem';
import { DefenseCraftSystem } from '../systems/DefenseCraftSystem';
import { ShelterSystem } from '../systems/ShelterSystem';
import { TrapSystem } from '../systems/TrapSystem';
import { WorkSiteSystem } from '../systems/WorkSiteSystem';
import GameBackground from '../ui/GameBackground';
import HandBar from '../ui/HandBar';
import { computeLayout, readSafeBottom, readSafeTop, } from '../ui/LayoutManager';
import { clampStackToPlayfield } from '../ui/playfieldClamp';
import StackLane from '../ui/StackLane';
import TopHud from '../ui/TopHud';
export default class GameScene extends Phaser.Scene {
    stackSystem;
    dragSystem;
    background;
    topHud;
    handBar;
    stackLane;
    layout;
    spawner;
    workSites;
    mutantGrowth;
    invasion;
    baseCamp;
    barriers;
    shelter;
    invasionConfig;
    resources = { food: 4, water: 3, caps: 2 };
    gameOver = false;
    toast;
    constructor() {
        super({ key: 'Game' });
    }
    create() {
        const recipes = this.cache.json.get('recipes');
        if (dataStore.getAllCards().length === 0) {
            dataStore.setCards(collectCardsFromCache(this.cache));
        }
        dataStore.setRecipes(recipes.recipes);
        this.layout = this.computeCurrentLayout();
        this.stackSystem = new CardStackSystem(this);
        this.dragSystem = new CardDragSystem(this, this.stackSystem, (result) => {
            if (result.stacked && result.targetName) {
                this.showToast(`已叠放：${result.card.definition.name} → ${result.targetName}`);
            }
        }, (sx, sy) => this.blocksBoardDrag(sx, sy));
        this.spawner = new CardSpawner(this, this.stackSystem, this.dragSystem);
        this.handBar = new HandBar(this, this.stackSystem, this.spawner);
        this.dragSystem.setStoreInHand((card, sx, sy) => {
            if (!this.handBar.containsScreenPoint(sx, sy))
                return false;
            if (!this.handBar.canStoreBoardCard(card)) {
                this.showToast('该卡无法收入手牌', '#8b5a3a');
                return false;
            }
            const name = card.definition.name;
            if (!this.handBar.storeBoardCard(card, this.dragSystem))
                return false;
            this.showToast(`已收入手牌：${name}`, '#8a9a7a');
            return true;
        });
        this.dragSystem.setPlayfieldBounds(() => this.layout?.playfield);
        const growthTables = this.cache.json.get('growth');
        this.workSites = new WorkSiteSystem(this, this.stackSystem, this.spawner);
        this.mutantGrowth = new MutantGrowthSystem(this, this.stackSystem, this.spawner, growthTables);
        new ResourcePickupSystem(this, (delta, card) => {
            this.resources.food += delta.food;
            this.resources.water += delta.water;
            this.resources.caps += delta.caps;
            this.topHud.setResources(this.resources);
            this.showToast(`收集：${card.definition.name}`, '#8a9a7a');
        });
        this.events.on('hand-add', ({ cardId }) => {
            this.handBar.addCard(cardId, 1);
        });
        this.events.on('drag-toast', (msg) => this.showToast(msg, '#8a9a7a'));
        this.events.on('mutant-growth-started', () => {
            this.showToast('变异种子生长中…', '#6a8a5a');
        });
        this.events.on('mutant-growth-complete', ({ plantId }) => {
            const def = dataStore.getCard(plantId);
            this.showToast(`长成：${def?.name ?? plantId}`, '#6a9a6a');
        });
        this.events.on('mutant-growth-failed', () => {
            this.showToast('生长失败：污壤污染', '#8b5a3a');
        });
        this.events.on('invasion-spawn', () => {
            this.showToast('变异体逼近！', '#9a4a4a');
        });
        this.invasionConfig = new InvasionConfig();
        this.invasionConfig.load(this.cache.json.get('invasion_enemies'), this.cache.json.get('invasion_waves'));
        this.baseCamp = new BaseCampSystem(this);
        this.barriers = new BarrierSystem(this);
        this.shelter = new ShelterSystem(this, this.stackSystem);
        this.events.on('base-hp-changed', () => this.syncBaseHud());
        this.events.on('base-repaired', ({ amount }) => {
            this.showToast(`大本营修复 +${amount}`, '#6a9a6a');
        });
        this.events.on('base-moon-regen', ({ amount }) => {
            this.showToast(`月相休整：本营 +${amount}`, '#8a9a7a');
        });
        this.events.on('barrier-destroyed', ({ name }) => {
            this.showToast(`${name} 被毁！`, '#8b5a3a');
        });
        this.events.on('trap-triggered', ({ damage, killed }) => {
            if (killed)
                this.showToast(`陷阱命中！消灭入侵者`, '#6a8a5a');
            else
                this.showToast(`陷阱造成 ${damage} 伤害`, '#8a9a7a');
        });
        this.events.on('invasion-surge', () => {
            this.showToast('月末涌动！大量变异体来袭', '#b04040');
        });
        this.events.on('enemy-reached-base', ({ damage }) => {
            if (this.gameOver)
                return;
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
            if (this.gameOver)
                return;
            this.resources.food = Math.max(0, this.resources.food - 1);
            this.syncBaseHud();
            this.showToast('幸存者遭到袭击！食物 -1', '#b04040');
        });
        this.drawBackground();
        this.setupHud();
        this.stackLane = new StackLane(this, this.stackSystem, this.workSites, this.mutantGrowth);
        this.applyLayout();
        this.spawnStarterBoard();
        const traps = new TrapSystem(this);
        this.invasion = new InvasionSystem(this, this.spawner, this.baseCamp, this.barriers, traps, this.invasionConfig);
        traps.bindInvasion(this.invasion);
        new DefenseCraftSystem(this, this.stackSystem, this.baseCamp, this.barriers);
        const plantAttackVfx = new PlantAttackVfxSystem(this, this.invasion);
        new DefenseTurretSystem(this, this.invasion, plantAttackVfx);
        this.setupMoonCycle();
        this.events.on('moon-end', () => this.onMoonEnd());
        this.scale.on('resize', this.handleResize, this);
        this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
            this.scale.off('resize', this.handleResize, this);
            this.dragSystem.destroy();
            this.workSites.destroy();
            this.mutantGrowth.destroy();
            this.invasion.destroy();
        });
    }
    blocksBoardDrag(sx, sy) {
        if (this.handBar.isDraggingFromHand())
            return false;
        return (this.layout.topHud.contains(sx, sy) ||
            this.layout.stackLane.contains(sx, sy) ||
            this.layout.handBar.contains(sx, sy));
    }
    computeCurrentLayout() {
        const { width, height } = this.scale;
        return computeLayout(width, height, readSafeTop(this.game.canvas), readSafeBottom());
    }
    applyLayout() {
        this.layout = this.computeCurrentLayout();
        const { width } = this.scale;
        const { topHud, playfield } = this.layout;
        this.topHud.applyLayout(topHud.centerX, topHud.y + topHud.height / 2, width);
        this.handBar.applyLayout(this.layout);
        this.stackLane.applyLayout(this.layout);
        this.background?.layoutPlayfield(playfield);
        this.registry.set('playfield', playfield);
        this.clampAllBoardCards();
        this.events.emit('layout-changed', this.layout);
    }
    clampAllBoardCards() {
        const pf = this.layout.playfield;
        for (const stack of this.stackSystem.getAllStacks()) {
            clampStackToPlayfield(this.stackSystem, stack, pf);
        }
    }
    drawBackground() {
        const { width, height } = this.scale;
        this.background = new GameBackground(this, width, height);
    }
    setupHud() {
        const { width } = this.scale;
        const { topHud } = this.layout;
        this.topHud = new TopHud(this, topHud.centerX, topHud.y + topHud.height / 2, width);
        this.topHud.setResources(this.resources);
    }
    handleResize(gameSize) {
        const { width, height } = gameSize;
        this.background?.resize(width, height);
        this.applyLayout();
        if (this.toast) {
            const pf = this.layout.playfield;
            this.toast.setPosition(pf.centerX, pf.bottom - 24);
        }
    }
    spawnStarterBoard() {
        const pf = this.layout.playfield;
        const cx = pf.centerX;
        const cy = pf.centerY + pf.height * 0.02;
        const spreadX = Math.min(88, pf.width * 0.26);
        const spreadY = Math.min(88, pf.height * 0.12);
        const layout = [
            { id: 'base_camp', x: cx, y: cy },
            { id: 'survivor', x: cx - spreadX * 0.55, y: cy - spreadY * 0.2 },
            { id: 'rust_bush', x: cx + spreadX * 0.2, y: cy - spreadY * 0.32 },
            { id: 'blight_plot', x: cx + spreadX * 0.2, y: cy + spreadY * 0.64 },
            { id: 'seed_thornvine', x: cx - spreadX, y: cy + spreadY * 0.96 },
            { id: 'plant_thornvine', x: cx + spreadX * 0.55, y: cy + spreadY * 0.5 },
            { id: 'scrap_pile', x: cx - spreadX, y: cy - spreadY * 0.8 },
            { id: 'fence_iron', x: cx + spreadX * 1.05, y: cy + spreadY * 0.18 },
            { id: 'sandbag_wall', x: cx - spreadX * 1.05, y: cy + spreadY * 0.36 },
            { id: 'caps', x: cx, y: cy - spreadY },
        ];
        for (const item of layout) {
            const def = dataStore.getCard(item.id);
            if (!def)
                continue;
            const card = new GameCard(this, item.x, item.y, def);
            card.setDepth(boardDepthFromY(item.y));
            this.stackSystem.registerBase(card);
            this.dragSystem.registerCard(card);
            effectRunner.run(def.effects, { scene: this, sourceCardId: def.id });
        }
        this.clampAllBoardCards();
        this.syncBaseHud();
    }
    setupMoonCycle() {
        this.topHud.startMoonCycle(() => this.events.emit('moon-end'));
    }
    syncBaseHud() {
        const base = this.baseCamp.isActive ? this.baseCamp.getHp() : undefined;
        this.topHud.setResources(this.resources, base ? { hp: base.hp, max: base.maxHp } : undefined);
    }
    onBaseDestroyed() {
        this.gameOver = true;
        this.handBar.setGameOver(true);
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
    onMoonEnd() {
        if (this.gameOver)
            return;
        const moon = this.registry.get(REGISTRY.MOON_INDEX);
        if (moon >= 12 && this.baseCamp.isActive) {
            this.onVictory();
            return;
        }
        const survivors = this.countTag('survivor');
        const foodNeed = survivors * 1;
        const waterNeed = survivors * 1;
        if (this.resources.food < foodNeed || this.resources.water < waterNeed) {
            this.showToast('月相结算：食物或净水不足！', '#8b3a3a');
        }
        else {
            this.resources.food -= foodNeed;
            this.resources.water -= waterNeed;
            this.showToast('月相结算：避难所撑过这一月相');
        }
        this.syncBaseHud();
        this.topHud.advanceMoon();
    }
    onVictory() {
        this.gameOver = true;
        this.handBar.setGameOver(true);
        this.invasion.pauseSpawning();
        const pf = this.layout.playfield;
        this.add
            .text(pf.centerX, pf.centerY, '避难所站稳\n撑过 12 个月相', {
            fontSize: '22px',
            color: '#c9b896',
            align: 'center',
            backgroundColor: '#000000cc',
            padding: { x: 24, y: 16 },
        })
            .setOrigin(0.5)
            .setDepth(3000);
        this.showToast('胜利：大本营守住了！', '#6a9a6a');
    }
    countTag(tag) {
        return this.children.list.filter((c) => c instanceof GameCard && (c.definition.tags ?? []).includes(tag)).length;
    }
    showToast(message, color = '#c9b896') {
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
