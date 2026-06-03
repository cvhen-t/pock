import { CARD_H, CARD_W } from './cardLayout';
/** 开局模式：`test` 仅物流演示场，不铺完整教学格。 */
export const INITIAL_BOARD_MODE = 'test';
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
/** 设备间距 ≈ linkRadius 内可连；每条业务链使用独立传送节点，避免汇流歧义 */
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
/**

 * 物流综合演示：多采集 + 双设施合成 + 汇仓储 + 卖出

 *

 * ```text

 * 【林木】枯木林 ─ 收集① ─ 传送① ─ 供料(粗木段) ─ 锈蚀工房

 *                              └─ 传送② ─ 存仓(全部) ──┐

 * 【纤维】锈灌木 ─ 收集② ─ 传送③ ─ 供料(植物纤维) ─ 锈蚀工房(粗麻绳)

 *                              └─ 传送④ ─ 存仓(粗麻绳) ──┼─ 储物棚

 * 【卖出】储物棚 ─ 传送⑤ ─ 卖出(木板) ─ 贸易站

 * ```

 */
export function computeStarterLogisticsLayout(playfield) {
    const H = LOGISTICS_HOP;
    const x0 = playfield.centerX - 300;
    const y0 = playfield.bottom - 92;
    const lane = (hop) => x0 + 55 + hop * H;
    const row = (yOff) => y0 + yOff;
    return [
        // ── 林木线：粗木 → 工房 → 木板入库 ──
        { id: 'wild_tree_grove', x: x0, y: row(-125) },
        { id: 'raw_timber', x: x0 + 28, y: row(-92), quantity: 2 },
        { id: 'auto_collector', x: x0 + 55, y: row(-85) },
        { id: 'auto_receiver', x: lane(1), y: row(-85) },
        {
            id: 'auto_sort_hand',
            x: lane(2),
            y: row(-135),
            sortMode: 'feed',
            sortFilter: 'raw_timber',
        },
        { id: 'facility_workshop', x: lane(3), y: row(-135) },
        { id: 'auto_receiver', x: lane(2), y: row(-35) },
        { id: 'auto_sort_hand', x: lane(3), y: row(-35), sortMode: 'store' },
        // ── 纤维线：植物纤维 → 工房(粗麻绳) → 入库（单原料配方）──
        { id: 'rust_bush', x: x0, y: row(-210) },
        { id: 'plant_fiber', x: x0 + 28, y: row(-178), quantity: 3 },
        { id: 'auto_collector', x: x0 + 55, y: row(-168) },
        { id: 'auto_receiver', x: lane(1), y: row(-168) },
        {
            id: 'auto_sort_hand',
            x: lane(2),
            y: row(-218),
            sortMode: 'feed',
            sortFilter: 'plant_fiber',
        },
        { id: 'facility_workshop', x: lane(3), y: row(-218) },
        { id: 'auto_receiver', x: lane(2), y: row(-118) },
        {
            id: 'auto_sort_hand',
            x: lane(3),
            y: row(-118),
            sortMode: 'store',
            sortFilter: 'rope_coil',
        },
        // ── 中央储物棚（多路存仓分拣手汇入，maxIn:4）──
        { id: 'facility_warehouse', x: lane(4), y: row(-75) },
        // ── 卖出线：棚出库 → 贸易站（可改筛选为 scrap / 全部可卖物）──
        { id: 'auto_receiver', x: lane(3), y: row(-75) },
        {
            id: 'auto_sort_hand',
            x: lane(2),
            y: row(-75),
            sortMode: 'sell',
            sortFilter: 'wood_plank',
        },
        { id: 'trader_post', x: lane(1), y: row(-75) },
        // 备用地面物资（碎铁可拾取，后期可经另一套链存/卖）
        { id: 'scrap', x: x0 + 28, y: row(-42), quantity: 3 },
    ];
}
/** 演示场说明（UI / 图鉴可引用） */
export const LOGISTICS_DEMO_CHAIN_DOC = `

林木线：收集探头拾取枯木林/粗木段 → 传送① → 分拣手【供料·粗木段】→ 锈蚀工房 → 传送② → 分拣手【存入仓库·全部】→ 储物棚

纤维线：收集探头拾取纤维 → 传送③ → 分拣手【供料·植物纤维】→ 锈蚀工房(粗麻绳) → 传送④ → 分拣手【存入仓库·粗麻绳】→ 储物棚

卖出线：储物棚 → 传送⑤ → 分拣手【卖出·木板】→ 贸易站（棚内木板自动换筹码）

`.trim();
