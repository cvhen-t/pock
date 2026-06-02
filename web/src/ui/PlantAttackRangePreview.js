/** Attack-range circle shown while dragging an attack plant on the board. */
export class PlantAttackRangePreview {
    g;
    constructor(scene) {
        this.g = scene.add.graphics();
        this.g.setDepth(980);
        this.g.setVisible(false);
    }
    show(worldX, worldY, range) {
        this.g.clear();
        this.g.setVisible(true);
        this.g.fillStyle(0x3a5a2e, 0.14);
        this.g.fillCircle(worldX, worldY, range);
        this.g.lineStyle(2, 0xc4a878, 0.72);
        this.g.strokeCircle(worldX, worldY, range);
    }
    hide() {
        this.g.clear();
        this.g.setVisible(false);
    }
    destroy() {
        this.g.destroy();
    }
}
