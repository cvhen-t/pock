/**
 * Slice AI thornvine lash sheet → 768×112 transparent spritesheet.
 * Run: node scripts/process-thornvine-lash.mjs [input.png]
 */
import { createCanvas, loadImage } from '@napi-rs/canvas';
import { writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const input =
  process.argv[2] ??
  join(root, '..', '..', '.cursor', 'projects', 'f-cc-pock-pock', 'assets', 'thornvine_lash_sheet.png');
const output = join(root, 'public', 'assets', 'vfx', 'thornvine_lash.png');

const FRAME_COUNT = 8;
const OUT_W = 96;
const OUT_H = 112;

function stripBackground(imageData) {
  const { data } = imageData;
  for (let i = 0; i < data.length; i += 4) {
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];
    const neutral = Math.abs(r - g) < 35 && Math.abs(g - b) < 35;
    if (neutral && r > 150 && g > 150 && b > 150) {
      data[i + 3] = 0;
      continue;
    }
    // AI often exports pure black instead of alpha
    if (r < 18 && g < 18 && b < 18) {
      data[i + 3] = 0;
    }
  }
  return imageData;
}

const src = await loadImage(input);
const srcFrameW = Math.floor(src.width / FRAME_COUNT);
const cropH = Math.floor(src.height * 0.78);
const cropY = src.height - cropH;

const out = createCanvas(OUT_W * FRAME_COUNT, OUT_H);
const ctx = out.getContext('2d');

for (let i = 0; i < FRAME_COUNT; i++) {
  const slice = createCanvas(srcFrameW, cropH);
  const sctx = slice.getContext('2d');
  sctx.drawImage(src, i * srcFrameW, cropY, srcFrameW, cropH, 0, 0, srcFrameW, cropH);
  const img = sctx.getImageData(0, 0, srcFrameW, cropH);
  stripBackground(img);
  sctx.putImageData(img, 0, 0);
  ctx.drawImage(slice, i * OUT_W, 0, OUT_W, OUT_H);
}

writeFileSync(output, out.toBuffer('image/png'));
console.log(`wrote ${output} (${out.width}x${out.height}, ${out.toBuffer('image/png').length} bytes)`);
