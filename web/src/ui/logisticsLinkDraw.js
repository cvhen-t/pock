/** L-shaped logistics edge (horizontal then vertical). */
export function drawLShapeLink(g, fromX, fromY, toX, toY, color, width, alpha) {
    g.lineStyle(width, color, alpha);
    const mx = (fromX + toX) / 2;
    g.beginPath();
    g.moveTo(fromX, fromY);
    g.lineTo(mx, fromY);
    g.lineTo(mx, toY);
    g.lineTo(toX, toY);
    g.strokePath();
}
export function drawLinkArrow(g, fromX, _fromY, toX, toY, color, alpha) {
    const mx = (fromX + toX) / 2;
    const ang = Math.atan2(0, toX - mx);
    const ax = toX - Math.cos(ang) * 10;
    const ay = toY - Math.sin(ang) * 10;
    g.fillStyle(color, alpha);
    g.fillTriangle(toX, toY, ax + 4, ay, ax - 4, ay);
}
