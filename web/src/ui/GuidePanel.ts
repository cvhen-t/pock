import Phaser from 'phaser';

const PANEL_DEPTH = 2450;
const PANEL_W = 520;
const PANEL_H = 500;
const HEADER_H = 96;
const CONTENT_TOP = -PANEL_H / 2 + HEADER_H;
const CONTENT_H = PANEL_H - HEADER_H - 16;
const CONTENT_PAD = 14;

export interface GuideRecipe {
  in: string;
  out: string;
  time?: string;
}

export interface GuideSection {
  heading: string;
  lines?: string[];
  bullets?: string[];
  items?: string[];
  recipes?: GuideRecipe[];
}

export interface GuideTab {
  id: string;
  name: string;
  sections: GuideSection[];
}

export interface PlayerGuideData {
  title: string;
  subtitle?: string;
  tabs: GuideTab[];
}

interface PanelDrag {
  originPanelX: number;
  originPanelY: number;
  originPointerX: number;
  originPointerY: number;
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function renderTabHtml(tab: GuideTab): string {
  const chunks: string[] = [];
  for (const section of tab.sections) {
    chunks.push(`<h3>${escapeHtml(section.heading)}</h3>`);
    section.lines?.forEach((line) => {
      chunks.push(`<p>${escapeHtml(line)}</p>`);
    });
    if (section.bullets?.length) {
      chunks.push('<ul>');
      for (const bullet of section.bullets) {
        chunks.push(`<li>${escapeHtml(bullet)}</li>`);
      }
      chunks.push('</ul>');
    }
    if (section.items?.length) {
      chunks.push('<ul class="guide-items">');
      for (const item of section.items) {
        chunks.push(`<li>${escapeHtml(item)}</li>`);
      }
      chunks.push('</ul>');
    }
    if (section.recipes?.length) {
      chunks.push('<ul class="guide-recipes">');
      for (const recipe of section.recipes) {
        const time = recipe.time ? ` <span class="guide-time">(${escapeHtml(recipe.time)})</span>` : '';
        chunks.push(
          `<li><span class="guide-in">${escapeHtml(recipe.in)}</span> → <span class="guide-out">${escapeHtml(recipe.out)}</span>${time}</li>`,
        );
      }
      chunks.push('</ul>');
    }
  }
  return chunks.join('');
}

export default class GuidePanel extends Phaser.GameObjects.Container {
  private panelBg!: Phaser.GameObjects.Rectangle;

  private titleBar!: Phaser.GameObjects.Rectangle;

  private tabRow!: Phaser.GameObjects.Container;

  private closeBtn!: Phaser.GameObjects.Text;

  private contentFrame!: Phaser.GameObjects.Rectangle;

  private domScroll!: HTMLDivElement;

  private open = false;

  private activeTabId = '';

  private panelDrag: PanelDrag | null = null;

  private screenW = 800;

  private screenH = 600;

  private positioned = false;

  private readonly contentW = PANEL_W - CONTENT_PAD * 2;

  private readonly contentLeft = -PANEL_W / 2 + CONTENT_PAD;

  private readonly panelBounds = new Phaser.Geom.Rectangle();

  constructor(
    scene: Phaser.Scene,
    private readonly guide: PlayerGuideData,
  ) {
    super(scene, 0, 0);
    scene.add.existing(this);
    this.setScrollFactor(0);
    this.setDepth(PANEL_DEPTH);
    this.setVisible(false);

    this.domScroll = this.createDomScroll(scene);

    this.panelBg = scene.add
      .rectangle(0, 0, PANEL_W, PANEL_H, 0x2a2620, 0.97)
      .setOrigin(0.5)
      .setStrokeStyle(2, 0x6a7a5a, 0.9);

    this.titleBar = scene.add
      .rectangle(0, -PANEL_H / 2 + 24, PANEL_W - 4, 44, 0x3a3228, 0.95)
      .setOrigin(0.5)
      .setInteractive({ useHandCursor: true });

    const title = scene.add.text(-PANEL_W / 2 + 16, -PANEL_H / 2 + 10, guide.title, {
      fontSize: '17px',
      color: '#c9d4b8',
    });
    title.setOrigin(0, 0);

    const subtitle = scene.add.text(-PANEL_W / 2 + 16, -PANEL_H / 2 + 32, guide.subtitle ?? '', {
      fontSize: '10px',
      color: '#6a7060',
    });
    subtitle.setOrigin(0, 0);

    this.closeBtn = scene.add
      .text(PANEL_W / 2 - 24, -PANEL_H / 2 + 18, '×', {
        fontSize: '22px',
        color: '#c9b896',
        backgroundColor: '#4a4030',
        padding: { x: 8, y: 2 },
      })
      .setOrigin(0.5)
      .setInteractive({ useHandCursor: true });
    this.closeBtn.on('pointerdown', (p: Phaser.Input.Pointer) => {
      p.event.stopPropagation();
      this.close();
    });

    this.tabRow = scene.add.container(-PANEL_W / 2 + 12, -PANEL_H / 2 + 58);

    this.contentFrame = scene.add
      .rectangle(
        this.contentLeft + this.contentW / 2,
        CONTENT_TOP + CONTENT_H / 2,
        this.contentW,
        CONTENT_H,
        0x1a1814,
        0.4,
      )
      .setOrigin(0.5)
      .setStrokeStyle(1, 0x3a3830, 0.5);

    this.add([
      this.panelBg,
      this.contentFrame,
      this.titleBar,
      title,
      subtitle,
      this.closeBtn,
      this.tabRow,
    ]);

    this.titleBar.on('pointerdown', (p: Phaser.Input.Pointer) => {
      p.event.stopPropagation();
      this.panelDrag = {
        originPanelX: this.x,
        originPanelY: this.y,
        originPointerX: p.x,
        originPointerY: p.y,
      };
    });

    const input = scene.input;
    input.on('pointermove', this.onPointerMove, this);
    input.on('pointerup', this.onPointerUp, this);
    scene.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      input.off('pointermove', this.onPointerMove, this);
      input.off('pointerup', this.onPointerUp, this);
      this.domScroll.remove();
    });

