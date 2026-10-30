// Seven-segment LED digits as inline SVG, with the unlit "8" ghosted behind,
// the way a real display looks.

const SEGMENTS: Record<string, string> = {
  a: '6,2 24,2 27,5 24,8 6,8 3,5',
  b: '28,6 31,9 31,22 28,25 25,22 25,9',
  c: '28,27 31,30 31,43 28,46 25,43 25,30',
  d: '6,44 24,44 27,47 24,50 6,50 3,47',
  e: '2,27 5,30 5,43 2,46 -1,43 -1,30',
  f: '2,6 5,9 5,22 2,25 -1,22 -1,9',
  g: '6,23 24,23 27,26 24,29 6,29 3,26',
};

const DIGITS: Record<string, string> = {
  '0': 'abcdef',
  '1': 'bc',
  '2': 'abdeg',
  '3': 'abcdg',
  '4': 'bcfg',
  '5': 'acdfg',
  '6': 'acdefg',
  '7': 'abc',
  '8': 'abcdefg',
  '9': 'abcdfg',
  ' ': '',
};

function digitSvg(ch: string, color: string) {
  const lit = DIGITS[ch] ?? '';
  const polys = Object.entries(SEGMENTS)
    .map(([seg, pts]) => {
      const on = lit.includes(seg);
      return `<polygon points="${pts}" fill="${on ? color : 'rgba(255,255,255,0.045)'}"${on ? ' filter="url(#glow)"' : ''}/>`;
    })
    .join('');
  // Slight italic skew like a real LED panel.
  return `<svg viewBox="-2 0 34 52" aria-hidden="true"><defs><filter id="glow" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="1.2" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter></defs><g transform="skewX(-6)">${polys}</g></svg>`;
}

/** Fills `host` with LED digits for `text`, padded on the left to `width` with ghost digits. */
export function renderLed(host: HTMLElement, text: string, color: string, width = text.length) {
  const padded = text.padStart(width, ' ');
  host.innerHTML = [...padded].map((ch) => digitSvg(ch, color)).join('');
  host.setAttribute('aria-label', text.trim());
}
