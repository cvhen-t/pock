import Phaser from 'phaser';
import { resolveCardMetrics } from '../config/cardLayout';
import { dataStore } from '../core/DataStore';
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
    const shape = def.shape ?? 'standard';
    const metrics = resolveCardMetrics(def);
    const w = metrics.w * scale;
    const h = metrics.h * scale;
    const shellKey = SHELL_BY_SHAPE[shape] ?? TEX.CARD_SHELL;
    const container = scene.add.container(0, 0);
    const shell = scene.add.image(0, 0, shellKey);
    shell.setDisplaySize(w + 2, h + 2);
    const color = Phaser.Display.Color.HexStringToColor(def.color ?? '#4a4540').color;
    const inner = scene.add.rectangle(0, 0, w - 8, h - 12, color, 0.9);
    const iconKey = resolveIconKey(scene, def);
    const icon = scene.add.image(0, -h * 0.08, iconKey);
    icon.setDisplaySize(metrics.icon * scale, metrics.icon * scale);
    const title = options.title ?? def.name;
    const namePx = Math.max(7, Math.round(8 * (scale / 0.82)));
    const name = scene.add.text(0, h * 0.24, title, {
        fontSize: shape === 'slim' ? `${Math.max(6, namePx - 1)}px` : `${namePx}px`,
        color: '#e8e0d4',
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
        const priceY = below ? h / 2 + 10 : h * 0.46;
        const price = scene.add.text(0, priceY, `${options.priceCaps} 筹`, {
            fontSize: `${Math.max(10, Math.round(11 * (scale / 0.82)))}px`,
            color: '#f0d878',
            backgroundColor: '#3a3020',
            padding: { x: 6, y: 2 },
        });
        price.setOrigin(0.5, 0);
        container.add(price);
        if (below)
            totalH = h / 2 + priceY + price.height + 4;
    }
    container.setSize(w, totalH);
    container.setData('thumbW', w);
    container.setData('thumbH', totalH);
    container.setData('thumbCardH', h);
    return container;
}
function resolveIconKey(scene, def) {
    if (def.artKey && scene.textures.exists(TEX.cardArt(def.artKey))) {
        return TEX.cardArt(def.artKey);
    }
    const iconId = def.icon ?? def.id;
    const procedural = TEX.icon(iconId);
    if (scene.textures.exists(procedural)) {
        return procedural;
    }
    return TEX.icon(def.id);
}
