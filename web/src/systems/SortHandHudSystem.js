import Phaser from 'phaser';
import { getLogisticsRole } from '../core/linkRules';
import GameCard from '../objects/GameCard';
import { SortHandHud } from '../ui/SortHandHud';
/** 为棋盘上的分拣手挂载配置摘要 HUD */
export class SortHandHudSystem {
    scene;
    huds = new Map();
    constructor(scene) {
        this.scene = scene;
        scene.events.on('card-spawned', this.onCardSpawned, this);
        scene.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
            scene.events.off('card-spawned', this.onCardSpawned, this);
            for (const hud of this.huds.values())
                hud.destroy();
            this.huds.clear();
        });
        for (const child of scene.children.list) {
            if (child instanceof GameCard)
                this.attachIfSortHand(child);
        }
    }
    onCardSpawned = (card) => {
        this.attachIfSortHand(card);
    };
    attachIfSortHand(card) {
        if (getLogisticsRole(card.definition.tags ?? []) !== 'logistics_sorter')
            return;
        if (this.huds.has(card))
            return;
        this.huds.set(card, new SortHandHud(card, this.scene));
    }
}
