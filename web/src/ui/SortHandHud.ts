import Phaser from 'phaser';

import { REGISTRY_AUTOMATION_GRAPH, type AutomationGraph } from '../core/automationNetwork';
import { formatSortHandSummary } from '../core/sortHandRules';
import type GameCard from '../objects/GameCard';

/** 分拣手底牌下方的配置摘要条 */
export class SortHandHud {
  private readonly label: Phaser.GameObjects.Text;

  private readonly onRotated: (card: GameCard) => void;

  private readonly onConfigChanged: (payload: { card: GameCard }) => void;

  private readonly onGraphUpdated: () => void;

  constructor(
    private readonly card: GameCard,
    private readonly scene: Phaser.Scene,
  ) {
    this.label = scene.add.text(0, 0, '', {
      fontSize: '9px',
      color: '#c9c0b0',
      backgroundColor: '#2a2620cc',
      padding: { x: 4, y: 2 },
    });
    card.add(this.label);
    this.layout();
    this.refresh();

    this.onRotated = (c) => {
      if (c === card) this.layout();
    };
    this.onConfigChanged = ({ card: c }) => {
      if (c === card) this.refresh();
    };
    this.onGraphUpdated = () => this.refresh();

    scene.events.on('card-rotated', this.onRotated);
    scene.events.on('sort-hand-config-changed', this.onConfigChanged);
    scene.events.on('automation-graph-updated', this.onGraphUpdated);
  }

  refresh(): void {
    const graph = this.scene.registry.get(REGISTRY_AUTOMATION_GRAPH) as
      | AutomationGraph
      | undefined;
    this.label.setText(formatSortHandSummary(this.card, graph));
    this.layout();
  }

  destroy(): void {
    this.scene.events.off('card-rotated', this.onRotated);
    this.scene.events.off('sort-hand-config-changed', this.onConfigChanged);
    this.scene.events.off('automation-graph-updated', this.onGraphUpdated);
    this.label.destroy();
  }

  private layout(): void {
    const y = this.card.cardHeight / 2 + 4;
    this.label.setPosition(0, y);
    this.label.setOrigin(0.5, 0);
    this.label.setDepth(22);
  }
}
