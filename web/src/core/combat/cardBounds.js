export function getCardBounds(card) {
    const hw = card.cardWidth / 2;
    const hh = card.cardHeight / 2;
    return new Phaser.Geom.Rectangle(card.x - hw, card.y - hh, card.cardWidth, card.cardHeight);
}
export function pointInCard(card, x, y) {
    const b = getCardBounds(card);
    return b.contains(x, y);
}
