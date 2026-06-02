/**
 * Bake procedural attack VFX atlases to PNG spritesheets.
 * Run: npm run bake:vfx
 */
import { createCanvas } from '@napi-rs/canvas';
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const outDir = join(root, 'public', 'assets', 'vfx');
mkdirSync(outDir, { recursive: true });

function rgba(hex, a) {
  const r = (hex >> 16) & 255;
  const g = (hex >> 8) & 255;
  const b = hex & 255;
  return `rgba(${r},${g},${b},${a})`;
}

function clamp(v, min, max) {
  return Math.max(min, Math.min(max, v));
}

function bakeAtlas(name, frameW, frameH, frameCount, drawFrame) {
  const canvas = createCanvas(frameW * frameCount, frameH);
  const ctx = canvas.getContext('2d');
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  for (let i = 0; i < frameCount; i++) {
    drawFrame(ctx, i * frameW, 0, i, frameW, frameH);
  }
  const buf = canvas.toBuffer('image/png');
  writeFileSync(join(outDir, `${name}.png`), buf);
  console.log(`wrote ${name}.png (${canvas.width}x${canvas.height})`);
}

function drawVineFrame(ctx, ox, oy, frame, w, h) {
  const baseX = ox + w / 2;
  const groundY = oy + h - 10;
  ctx.fillStyle = rgba(0x1a1612, 0.12);
  ctx.fillRect(ox, oy, w, h);
  const crackAlpha = frame === 0 ? 0.9 : frame <= 2 ? 0.55 : frame >= 7 ? 0.2 : 0.35;
  ctx.strokeStyle = rgba(0x3a3228, crackAlpha);
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(baseX - 14, groundY);
  ctx.lineTo(baseX - 6, groundY - 2);
  ctx.moveTo(baseX + 8, groundY);
  ctx.lineTo(baseX + 16, groundY - 1);
  ctx.moveTo(baseX - 4, groundY);
  ctx.lineTo(baseX + 2, groundY - 3);
  ctx.stroke();
  const grow = clamp(frame / 5, 0, 1);
  if (frame === 0) return;
  const vineH = 8 + grow * 58;
  const lean = frame >= 4 && frame <= 6 ? -10 : frame >= 2 ? -4 : 0;
  const tipX = baseX + lean;
  const tipY = groundY - vineH;
  ctx.fillStyle = rgba(0x2a241c, 0.5);
  ctx.beginPath();
  ctx.ellipse(baseX, groundY + 2, 11 + grow * 5, 4, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = rgba(0x2e4a28, 1);
  ctx.lineWidth = 3;
  const midX = baseX + lean * 0.45;
  const midY = groundY - vineH * 0.55;
  ctx.beginPath();
  ctx.moveTo(baseX, groundY);
  ctx.lineTo(midX, midY);
  ctx.lineTo(tipX, tipY);
  ctx.stroke();
  ctx.strokeStyle = rgba(0x3a5c32, 0.95);
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(baseX, groundY);
  ctx.lineTo(midX, midY);
  ctx.stroke();
  const thornCount = frame >= 3 ? 3 : frame >= 1 ? 1 : 0;
  ctx.fillStyle = rgba(0x5c4038, 1);
  for (let t = 0; t < thornCount; t++) {
    const tY = groundY - vineH * (0.35 + t * 0.22);
    const tX = baseX + lean * (0.2 + t * 0.15) + (t % 2 === 0 ? -8 : 8);
    ctx.beginPath();
    ctx.moveTo(tX, tY);
    ctx.lineTo(tX - 3, tY + 5);
    ctx.lineTo(tX + 3, tY + 5);
    ctx.closePath();
    ctx.fill();
  }
  if (frame >= 4) {
    ctx.strokeStyle = rgba(0x4a6a38, 0.85);
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(tipX, tipY);
    ctx.lineTo(tipX - 14, tipY - 6);
    ctx.moveTo(tipX, tipY);
    ctx.lineTo(tipX + 10, tipY - 4);
    ctx.stroke();
  }
  if (frame === 6) {
    ctx.fillStyle = rgba(0x8a9a5a, 0.35);
    ctx.beginPath();
    ctx.arc(tipX, tipY - 4, 14, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = rgba(0x6a8a48, 0.9);
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(tipX, tipY - 4, 12, 0, Math.PI * 2);
    ctx.stroke();
  }
  if (frame === 7) {
    ctx.fillStyle = rgba(0x2e2820, 0.4);
    ctx.beginPath();
    ctx.ellipse(baseX, groundY, 9, 3, 0, 0, Math.PI * 2);
    ctx.fill();
  }
}

function drawSnareFrame(ctx, ox, oy, frame, w, h) {
  const baseX = ox + w / 2;
  const groundY = oy + h - 8;
  const ankleY = groundY - 18;
  ctx.fillStyle = rgba(0x1a1612, 0.1);
  ctx.fillRect(ox, oy, w, h);
  const crackAlpha = frame === 0 ? 0.85 : frame <= 2 ? 0.5 : frame >= 7 ? 0.15 : 0.3;
  ctx.strokeStyle = rgba(0x3a3228, crackAlpha);
  ctx.lineWidth = 1;
  ctx.stroke();
  if (frame === 0) return;
  const spread = clamp(frame / 4, 0.2, 1);
  ctx.fillStyle = rgba(0x2a241c, 0.45);
  ctx.beginPath();
  ctx.ellipse(baseX, groundY + 2, 14 + spread * 7, 3.5, 0, 0, Math.PI * 2);
  ctx.fill();
  if (frame >= 4) {
    const wrapW = frame >= 5 ? 26 : 20;
    const wrapH = frame >= 6 ? 16 : 12;
    ctx.strokeStyle = rgba(0x3a4a28, frame >= 6 ? 0.95 : 0.7);
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.ellipse(baseX, ankleY + 2, wrapW / 2, wrapH / 2, 0, 0, Math.PI * 2);
    ctx.stroke();
  }
  if (frame === 7) {
    ctx.fillStyle = rgba(0x2e2820, 0.45);
    ctx.beginPath();
    ctx.ellipse(baseX, groundY, 12, 3, 0, 0, Math.PI * 2);
    ctx.fill();
  }
}

function drawSporeFrame(ctx, ox, oy, frame, w, h) {
  const cx = ox + w / 2;
  const cy = oy + h / 2;
  ctx.fillStyle = rgba(0x1a1612, 0.08);
  ctx.fillRect(ox, oy, w, h);
  if (frame === 0) {
    ctx.fillStyle = rgba(0x3a5a32, 0.45);
    ctx.beginPath();
    ctx.arc(cx, cy + 4, 10, 0, Math.PI * 2);
    ctx.fill();
    return;
  }
  if (frame <= 2) {
    const r = frame === 1 ? 9 : 11;
    ctx.fillStyle = rgba(0x3a5230, 0.75);
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.fill();
    return;
  }
  if (frame === 3) {
    ctx.fillStyle = rgba(0x4a6a38, 0.5);
    ctx.beginPath();
    ctx.arc(cx, cy + 2, 18, 0, Math.PI * 2);
    ctx.fill();
    return;
  }
  ctx.fillStyle = rgba(0x4a6a38, frame === 4 ? 0.5 : 0.25);
  ctx.beginPath();
  ctx.arc(cx, cy + 2, 12, 0, Math.PI * 2);
  ctx.fill();
}

function drawAcidFrame(ctx, ox, oy, frame, w, h) {
  const cx = ox + w / 2;
  const groundY = oy + h - 10;
  ctx.fillStyle = rgba(0x1a1612, 0.08);
  ctx.fillRect(ox, oy, w, h);
  if (frame === 0) {
    ctx.fillStyle = rgba(0x4a5a30, 0.5);
    ctx.beginPath();
    ctx.arc(cx, groundY - 20, 8, 0, Math.PI * 2);
    ctx.fill();
    return;
  }
  if (frame === 1) {
    ctx.fillStyle = rgba(0x5a6a38, 0.85);
    ctx.beginPath();
    ctx.ellipse(cx, groundY - 28, 3.5, 5, 0, 0, Math.PI * 2);
    ctx.fill();
    return;
  }
  if (frame <= 3) {
    const dripY = frame === 2 ? groundY - 38 : groundY - 48;
    ctx.fillStyle = rgba(0x5a6a38, 0.9);
    ctx.beginPath();
    ctx.ellipse(cx, dripY, 4, 6, 0, 0, Math.PI * 2);
    ctx.fill();
    return;
  }
  if (frame === 4) {
    ctx.fillStyle = rgba(0x5a6a38, 0.55);
    ctx.beginPath();
    ctx.ellipse(cx, groundY - 4, 18, 7, 0, 0, Math.PI * 2);
    ctx.fill();
    return;
  }
  if (frame === 5) {
    ctx.fillStyle = rgba(0x6a7a40, 0.25);
    ctx.beginPath();
    ctx.ellipse(cx, groundY - 12, 14, 10, 0, 0, Math.PI * 2);
    ctx.fill();
    return;
  }
  ctx.fillStyle = rgba(0x3a4a28, 0.35);
  ctx.beginPath();
  ctx.ellipse(cx, groundY - 2, 13, 3, 0, 0, Math.PI * 2);
  ctx.fill();
}

function placeThorn(ctx, x, y, dir) {
  ctx.fillStyle = rgba(0x5c4038, 1);
  ctx.beginPath();
  ctx.moveTo(x, y);
  ctx.lineTo(x + dir * 3, y + 6);
  ctx.lineTo(x - dir * 2, y + 7);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = rgba(0x7a5a48, 0.9);
  ctx.beginPath();
  ctx.arc(x, y + 1, 2, 0, Math.PI * 2);
  ctx.fill();
}

function drawLashStem(ctx, x0, y0, x1, y1, width, thorns) {
  const mx = (x0 + x1) / 2 + (x1 - x0) * 0.08;
  const my = (y0 + y1) / 2 - 6;

  ctx.strokeStyle = rgba(0x2e4a28, 1);
  ctx.lineWidth = width;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  ctx.beginPath();
  ctx.moveTo(x0, y0);
  ctx.lineTo(mx, my);
  ctx.lineTo(x1, y1);
  ctx.stroke();

  ctx.strokeStyle = rgba(0x3a5c32, 0.85);
  ctx.lineWidth = Math.max(1.5, width - 1.5);
  ctx.beginPath();
  ctx.moveTo(x0, y0);
  ctx.lineTo(mx, my);
  ctx.stroke();

  if (thorns) {
    placeThorn(ctx, mx - 7, my + 3, -1);
    placeThorn(ctx, mx + 8, my + 2, 1);
  }
}

function drawThornvineLashFrame(ctx, ox, oy, frame, w, h) {
  const baseX = ox + w / 2;
  const groundY = oy + h - 8;
  const grow = clamp(frame / 5, 0, 1);
  const whip = frame >= 4 && frame <= 6 ? 1 : frame >= 2 ? 0.55 : 0;
  const lean = frame >= 5 ? -14 : frame >= 3 ? -8 : frame >= 1 ? -3 : 0;

  ctx.fillStyle = rgba(0x1a1612, 0.06);
  ctx.fillRect(ox, oy, w, h);

  ctx.fillStyle = rgba(0x2a241c, 0.4);
  ctx.beginPath();
  ctx.ellipse(baseX + lean * 0.2, groundY + 2, 10 + grow * 6, 3.5, 0, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = rgba(0x3a3228, 1);
  ctx.fillRect(baseX - 3, groundY - 10, 6, 12);

  if (frame === 0) {
    ctx.strokeStyle = rgba(0x3a5c32, 0.7);
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(baseX, groundY - 8);
    ctx.lineTo(baseX - 6, groundY - 18);
    ctx.moveTo(baseX, groundY - 8);
    ctx.lineTo(baseX + 8, groundY - 16);
    ctx.stroke();
    return;
  }

  const mainLen = 12 + grow * 72;
  const tipX = baseX + lean;
  const tipY = groundY - mainLen;

  drawLashStem(ctx, baseX, groundY - 6, tipX, tipY, 4, true);

  if (grow >= 0.35) {
    const branchT = 0.45 + whip * 0.15;
    const bx = baseX + (tipX - baseX) * branchT;
    const by = groundY - 6 + (tipY - (groundY - 6)) * branchT;
    drawLashStem(ctx, bx, by, bx - 18 - whip * 6, by - 22 - whip * 8, 2.5, false);
    drawLashStem(ctx, bx, by, bx + 16 + whip * 4, by - 18 - whip * 6, 2.5, false);
  }

  if (grow >= 0.55) {
    const midX = baseX + (tipX - baseX) * 0.62;
    const midY = groundY - 6 + (tipY - (groundY - 6)) * 0.62;
    placeThorn(ctx, midX - 10, midY + 2, -1);
    placeThorn(ctx, midX + 9, midY + 4, 1);
  }

  if (frame >= 3) {
    placeThorn(ctx, tipX - 8, tipY + 6, -1);
    placeThorn(ctx, tipX + 7, tipY + 5, 1);
    ctx.fillStyle = rgba(0x4a5c38, 1);
    ctx.beginPath();
    ctx.arc(tipX, tipY, 5, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = rgba(0x3a4a30, 1);
    ctx.beginPath();
    ctx.arc(tipX - 2, tipY + 1, 3, 0, Math.PI * 2);
    ctx.fill();
  }

  if (frame >= 5) {
    ctx.strokeStyle = rgba(0x4a6a38, 0.9);
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(tipX, tipY);
    ctx.lineTo(tipX - 16, tipY - 8);
    ctx.moveTo(tipX, tipY);
    ctx.lineTo(tipX + 14, tipY - 6);
    ctx.moveTo(tipX, tipY);
    ctx.lineTo(tipX - 4, tipY - 18);
    ctx.stroke();
  }

  if (frame === 6) {
    ctx.fillStyle = rgba(0x8a6a48, 0.35);
    ctx.beginPath();
    ctx.arc(tipX, tipY - 2, 16, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = rgba(0x7a5a48, 0.85);
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(tipX, tipY - 2, 13, 0, Math.PI * 2);
    ctx.stroke();
    ctx.fillStyle = rgba(0x6a8a48, 0.25);
    ctx.beginPath();
    ctx.arc(tipX, tipY - 2, 9, 0, Math.PI * 2);
    ctx.fill();
  }

  if (frame === 7) {
    ctx.fillStyle = rgba(0x2e2820, 0.35);
    ctx.beginPath();
    ctx.ellipse(baseX, groundY, 8, 2.5, 0, 0, Math.PI * 2);
    ctx.fill();
  }
}

bakeAtlas('thornvine_lash', 96, 112, 8, drawThornvineLashFrame);
bakeAtlas('underground_vine', 72, 96, 8, drawVineFrame);
bakeAtlas('underground_snare', 80, 72, 8, drawSnareFrame);
bakeAtlas('spore_burst', 72, 64, 6, drawSporeFrame);
bakeAtlas('acid_splash', 88, 80, 7, drawAcidFrame);

console.log('Done — PNG atlases in public/assets/vfx/');
