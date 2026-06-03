import Phaser from 'phaser';
import { REGISTRY } from '../config/gameConfig';
import { HUD_ACTION_BTN, HUD_ACTION_GAP, HUD_BAR_H, HUD_CHIP_GAP, HUD_CHIP_H, HUD_CHIP_W, HUD_GUIDE_BTN, HUD_DAY_BAR_W, HUD_RES_COLORS, HUD_RES_ICON, HUD_RES_LABELS, HUD_SIDE_PAD, } from '../config/hudLayout';
import { TEX } from '../art/textureKeys';
/** Small top-bar icon button — settings, speed, etc. */
class HudActionButton extends Phaser.GameObjects.Container {
    bg;
    label;
    constructor(scene, x, y, text, onPress, btnWidth = HUD_ACTION_BTN) {
        super(scene, x, y);
        this.bg = scene.add.rectangle(0, 0, btnWidth, HUD_CHIP_H, 0x322e28, 0.95);
        this.bg.setStrokeStyle(1, 0x5c4a32, 0.85);
        this.label = scene.add.text(0, 0, text, {
            fontSize: '12px',
            color: '#c9b896',
        });
        this.label.setOrigin(0.5);
        this.add([this.bg, this.label]);
        this.setSize(btnWidth, HUD_CHIP_H);
        this.bg.setInteractive({ useHandCursor: true });
        this.bg.on('pointerover', () => {
            this.bg.setFillStyle(0x3e3a34, 0.98);
            this.label.setColor('#e8e0d4');
        });
        this.bg.on('pointerout', () => {
            this.bg.setFillStyle(0x322e28, 0.95);
            this.label.setColor('#c9b896');
        });
        this.bg.on('pointerdown', onPress);
    }
    setLabel(text) {
        this.label.setText(text);
    }
}
export default class TopHud extends Phaser.GameObjects.Container {
    bg;
    bottomEdge;
    leftRail;
    centerRail;
    rightRail;
    resourceChips = [];
    dayLabel;
    dayTimer;
    dayBarBg;
    dayBarFill;
    basePanel;
    baseLabel;
    baseBarBg;
    baseBarFill;
    actionRail;
    speedBtn;
    guideBtn;
    settingsBtn;
    dayEvent;
    remaining = 0;
    onDayEnd;
    speedLevel = 1;
    constructor(scene, centerX, centerY, screenWidth) {
        super(scene, centerX, centerY);
        this.bg = scene.add
            .rectangle(0, 0, screenWidth, HUD_BAR_H, 0x1e1b16, 1)
            .setOrigin(0.5);
        this.bottomEdge = scene.add
            .rectangle(0, 0, screenWidth, 1, 0x4a4034, 0.75)
            .setOrigin(0.5);
        this.leftRail = scene.add.container(0, 0);
        this.centerRail = scene.add.container(0, 0);
        this.rightRail = scene.add.container(0, 0);
        this.buildResourceChips();
        this.buildDaySection();
        this.buildBasePanel();
        this.buildActionRail();
        this.add([
            this.bg,
            this.bottomEdge,
            this.leftRail,
            this.centerRail,
            this.rightRail,
        ]);
        scene.add.existing(this);
        this.setScrollFactor(0);
        this.setDepth(2200);
        this.layoutBar(screenWidth, HUD_BAR_H);
        this.setResources({ food: 4, water: 3, caps: 2 });
    }
    buildResourceChips() {
        const keys = ['food', 'water', 'caps'];
        for (const key of keys) {
            const colors = HUD_RES_COLORS[key];
            const chip = this.scene.add.container(0, 0);
            const chipW = HUD_CHIP_W;
            const bg = this.scene.add.rectangle(0, 0, chipW, HUD_CHIP_H, colors.bg, 0.92);
            bg.setStrokeStyle(1, colors.stroke, 0.8);
            const iconKey = this.resolveIcon(HUD_RES_ICON[key]);
            const icon = this.scene.add.image(-chipW / 2 + 14, 0, iconKey);
            icon.setDisplaySize(14, 14);
            const labelText = this.scene.add.text(-chipW / 2 + 26, 0, HUD_RES_LABELS[key], {
                fontSize: '10px',
                color: '#a89878',
            });
            labelText.setOrigin(0, 0.5);
            const valueText = this.scene.add.text(chipW / 2 - 7, 0, '0', {
                fontSize: '14px',
                color: colors.text,
                fontStyle: 'bold',
            });
            valueText.setOrigin(1, 0.5);
            chip.add([bg, icon, labelText, valueText]);
            chip.setSize(chipW, HUD_CHIP_H);
            this.resourceChips.push({ key, container: chip, labelText, valueText });
            this.leftRail.add(chip);
        }
    }
    buildDaySection() {
        this.dayLabel = this.scene.add.text(0, -9, '第 1 天', {
            fontSize: '11px',
            color: '#c9b896',
        });
        this.dayLabel.setOrigin(0.5, 0.5);
        this.dayTimer = this.scene.add.text(0, 8, '2:00', {
            fontSize: '11px',
            color: '#e8e0d4',
        });
        this.dayTimer.setOrigin(0.5, 0.5);
        this.dayBarBg = this.scene.add.rectangle(0, 0, HUD_DAY_BAR_W, 4, 0x2a2620, 0.9);
        this.dayBarFill = this.scene.add.rectangle(-HUD_DAY_BAR_W / 2, 0, HUD_DAY_BAR_W, 4, 0x8a9a6a, 0.95);
        this.dayBarFill.setOrigin(0, 0.5);
        this.centerRail.add([
            this.dayBarBg,
            this.dayBarFill,
            this.dayLabel,
            this.dayTimer,
        ]);
        this.layoutDaySection();
    }
    layoutDaySection() {
        this.dayBarBg.setPosition(0, 0);
        this.dayBarFill.setPosition(-HUD_DAY_BAR_W / 2, 0);
        this.dayLabel.setPosition(0, -10);
        this.dayTimer.setPosition(0, 10);
    }
    buildBasePanel() {
        this.basePanel = this.scene.add.container(0, 0);
        this.baseLabel = this.scene.add.text(0, -6, '本营', {
            fontSize: '10px',
            color: '#8a7a6a',
        });
        this.baseLabel.setOrigin(0.5, 0.5);
        const barW = 60;
        this.baseBarBg = this.scene.add.rectangle(0, 4, barW, 5, 0x2a2620, 0.9);
        this.baseBarFill = this.scene.add.rectangle(-barW / 2, 4, barW, 5, 0x6a9a6a, 0.95);
        this.baseBarFill.setOrigin(0, 0.5);
        this.basePanel.add([this.baseBarBg, this.baseBarFill, this.baseLabel]);
        this.rightRail.add(this.basePanel);
    }
    buildActionRail() {
        this.actionRail = this.scene.add.container(0, 0);
        this.speedBtn = new HudActionButton(this.scene, 0, 0, '×1', () => {
            this.cycleSpeed();
            this.scene.events.emit('hud-action', { key: 'speed', speed: this.speedLevel });
        });
        this.guideBtn = new HudActionButton(this.scene, 0, 0, '图鉴', () => {
            this.scene.events.emit('hud-action', { key: 'guide' });
        }, HUD_GUIDE_BTN);
        this.settingsBtn = new HudActionButton(this.scene, 0, 0, '⚙', () => {
            this.scene.events.emit('hud-action', { key: 'settings' });
        });
        this.actionRail.add([this.speedBtn, this.guideBtn, this.settingsBtn]);
        this.rightRail.add(this.actionRail);
    }
    cycleSpeed() {
        this.speedLevel = this.speedLevel >= 3 ? 1 : this.speedLevel + 1;
        this.speedBtn.setLabel(`×${this.speedLevel}`);
    }
    resolveIcon(cardId) {
        const key = TEX.icon(cardId);
        if (this.scene.textures.exists(key))
            return key;
        return TEX.icon('caps');
    }
    applyLayout(centerX, centerY, screenWidth, totalHeight = HUD_BAR_H) {
        this.setPosition(centerX, centerY);
        this.layoutBar(screenWidth, totalHeight);
    }
    layoutBar(screenWidth, totalHeight) {
        // Bleed 2px past top edge to avoid sub-pixel gaps against the full-screen backdrop
        this.bg.setSize(screenWidth, totalHeight + 2);
        this.bottomEdge.setSize(screenWidth, 1);
        this.bottomEdge.setPosition(0, totalHeight / 2 - 0.5);
        const halfW = screenWidth / 2;
        const y = 0;
        // Left — resource chips
        let chipX = -halfW + HUD_SIDE_PAD;
        for (const chip of this.resourceChips) {
            const w = chip.container.width;
            chip.container.setPosition(chipX + w / 2, y);
            chipX += w + HUD_CHIP_GAP;
        }
        // Center — day timer
        this.centerRail.setPosition(0, y);
        // Right — base hp + action buttons
        const actionTotalW = HUD_ACTION_BTN * 2 + HUD_GUIDE_BTN + HUD_ACTION_GAP * 2;
        const railRight = halfW - HUD_SIDE_PAD;
        this.actionRail.setPosition(railRight, y);
        this.settingsBtn.setPosition(-HUD_ACTION_BTN / 2, 0);
        this.guideBtn.setPosition(-HUD_ACTION_BTN - HUD_ACTION_GAP - HUD_GUIDE_BTN / 2, 0);
        this.speedBtn.setPosition(-HUD_ACTION_BTN - HUD_ACTION_GAP - HUD_GUIDE_BTN - HUD_ACTION_GAP - HUD_ACTION_BTN / 2, 0);
        this.basePanel.setPosition(railRight - actionTotalW - 40, y);
    }
    setResources(res, baseHp) {
        for (const chip of this.resourceChips) {
            const val = res[chip.key];
            chip.valueText.setText(String(val));
            const warn = (chip.key === 'food' || chip.key === 'water') && val <= 1;
            const color = warn ? '#c07050' : HUD_RES_COLORS[chip.key].text;
            chip.valueText.setColor(color);
            chip.labelText.setColor(warn ? '#a06048' : '#a89878');
        }
        if (baseHp) {
            this.basePanel.setVisible(true);
            const pct = Phaser.Math.Clamp(baseHp.hp / baseHp.max, 0, 1);
            const barW = 60;
            this.baseBarFill.width = barW * pct;
            this.baseBarFill.setFillStyle(baseHp.hp <= baseHp.max * 0.3 ? 0xb05040 : 0x6a9a6a);
            this.baseLabel.setText(`本营 ${baseHp.hp}/${baseHp.max}`);
        }
        else {
            this.basePanel.setVisible(false);
        }
    }
    /** External control of speed display (when game logic hooks in). */
    setSpeedLevel(level) {
        this.speedLevel = Phaser.Math.Clamp(level, 1, 3);
        this.speedBtn.setLabel(`×${this.speedLevel}`);
    }
    startDayCycle(onDayEnd) {
        this.onDayEnd = onDayEnd;
        const total = this.scene.registry.get(REGISTRY.DAY_SECONDS);
        const savedRemaining = this.scene.registry.get(REGISTRY.DAY_REMAINING);
        // 0 means day just ended; do not resume at 0 or the next tick fires day-end again.
        this.remaining =
            savedRemaining != null && savedRemaining > 0 ? savedRemaining : total;
        this.dayEvent?.remove();
        this.dayEvent = this.scene.time.addEvent({
            delay: 1000,
            loop: true,
            callback: () => {
                this.remaining = Math.max(0, this.remaining - 1);
                this.refreshDay();
                if (this.remaining <= 0) {
                    this.dayEvent?.remove();
                    this.onDayEnd?.();
                }
            },
        });
        this.refreshDay();
    }
    advanceDay() {
        const idx = this.scene.registry.get(REGISTRY.DAY_INDEX) + 1;
        this.scene.registry.set(REGISTRY.DAY_INDEX, idx);
        const total = this.scene.registry.get(REGISTRY.DAY_SECONDS);
        this.remaining = total;
        this.scene.registry.set(REGISTRY.DAY_REMAINING, total);
        if (this.onDayEnd)
            this.startDayCycle(this.onDayEnd);
    }
    refreshDay() {
        const day = this.scene.registry.get(REGISTRY.DAY_INDEX);
        const total = this.scene.registry.get(REGISTRY.DAY_SECONDS);
        const m = Math.floor(this.remaining / 60);
        const s = this.remaining % 60;
        this.dayLabel.setText(`第 ${day} 天`);
        this.dayTimer.setText(`${m}:${s.toString().padStart(2, '0')}`);
        const pct = total > 0 ? this.remaining / total : 0;
        this.dayBarFill.width = HUD_DAY_BAR_W * pct;
        this.dayBarFill.setFillStyle(this.remaining <= 15 ? 0xb08050 : 0x8a9a6a);
        this.scene.registry.set(REGISTRY.DAY_REMAINING, this.remaining);
    }
    getDayRemaining() {
        return this.remaining;
    }
    getSpeedLevel() {
        return this.speedLevel;
    }
    restoreDayState(dayIndex, dayRemaining) {
        this.scene.registry.set(REGISTRY.DAY_INDEX, dayIndex);
        this.remaining = Math.max(0, dayRemaining);
        this.scene.registry.set(REGISTRY.DAY_REMAINING, this.remaining);
        this.refreshDay();
    }
    destroy(fromScene) {
        this.dayEvent?.remove();
        super.destroy(fromScene);
    }
}
