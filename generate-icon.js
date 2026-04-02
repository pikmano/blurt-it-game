/**
 * AlphaBurst — Epic App Icon Generator
 * Outputs: assets/icon.png (1024x1024) and assets/adaptive-icon.png (1024x1024)
 * Pure Node.js, no dependencies.
 */

const fs   = require('fs');
const zlib = require('zlib');
const path = require('path');

const SIZE = 1024;
const buf  = Buffer.alloc(SIZE * SIZE * 4, 0);

// ─── Pixel helpers ────────────────────────────────────────────────────────────

function getIdx(x, y) { return (y * SIZE + x) * 4; }

function blend(x, y, r, g, b, a) {
  if (x < 0 || x >= SIZE || y < 0 || y >= SIZE) return;
  const i = getIdx(x, y);
  const A = a / 255;
  buf[i]   = Math.min(255, Math.round(buf[i]   * (1 - A) + r * A));
  buf[i+1] = Math.min(255, Math.round(buf[i+1] * (1 - A) + g * A));
  buf[i+2] = Math.min(255, Math.round(buf[i+2] * (1 - A) + b * A));
  buf[i+3] = 255;
}

function setRaw(x, y, r, g, b) {
  if (x < 0 || x >= SIZE || y < 0 || y >= SIZE) return;
  const i = getIdx(x, y);
  buf[i] = r; buf[i+1] = g; buf[i+2] = b; buf[i+3] = 255;
}

// ─── Geometry helpers ─────────────────────────────────────────────────────────

function distToSegment(px, py, ax, ay, bx, by) {
  const dx = bx - ax, dy = by - ay;
  const lenSq = dx * dx + dy * dy;
  if (lenSq === 0) return Math.hypot(px - ax, py - ay);
  const t = Math.max(0, Math.min(1, ((px - ax) * dx + (py - ay) * dy) / lenSq));
  return Math.hypot(px - ax - t * dx, py - ay - t * dy);
}

function drawStroke(ax, ay, bx, by, thick, r, g, b, opacity) {
  opacity = opacity ?? 1;
  const pad = Math.ceil(thick) + 2;
  const x0 = Math.max(0, Math.floor(Math.min(ax, bx)) - pad);
  const x1 = Math.min(SIZE - 1, Math.ceil(Math.max(ax, bx)) + pad);
  const y0 = Math.max(0, Math.floor(Math.min(ay, by)) - pad);
  const y1 = Math.min(SIZE - 1, Math.ceil(Math.max(ay, by)) + pad);
  for (let y = y0; y <= y1; y++) {
    for (let x = x0; x <= x1; x++) {
      const d = distToSegment(x, y, ax, ay, bx, by);
      if (d >= thick) continue;
      const edge = Math.max(0, Math.min(1, (thick - d) / 2.5));
      blend(x, y, r, g, b, Math.round(255 * edge * opacity));
    }
  }
}

function fillCircle(cx, cy, radius, r, g, b, a) {
  const x0 = Math.max(0, Math.floor(cx - radius));
  const x1 = Math.min(SIZE - 1, Math.ceil(cx + radius));
  const y0 = Math.max(0, Math.floor(cy - radius));
  const y1 = Math.min(SIZE - 1, Math.ceil(cy + radius));
  for (let y = y0; y <= y1; y++) {
    for (let x = x0; x <= x1; x++) {
      const d = Math.hypot(x - cx, y - cy);
      if (d >= radius) continue;
      const edge = Math.max(0, Math.min(1, (radius - d) / 2.5));
      blend(x, y, r, g, b, Math.round(a * edge));
    }
  }
}

function fillRoundedRect(rx, ry, rw, rh, corner, r, g, b, a) {
  const x0 = Math.max(0, Math.floor(rx));
  const x1 = Math.min(SIZE - 1, Math.ceil(rx + rw));
  const y0 = Math.max(0, Math.floor(ry));
  const y1 = Math.min(SIZE - 1, Math.ceil(ry + rh));
  for (let y = y0; y <= y1; y++) {
    for (let x = x0; x <= x1; x++) {
      const cdx = Math.max(0, rx + corner - x, x - (rx + rw - corner));
      const cdy = Math.max(0, ry + corner - y, y - (ry + rh - corner));
      const d   = Math.hypot(cdx, cdy);
      if (d > corner) continue;
      const edge = Math.max(0, Math.min(1, (corner - d) / 2.5));
      blend(x, y, r, g, b, Math.round(a * edge));
    }
  }
}

