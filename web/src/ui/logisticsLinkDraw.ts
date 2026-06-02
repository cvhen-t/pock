/** L-shaped logistics edge (horizontal then vertical). */
export function drawLShapeLink(
  g: Phaser.GameObjects.Graphics,
  fromX: number,
  fromY: number,
  toX: number,
  toY: number,
  color: number,
  width: number,
  alpha: number,
): void {
  g.lineStyle(width, color, alpha);
  const mx = (fromX + toX) / 2;
  g.beginPath();
  g.moveTo(fromX, fromY);
  g.lineTo(mx, fromY);
  g.lineTo(mx, toY);
  g.lineTo(toX, toY);
  g.strokePath();
}

export function drawLinkArrow(
  g: Phaser.GameObjects.Graphics,
  fromX: number,
  _fromY: number,
  toX: number,
  toY: number,
  color: number,
  alpha: number,
): void {
  const mx = (fromX + toX) / 2;
  const ang = Math.atan2(0, toX - mx);
  const ax = toX - Math.cos(ang) * 10;
  const ay = toY - Math.sin(ang) * 10;
  g.fillStyle(color, alpha);
  g.fillTriangle(toX, toY, ax + 4, ay, ax - 4, ay);
}
