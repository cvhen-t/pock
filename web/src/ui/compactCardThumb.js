import { CARD_SHAPES, resolveCardMetrics } from '../config/cardLayout';
import { dataStore } from '../core/DataStore';
import { resolveCardIconKey } from '../art/resolveCardIconKey';
import { CARD_ICON_BG, CARD_INNER_ALPHA } from '../art/cardIconStyle';
import { TEX } from '../art/textureKeys';
const SHELL_BY_SHAPE = {
    standard: TEX.CARD_SHELL,
    compact: TEX.CARD_SHELL_COMPACT,
    slim: TEX.CARD_SHELL_SLIM,
    wide: TEX.CARD_SHELL_WIDE,
    tile: TEX.CARD_SHELL_TILE,
};
/** HUD-sized card preview (shop shelf, tooltips). */
export function createCardThumb(scene, cardId, options = {}) {
    const def = dataStore.getCard(cardId);
    if (!def)
        return null;
    const scale = options.scale ?? 0.82;
    const uniform = options.uniformStandard ?? false;
    const shape = uniform ? 'standard' : (def.shape ?? 'standard');
    const metrics = uniform ? CARD_SHAPES.standard : resolveCardMetrics(def);
    const w = metrics.w * scale;
    const h = metrics.h * scale;
    const shellKey = uniform ? TEX.CARD_SHELL : (SHELL_BY_SHAPE[shape] ?? TEX.CARD_SHELL);
    const container = scene.add.container(0, 0);
    const shell = scene.add.image(0, 0, shellKey);
    shell.setDisplaySize(w + 2, h + 2);
    const inner = scene.add.rectangle(0, 0, w - 8, h - 12, CARD_ICON_BG, CARD_INNER_ALPHA);
    const iconKey = resolveIconKey(scene, def);
    const icon = scene.add.image(0, -h * 0.08, iconKey);
    icon.setDisplaySize(metrics.icon * scale, metrics.icon * scale);
    const title = options.title ?? def.name;
    const namePx = Math.max(7, Math.round(8 * (scale / 0.82)));
    const name = scene.add.text(0, h * 0.24, title, {
        fontSize: shape === 'slim' ? `${Math.max(6, namePx - 1)}px` : `${namePx}px`,
        color: '#000000',
        align: 'center',
        wordWrap: { width: w - 8 },
    });
    name.setOrigin(0.5, 0);
    container.add([shell, inner, icon, name]);
    if (options.subtitle) {
        const sub = scene.add.text(0, -h * 0.38, options.subtitle, {
            fontSize: '9px',
            color: '#c9b896',
            backgroundColor: '#2a2620',
            padding: { x: 4, y: 2 },
        });
        sub.setOrigin(0.5);
        container.add(sub);
    }
    let totalH = h;
    if (options.priceCaps !== undefined) {
        const below = options.priceBelowCard ?? false;
        const compact = options.compactPrice ?? false;
        const priceY = below ? h / 2 + (compact ? 2 : 10) : h * 0.46;
        const price = scene.add.text(0, priceY, `${options.priceCaps} 筹`, {
            fontSize: `${Math.max(compact ? 9 : 10, Math.round(11 * (scale / 0.82)))}px`,
            color: '#f0d878',
            backgroundColor: '#3a3020',
            padding: compact ? { x: 3, y: 0 } : { x: 6, y: 2 },
        });
        price.setOrigin(0.5, 0);
        container.add(price);
        if (below)
            totalH = h / 2 + priceY + price.height + (compact ? 1 : 4);
    }
    container.setSize(w, totalH);
    container.setData('thumbW', w);
    container.setData('thumbH', totalH);
    container.setData('thumbCardH', h);
    return container;
}
function resolveIconKey(scene, def) {
    return resolveCardIconKey(scene, def);
}
