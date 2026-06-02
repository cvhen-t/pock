import type { CardDefinition, CardShape } from '../types/gameData';

/** Default portrait card (Stacklands-like). */
export const CARD_W = 62;
export const CARD_H = 76;
export const CARD_ICON_SIZE = 36;
export const STACK_SNAP = 38;
export const STACK_HIT_RADIUS = 48;
export const CARD_DROP_RADIUS = 48;

export interface CardMetrics {
  w: number;
  h: number;
  icon: number;
  stackSnap: number;
}

export const CARD_SHAPES: Record<CardShape, CardMetrics> = {
  standard: { w: 62, h: 76, icon: 36, stackSnap: 38 },
  compact: { w: 52, h: 58, icon: 30, stackSnap: 32 },
  slim: { w: 44, h: 72, icon: 30, stackSnap: 34 },
  wide: { w: 92, h: 48, icon: 34, stackSnap: 30 },
  tile: { w: 76, h: 76, icon: 38, stackSnap: 36 },
};

export interface CardContentLayout {
  icon: { x: number; y: number };
  divider: { x: number; y: number; w: number };
  label: { x: number; y: number; fontSize: string; maxWidth: number };
  nameplate: { x: number; y: number; w: number; h: number } | null;
  inner: { x: number; y: number; w: number; h: number };
}

/** Positions in container space (origin at card center). */
export function layoutCardContent(shape: CardShape, m: CardMetrics): CardContentLayout {
  const { w, h, icon: iconSize } = m;
  const pad = 3;
  const labelBand = shape === 'compact' || shape === 'slim' ? 11 : 12;

  if (shape === 'wide') {
    return {
      icon: { x: -w * 0.26, y: 0 },
      divider: { x: -w * 0.05, y: 0, w: 1 },
      label: { x: w * 0.1, y: 0, fontSize: '8px', maxWidth: w * 0.48 },
      nameplate: null,
      inner: { x: 0, y: 0, w: w - 6, h: h - 6 },
    };
  }

  const iconLabelGap = 1;
  const stackH = iconSize + iconLabelGap + labelBand;
  const stackTop = -stackH / 2;
  const iconY = stackTop + iconSize / 2;
  const labelBottom = stackTop + iconSize + iconLabelGap + labelBand;

  return {
    icon: { x: 0, y: iconY },
    divider: { x: 0, y: stackTop + iconSize + 0.5, w: w - 10 },
    label: {
      x: 0,
      y: labelBottom,
      fontSize: shape === 'compact' || shape === 'slim' ? '8px' : '9px',
      maxWidth: w - 8,
    },
    nameplate: null,
    inner: { x: 0, y: 0, w: w - 8, h: h - pad * 2 },
  };
}

export function resolveCardMetrics(def: CardDefinition): CardMetrics {
  const shape = def.shape ?? 'standard';
  return CARD_SHAPES[shape] ?? CARD_SHAPES.standard;
}

/** Playfield cards always render as standard portrait (ignores def.shape). */
export function resolveBoardCardMetrics(_def?: CardDefinition): CardMetrics {
  return CARD_SHAPES.standard;
}
