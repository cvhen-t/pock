export type CardDeck = 'resource' | 'attack' | 'defense';

/** Visual footprint on the board. */
export type CardShape = 'standard' | 'compact' | 'slim' | 'wide' | 'tile';

export interface CardEffect {
  type: string;
  [key: string]: unknown;
}

export interface CardDefinition {
  id: string;
  name: string;
  /** Which deck this card belongs to (packs / UI filter). */
  deck?: CardDeck;
  /** Board size preset — e.g. fence = slim. */
  shape?: CardShape;
  tags?: string[];
  color?: string;
  /** Procedural / PNG icon key; defaults to `id`. */
  icon?: string;
  /** `public/assets/cards/{artKey}.png` when present. */
  artKey?: string;
  effects?: CardEffect[];
}

export interface RecipeInput {
  tag?: string;
  cardId?: string;
  count: number;
}

export interface RecipeDefinition {
  id: string;
  inputs: RecipeInput[];
  output: { cardId: string; count?: number };
  workSeconds?: number;
  manualUnlock?: string;
}
