/** Top HUD layout — resources, day timer, action rail */

export const HUD_BAR_H = 31;
export const HUD_SIDE_PAD = 10;
export const HUD_CHIP_H = 25;
export const HUD_CHIP_W = 80;
export const HUD_CHIP_GAP = 6;
export const HUD_ACTION_BTN = 24;
export const HUD_GUIDE_BTN = 28;
export const HUD_ACTION_GAP = 8;
export const HUD_DAY_BAR_W = 84;

export const HUD_RES_ICON: Record<'food' | 'water' | 'caps', string> = {
  food: 'canned_food',
  water: 'water_clean',
  caps: 'caps',
};

export const HUD_RES_LABELS: Record<'food' | 'water' | 'caps', string> = {
  food: '食物',
  water: '净水',
  caps: '筹码',
};

export const HUD_RES_COLORS: Record<
  'food' | 'water' | 'caps',
  { bg: number; stroke: number; text: string }
> = {
  food: { bg: 0x3a3028, stroke: 0x6a5a40, text: '#e8c89a' },
  water: { bg: 0x283238, stroke: 0x4a6a7a, text: '#9ac8e8' },
  caps: { bg: 0x383228, stroke: 0x7a6a3a, text: '#f0d878' },
};
