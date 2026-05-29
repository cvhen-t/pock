import { CARD_H, CARD_W } from './cardLayout';

export interface StarterBoardSlot {
  id: string;
  col: number;
  row: number;
}

/** Grid slots (col, row) for starter board — base near center. */
const STARTER_GRID: StarterBoardSlot[] = [
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

export interface StarterBoardPosition {
  id: string;
  x: number;
  y: number;
}

/**
 * Starter card centers that respect card size and playfield bounds.
 */
export function computeStarterBoardLayout(
  playfield: Phaser.Geom.Rectangle,
): StarterBoardPosition[] {
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