// Normalize angle difference to [0, π]
function angleDiff(a, b) {
  let d = (a - b) % (Math.PI * 2);
  if (d < 0) d += Math.PI * 2;
  if (d > Math.PI) d = Math.PI * 2 - d;
  return d;
}

// ─── PNG encoder ──────────────────────────────────────────────────────────────

function buildPNG() {
  const table = new Uint32Array(256);
  for (let i = 0; i < 256; i++) {
    let c = i;
    for (let j = 0; j < 8; j++) c = (c & 1) ? (0xEDB88320 ^ (c >>> 1)) : (c >>> 1);
    table[i] = c;
  }
  function crc32(data) {
    let c = 0xFFFFFFFF;
    for (let i = 0; i < data.length; i++) c = table[(c ^ data[i]) & 0xFF] ^ (c >>> 8);
    return (c ^ 0xFFFFFFFF) >>> 0;
  }
  function chunk(type, data) {
    const len = Buffer.alloc(4); len.writeUInt32BE(data.length);
    const t   = Buffer.from(type);
    const crc = Buffer.alloc(4);
    crc.writeUInt32BE(crc32(Buffer.concat([t, data])));
    return Buffer.concat([len, t, data, crc]);
  }

  const rowStride = 1 + SIZE * 4;
  const raw = Buffer.alloc(SIZE * rowStride);
  for (let y = 0; y < SIZE; y++) {
    raw[y * rowStride] = 0; // filter = None
    buf.copy(raw, y * rowStride + 1, y * SIZE * 4, (y + 1) * SIZE * 4);
  }

  const IHDR = Buffer.alloc(13);
  IHDR.writeUInt32BE(SIZE, 0);
  IHDR.writeUInt32BE(SIZE, 4);
  IHDR[8] = 8; IHDR[9] = 6; // 8-bit RGBA

  const compressed = zlib.deflateSync(raw, { level: 9 });
  const sig = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
  return Buffer.concat([sig, chunk('IHDR', IHDR), chunk('IDAT', compressed), chunk('IEND', Buffer.alloc(0))]);
}

// ══════════════════════════════════════════════════════════════════════════════
//  DRAW THE ICON
// ══════════════════════════════════════════════════════════════════════════════

const CX = SIZE / 2, CY = SIZE / 2;

// ── 1. Background: deep space radial gradient (bright purple center → black) ─
console.log('1/9 Background...');
for (let y = 0; y < SIZE; y++) {
  for (let x = 0; x < SIZE; x++) {
    const d = Math.hypot(x - CX, y - CY);
    const t = Math.min(d / (SIZE * 0.68), 1);
    // center: #2A1566 (deep indigo)  edge: #06030E (near black)
    const r = Math.round(42 * (1 - t) + 6  * t);
    const g = Math.round(21 * (1 - t) + 3  * t);
    const b = Math.round(102* (1 - t) + 14 * t);
    setRaw(x, y, r, g, b);
  }
}

// ── 2. Soft inner glow behind center ─────────────────────────────────────────
console.log('2/9 Center glow...');
for (let y = 0; y < SIZE; y++) {
  for (let x = 0; x < SIZE; x++) {
    const d = Math.hypot(x - CX, y - CY);
    if (d > 420) continue;
    const t = 1 - d / 420;
    // warm purple-blue glow
    blend(x, y, 90, 60, 220, Math.round(70 * t * t * t));
  }
}

// ── 3. Golden burst rays (8 rays) ─────────────────────────────────────────────
console.log('3/9 Burst rays...');
const NUM_RAYS   = 8;
const RAY_INNER  = 80;
const RAY_OUTER  = 510;
const RAY_HALF_W = (Math.PI * 2 / NUM_RAYS) * 0.30; // 30% of gap = nice width