    this.activeTabId = guide.tabs[0]?.id ?? '';
    this.buildTabs();
  }

  private createDomScroll(scene: Phaser.Scene): HTMLDivElement {
    const host = scene.game.canvas?.parentElement ?? document.getElementById('game-container');
    const el = document.createElement('div');
    el.id = 'guide-panel-scroll';
    el.addEventListener(
      'wheel',
      (e) => {
        if (this.open) e.stopPropagation();
      },
      { passive: true },
    );
    el.addEventListener(
      'pointerdown',
      (e) => {
        if (this.open) e.stopPropagation();
      },
    );
    host?.appendChild(el);
    return el;
  }

  private onPointerMove(pointer: Phaser.Input.Pointer): void {
    if (!this.panelDrag) return;
    this.setPosition(
      this.panelDrag.originPanelX + pointer.x - this.panelDrag.originPointerX,
      this.panelDrag.originPanelY + pointer.y - this.panelDrag.originPointerY,
    );
    this.syncPanelBounds();
    this.syncDomLayout();
  }

  private onPointerUp(): void {
    this.panelDrag = null;
  }

  private buildTabs(): void {
    this.tabRow.removeAll(true);
    let x = 0;
    for (const tab of this.guide.tabs) {
      const active = tab.id === this.activeTabId;
      const label = this.scene.add
        .text(x, 0, tab.name, {
          fontSize: '12px',
          color: active ? '#f0e8d8' : '#8a8070',
          backgroundColor: active ? '#5a6a4a' : '#2a2620',
          padding: { x: 10, y: 5 },
        })
        .setOrigin(0, 0)
        .setInteractive({ useHandCursor: true });
      label.on('pointerdown', (p: Phaser.Input.Pointer) => {
        p.event.stopPropagation();
        if (this.activeTabId === tab.id) return;
        this.activeTabId = tab.id;
        this.buildTabs();
        this.renderTabContent();
      });
      this.tabRow.add(label);
      x += label.width + 6;
    }
    this.bringChromeToFront();
  }

  private renderTabContent(): void {
    const tab = this.guide.tabs.find((t) => t.id === this.activeTabId);
    this.domScroll.innerHTML = tab ? renderTabHtml(tab) : '';
    this.domScroll.scrollTop = 0;
    this.syncDomLayout();
  }

  private bringChromeToFront(): void {
    this.bringToTop(this.titleBar);
    this.bringToTop(this.closeBtn);
    this.bringToTop(this.tabRow);
  }

  private syncDomLayout(): void {
    if (!this.open) {
      this.domScroll.style.display = 'none';
      return;
    }
    const left = this.x + this.contentLeft;
    const top = this.y + CONTENT_TOP;
    this.domScroll.style.display = 'block';
    this.domScroll.style.left = `${left}px`;
    this.domScroll.style.top = `${top}px`;
    this.domScroll.style.width = `${this.contentW}px`;
    this.domScroll.style.height = `${CONTENT_H}px`;
  }

  toggle(): void {
    if (this.open) this.close();
    else this.openGuide();
  }

  openGuide(): void {
    if (!this.positioned) {
      this.setPosition(this.screenW / 2, this.screenH * 0.46);
      this.positioned = true;
    }
    this.open = true;
    this.setVisible(true);
    this.renderTabContent();
    this.syncPanelBounds();
    this.syncDomLayout();
    this.bringChromeToFront();
  }

  close(): void {
    if (!this.open) return;
    this.panelDrag = null;
    this.open = false;
    this.setVisible(false);
    this.domScroll.style.display = 'none';
  }

  isOpen(): boolean {
    return this.open;
  }

  containsPanelPoint(sx: number, sy: number): boolean {
    return this.open && this.panelBounds.contains(sx, sy);
  }

  applyLayout(_centerX: number, _centerY: number, width: number, height: number): void {
    this.screenW = width;
    this.screenH = height;
    if (!this.positioned) {
      this.setPosition(width / 2, height * 0.46);
    }
    this.syncPanelBounds();
    this.syncDomLayout();
  }

  private syncPanelBounds(): void {
    this.panelBounds.setTo(this.x - PANEL_W / 2, this.y - PANEL_H / 2, PANEL_W, PANEL_H);
  }
}
