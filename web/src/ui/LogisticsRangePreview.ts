import Phaser from 'phaser';
import { edgeStyleKey } from '../core/linkRules';
import type { LogisticsPreviewLink, LogisticsRangeSpec } from '../core/logisticsRangePreview';
import { hexToNumber, REGISTRY_LINK_VISUAL, type LinkVisualConfig } from '../core/linkVisualConfig';
import { drawLShapeLink, drawLinkArrow } from './logisticsLinkDraw';

const PICKUP_FILL = 0x5a9a68;
const PICKUP_FILL_ALPHA = 0.14;
const LINK_STROKE = 0x5a8ac8;
const LINK_STROKE_ALPHA = 0.78;
const CANDIDATE_STROKE = 0xc8a050;
const CANDIDATE_FILL = 0xc8a050;
const CANDIDATE_FILL_ALPHA = 0.12;

/**
 * Pickup + link circles and preview connection lines while dragging logistics cards.
 */
export class LogisticsRangePreview {
  private readonly g: Phaser.GameObjects.Graphics;

  constructor(private readonly scene: Phaser.Scene) {
    this.g = scene.add.graphics();
    this.g.setDepth(979);
    this.g.setVisible(false);
  }

  show(
    worldX: number,
    worldY: number,
    spec: LogisticsRangeSpec,
    previewLinks: LogisticsPreviewLink[] = [],
  ): void {
    this.g.clear();
    this.g.setVisible(true);

    const visual = this.scene.registry.get(REGISTRY_LINK_VISUAL) as LinkVisualConfig | undefined;

    if (spec.pickupRadius != null && spec.pickupRadius > 0) {
      this.g.fillStyle(PICKUP_FILL, PICKUP_FILL_ALPHA);
      this.g.fillCircle(worldX, worldY, spec.pickupRadius);
    }

    this.g.lineStyle(2, LINK_STROKE, LINK_STROKE_ALPHA);
    this.g.strokeCircle(worldX, worldY, spec.linkRadius);

    for (const link of previewLinks) {
      const key = edgeStyleKey(link.fromRole, link.toRole);
      const style = visual?.edgeStyles[key];
      const color = hexToNumber(style?.color ?? visual?.previewEdgeColor ?? '#5a8ac8');
      const width = style?.width ?? 2;
      const alpha = visual?.previewAlpha ?? 0.88;
      const fx = link.fromCard.x;
      const fy = link.fromCard.y;
      const tx = link.toCard.x;
      const ty = link.toCard.y;

      drawLShapeLink(this.g, fx, fy, tx, ty, color, width, alpha);
      drawLinkArrow(this.g, fx, fy, tx, ty, color, alpha);

      const r = Math.max(link.other.cardWidth, link.other.cardHeight) * 0.42 + 6;
      this.g.fillStyle(CANDIDATE_FILL, CANDIDATE_FILL_ALPHA);
      this.g.fillCircle(link.other.x, link.other.y, r);
      this.g.lineStyle(2, CANDIDATE_STROKE, 0.95);
      this.g.strokeCircle(link.other.x, link.other.y, r);
    }
  }

  hide(): void {
    this.g.clear();
    this.g.setVisible(false);
  }

  destroy(): void {
    this.g.destroy();
  }
}
