/** Screen layout zones — see docs/game-layout-design.md */
import { HUD_BAR_H } from './hudLayout';
export const LAYOUT_TOP_H = HUD_BAR_H;
/** Bottom player action bar height */
export const LAYOUT_ACTION_H = 80;
/** @deprecated use LAYOUT_ACTION_H */
export const LAYOUT_INVENTORY_H = LAYOUT_ACTION_H;
/** @deprecated use LAYOUT_ACTION_H */
export const LAYOUT_HAND_H = LAYOUT_ACTION_H;
export const LAYOUT_LANE_MIN_W = 108;
export const LAYOUT_LANE_MAX_W = 132;
export const LAYOUT_LANE_WIDTH_RATIO = 0.28;
export const LAYOUT_BACKPACK_MIN_W = 108;
export const LAYOUT_BACKPACK_MAX_W = 132;
export const LAYOUT_BACKPACK_WIDTH_RATIO = 0.28;
/** @deprecated use LAYOUT_BACKPACK_* */
export const LAYOUT_PENDING_MIN_W = LAYOUT_BACKPACK_MIN_W;
/** @deprecated use LAYOUT_BACKPACK_* */
export const LAYOUT_PENDING_MAX_W = LAYOUT_BACKPACK_MAX_W;
/** @deprecated use LAYOUT_BACKPACK_* */
export const LAYOUT_PENDING_WIDTH_RATIO = LAYOUT_BACKPACK_WIDTH_RATIO;
export const HAND_SLOT_GAP = 8;
export const HAND_SLOT_SCALE = 0.92;
export const HAND_DRAG_THRESHOLD = 10;
export const HAND_SCROLL_THRESHOLD = 6;
export const ACTION_SLOT_COUNT = 4;
export const ACTION_SLOT_SCALE = 0.88;
export const ACTION_SLOT_GAP = 10;
export const STACK_LANE_MAX_ENTRIES = 6;
