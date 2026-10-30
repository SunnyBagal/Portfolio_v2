// Procedural brick wall: staggered rows, per-brick tone, chips and grime.
// Seeded so the wall looks the same on every load.

function rng(seed: number) {
  return () => {
    seed = (seed * 1664525 + 1013904223) >>> 0;
    return seed / 4294967296;
  };
}

export interface BrickOptions {
  width: number;
  height: number;
  brickW?: number;
  brickH?: number;
  mortar?: number;
  base?: number;
  seed?: number;
}

/** Paints a brick wall onto ctx at (0, 0). */
export function paintBricks(ctx: CanvasRenderingContext2D, opts: BrickOptions) {
  const { width, height, brickW = 120, brickH = 40, mortar = 5, base = 52, seed = 7 } = opts;
  const rand = rng(seed);

  ctx.fillStyle = '#0d0d0e';
  ctx.fillRect(0, 0, width, height);

  for (let row = 0, y = 0; y < height; row++, y += brickH) {
    const offset = row % 2 ? -brickW / 2 : 0;
    for (let x = offset; x < width; x += brickW) {
      const tone = base + (rand() - 0.5) * 22;
      const bx = x + mortar / 2;
      const by = y + mortar / 2;
      const bw = brickW - mortar;
      const bh = brickH - mortar;

      const g = ctx.createLinearGradient(0, by, 0, by + bh);
      g.addColorStop(0, `rgb(${tone + 10},${tone + 10},${tone + 11})`);
      g.addColorStop(1, `rgb(${tone - 8},${tone - 8},${tone - 7})`);
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.roundRect(bx, by, bw, bh, 3);
      ctx.fill();

      // Speckle and chips.
      for (let i = 0; i < 26; i++) {
        const light = rand() > 0.5;
        ctx.fillStyle = light ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.22)';
        const s = rand() * 3 + 0.6;
        ctx.fillRect(bx + rand() * bw, by + rand() * bh, s, s);
      }
      if (rand() > 0.82) {
        ctx.fillStyle = 'rgba(0,0,0,0.35)';
        ctx.beginPath();
        ctx.ellipse(bx + rand() * bw, by + rand() * bh, rand() * 9 + 3, rand() * 4 + 2, rand() * 3, 0, Math.PI * 2);
        ctx.fill();
      }
      // Top highlight edge.
      ctx.fillStyle = 'rgba(255,255,255,0.06)';
      ctx.fillRect(bx + 2, by, bw - 4, 1.5);
    }
  }

  // Vignette and grime streaks.
  const v = ctx.createRadialGradient(width / 2, height / 2, Math.min(width, height) * 0.2, width / 2, height / 2, Math.max(width, height) * 0.75);
  v.addColorStop(0, 'rgba(0,0,0,0)');
  v.addColorStop(1, 'rgba(0,0,0,0.6)');
  ctx.fillStyle = v;
  ctx.fillRect(0, 0, width, height);
  for (let i = 0; i < width / 60; i++) {
    const x = rand() * width;
    const g = ctx.createLinearGradient(0, 0, 0, height);
    g.addColorStop(0, 'rgba(0,0,0,0)');
    g.addColorStop(rand(), 'rgba(0,0,0,0.12)');
    g.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = g;
    ctx.fillRect(x, 0, rand() * 40 + 10, height);
  }
}

/** A tileable-enough brick texture as a data URL, for CSS backgrounds. */
export function brickTexture(width = 1200, height = 800, opts: Partial<BrickOptions> = {}) {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  paintBricks(canvas.getContext('2d')!, { width, height, ...opts });
  return canvas.toDataURL('image/jpeg', 0.82);
}
