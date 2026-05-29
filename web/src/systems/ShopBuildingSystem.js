import Phaser from 'phaser';
/**
 * Shop building on the board: tap opens trade UI; drag cards onto it to sell.
 */
export class ShopBuildingSystem {
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
    onCardTap({ card }) {
        const shop = this.resolveShopBuilding(card);
        if (!shop)
            return;
        this.scene.events.emit('shop-trade-open', { card: shop });
    }
    /** Tapped card may be stacked on top of the shop building. */
    resolveShopBuilding(card) {
        if (this.isShopBuilding(card))
            return card;
        const stack = card.stackId ? this.stacks.getStackAt(card) : undefined;
        if (stack && this.isShopBuilding(stack.base))
            return stack.base;
        return null;
    }
    /** Screen coords (HUD / pointer.x). */
    findShopAtScreen(sx, sy) {
        const cam = this.scene.cameras.main;
        const wx = cam.scrollX + sx / cam.zoom;
        const wy = cam.scrollY + sy / cam.zoom;
        return this.findShopAtWorld(wx, wy);
    }
    /** World / playfield coords. */
    findShopAtWorld(wx, wy, exclude) {
        let best = null;
        let bestDepth = -1;
        for (const stack of this.stacks.getAllStacks()) {
            const base = stack.base;
            if (exclude && base === exclude)
                continue;
            if (!this.isShopBuilding(base))
                continue;
            if (!this.cardContainsWorld(base, wx, wy))
                continue;
            if (base.depth > bestDepth) {
                bestDepth = base.depth;
                best = base;
            }
        }
        return best;
    }
    /** Shop under a dragged card (overlap), not only when centers align. */
    findShopForSell(dragged) {
        let best = null;
        let bestDepth = -1;
        for (const stack of this.stacks.getAllStacks()) {
            const shop = stack.base;
            if (shop === dragged)
                continue;
            if (!this.isShopBuilding(shop))
                continue;
            if (!this.cardsOverlap(dragged, shop))
                continue;
            if (shop.depth > bestDepth) {
                bestDepth = shop.depth;
                best = shop;
            }
        }
        return best;
    }
    isShopBuilding(card) {
        const tags = card.definition.tags ?? [];
        if (!tags.includes('shop'))
            return false;
        const stack = card.stackId ? this.stacks.getStackAt(card) : undefined;
        if (stack && stack.base !== card)
            return false;
        return true;
    }
    cardContainsWorld(card, wx, wy) {
        const hw = card.cardWidth / 2;
        const hh = card.cardHeight / 2;
        return (wx >= card.x - hw &&
            wx <= card.x + hw &&
            wy >= card.y - hh &&
            wy <= card.y + hh);
    }
    cardsOverlap(a, b) {
        const dx = Math.abs(a.x - b.x);
        const dy = Math.abs(a.y - b.y);
        return (dx < (a.cardWidth + b.cardWidth) / 2 &&
            dy < (a.cardHeight + b.cardHeight) / 2);
    }
}
