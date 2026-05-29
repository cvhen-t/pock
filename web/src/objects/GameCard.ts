import Phaser from 'phaser';
import { TEX } from '../art/textureKeys';
import { layoutCardContent, resolveCardMetrics, type CardMetrics } from '../config/cardLayout';
import type { CardDefinition } from '../types/gameData';

export { CARD_W, CARD_H } from '../config/cardLayout';

/** Visual card only — drag handled by CardDragSystem. */
export default class GameCard extends Phaser.GameObjects.Container {
  readonly definition: CardDefinition;
  readonly metrics: CardMetrics;
  stackId: string | null = null;

  /** 0 = default, 1 = rotated 90° (slim ↔ wide footprint). */
  orientation = 0;

  private readonly face: Phaser.GameObjects.Container;

  /** Stack count for resource cards (shown top-right when > 1). */
  quantity = 1;

  private shell: Phaser.GameObjects.Image;
  private inner: Phaser.GameObjects.Rectangle;
  private icon: Phaser.GameObjects.Image;
  private label: Phaser.GameObjects.Text;
  private qtyBadge: Phaser.GameObjects.Text;

  constructor(scene: Phaser.Scene, x: number, y: number, definition: CardDefinition) {
    super(scene, x, y);
    this.definition = definition;
    this.metrics = resolveCardMetrics(definition);

    const { w, h, icon: iconSize } = this.metrics;
    const shape = definition.shape ?? 'standard';
    const layout = layoutCardContent(shape, this.metrics);
    const color = Phaser.Display.Color.HexStringToColor(definition.color ?? '#4a4540').color;
    const shellKey = shellTextureForShape(shape);

    this.face = scene.add.container(0, 0);

    this.shell = scene.add.image(0, 0, shellKey);
    this.shell.setOrigin(0.5);
    this.shell.setDisplaySize(w + 2, h + 2);

    this.inner = scene.add.rectangle(
      layout.inner.x,
      layout.inner.y,
      layout.inner.w,
      layout.inner.h,
      color,
      0.88,
    );
    this.inner.setStrokeStyle(1, 0x2a2620, 0.6);

    const iconKey = resolveIconKey(scene, definition);
    this.icon = scene.add.image(layout.icon.x, layout.icon.y, iconKey);
    this.icon.setDisplaySize(iconSize, iconSize);

    const divider = scene.add.rectangle(
      layout.divider.x,
      layout.divider.y,
      layout.divider.w,
      1,
      0x2a2620,
      0.75,
    );

    const faceChildren: Phaser.GameObjects.GameObject[] = [this.shell, this.inner, this.icon, divider];

    if (layout.nameplate) {
      const plate = scene.add.rectangle(
        layout.nameplate.x,
        layout.nameplate.y,
        layout.nameplate.w,
        layout.nameplate.h,
        0x1a1612,
        0.55,
      );
      plate.setStrokeStyle(1, 0x2a2620, 0.4);
      faceChildren.push(plate);
    }

    this.label = scene.add.text(layout.label.x, layout.label.y, definition.name, {
      fontFamily: 'system-ui, sans-serif',
      fontSize: layout.label.fontSize,
      color: '#e8e0d4',
      align: 'center',
      stroke: '#1a1612',
      strokeThickness: 1,
      wordWrap: { width: layout.label.maxWidth },
    });
    this.label.setOrigin(0.5, shape === 'wide' ? 0.5 : 1);

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

  setQuantity(value: number): void {
    this.quantity = Math.max(1, Math.floor(value));
    this.syncQuantityBadge();
  }

  addQuantity(delta: number): void {
    if (delta <= 0) return;
    this.setQuantity(this.quantity + delta);
  }

  private syncQuantityBadge(): void {
    this.qtyBadge.setVisible(this.quantity > 1);
    this.qtyBadge.setText(this.quantity > 99 ? '99+' : String(this.quantity));
  }

  get cardWidth(): number {
    const { w, h } = this.metrics;
    return this.orientation === 1 ? h : w;
  }

  get cardHeight(): number {
    const { w, h } = this.metrics;
    return this.orientation === 1 ? w : h;
  }

  /** Toggle 90° rotation (slim ↔ wide footprint). */
  toggleRotation(): void {
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

  syncHitSize(): void {
    this.setSize(this.cardWidth, this.cardHeight);
  }
}

export function boardDepthFromY(y: number): number {
  return 10 + Math.round(y);
}

function shellTextureForShape(shape: string): string {
  switch (shape) {
    case 'slim':
      return TEX.CARD_SHELL_SLIM;
    case 'wide':
      return TEX.CARD_SHELL_WIDE;
    case 'tile':
      return TEX.CARD_SHELL_TILE;
    case 'compact':
      return TEX.CARD_SHELL_COMPACT;
    default:
      return TEX.CARD_SHELL;
  }
}

function resolveIconKey(scene: Phaser.Scene, def: CardDefinition): string {
  if (def.artKey && scene.textures.exists(TEX.cardArt(def.artKey))) {
    return TEX.cardArt(def.artKey);
  }
  const iconId = def.icon ?? def.id;
  const procedural = TEX.icon(iconId);
  if (scene.textures.exists(procedural)) {
    return procedural;
  }
  return TEX.icon(def.id);
}
