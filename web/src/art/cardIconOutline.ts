type OutlineScratch = {
  width: number;
  height: number;
  getContext(contextId: '2d'): CanvasRenderingContext2D;
};

/** Expand opaque pixels into a white outline on transparent PNGs / canvases. */
export function applyWhiteOutline(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  radius: number,
  scratch: OutlineScratch,
): void {
  const src = ctx.getImageData(0, 0, width, height);
  const d = src.data;
  const outline = ctx.createImageData(width, height);
  const o = outline.data;
  const r2 = radius * radius;

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const i = (y * width + x) * 4;
      if (d[i + 3] > 48) continue;

      let hit = false;
      for (let dy = -radius; dy <= radius && !hit; dy++) {
        for (let dx = -radius; dx <= radius && !hit; dx++) {
          if (dx * dx + dy * dy > r2) continue;
          const nx = x + dx;
          const ny = y + dy;
          if (nx < 0 || nx >= width || ny < 0 || ny >= height) continue;
          const ni = (ny * width + nx) * 4;
          if (d[ni + 3] > 60) hit = true;
        }
      }
      if (hit) {
        o[i] = 255;
        o[i + 1] = 255;
        o[i + 2] = 255;
        o[i + 3] = 255;
      }
    }
  }

  ctx.clearRect(0, 0, width, height);
  ctx.putImageData(outline, 0, 0);

  const layerCtx = scratch.getContext('2d');
  layerCtx.clearRect(0, 0, width, height);
  layerCtx.putImageData(src, 0, 0);
  ctx.drawImage(scratch as unknown as CanvasImageSource, 0, 0);
}
