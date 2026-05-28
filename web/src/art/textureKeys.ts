/** Runtime texture keys (procedural or loaded PNG). */
export const TEX = {
  BG_WASTELAND: 'bg-wasteland',
  CARD_SHELL: 'card-shell',
  CARD_SHELL_COMPACT: 'card-shell-compact',
  CARD_SHELL_SLIM: 'card-shell-slim',
  CARD_SHELL_WIDE: 'card-shell-wide',
  CARD_SHELL_TILE: 'card-shell-tile',
  icon: (cardId: string) => `icon-${cardId}`,
  cardArt: (artKey: string) => `card-art-${artKey}`,
} as const;
