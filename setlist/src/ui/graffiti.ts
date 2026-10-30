// The "leave your tag" spray wall: five nozzles, pressure, size, drips, undo and export.

import { contact } from '../content';
import { sprayCan } from './art';
import { sound } from './audio';
import { paintBricks } from './bricks';
import { h, icon, svg } from './dom';

type Nozzle = 'skinny' | 'fat' | 'soft' | 'splatter' | 'calligraphy';

const CANS = [
  { name: 'Lime', color: '#d9f73f' },
  { name: 'Pink', color: '#ff2a8f' },
  { name: 'Cyan', color: '#35c5ec' },
  { name: 'Red', color: '#ff2b2b' },
  { name: 'Green', color: '#46f080' },
  { name: 'Orange', color: '#ffa630' },
  { name: 'White', color: '#f4f2ec' },
  { name: 'Black', color: '#0c0c0d' },
  { name: 'Rainbow', color: 'rainbow' },
];

const NOZZLES: { id: Nozzle; label: string }[] = [
  { id: 'skinny', label: 'Skinny' },
  { id: 'fat', label: 'Fat' },
  { id: 'soft', label: 'Soft' },
  { id: 'splatter', label: 'Splatter' },
  { id: 'calligraphy', label: 'Calligraphy' },
];

interface Drip {
  x: number;
  y: number;
  len: number;
  max: number;
  w: number;
  color: string;
}

function gauss() {
  return (Math.random() + Math.random() + Math.random() - 1.5) / 1.5;
}

