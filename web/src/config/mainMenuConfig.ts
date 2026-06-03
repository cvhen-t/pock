/** Main menu copy and palette — single config entry for title screen. */

export const MAIN_MENU_COPY = {
  title: '荒原叠卡',
  tagline: '废土叠卡生存',
  subtitle: '叠放卡牌 · 抵御侵蚀 · 熬过每一个长夜',
  startLabel: '开始生存',
  continueLabel: '继续游戏',
  continueHintNoSave: '暂无存档',
  versionLabel: '早期体验',
} as const;

export const MAIN_MENU_COLORS = {
  overlay: 0x0c0b09,
  overlayAlpha: 0.62,
  vignette: 0x1a1612,
  vignetteAlpha: 0.35,
  panelBg: 0x1e1c18,
  panelStroke: 0x5c4a32,
  title: '#e8dcc8',
  tagline: '#8b6914',
  subtitle: '#8a8070',
  version: '#5a5248',
  btnPrimaryBg: 0x4a3a22,
  btnPrimaryBgHover: 0x5c4828,
  btnPrimaryStroke: 0x8b6914,
  btnPrimaryText: '#f0e4c8',
  btnSecondaryBg: 0x322e28,
  btnSecondaryBgHover: 0x3e3a34,
  btnSecondaryStroke: 0x5c4a32,
  btnSecondaryText: '#c9b896',
} as const;

export const MAIN_MENU_LAYOUT = {
  panelMaxW: 360,
  panelPadX: 28,
  panelPadY: 32,
  titleSize: '32px',
  taglineSize: '13px',
  subtitleSize: '12px',
  btnW: 220,
  btnH: 44,
  btnGap: 12,
} as const;
