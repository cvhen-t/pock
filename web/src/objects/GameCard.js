import Phaser from 'phaser';
import { CARD_ICON_BG, resolveCardInnerAlpha } from '../art/cardIconStyle';
import { resolveCardIconKey } from '../art/resolveCardIconKey';
import { TEX } from '../art/textureKeys';
import { layoutCardContent, resolveBoardCardMetrics, } from '../config/cardLayout';
import { resolveWorldSprite } from '../art/WorldSpriteRegistry';
export { CARD_W, CARD_H } from '../config/cardLayout';
/** Visual card only — drag handled by CardDragSystem. */
export default class GameCard extends Phaser.GameObjects.Container {
    definition;
    metrics;
    stackId = null;
    /** 0 = default, 1 = rotated 90° (slim ↔ wide footprint). */
    orientation = 0;
    face;
    /** Stack count for resource cards (shown top-right when > 1). */
    quantity = 1;
    shell;
    inner;
    icon;
    label;
    qtyBadge;
    worldSprite;
    placedSwayTween;
    displayMode = 'card';
    constructor(scene, x, y, definition) {
        super(scene, x, y);
        this.definition = definition;
        this.metrics = resolveBoardCardMetrics(definition);
        const { w, h, icon: iconSize } = this.metrics;
        const shape = 'standard';
        const layout = layoutCardContent(shape, this.metrics);
        const color = CARD_ICON_BG;
        const shellKey = TEX.CARD_SHELL;
        this.face = scene.add.container(0, 0);
        this.shell = scene.add.image(0, 0, shellKey);
        this.shell.setOrigin(0.5);
        this.shell.setDisplaySize(w + 2, h + 2);
        this.inner = scene.add.rectangle(layout.inner.x, layout.inner.y, layout.inner.w, layout.inner.h, color, resolveCardInnerAlpha(definition.id));
        this.inner.setStrokeStyle(1, 0x2a2620, 0.6);
        const iconKey = resolveIconKey(scene, definition);
        this.icon = scene.add.image(layout.icon.x, layout.icon.y, iconKey);
        this.icon.setDisplaySize(iconSize, iconSize);
        const faceChildren = [this.shell, this.inner, this.icon];
        this.label = scene.add.text(layout.label.x, layout.label.y, definition.name, {
            fontFamily: 'system-ui, sans-serif',
            fontSize: layout.label.fontSize,
            color: '#000000',
            align: 'center',
            wordWrap: { width: layout.label.maxWidth },
        });
        this.label.setOrigin(0.5, 1);
        this.qtyBadge = scene.add.text(w / 2 - 6, -h / 2 + 5, '', {
            fontFamily: 'system-ui, sans-serif',
            fontSize: '11px',
            color: '#f0e8d8',
            stroke: '#1a1612',
            strokeThickness: 2,
        });
        this.qtyBadge.setOrigin(1, 0);
        this.qtyBadge.setVisible(false);
        faceChildren.push(this.label, this.qtyBadge);
        this.face.add(faceChildren);
        this.add(this.face);
        this.syncHitSize();
        this.syncQuantityBadge();
        scene.add.existing(this);
    }
    setQuantity(value) {
        this.quantity = Math.max(1, Math.floor(value));
        this.syncQuantityBadge();
    }
    addQuantity(delta) {
        if (delta <= 0)
            return;
        this.setQuantity(this.quantity + delta);
    }
    syncQuantityBadge() {
        this.qtyBadge.setVisible(this.quantity > 1);
        this.qtyBadge.setText(this.quantity > 99 ? '99+' : String(this.quantity));
    }
    get cardWidth() {
        const { w, h } = this.metrics;
        return this.orientation === 1 ? h : w;
    }
    get cardHeight() {
        const { w, h } = this.metrics;
        return this.orientation === 1 ? w : h;
    }
    /** Toggle 90° rotation (slim ↔ wide footprint). */
    toggleRotation() {
        this.orientation = this.orientation === 0 ? 1 : 0;
        this.scene.tweens.killTweensOf(this.face);
        this.scene.tweens.add({
            targets: this.face,
            angle: this.orientation * 90,
            duration: 120,
            ease: 'Quad.easeOut',
        });
        this.syncHitSize();
        this.scene.events.emit('card-rotated', this);
    }
    syncHitSize() {
        this.setSize(this.cardWidth, this.cardHeight);
    }
    getDisplayMode() {
        return this.displayMode;
    }
    hasPlacedVisual() {
        return Boolean(this.definition.placedVisual);
    }
    setDisplayMode(mode) {
        const config = this.definition.placedVisual;
        if (!config)
            return;
        if (mode === 'placed') {
            const entry = resolveWorldSprite(config);
            if (!entry)
                return;
            this.ensureWorldSprite(entry, config);
            this.face.setVisible(false);
            this.worldSprite.setVisible(true);
            if (entry.tweenSway) {
                this.startPlacedSway();
            }
            else if (!this.worldSprite.anims.isPlaying) {
                this.worldSprite.play(entry.animKey);
            }
            this.displayMode = 'placed';
            return;
        }
        this.stopPlacedSway();
        this.face.setVisible(true);
        this.worldSprite?.setVisible(false);
        this.worldSprite?.anims.stop();
        this.displayMode = 'card';
    }
    startPlacedSway() {
        if (!this.worldSprite || this.placedSwayTween?.isPlaying())
            return;
        this.worldSprite.setAngle(0);
        this.placedSwayTween = this.scene.tweens.add({
            targets: this.worldSprite,
            angle: -3,
            duration: 1400,
            yoyo: true,
            repeat: -1,
            ease: 'Sine.easeInOut',
        });
    }
    stopPlacedSway() {
        this.placedSwayTween?.remove();
        this.placedSwayTween = undefined;
        if (this.worldSprite) {
            this.worldSprite.setAngle(0);
        }
    }
    ensureWorldSprite(entry, config) {
        if (this.worldSprite)
            return;
        const scale = config.scale ?? entry.defaultScale;
        const feetY = config.feetOffsetY ?? entry.defaultFeetOffsetY;
        this.worldSprite = this.scene.add.sprite(0, feetY, entry.atlasKey, 0);
        this.worldSprite.setOrigin(0.5, 1);
        this.worldSprite.setScale(scale);
        this.add(this.worldSprite);
    }
    destroy(fromScene) {
        this.stopPlacedSway();
        this.worldSprite?.destroy();
        this.worldSprite = undefined;
        super.destroy(fromScene);
    }
}
export function boardDepthFromY(y) {
    return 10 + Math.round(y);
}
function resolveIconKey(scene, def) {
    return resolveCardIconKey(scene, def);
}