export function graffitiWall() {
  const state = { can: 0, nozzle: 'skinny' as Nozzle, size: 14, pressure: 0.7, antidrip: false, hue: 0 };
  const dpr = Math.min(devicePixelRatio || 1, 2);

  const bg = h('canvas', { 'aria-hidden': 'true' });
  const paint = h('canvas', { 'aria-label': 'Spray wall, draw with mouse or finger', role: 'img' });
  const hint = h('div.wall-hint', {}, contact.wall.hint);
  const download = h('button.btn.small.wall-download', { type: 'button' }, icon('download'), contact.wall.download);
  const wall = h('div.wall-canvas', {}, bg, paint, hint, download);
  const ctx = paint.getContext('2d')!;

  let W = 0;
  let H = 0;
  function size() {
    const r = wall.getBoundingClientRect();
    if (!r.width) return;
    const old = W ? (() => {
      const c = document.createElement('canvas');
      c.width = paint.width;
      c.height = paint.height;
      c.getContext('2d')!.drawImage(paint, 0, 0);
      return c;
    })() : null;
    W = r.width;
    H = r.height;
    for (const c of [bg, paint]) {
      c.width = Math.round(W * dpr);
      c.height = Math.round(H * dpr);
    }
    const b = bg.getContext('2d')!;
    b.scale(dpr, dpr);
    paintBricks(b, { width: W, height: H, brickW: 64, brickH: 24, mortar: 3, base: 48, seed: 21 });
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    if (old) ctx.drawImage(old, 0, 0, W, H);
  }
  new ResizeObserver(size).observe(wall);

  // ---- undo history ----
  const history: ImageData[] = [];
  const undoBtn = h('button.round', { type: 'button', 'aria-label': 'Undo', disabled: true }, icon('undo'));
  const clearBtn = h('button.round', { type: 'button', 'aria-label': 'Clear wall' }, icon('eraser'));
  function snapshot() {
    history.push(ctx.getImageData(0, 0, paint.width, paint.height));
    if (history.length > 20) history.shift();
    undoBtn.disabled = false;
  }
  undoBtn.addEventListener('click', () => {
    const img = history.pop();
    if (!img) return;
    drips.length = 0;
    ctx.putImageData(img, 0, 0);
    undoBtn.disabled = history.length === 0;
  });
  clearBtn.addEventListener('click', () => {
    snapshot();
    drips.length = 0;
    ctx.clearRect(0, 0, W, H);
    hint.classList.remove('gone');
  });

  // ---- drawing ----
  const color = () => {
    const c = CANS[state.can]!.color;
    return c === 'rainbow' ? `hsl(${state.hue % 360} 95% 60%)` : c;
  };

  function rgba(c: string, a: number) {
    if (c.startsWith('hsl')) return c.replace(')', ` / ${a})`);
    const n = parseInt(c.slice(1), 16);
    return `rgba(${n >> 16},${(n >> 8) & 255},${n & 255},${a})`;
  }

  let wet = 0;
  function stamp(x: number, y: number, px: number, py: number) {
    const c = color();
    const p = state.pressure;
    const s = state.size;
    switch (state.nozzle) {
      case 'calligraphy': {
        const nib = s * 0.7;
        const dx = Math.cos(Math.PI / 4) * nib;
        const dy = Math.sin(Math.PI / 4) * nib;
        ctx.fillStyle = rgba(c, 0.55 + p * 0.45);
        ctx.beginPath();
        ctx.moveTo(px - dx, py + dy);
        ctx.lineTo(px + dx, py - dy);
        ctx.lineTo(x + dx, y - dy);
        ctx.lineTo(x - dx, y + dy);
        ctx.closePath();
        ctx.fill();
        return;
      }
      case 'splatter': {
        spray(x, y, s * 0.5, c, p * 0.6, 10);
        if (Math.random() < 0.35 * p) {
          for (let i = 0; i < 3; i++) {
            const a = Math.random() * Math.PI * 2;
            const d = s * (0.8 + Math.random() * 2.4);
            ctx.fillStyle = rgba(c, 0.9);
            ctx.beginPath();
            ctx.arc(x + Math.cos(a) * d, y + Math.sin(a) * d, Math.random() * s * 0.22 + 1, 0, Math.PI * 2);
            ctx.fill();
          }
        }
        return;
      }
      case 'soft': {
        const r = s * 2.2;
        const g = ctx.createRadialGradient(x, y, 0, x, y, r);
        g.addColorStop(0, rgba(c, 0.09 * p + 0.02));
        g.addColorStop(1, rgba(c, 0));
        ctx.fillStyle = g;
        ctx.fillRect(x - r, y - r, r * 2, r * 2);
        return;
      }
      case 'fat':
        spray(x, y, s * 1.3, c, p, 46);
        return;
      default:
        spray(x, y, s * 0.55, c, p, 18);
    }
  }

  /** A spray stamp: soft glowing core plus scattered speckle, like real aerosol. */
  function spray(x: number, y: number, r: number, c: string, p: number, dots: number) {
    const g = ctx.createRadialGradient(x, y, 0, x, y, r);
    g.addColorStop(0, rgba(c, 0.32 * p + 0.06));
    g.addColorStop(0.55, rgba(c, 0.14 * p));
    g.addColorStop(1, rgba(c, 0));
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = rgba(c, 0.7);
    const n = Math.round(dots * p);
    for (let i = 0; i < n; i++) {
      const dx = gauss() * r * 1.5;
      const dy = gauss() * r * 1.5;
      const d = Math.random() * 1.3 + 0.4;
      ctx.fillRect(x + dx, y + dy, d, d);
    }
  }

  // ---- drips ----
  const drips: Drip[] = [];
  let dripping = false;
  function dripLoop() {
    dripping = drips.length > 0;
    if (!dripping) return;
    for (let i = drips.length - 1; i >= 0; i--) {
      const d = drips[i]!;
      const step = 0.6 + (1 - d.len / d.max) * 1.4;
      const w = d.w * (1 - (d.len / d.max) * 0.6);
      ctx.fillStyle = d.color;
      ctx.fillRect(d.x - w / 2, d.y + d.len, w, step + 0.5);
      d.len += step;
      if (d.len >= d.max) {
        ctx.beginPath();
        ctx.arc(d.x, d.y + d.len, w * 0.75, 0, Math.PI * 2);
        ctx.fill();
        drips.splice(i, 1);
      }
    }
    requestAnimationFrame(dripLoop);
  }
  function maybeDrip(x: number, y: number, speed: number) {
    if (state.antidrip || state.nozzle === 'soft' || state.nozzle === 'calligraphy') return;
    // Fast strokes never drip; paint pools when the can slows down or stops.
    if (speed > 0.35) return;
    wet += (state.pressure * state.size) / (260 * (speed + 0.25));
    if (wet < 1) return;
    wet = 0;
    drips.push({ x: x + gauss() * state.size * 0.3, y, len: 0, max: 18 + Math.random() * 70, w: Math.max(1.4, state.size * 0.16), color: rgba(color(), 0.8) });
    if (!dripping) requestAnimationFrame(dripLoop);
  }

  // ---- pointer ----
  let last: { x: number; y: number; t: number } | null = null;
  const pos = (e: PointerEvent) => {
    const r = paint.getBoundingClientRect();
    return { x: e.clientX - r.left, y: e.clientY - r.top, t: performance.now() };
  };

  paint.addEventListener('pointerdown', (e) => {
    paint.setPointerCapture(e.pointerId);
    snapshot();
    hint.classList.add('gone');
    last = pos(e);
    wet = 0;
    stamp(last.x, last.y, last.x, last.y);
    sound.spray(true, state.pressure);
  });
  paint.addEventListener('pointermove', (e) => {
    if (!last) return;
    const p = pos(e);
    const dist = Math.hypot(p.x - last.x, p.y - last.y);
    const speed = dist / Math.max(1, p.t - last.t);
    const spacing = Math.max(1, state.size / 5);
    const steps = Math.max(1, Math.ceil(dist / spacing));
    for (let i = 1; i <= steps; i++) {
      const k = i / steps;
      const x = last.x + (p.x - last.x) * k;
      const y = last.y + (p.y - last.y) * k;
      const px = last.x + (p.x - last.x) * ((i - 1) / steps);
      const py = last.y + (p.y - last.y) * ((i - 1) / steps);
      stamp(x, y, px, py);
    }
    state.hue += dist * 0.6;
    maybeDrip(p.x, p.y, speed);
    last = p;
  });
  // Holding still keeps spraying, which is what builds up drips.
  let holdTimer = 0;
  const hold = () => {
    if (last && performance.now() - last.t > 90) {
      stamp(last.x, last.y, last.x, last.y);
      maybeDrip(last.x, last.y, 0);
    }
    holdTimer = window.setTimeout(hold, 60);
  };
  paint.addEventListener('pointerdown', () => (holdTimer = window.setTimeout(hold, 120)));
  const end = () => {
    last = null;
    clearTimeout(holdTimer);
    sound.spray(false);
  };
  paint.addEventListener('pointerup', end);
  paint.addEventListener('pointercancel', end);

  // ---- export ----
  download.addEventListener('click', () => {
    const out = document.createElement('canvas');
    out.width = paint.width;
    out.height = paint.height;
    const o = out.getContext('2d')!;
    o.drawImage(bg, 0, 0);
    o.drawImage(paint, 0, 0);
    o.font = `${14 * dpr}px "Permanent Marker"`;
    o.fillStyle = 'rgba(255,255,255,0.55)';
    o.fillText('sunnybagal.com', 14 * dpr, out.height - 14 * dpr);
    const a = document.createElement('a');
    a.download = 'my-tag.png';
    a.href = out.toDataURL('image/png');
    a.click();
  });

  // ---- tools ----
  const cans = h('div.cans', { role: 'group', 'aria-label': 'Colour' });
  const canBtns = CANS.map((c, i) => {
    const b = h(
      'button.can',
      { type: 'button', 'aria-label': c.name, 'aria-pressed': String(i === state.can), style: `color:${c.color === 'rainbow' ? '#fff' : c.color}` },
      svg(sprayCan(c.color, c.color === 'rainbow')),
    );
    b.addEventListener('click', () => {
      state.can = i;
      canBtns.forEach((x, j) => x.setAttribute('aria-pressed', String(j === i)));
    });
    cans.append(b);
    return b;
  });

  const nozzles = h('div.nozzles', { role: 'group', 'aria-label': 'Nozzle' });
  const nozBtns = NOZZLES.map((n) => {
    const b = h('button.nozzle', { type: 'button', 'aria-pressed': String(n.id === state.nozzle) }, h('i'), n.label);
    b.addEventListener('click', () => {
      state.nozzle = n.id;
      nozBtns.forEach((x, j) => x.setAttribute('aria-pressed', String(NOZZLES[j]!.id === n.id)));
    });
    nozzles.append(b);
    return b;
  });

  const slider = (label: string, min: number, max: number, value: number, fmt: (v: number) => string, on: (v: number) => void) => {
    const out = h('b', {}, fmt(value));
    const input = h('input', { type: 'range', min, max, value, 'aria-label': label });
    input.addEventListener('input', () => {
      const v = Number(input.value);
      out.textContent = fmt(v);
      on(v);
    });
    return h('label.slider', {}, h('span', {}, `${label} `, out), input);
  };

  const anti = h('input', { type: 'checkbox' });
  anti.addEventListener('change', () => (state.antidrip = anti.checked));

  const tools = h(
    'div.tools',
    {},
    h('div.tool-row', {}, h('span.tool-label', {}, 'Colour'), cans),
    h('div.tool-row', {}, h('span.tool-label', {}, 'Nozzle'), nozzles),
    h(
      'div.tool-row.sliders',
      {},
      slider('Size', 2, 40, state.size, String, (v) => (state.size = v)),
      slider('Pressure', 10, 100, state.pressure * 100, (v) => `${v}%`, (v) => (state.pressure = v / 100)),
      h('label.switch', {}, anti, 'Anti-drip'),
      h('div.tool-actions', {}, undoBtn, clearBtn),
    ),
  );

  return h('div.graffiti.reveal', {}, wall, tools);
}
