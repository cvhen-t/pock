import Phaser from 'phaser';
import { edgeStyleKey } from '../core/linkRules';
import { EVENT_AUTOMATION_GRAPH_UPDATED, isActiveCollectorChain, isActiveFacilityRelayChain, REGISTRY_AUTOMATION_GRAPH, } from '../core/automationNetwork';
import { hexToNumber, REGISTRY_LINK_VISUAL } from '../core/linkVisualConfig';
import { drawLShapeLink } from './logisticsLinkDraw';
export class ConveyorLinkRenderer {
    scene;
    gfx;
    refreshTimer;
    constructor(scene) {
        this.scene = scene;
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
    draw() {
        const graph = this.scene.registry.get(REGISTRY_AUTOMATION_GRAPH);
        const visual = this.scene.registry.get(REGISTRY_LINK_VISUAL);
        if (!graph || !visual)
            return;
        this.gfx.clear();
        for (const edge of graph.edges) {
            const key = edgeStyleKey(edge.fromRole, edge.toRole);
            const style = visual.edgeStyles[key];
            const color = hexToNumber(style?.color ?? visual.activeEdgeColor);
            const width = style?.width ?? 2;
            const active = edge.from.role === 'logistics_collect'
                ? isActiveCollectorChain(graph, edge.from)
                : edge.from.role === 'logistics_facility' && edge.toRole === 'auto_relay'
                    ? isActiveFacilityRelayChain(graph, edge.from)
                    : true;
            this.drawEdge(edge.from.card, edge.to.card, color, width, active ? 0.85 : visual.inactiveAlpha);
        }
    }
    drawEdge(from, to, color, width, alpha) {
        drawLShapeLink(this.gfx, from.x, from.y, to.x, to.y, color, width, alpha);
    }
}
