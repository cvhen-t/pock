/**
 * Bake card icons to 128×128 PNG for all cards in data/cards/*.json
 * Run: npm run bake:icons
 */
import { createCanvas } from '@napi-rs/canvas';
import { mkdirSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { canvasIconCtx } from '../src/art/cardIconCanvasCtx';
import { drawIconKind } from '../src/art/cardIconDraw';
import { resolveIconKind } from '../src/art/cardIconKinds';
import { applyWhiteOutline } from '../src/art/cardIconOutline';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const cardsDir = join(root, 'public', 'data', 'cards');
const outDir = join(root, 'public', 'assets', 'cards');
const SIZE = 160;
const OUTLINE_RADIUS = 3;

function collectCardIds(): string[] {
  const ids = new Set<string>();
  for (const file of readdirSync(cardsDir)) {
    if (!file.endsWith('.json') || file === 'manifest.json') continue;
    const data = JSON.parse(readFileSync(join(cardsDir, file), 'utf8')) as {
      cards?: { id: string }[];
      starter?: { id: string }[];
    };
    for (const c of data.cards ?? data.starter ?? []) {
      ids.add(c.id);
    }
  }
  return [...ids].sort();
}

mkdirSync(outDir, { recursive: true });

const onlyId = process.argv[2];
const ids = onlyId ? [onlyId] : collectCardIds();
if (onlyId && !collectCardIds().includes(onlyId)) {
  console.error(`Unknown card id: ${onlyId}`);
  process.exit(1);
}
for (const id of ids) {
  const canvas = createCanvas(SIZE, SIZE);
  const scratch = createCanvas(SIZE, SIZE);
  const ctx2d = canvas.getContext('2d');
  ctx2d.clearRect(0, 0, SIZE, SIZE);
  const icon = canvasIconCtx(ctx2d);
  drawIconKind(icon, resolveIconKind(id), SIZE);
  applyWhiteOutline(ctx2d, SIZE, SIZE, OUTLINE_RADIUS, scratch);
  const path = join(outDir, `${id}.png`);
  writeFileSync(path, canvas.toBuffer('image/png'));
}

console.log(`baked ${ids.length} card icons → public/assets/cards/`);
