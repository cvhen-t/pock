/**
 * Strip fake transparency, scale to 768×512, write world_sprite PNG.
 * Run: node scripts/process-world-sprite.mjs <input.png> [outputName]
 */
import { createCanvas, loadImage } from '@napi-rs/canvas';
import { writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const outDir = join(root, 'public', 'assets', 'world');
const OUT_W = 768;
const OUT_H = 512;

const input = process.argv[2];
if (!input) {
  console.error('Usage: node scripts/process-world-sprite.mjs <input.png> [output-basename]');
  process.exit(1);
}

const baseName =
  process.argv[3] ?? input.replace(/\\/g, '/').split('/').pop()?.replace(/\.png$/i, '') ?? 'world_sprite';
const output = join(outDir, `${baseName}.png`);

function stripBackground(imageData) {
  const { data } = imageData;
  for (let i = 0; i < data.length; i += 4) {
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];
    const neutral = Math.abs(r - g) < 30 && Math.abs(g - b) < 30;
    // White / light gray backdrop and checkerboard tiles
    if (neutral && r > 120) {
      data[i + 3] = 0;
      continue;
    }
    if (r < 18 && g < 18 && b < 18) {
      data[i + 3] = 0;
    }
  }
  return imageData;
}

const src = await loadImage(input);
const slice = createCanvas(src.width, src.height);
const sctx = slice.getContext('2d');
sctx.drawImage(src, 0, 0);
const img = sctx.getImageData(0, 0, src.width, src.height);
stripBackground(img);
sctx.putImageData(img, 0, 0);

const out = createCanvas(OUT_W, OUT_H);
const ctx = out.getContext('2d');
ctx.clearRect(0, 0, OUT_W, OUT_H);
ctx.drawImage(slice, 0, 0, OUT_W, OUT_H);

const buf = out.toBuffer('image/png');
writeFileSync(output, buf);
console.log(`wrote ${output} (${OUT_W}x${OUT_H}, ${buf.length} bytes)`);
