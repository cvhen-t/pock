import Phaser from 'phaser';

import {
  MAIN_MENU_COLORS,
  MAIN_MENU_COPY,
  MAIN_MENU_LAYOUT,
} from '../config/mainMenuConfig';
import type { SaveSlotSummary } from '../core/save/saveTypes';
import { formatSaveTimestamp } from '../core/save/saveStorage';
import MenuButton from './MenuButton';

export interface MainMenuPanelCallbacks {
  onStart: () => void;
  onContinue: () => void;
}

/**
 * Centered title card: game name, tagline, primary CTA, continue save.
 */
export default class MainMenuPanel extends Phaser.GameObjects.Container {
  private readonly panelBg: Phaser.GameObjects.Rectangle;

  private readonly titleText: Phaser.GameObjects.Text;

  private readonly taglineText: Phaser.GameObjects.Text;

  private readonly divider: Phaser.GameObjects.Rectangle;

  private readonly subtitleText: Phaser.GameObjects.Text;

  private readonly startBtn: MenuButton;

  private readonly continueBtn: MenuButton;

  private readonly continueHint: Phaser.GameObjects.Text;

  private readonly versionText: Phaser.GameObjects.Text;

  private panelW: number = MAIN_MENU_LAYOUT.panelMaxW;

  private panelH = 320;

  constructor(scene: Phaser.Scene, callbacks: MainMenuPanelCallbacks) {
    super(scene, 0, 0);

    this.panelBg = scene.add.rectangle(0, 0, this.panelW, this.panelH, MAIN_MENU_COLORS.panelBg, 0.94);
    this.panelBg.setStrokeStyle(1, MAIN_MENU_COLORS.panelStroke, 0.85);

    this.titleText = scene.add.text(0, 0, MAIN_MENU_COPY.title, {
      fontFamily: 'system-ui, -apple-system, sans-serif',
      fontSize: MAIN_MENU_LAYOUT.titleSize,
      fontStyle: '700',
      color: MAIN_MENU_COLORS.title,
    });
    this.titleText.setOrigin(0.5, 0);

    this.taglineText = scene.add.text(0, 0, MAIN_MENU_COPY.tagline, {
      fontFamily: 'system-ui, -apple-system, sans-serif',
      fontSize: MAIN_MENU_LAYOUT.taglineSize,
      fontStyle: '600',
      color: MAIN_MENU_COLORS.tagline,
      letterSpacing: 4,
    });
    this.taglineText.setOrigin(0.5, 0);

    this.divider = scene.add.rectangle(0, 0, 120, 1, MAIN_MENU_COLORS.panelStroke, 0.6);

    this.subtitleText = scene.add.text(0, 0, MAIN_MENU_COPY.subtitle, {
      fontFamily: 'system-ui, -apple-system, sans-serif',
      fontSize: MAIN_MENU_LAYOUT.subtitleSize,
      color: MAIN_MENU_COLORS.subtitle,
      align: 'center',
      wordWrap: { width: MAIN_MENU_LAYOUT.panelMaxW - MAIN_MENU_LAYOUT.panelPadX * 2 },
    });
    this.subtitleText.setOrigin(0.5, 0);

    this.startBtn = new MenuButton(
      scene,
      0,
      0,
      MAIN_MENU_COPY.startLabel,
      MAIN_MENU_LAYOUT.btnW,
      MAIN_MENU_LAYOUT.btnH,
      callbacks.onStart,
      {
        bg: MAIN_MENU_COLORS.btnPrimaryBg,
        bgHover: MAIN_MENU_COLORS.btnPrimaryBgHover,
        stroke: MAIN_MENU_COLORS.btnPrimaryStroke,
        text: MAIN_MENU_COLORS.btnPrimaryText,
      },
    );

    this.continueBtn = new MenuButton(
      scene,
      0,
      0,
      MAIN_MENU_COPY.continueLabel,
      MAIN_MENU_LAYOUT.btnW,
      MAIN_MENU_LAYOUT.btnH,
      callbacks.onContinue,
      {
        bg: MAIN_MENU_COLORS.btnSecondaryBg,
        bgHover: MAIN_MENU_COLORS.btnSecondaryBgHover,
        stroke: MAIN_MENU_COLORS.btnSecondaryStroke,
        text: MAIN_MENU_COLORS.btnSecondaryText,
      },
    );

    this.continueHint = scene.add.text(0, 0, MAIN_MENU_COPY.continueHintNoSave, {
      fontFamily: 'system-ui, -apple-system, sans-serif',
      fontSize: '10px',
      color: MAIN_MENU_COLORS.version,
    });
    this.continueHint.setOrigin(0.5, 0);

    this.versionText = scene.add.text(0, 0, MAIN_MENU_COPY.versionLabel, {
      fontFamily: 'system-ui, -apple-system, sans-serif',
      fontSize: '10px',
      color: MAIN_MENU_COLORS.version,
    });
    this.versionText.setOrigin(0.5, 0);

    this.add([
      this.panelBg,
      this.titleText,
      this.taglineText,
      this.divider,
      this.subtitleText,
      this.startBtn,
      this.continueBtn,
      this.continueHint,
      this.versionText,
    ]);

    scene.add.existing(this);
    this.layoutPanel();
  }

