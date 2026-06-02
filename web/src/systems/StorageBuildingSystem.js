import Phaser from 'phaser';
import { isPlayerWarehouseCard } from '../core/storageInventory';
/** 储物棚：单击打开仓储面板 */
export class StorageBuildingSystem {
    scene;
    stacks;
    constructor(scene, stacks) {
        this.scene = scene;
        this.stacks = stacks;
        scene.events.on('board-card-tap', this.onCardTap, this);
        scene.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
            scene.events.off('board-card-tap', this.onCardTap, this);
        });
    }
    onCardTap = ({ card }) => {
        const warehouse = this.resolveWarehouse(card);
        if (!warehouse)
            return;
        this.scene.events.emit('storage-panel-open', { card: warehouse });
    };
    resolveWarehouse(card) {
        if (this.isWarehouseBuilding(card))
            return card;
        const stack = card.stackId ? this.stacks.getStackAt(card) : undefined;
        if (stack && this.isWarehouseBuilding(stack.base))
            return stack.base;
        return null;
    }
    isWarehouseBuilding(card) {
        if (!isPlayerWarehouseCard(card))
            return false;
        const stack = card.stackId ? this.stacks.getStackAt(card) : undefined;
        if (stack && stack.base !== card)
            return false;
        return true;
    }
}