for (let y = 0; y < SIZE; y++) {
  for (let x = 0; x < SIZE; x++) {
    const dx = x - CX, dy = y - CY;
    const d  = Math.hypot(dx, dy);
    if (d < RAY_INNER || d > RAY_OUTER) continue;

    const angle = Math.atan2(dy, dx);

    // Find closest ray and its angular distance
    let bestDiff = Infinity;
    for (let ri = 0; ri < NUM_RAYS; ri++) {
      const rayAngle = (ri / NUM_RAYS) * Math.PI * 2;
      const diff = angleDiff(angle, rayAngle);   // ← fixed: always 0..π
      if (diff < bestDiff) bestDiff = diff;
    }
    if (bestDiff >= RAY_HALF_W) continue;

    const edgeFade = 1 - bestDiff / RAY_HALF_W;
    const distFade = 1 - (d - RAY_INNER) / (RAY_OUTER - RAY_INNER);
    const alpha    = Math.round(160 * edgeFade * (0.25 + 0.75 * distFade));

    blend(x, y, 255, 205, 55, alpha); // warm gold
  }
}

// ── 4. Rounded tile card ──────────────────────────────────────────────────────
console.log('4/9 Tile card...');
const TILE_W = 420, TILE_H = 430, TILE_R = 60;
const TX = CX - TILE_W / 2, TY = CY - TILE_H / 2 - 10;

// Drop shadow
for (let s = 18; s > 0; s--) {
  fillRoundedRect(TX + s, TY + s, TILE_W, TILE_H, TILE_R, 0, 0, 10, Math.round(5 * s));
}
// Outer glow ring (purple)
for (let i = 8; i > 0; i--) {
  fillRoundedRect(TX - i, TY - i, TILE_W + i*2, TILE_H + i*2, TILE_R + i,
    130, 100, 255, Math.round(35 - i*4));
}
// Main tile: clean white-cream
fillRoundedRect(TX, TY, TILE_W, TILE_H, TILE_R, 248, 245, 255, 255);
// Top highlight sheen (brighter white strip at top of tile)
fillRoundedRect(TX + 4, TY + 4, TILE_W - 8, TILE_H * 0.5, TILE_R - 2, 255, 255, 255, 70);

// ── 5. Letter "A" (deep purple, on tile) ─────────────────────────────────────
console.log('5/9 Letter A...');
const LCX = CX, LCY = CY + 2;
const LH  = 306, LW = 272;
const SW  = 56; // stroke width

const TOP_X = LCX,         TOP_Y  = LCY - LH / 2;
const BL_X  = LCX - LW/2,  BL_Y   = LCY + LH / 2;
const BR_X  = LCX + LW/2,  BR_Y   = LCY + LH / 2;
const CROSS_Y  = TOP_Y + LH * 0.56;
const CROSS_LX = LCX - LW * 0.265;
const CROSS_RX = LCX + LW * 0.265;

// Subtle inner shadow (darker purple under letter)
drawStroke(TOP_X + 4, TOP_Y + 4, BL_X + 4, BL_Y + 4,  SW + 10, 30, 0, 80, 0.35);
drawStroke(TOP_X + 4, TOP_Y + 4, BR_X + 4, BR_Y + 4,  SW + 10, 30, 0, 80, 0.35);
drawStroke(CROSS_LX + 3, CROSS_Y + 4, CROSS_RX + 3, CROSS_Y + 4, SW*0.7 + 10, 30, 0, 80, 0.35);

// Main letter — rich deep purple #4A0E9E
drawStroke(TOP_X, TOP_Y, BL_X, BL_Y,    SW, 74, 14, 158, 1.0);
drawStroke(TOP_X, TOP_Y, BR_X, BR_Y,    SW, 74, 14, 158, 1.0);
drawStroke(CROSS_LX, CROSS_Y, CROSS_RX, CROSS_Y, SW * 0.68, 74, 14, 158, 1.0);

