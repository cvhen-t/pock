import Phaser from 'phaser';
import { isAutomationEdgeActive } from '../core/automationPath';
import { edgeStyleKey } from '../core/linkRules';
import {
  EVENT_AUTOMATION_GRAPH_UPDATED,
  REGISTRY_AUTOMATION_GRAPH,
  type AutomationGraph,
} from '../core/automationNetwork';
import { hexToNumber, REGISTRY_LINK_VISUAL, type LinkVisualConfig } from '../core/linkVisualConfig';
import type GameCard from '../objects/GameCard';
import { drawLShapeLink } from './logisticsLinkDraw';

export class ConveyorLinkRenderer {
  private readonly gfx: Phaser.GameObjects.Graphics;
  private readonly refreshTimer: Phaser.Time.TimerEvent;

  constructor(private readonly scene: Phaser.Scene) {
    this.gfx = scene.add.graphics().setDepth(3);
    scene.events.on(EVENT_AUTOMATION_GRAPH_UPDATED, () => this.draw());
    scene.events.on('layout-changed', () => this.draw());
    this.refreshTimer = scene.time.addEvent({
      delay: 50,
      loop: true,
      callback: () => this.draw(),
    });
    scene.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.refreshTimer.remove();
      this.gfx.destroy();
    });
  }

  private draw(): void {
    const graph = this.scene.registry.get(REGISTRY_AUTOMATION_GRAPH) as AutomationGraph | undefined;
    const visual = this.scene.registry.get(REGISTRY_LINK_VISUAL) as LinkVisualConfig | undefined;
    if (!graph || !visual) return;

    this.gfx.clear();
    for (const edge of graph.edges) {
      const key = edgeStyleKey(edge.fromRole, edge.toRole);
      const style = visual.edgeStyles[key];
      const color = hexToNumber(style?.color ?? visual.activeEdgeColor);
      const width = style?.width ?? 2;
      const active = isAutomationEdgeActive(graph, edge);
      this.drawEdge(edge.from.card, edge.to.card, color, width, active ? 0.85 : visual.inactiveAlpha);
    }
  }

  private drawEdge(
    from: GameCard,
    to: GameCard,
    color: number,
    width: number,
    alpha: number,
  ): void {
    drawLShapeLink(this.gfx, from.x, from.y, to.x, to.y, color, width, alpha);
  }
}
