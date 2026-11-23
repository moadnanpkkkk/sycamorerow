// Renders assets/icon.png (256×256): the sycamore seen through a lancet window, pale yellow on black.
// Usage: node tools/make-icon.js
'use strict';
const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

const S = 256; const SS = 4;
const INK = [8, 7, 8]; const LAMP = [230, 225, 214]; const DIM = [120, 112, 80];
const cx = 128; const spring = 118; const w = 86; const R = 108; const d = R - w; const base = 232;
const insideArch = (x, y, grow = 0) => {
  if (x < cx - w - grow || x > cx + w + grow || y > base + grow) return false;
  if (y >= spring) return true;
  return Math.hypot(x - (cx + d), y - spring) <= R + grow && Math.hypot(x - (cx - d), y - spring) <= R + grow;
};
const circles = [[128, 112, 44], [94, 130, 27], [162, 128, 29], [108, 90, 25], [150, 88, 26], [128, 74, 22], [80, 112, 16], [176, 108, 17]];
const inTree = (x, y) => {
  if (x >= 121 && x <= 135 && y >= 140 && y <= base) return true; // trunk
  if (Math.abs((x - 128) - (y - 150) * 0.9) < 4 && y > 118 && y < 150 && x > 128) return true; // branch
  if (Math.abs((x - 128) + (y - 150) * 0.9) < 4 && y > 118 && y < 150 && x < 128) return true;
  if (y >= 212) return true; // ground
  return circles.some(([a, b, r]) => Math.hypot(x - a, y - b) <= r);
};
function shade(x, y) {
  if (insideArch(x, y)) {
    if (inTree(x, y)) return INK;
    if (Math.hypot(x - 168, y - 62) < 13) return [255, 250, 225]; // moon
    const t = (y - 20) / 200; return LAMP.map((c, i) => Math.round(c * (1 - t * 0.35) + INK[i] * t * 0.35));
  }
  if (insideArch(x, y, 5)) return INK;          // ink gap
  if (insideArch(x, y, 10)) return LAMP;        // carved frame
  if (insideArch(x, y, 14)) return INK;
  if (insideArch(x, y, 16)) return DIM;         // hood mould
  return null;                                   // transparent
}

const raw = Buffer.alloc((S * 4 + 1) * S);
for (let y = 0; y < S; y++) {
  raw[y * (S * 4 + 1)] = 0;
  for (let x = 0; x < S; x++) {
    let r = 0, g = 0, b = 0, a = 0;
    for (let sy = 0; sy < SS; sy++) for (let sx = 0; sx < SS; sx++) {
      const c = shade(x + (sx + 0.5) / SS, y + (sy + 0.5) / SS);
      if (c) { r += c[0]; g += c[1]; b += c[2]; a += 255; }
    }
    const n = SS * SS; const o = y * (S * 4 + 1) + 1 + x * 4; const cov = a / 255;
    raw[o] = cov ? Math.round(r / cov) : 0; raw[o + 1] = cov ? Math.round(g / cov) : 0; raw[o + 2] = cov ? Math.round(b / cov) : 0; raw[o + 3] = Math.round(a / n);
  }
}
const crcTable = new Int32Array(256).map((_, n) => { let c = n; for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1; return c; });
const crc = (buf) => { let c = -1; for (const b of buf) c = crcTable[(c ^ b) & 0xff] ^ (c >>> 8); return (c ^ -1) >>> 0; };
const chunk = (type, data) => { const len = Buffer.alloc(4); len.writeUInt32BE(data.length); const td = Buffer.concat([Buffer.from(type), data]); const c = Buffer.alloc(4); c.writeUInt32BE(crc(td)); return Buffer.concat([len, td, c]); };
const ihdr = Buffer.alloc(13); ihdr.writeUInt32BE(S, 0); ihdr.writeUInt32BE(S, 4); ihdr[8] = 8; ihdr[9] = 6; ihdr[10] = 0; ihdr[11] = 0; ihdr[12] = 0;
const png = Buffer.concat([Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]), chunk('IHDR', ihdr), chunk('IDAT', zlib.deflateSync(raw, { level: 9 })), chunk('IEND', Buffer.alloc(0))]);
const out = path.join(__dirname, '..', 'assets', 'icon.png');
fs.writeFileSync(out, png);
console.log('Wrote', out, png.length, 'bytes');