// Inner highlight — lighter left edge of left leg
drawStroke(TOP_X - 9,  TOP_Y + 6,  BL_X + 14,  BL_Y - 6,  SW * 0.28, 160, 110, 255, 0.55);
// Inner highlight — lighter right edge of right leg
drawStroke(TOP_X + 9,  TOP_Y + 6,  BR_X - 14,  BR_Y - 6,  SW * 0.28, 160, 110, 255, 0.45);

// ── 6. Tile corner score dot (like a game piece) ──────────────────────────────
console.log('6/9 Score dot...');
const SCORE_X = TX + TILE_W - 46;
const SCORE_Y = TY + TILE_H - 46;
fillCircle(SCORE_X, SCORE_Y, 14, 74, 14, 158, 200);
fillCircle(SCORE_X, SCORE_Y, 7,  160, 120, 255, 180);

// ── 7. Sparkle stars ──────────────────────────────────────────────────────────
console.log('7/9 Sparkles...');
const SPARKLES = [
  [148, 148, 20], [876, 165, 16], [145, 860, 17], [885, 845, 14],
  [335,  80, 13], [700,  72, 14], [ 65, 490, 12], [966, 530, 11],
  [778, 948, 12], [270, 958, 11], [955, 272, 14], [ 78, 280, 11],
  [490,  50, 10], [558, 974, 9],  [945, 660, 10], [ 58, 660, 9],
  [820, 420, 8],  [195, 430, 8],
];
for (const [sx, sy, sz] of SPARKLES) {
  const r = sz * 0.55;
  fillCircle(sx, sy, r, 255, 248, 170, 255);
  drawStroke(sx - sz, sy, sx + sz, sy, sz * 0.18, 255, 235, 120, 210);
  drawStroke(sx, sy - sz, sx, sy + sz, sz * 0.18, 255, 235, 120, 210);
  drawStroke(sx - sz*0.65, sy - sz*0.65, sx + sz*0.65, sy + sz*0.65, sz * 0.14, 255, 220, 100, 140);
  drawStroke(sx + sz*0.65, sy - sz*0.65, sx - sz*0.65, sy + sz*0.65, sz * 0.14, 255, 220, 100, 140);
}

// ── 8. Subtle letter chips floating around tile ───────────────────────────────
console.log('8/9 Letter chips...');
const CHIPS = [
  [118, 306, 58, 64, 12],
  [912, 338, 58, 64, 12],
  [120, 718, 58, 64, 12],
  [910, 700, 58, 64, 12],
];
// Draw small rounded tiles with an "×" to represent random letters (clean, simple)
for (const [mx, my, cw, ch, cr] of CHIPS) {
  const rx = mx - cw/2, ry = my - ch/2;
  // Shadow
  fillRoundedRect(rx+3, ry+4, cw, ch, cr, 0, 0, 20, 90);
  // Tile
  fillRoundedRect(rx, ry, cw, ch, cr, 230, 222, 255, 220);
  // Highlight
  fillRoundedRect(rx+2, ry+2, cw-4, ch*0.45, cr-2, 255, 255, 255, 55);
  // Dot (abstract "letter" mark)
  fillCircle(mx, my - 6, 7,  74, 14, 158, 180);
  drawStroke(mx-10, my+7, mx+10, my+7, 4, 74, 14, 158, 160/255);
}

// ── 9. Top-of-icon soft vignette shine ───────────────────────────────────────
console.log('9/9 Shine...');
for (let y = 0; y < SIZE; y++) {
  for (let x = 0; x < SIZE; x++) {
    const dx = x - CX;
    const d = Math.hypot(dx * 0.8, y - 60);
    if (d >= 210) continue;
    const t = 1 - d / 210;
    blend(x, y, 255, 255, 255, Math.round(18 * t * t));
  }
}

// ── Save ──────────────────────────────────────────────────────────────────────
console.log('\nEncoding PNG...');
const png = buildPNG();
const OUT = path.join(__dirname, 'assets');
fs.writeFileSync(path.join(OUT, 'icon.png'), png);
fs.writeFileSync(path.join(OUT, 'adaptive-icon.png'), png);
console.log(`✅  Done! icon.png written — ${(png.length / 1024).toFixed(0)} KB`);
