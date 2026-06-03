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
function lShapePoints(fromX, fromY, toX, toY) {
    const mx = (fromX + toX) / 2;
    return [
        { x: fromX, y: fromY },
        { x: mx, y: fromY },
        { x: mx, y: toY },
        { x: toX, y: toY },
    ];
}
/** 虚线 L 型折线（断链预览） */
export function drawDashedLShapeLink(g, fromX, fromY, toX, toY, color, width, alpha, dashLength, dashGap) {
    const pts = lShapePoints(fromX, fromY, toX, toY);
    g.lineStyle(width, color, alpha);
    let draw = true;
    let remain = dashLength;
    const strokeSeg = (x1, y1, x2, y2) => {
        const len = Math.hypot(x2 - x1, y2 - y1);
        if (len <= 0)
            return;
        let t0 = 0;
        while (t0 < len) {
            const step = Math.min(remain, len - t0);
            const t1 = t0 + step;
            if (draw) {
                const sx = x1 + ((x2 - x1) * t0) / len;
                const sy = y1 + ((y2 - y1) * t0) / len;
                const ex = x1 + ((x2 - x1) * t1) / len;
                const ey = y1 + ((y2 - y1) * t1) / len;
                g.beginPath();
                g.moveTo(sx, sy);
                g.lineTo(ex, ey);
                g.strokePath();
            }
            t0 = t1;
            if (remain === step) {
                draw = !draw;
                remain = draw ? dashLength : dashGap;
            }
            else {
                remain -= step;
            }
        }
    };
    for (let i = 0; i < pts.length - 1; i++) {
        strokeSeg(pts[i].x, pts[i].y, pts[i + 1].x, pts[i + 1].y);
    }
}
export function drawLinkArrow(g, fromX, _fromY, toX, toY, color, alpha) {
    const mx = (fromX + toX) / 2;
    const ang = Math.atan2(0, toX - mx);
    const ax = toX - Math.cos(ang) * 10;
    const ay = toY - Math.sin(ang) * 10;
    g.fillStyle(color, alpha);
    g.fillTriangle(toX, toY, ax + 4, ay, ax - 4, ay);
}
