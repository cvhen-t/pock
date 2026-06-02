import Phaser from 'phaser';
import { getLogisticsRole } from '../core/linkRules';
export class SortHandBuildingSystem {
    scene;
    constructor(scene) {
        this.scene = scene;
        scene.events.on('board-card-tap', this.onCardTap, this);
        scene.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
            scene.events.off('board-card-tap', this.onCardTap, this);
        });
    }
    onCardTap = ({ card }) => {
        if (!this.isSortHand(card))
            return;
        this.scene.events.emit('sort-hand-panel-open', { card });
    };
    isSortHand(card) {
        return getLogisticsRole(card.definition.tags ?? []) === 'logistics_sorter';
    }
}
