const HINT_DEPTH = 1950;
/**
 * Floating label shown while dragging a card over a valid stack target.
 */
export class StackDropHint {
    container;
    bg;
    primary;
    secondary;
    constructor(scene) {
        this.container = scene.add.container(0, 0);
        this.container.setDepth(HINT_DEPTH);
        this.container.setVisible(false);
        this.bg = scene.add.rectangle(0, 0, 120, 28, 0x1a1612, 0.88);
        this.bg.setStrokeStyle(1, 0x6a8a4a, 0.85);
        this.primary = scene.add.text(0, -5, '', {
            fontSize: '11px',
            color: '#c9e8a8',
            align: 'center',
        });
        this.primary.setOrigin(0.5, 0.5);
        this.secondary = scene.add.text(0, 8, '', {
            fontSize: '9px',
            color: '#8a9a7a',
            align: 'center',
        });
        this.secondary.setOrigin(0.5, 0.5);
        this.container.add([this.bg, this.primary, this.secondary]);
    }
    show(worldX, worldY, preview) {
        this.primary.setText(preview.primary);
        const hasSub = Boolean(preview.secondary);
        this.secondary.setText(preview.secondary ?? '');
        this.secondary.setVisible(hasSub);
        const padX = 12;
        const lineH = hasSub ? 26 : 18;
        const w = Math.max(this.primary.width, hasSub ? this.secondary.width : 0) + padX * 2;
        const h = lineH + 8;
        this.bg.setSize(w, h);
        this.primary.setY(hasSub ? -6 : 0);
        this.container.setPosition(worldX, worldY - 52);
        this.container.setVisible(true);
    }
    hide() {
        this.container.setVisible(false);
    }
    destroy() {
        this.container.destroy();
    }
}