  layout(screenW: number, screenH: number): void {
    this.panelW = Math.min(MAIN_MENU_LAYOUT.panelMaxW, screenW - 48);
    this.subtitleText.setWordWrapWidth(this.panelW - MAIN_MENU_LAYOUT.panelPadX * 2);
    this.layoutPanel();
    this.setPosition(screenW / 2, screenH * 0.44);
  }

  setStartEnabled(enabled: boolean): void {
    this.startBtn.setEnabled(enabled);
  }

  setContinueEnabled(enabled: boolean, summary?: SaveSlotSummary | null): void {
    this.continueBtn.setEnabled(enabled);
    if (enabled && summary) {
      const when = formatSaveTimestamp(summary.savedAt);
      const status = summary.gameOver ? ' · 已陷落' : '';
      this.continueHint.setText(`第 ${summary.dayIndex} 天${when ? ` · ${when}` : ''}${status}`);
      this.continueHint.setColor(MAIN_MENU_COLORS.tagline);
    } else {
      this.continueHint.setText(MAIN_MENU_COPY.continueHintNoSave);
      this.continueHint.setColor(MAIN_MENU_COLORS.version);
    }
  }

  private layoutPanel(): void {
    const padY = MAIN_MENU_LAYOUT.panelPadY;
    const innerH =
      padY +
      this.titleText.height +
      6 +
      this.taglineText.height +
      14 +
      16 +
      this.subtitleText.height +
      28 +
      MAIN_MENU_LAYOUT.btnH +
      MAIN_MENU_LAYOUT.btnGap +
      MAIN_MENU_LAYOUT.btnH +
      14 +
      this.continueHint.height +
      16 +
      this.versionText.height +
      padY;

    this.panelH = innerH;
    this.panelBg.setSize(this.panelW, this.panelH);

    let y = -this.panelH / 2 + padY;
    this.titleText.setPosition(0, y);
    y += this.titleText.height + 6;
    this.taglineText.setPosition(0, y);
    y += this.taglineText.height + 14;
    this.divider.setPosition(0, y);
    y += 16;
    this.subtitleText.setPosition(0, y);
    y += this.subtitleText.height + 28;
    this.startBtn.setPosition(0, y + MAIN_MENU_LAYOUT.btnH / 2);
    y += MAIN_MENU_LAYOUT.btnH + MAIN_MENU_LAYOUT.btnGap;
    this.continueBtn.setPosition(0, y + MAIN_MENU_LAYOUT.btnH / 2);
    y += MAIN_MENU_LAYOUT.btnH + 8;
    this.continueHint.setPosition(0, y);
    y += this.continueHint.height + 12;
    this.versionText.setPosition(0, y);
  }
}
