function hex(color, alpha = 1) {
    const r = (color >> 16) & 255;
    const g = (color >> 8) & 255;
    const b = color & 255;
    return `rgba(${r},${g},${b},${alpha})`;
}
export function canvasIconCtx(ctx) {
    return {
        fillStyle(color, alpha = 1) {
            ctx.fillStyle = hex(color, alpha);
        },
        strokeStyle(color, width, alpha = 1) {
            ctx.strokeStyle = hex(color, alpha);
            ctx.lineWidth = width;
        },
        fillCircle(x, y, r) {
            ctx.beginPath();
            ctx.arc(x, y, r, 0, Math.PI * 2);
            ctx.fill();
        },
        strokeCircle(x, y, r) {
            ctx.beginPath();
            ctx.arc(x, y, r, 0, Math.PI * 2);
            ctx.stroke();
        },
        fillRect(x, y, w, h) {
            ctx.fillRect(x, y, w, h);
        },
        fillRoundedRect(x, y, w, h, r) {
            roundRect(ctx, x, y, w, h, r);
            ctx.fill();
        },
        fillEllipse(x, y, rw, rh) {
            ctx.beginPath();
            ctx.ellipse(x, y, rw, rh, 0, 0, Math.PI * 2);
            ctx.fill();
        },
        strokeEllipse(x, y, rw, rh) {
            ctx.beginPath();
            ctx.ellipse(x, y, rw, rh, 0, 0, Math.PI * 2);
            ctx.stroke();
        },
        line(x1, y1, x2, y2) {
            ctx.beginPath();
            ctx.moveTo(x1, y1);
            ctx.lineTo(x2, y2);
            ctx.stroke();
        },
        fillTriangle(x1, y1, x2, y2, x3, y3) {
            ctx.beginPath();
            ctx.moveTo(x1, y1);
            ctx.lineTo(x2, y2);
            ctx.lineTo(x3, y3);
            ctx.closePath();
            ctx.fill();
        },
        strokeRoundedRect(x, y, w, h, r) {
            roundRect(ctx, x, y, w, h, r);
            ctx.stroke();
        },
    };
}
function roundRect(ctx, x, y, w, h, r) {
    const rad = Math.min(r, w / 2, h / 2);
    ctx.beginPath();
    ctx.moveTo(x + rad, y);
    ctx.lineTo(x + w - rad, y);
    ctx.quadraticCurveTo(x + w, y, x + w, y + rad);
    ctx.lineTo(x + w, y + h - rad);
    ctx.quadraticCurveTo(x + w, y + h, x + w - rad, y + h);
    ctx.lineTo(x + rad, y + h);
    ctx.quadraticCurveTo(x, y + h, x, y + h - rad);
    ctx.lineTo(x, y + rad);
    ctx.quadraticCurveTo(x, y, x + rad, y);
    ctx.closePath();
}
