import Phaser from 'phaser';
import { edgeStyleKey } from '../core/linkRules';
import type { LogisticsDragSnapshot } from '../core/logisticsLinkDragSnapshot';
import type { LogisticsRangeSpec } from '../core/logisticsRangePreview';
import { hexToNumber, REGISTRY_LINK_VISUAL, type LinkVisualConfig } from '../core/linkVisualConfig';
import { drawDashedLShapeLink, drawLShapeLink, drawLinkArrow } from './logisticsLinkDraw';

const PICKUP_FILL = 0x5a9a68;
const PICKUP_FILL_ALPHA = 0.14;
const LINK_STROKE = 0x5a8ac8;
const LINK_STROKE_ALPHA = 0.78;
const CANDIDATE_STROKE = 0xc8a050;
const CANDIDATE_FILL_ALPHA = 0.12;
const BLOCKED_STROKE = 0x6a6060;

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
    snapshot: LogisticsDragSnapshot,
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

    const dashLen = visual?.dashLength ?? 8;
    const dashGap = visual?.dashGap ?? 6;
    const breakColor = hexToNumber(visual?.breakEdgeColor ?? '#b04040');
    const breakAlpha = visual?.breakAlpha ?? 0.75;
    const blockedAlpha = visual?.blockedCandidateAlpha ?? 0.4;

    for (const link of snapshot.removed) {
      this.drawLink(link, visual, breakColor, 2, breakAlpha, true, dashLen, dashGap);
    }

    const addedOthers = new Set(snapshot.added.map((l) => l.other));
    for (const link of snapshot.active) {
      const isNew = addedOthers.has(link.other);
      const alpha = isNew ? (visual?.previewAlpha ?? 0.88) : (visual?.previewAlpha ?? 0.88) * 0.55;
      this.drawLink(link, visual, undefined, 2, alpha, false, dashLen, dashGap);
      if (isNew) {
        this.highlightCandidate(link.other, CANDIDATE_STROKE, CANDIDATE_FILL_ALPHA);
      }
    }

    for (const link of snapshot.blocked) {
      if (addedOthers.has(link.other)) continue;
      this.drawLink(
        link,
        visual,
        hexToNumber(visual?.blockedColor ?? '#b04040'),
        2,
        blockedAlpha,
        true,
        dashLen,
        dashGap,
      );
      this.highlightCandidate(link.other, BLOCKED_STROKE, blockedAlpha * 0.5);
    }
  }

  private drawLink(
    link: { fromCard: { x: number; y: number }; toCard: { x: number; y: number }; fromRole: string; toRole: string },
    visual: LinkVisualConfig | undefined,
    overrideColor: number | undefined,
    width: number,
    alpha: number,
    dashed: boolean,
    dashLen: number,
    dashGap: number,
  ): void {
    const key = edgeStyleKey(link.fromRole, link.toRole);
    const style = visual?.edgeStyles[key];
    const color =
      overrideColor ?? hexToNumber(style?.color ?? visual?.previewEdgeColor ?? '#5a8ac8');
    const w = style?.width ?? width;
    const fx = link.fromCard.x;
    const fy = link.fromCard.y;
    const tx = link.toCard.x;
    const ty = link.toCard.y;

    if (dashed) {
      drawDashedLShapeLink(this.g, fx, fy, tx, ty, color, w, alpha, dashLen, dashGap);
    } else {
      drawLShapeLink(this.g, fx, fy, tx, ty, color, w, alpha);
      drawLinkArrow(this.g, fx, fy, tx, ty, color, alpha);
    }
  }

  private highlightCandidate(
    card: { x: number; y: number; cardWidth: number; cardHeight: number },
    stroke: number,
    fillAlpha: number,
  ): void {
    const r = Math.max(card.cardWidth, card.cardHeight) * 0.42 + 6;
    this.g.fillStyle(stroke, fillAlpha);
    this.g.fillCircle(card.x, card.y, r);
    this.g.lineStyle(2, stroke, 0.95);
    this.g.strokeCircle(card.x, card.y, r);
  }

  hide(): void {
    this.g.clear();
    this.g.setVisible(false);
  }

  destroy(): void {
    this.g.destroy();
  }
}
