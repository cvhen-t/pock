import { CARD_H, CARD_W } from './cardLayout';
/** Grid slots (col, row) for starter board — base near center. */
const STARTER_GRID = [
    { id: 'wild_tree_grove', col: 0, row: 0 },
    { id: 'trader_post', col: 1, row: 0 },
    { id: 'wild_ore_vein', col: 2, row: 0 },
    { id: 'fence_iron', col: 3, row: 0 },
    { id: 'scrap_pile', col: 0, row: 1 },
    { id: 'survivor', col: 1, row: 1 },
    { id: 'rust_bush', col: 2, row: 1 },
    { id: 'plant_thornvine', col: 3, row: 1 },
    { id: 'wild_lake', col: 4, row: 1 },
    { id: 'sandbag_wall', col: 0, row: 2 },
    { id: 'seed_thornvine', col: 1, row: 2 },
    { id: 'base_camp', col: 2, row: 2 },
    { id: 'blight_plot', col: 3, row: 2 },
    { id: 'wild_soil_mound', col: 4, row: 2 },
];
const GRID_COLS = 5;
const GRID_ROWS = 3;
const CELL_GAP_X = 14;
const CELL_GAP_Y = 16;
const PLAYFIELD_PAD = 12;
const LOGISTICS_HOP = 82;
/**
 * Starter card centers that respect card size and playfield bounds.
 */
export function computeStarterBoardLayout(playfield) {
    const idealCellW = CARD_W + CELL_GAP_X;
    const idealCellH = CARD_H + CELL_GAP_Y;
    const gridW = (GRID_COLS - 1) * idealCellW;
    const gridH = (GRID_ROWS - 1) * idealCellH;
    const maxW = playfield.width - PLAYFIELD_PAD * 2;
    const maxH = playfield.height - PLAYFIELD_PAD * 2;
    const scale = Math.min(1, maxW / gridW, maxH / gridH);
    const cellW = idealCellW * scale;
    const cellH = idealCellH * scale;
    const originX = playfield.centerX - gridW * scale * 0.5;
    const originY = playfield.centerY - gridH * scale * 0.5 + playfield.height * 0.02;
    return STARTER_GRID.map(({ id, col, row }) => ({
        id,
        x: originX + col * cellW,
        y: originY + row * cellH,
    }));
}
/** Demo: 资源 → 传送 → 分拣手 → 商店 / 工房（并行分支） */
export function computeStarterLogisticsLayout(playfield) {
    const y = playfield.bottom - 88;
    const x0 = playfield.centerX - LOGISTICS_HOP * 2;
    return [
        { id: 'auto_collector', x: x0, y },
        { id: 'auto_receiver', x: x0 + LOGISTICS_HOP, y },
        { id: 'auto_sort_hand', x: x0 + LOGISTICS_HOP * 2, y: y - 55, sortMode: 'sell', sortFilter: 'scrap' },
        { id: 'trader_post', x: x0 + LOGISTICS_HOP * 3, y: y - 55 },
        { id: 'auto_sort_hand', x: x0 + LOGISTICS_HOP * 2, y: y + 55, sortMode: 'feed', sortFilter: 'scrap' },
        { id: 'facility_workshop', x: x0 + LOGISTICS_HOP * 3, y: y + 55 },
        { id: 'scrap', x: x0 - 36, y: y + 44, quantity: 2 },
    ];
}
