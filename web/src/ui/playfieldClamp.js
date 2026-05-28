import Phaser from 'phaser';
const DEFAULT_PAD = 6;
/** Clamp a solo card center inside the playfield. */
export function clampCardCenter(playfield, card, padding = DEFAULT_PAD) {
    const hw = card.cardWidth / 2;
    const hh = card.cardHeight / 2;
    card.x = Phaser.Math.Clamp(card.x, playfield.left + hw + padding, playfield.right - hw - padding);
    card.y = Phaser.Math.Clamp(card.y, playfield.top + hh + padding, playfield.bottom - hh - padding);
}
/** Shift a stack so its pile bounds stay inside the playfield. */
export function clampStackToPlayfield(stacks, stack, playfield, padding = DEFAULT_PAD) {
    const bounds = stacks.getPileBounds(stack);
    let dx = 0;
    let dy = 0;
    if (bounds.left < playfield.left + padding) {
        dx = playfield.left + padding - bounds.left;
    }
    else if (bounds.right > playfield.right - padding) {
        dx = playfield.right - padding - bounds.right;
    }
    if (bounds.top < playfield.top + padding) {
        dy = playfield.top + padding - bounds.top;
    }
    else if (bounds.bottom > playfield.bottom - padding) {
        dy = playfield.bottom - padding - bounds.bottom;
    }
    if (dx === 0 && dy === 0)
        return;
    stack.base.x += dx;
    stack.base.y += dy;
    stacks.layoutStack(stack);
}
export function clampDraggedCards(stacks, playfield, mode, leader, stack) {
    if (mode === 'pile' && stack) {
        stacks.layoutStack(stack);
        clampStackToPlayfield(stacks, stack, playfield);
        return;
    }
    clampCardCenter(playfield, leader);
    const s = stacks.getStackAt(leader);
    if (s?.base === leader) {
        stacks.layoutStack(s);
        clampStackToPlayfield(stacks, s, playfield);
    }
}
