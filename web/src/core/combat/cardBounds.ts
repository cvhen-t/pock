import type GameCard from '../../objects/GameCard';

export function getCardBounds(card: GameCard): Phaser.Geom.Rectangle {
  const hw = card.cardWidth / 2;
  const hh = card.cardHeight / 2;
  return new Phaser.Geom.Rectangle(card.x - hw, card.y - hh, card.cardWidth, card.cardHeight);
}

export function pointInCard(card: GameCard, x: number, y: number): boolean {
  const b = getCardBounds(card);
  return b.contains(x, y);
}
