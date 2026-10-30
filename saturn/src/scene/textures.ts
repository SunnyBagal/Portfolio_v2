import { CanvasTexture, SRGBColorSpace, type Texture } from 'three';

/** Small seeded PRNG (mulberry32) so the procedural scene looks the same on every load. */
export function rng(seed: number) {
  let s = seed | 0;
  return () => {
    s = (s + 0x6d2b79f5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const hex = (h: string): [number, number, number] => {
  const n = parseInt(h.slice(1), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
};

function canvas(w: number, h: number) {
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  return [c, c.getContext('2d')!] as const;
}

function finish(c: HTMLCanvasElement): Texture {
  const tex = new CanvasTexture(c);
  tex.colorSpace = SRGBColorSpace;
  tex.anisotropy = 4;
  return tex;
}

// Saturn's ochres and creams, darkest to lightest.
const PLANET_PALETTE = ['#6f5235', '#93704a', '#b68d5c', '#cfa874', '#e2c796', '#efdfbb', '#f4e9cf'].map(hex);

/** Equirectangular banded gas-giant texture. Bands wobble a little so they read as cloud belts. */
export function planetTexture(): Texture {
  const w = 1024;
  const h = 512;
  const [c, ctx] = canvas(w, h);
  const img = ctx.createImageData(w, h);
  const rand = rng(11);
  const waves = Array.from({ length: 7 }, (_, i) => ({
    f: 3 + i * 4.3 + rand() * 4,
    p: rand() * Math.PI * 2,
    a: 1 / (1 + i * 0.7),
  }));
  const amp = waves.reduce((s, wv) => s + wv.a, 0);
  const last = PLANET_PALETTE.length - 1;

  for (let y = 0; y < h; y++) {
    const v = y / (h - 1);
    const polar = Math.pow(Math.sin(v * Math.PI), 0.5);
    const equator = 0.22 * Math.exp(-(((v - 0.5) / 0.07) ** 2));
    for (let x = 0; x < w; x++) {
      const u = (x / w) * Math.PI * 2;
      // integer frequencies in u keep the seam invisible
      const lat = v + 0.0035 * Math.sin(u * 3 + v * 37) + 0.0016 * Math.sin(u * 9 - v * 71);
      let n = 0;
      for (const wv of waves) n += wv.a * Math.sin(lat * wv.f * Math.PI * 2 + wv.p);
      n = 0.5 + (n / amp) * 0.42 + equator;
      n = Math.min(1, Math.max(0, n));
      const f = n * last;
      const i0 = Math.floor(f);
      const i1 = Math.min(last, i0 + 1);
      const k = f - i0;
      const shade = (0.6 + 0.4 * polar) * (0.97 + rand() * 0.06);
      const o = (y * w + x) * 4;
      for (let ch = 0; ch < 3; ch++) {
        img.data[o + ch] = (PLANET_PALETTE[i0][ch] * (1 - k) + PLANET_PALETTE[i1][ch] * k) * shade;
      }
      img.data[o + 3] = 255;
    }
  }
  ctx.putImageData(img, 0, 0);
  return finish(c);
}

/** Grey-cream cratered moon surface. */
export function moonTexture(): Texture {
  const [c, ctx] = canvas(512, 256);
  const rand = rng(29);
  ctx.fillStyle = '#a99f90';
  ctx.fillRect(0, 0, 512, 256);
  for (let i = 0; i < 36; i++) {
    const x = rand() * 512;
    const y = rand() * 256;
    const r = 20 + rand() * 50;
    const g = ctx.createRadialGradient(x, y, 0, x, y, r);
    g.addColorStop(0, 'rgba(58, 52, 46, 0.22)');
    g.addColorStop(1, 'rgba(58, 52, 46, 0)');
    ctx.fillStyle = g;
    ctx.fillRect(x - r, y - r, r * 2, r * 2);
  }
  for (let i = 0; i < 110; i++) {
    const x = rand() * 512;
    const y = 20 + rand() * 216;
    const r = 1.5 + Math.pow(rand(), 3) * 13;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(48, 43, 38, 0.32)';
    ctx.fill();
    ctx.beginPath();
    ctx.arc(x + r * 0.15, y + r * 0.15, r, Math.PI * 1.1, Math.PI * 1.9);
    ctx.strokeStyle = 'rgba(240, 232, 216, 0.3)';
    ctx.lineWidth = Math.max(0.6, r * 0.18);
    ctx.stroke();
  }
  return finish(c);
}

let glow: Texture | undefined;

/** Soft radial falloff used for the story-rock halos. */
export function glowTexture(): Texture {
  if (glow) return glow;
  const [c, ctx] = canvas(128, 128);
  const g = ctx.createRadialGradient(64, 64, 0, 64, 64, 64);
  g.addColorStop(0, 'rgba(255,255,255,1)');
  g.addColorStop(0.18, 'rgba(255,255,255,0.45)');
  g.addColorStop(0.5, 'rgba(255,255,255,0.08)');
  g.addColorStop(1, 'rgba(255,255,255,0)');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, 128, 128);
  glow = finish(c);
  return glow;
}
