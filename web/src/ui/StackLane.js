import Phaser from 'phaser';
import { STACK_LANE_MAX_ENTRIES } from '../config/layoutConfig';
import { dataStore } from '../core/DataStore';
const LANE_DEPTH = 2050;
const ENTRY_H = 28;
export default class StackLane extends Phaser.GameObjects.Container {
    stacks;
    workSites;
    mutantGrowth;
    bg;
    entries = new Map();
    emptyHint;
    layoutRects;
    constructor(scene, stacks, workSites, mutantGrowth) {
        super(scene, 0, 0);
        this.stacks = stacks;
        this.workSites = workSites;
        this.mutantGrowth = mutantGrowth;
        scene.add.existing(this);
        this.setScrollFactor(0);
        this.setDepth(LANE_DEPTH);
        this.bg = scene.add.rectangle(0, 0, 72, 100, 0x1a1612, 0.55);
        this.bg.setStrokeStyle(1, 0x3d3830, 0.6);
        this.emptyHint = scene.add.text(0, 0, '暂无\n进行中', {
            fontSize: '9px',
            color: '#5a5248',
            align: 'center',
        });
        this.emptyHint.setOrigin(0.5);
        this.add([this.bg, this.emptyHint]);
        scene.events.on('stack-changed', () => this.refresh());
        scene.events.on('worksite-produced', () => this.refresh());
        scene.events.on('mutant-growth-started', () => this.refresh());
        scene.time.addEvent({
            delay: 250,
            loop: true,
            callback: () => this.refresh(),
        });
        scene.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
            scene.events.off('stack-changed', this.refresh, this);
            scene.events.off('worksite-produced', this.refresh, this);
            scene.events.off('mutant-growth-started', this.refresh, this);
        });
    }
    applyLayout(rects) {
        this.layoutRects = rects;
        const { stackLane } = rects;
        this.setPosition(stackLane.x, stackLane.y);
        this.bg.setPosition(stackLane.width / 2, stackLane.height / 2);
        this.bg.setSize(stackLane.width, stackLane.height);
        this.emptyHint.setPosition(stackLane.width / 2, stackLane.height / 2);
        this.refresh();
    }
    containsScreenPoint(sx, sy) {
        return this.layoutRects?.stackLane.contains(sx, sy) ?? false;
    }
    refresh = () => {
        if (!this.layoutRects)
            return;
        for (const entry of this.entries.values()) {
            entry.container.destroy();
        }
        this.entries.clear();
        const tracked = this.collectTrackedStacks();
        this.emptyHint.setVisible(tracked.length === 0);
        const laneW = this.layoutRects.stackLane.width;
        let y = 10 + ENTRY_H / 2;
        for (const stack of tracked.slice(0, STACK_LANE_MAX_ENTRIES)) {
            const container = this.buildEntry(stack, laneW);
            container.setPosition(laneW / 2, y);
            container.setInteractive(new Phaser.Geom.Rectangle(-laneW / 2 + 4, -ENTRY_H / 2, laneW - 8, ENTRY_H), Phaser.Geom.Rectangle.Contains);
            container.on('pointerdown', () => this.focusStack(stack));
            this.add(container);
            this.entries.set(stack.id, { stackId: stack.id, container });
            y += ENTRY_H + 4;
        }
    };
    collectTrackedStacks() {
        const out = [];
        for (const stack of this.stacks.getAllStacks()) {
            const baseTags = stack.base.definition.tags ?? [];
            const hasSeed = stack.members.some((m) => (m.definition.tags ?? []).includes('mutant_seed'));
            const hasWorksite = baseTags.includes('worksite') && getSpawnEffect(stack.base.definition);
            const hasGrowth = baseTags.includes('blight_plot') && hasSeed;
            if (hasGrowth) {
                out.push(stack);
                continue;
            }
            if (hasWorksite && stackHasSurvivor(stack)) {
                out.push(stack);
            }
        }
        return out;
    }
    buildEntry(stack, laneW) {
        const c = this.scene.add.container(0, 0);
        const { label, seconds } = this.describeStack(stack);
        const pad = 6;
        const textW = laneW - pad * 2;
        const timeStr = seconds !== null ? `${seconds}秒` : '--';
        const line = `${label} ${timeStr}`;
        const row = this.scene.add.text(-laneW / 2 + pad, 0, line, {
            fontSize: '10px',
            color: '#c9b896',
            wordWrap: { width: textW },
        });
        row.setOrigin(0, 0.5);
        c.add(row);
        return c;
    }
    describeStack(stack) {
        const baseTags = stack.base.definition.tags ?? [];
        const hasSeed = stack.members.some((m) => (m.definition.tags ?? []).includes('mutant_seed'));
        if (baseTags.includes('blight_plot') && hasSeed) {
            const seed = stack.members.find((m) => (m.definition.tags ?? []).includes('mutant_seed'));
            return {
                label: seed ? `${seed.definition.name}·生长` : '污壤·生长',
                seconds: this.mutantGrowth.getGrowthRemainingSec(stack.id),
            };
        }
        const effect = getSpawnEffect(stack.base.definition);
        if (effect && stackHasSurvivor(stack)) {
            const output = effect.outputCardId
                ? dataStore.getCard(effect.outputCardId)?.name
                : undefined;
            const label = output
                ? `${stack.base.definition.name}·${output}`
                : `${stack.base.definition.name}·工作中`;
            return {
                label,
                seconds: this.workSites.getWorkRemainingSec(stack.id),
            };
        }
        return { label: stack.base.definition.name, seconds: null };
    }
    focusStack(stack) {
        this.scene.events.emit('stack-lane-focus', { stackId: stack.id });
        const target = stack.base;
        this.scene.tweens.add({
            targets: target,
            scaleX: 1.08,
            scaleY: 1.08,
            duration: 120,
            yoyo: true,
        });
    }
}
function getSpawnEffect(def) {
    return def.effects?.find((e) => e.type === 'spawn_timer');
}
function stackHasSurvivor(stack) {
    return [stack.base, ...stack.members].some((c) => (c.definition.tags ?? []).includes('survivor'));
}
