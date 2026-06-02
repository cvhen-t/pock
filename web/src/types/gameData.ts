export type CardDeck = 'resource' | 'attack' | 'defense' | 'wilderness' | 'facility';

/** Visual footprint on the board. */
export type CardShape = 'standard' | 'compact' | 'slim' | 'wide' | 'tile';

export interface CardEffect {
  type: string;
  [key: string]: unknown;
}

/** Placed-on-board world sprite (card face while dragging). */
export interface PlacedVisualConfig {
  /** Key in world sprite registry, e.g. `plant_thornvine_world`. */
  spriteId: string;
  scale?: number;
  /** Y offset from card center to sprite feet (px). */
  feetOffsetY?: number;
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
  placedVisual?: PlacedVisualConfig;
  effects?: CardEffect[];
}

export interface RecipeInput {
  tag?: string;
  cardId?: string;
  count: number;
}

export interface RecipeExtraOutput {
  cardId: string;
  count?: number;
}

export interface RecipeDefinition {
  id: string;
  inputs: RecipeInput[];
  output: { cardId: string; count?: number };
  workSeconds?: number;
  manualUnlock?: string;
  /** Facility craft station id (workshop, kitchen, …). */
  stationId?: string;
  dayMin?: number;
  /** @deprecated Use dayMin — kept for legacy recipe JSON. */
  moonPhaseMin?: number;
  /** Slaughter recipes consume animal members. */
  consumeAnimals?: boolean;
  extraOutputs?: RecipeExtraOutput[];
}
