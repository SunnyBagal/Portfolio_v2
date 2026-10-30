// Generated artwork. The original site uses photos and Behance shots; these stand in
// with drawings of the actual projects so nothing here is borrowed imagery.

const C = {
  lime: '#d9f73f',
  pink: '#ec1e8c',
  red: '#e3232b',
  cyan: '#35c5ec',
  green: '#46f080',
  orange: '#efa12f',
  paper: '#e8e5de',
  ink: '#141416',
};

/** Shown in the hero polaroid until public/sunny.jpg exists. */
export const photoPlaceholder = `
<svg viewBox="0 0 340 368" preserveAspectRatio="xMidYMid slice" role="img" aria-label="Photo placeholder">
  <defs>
    <linearGradient id="pp-bg" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#dcdcd6"/><stop offset="1" stop-color="#a9a9a2"/></linearGradient>
    <linearGradient id="pp-body" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#2b2c31"/><stop offset="1" stop-color="#16171a"/></linearGradient>
  </defs>
  <rect width="340" height="368" fill="url(#pp-bg)"/>
  <rect x="0" y="0" width="340" height="40" fill="#c9c9c2"/>
  <g opacity=".9">
    <rect x="22" y="70" width="110" height="130" fill="#f4f4f0" stroke="#bbb"/>
    <text x="34" y="96" font-family="Bakbak One" font-size="16" fill="#333">WS · SYNC</text>
    <rect x="34" y="108" width="26" height="22" fill="${C.lime}"/><rect x="66" y="108" width="26" height="22" fill="${C.pink}"/>
    <rect x="34" y="138" width="26" height="22" fill="${C.cyan}"/><rect x="66" y="138" width="26" height="22" fill="${C.orange}"/>
    <rect x="98" y="138" width="26" height="22" fill="${C.lime}"/>
    <rect x="230" y="64" width="28" height="24" fill="${C.pink}" transform="rotate(-6 244 76)"/>
    <rect x="266" y="70" width="28" height="24" fill="${C.lime}" transform="rotate(5 280 82)"/>
  </g>
  <circle cx="186" cy="150" r="56" fill="#24252a"/>
  <path d="M70 368c4-92 52-138 116-138s112 46 116 138Z" fill="url(#pp-body)"/>
  <path d="M150 238l36 52 36-52" fill="none" stroke="#e8e5de" stroke-width="10"/>
  <rect x="58" y="300" width="224" height="40" rx="6" fill="#141416" opacity=".85"/>
  <text x="170" y="318" text-anchor="middle" font-family="Archivo" font-weight="700" font-size="11" fill="${C.lime}">PLACEHOLDER</text>
  <text x="170" y="332" text-anchor="middle" font-family="Archivo" font-size="10" fill="#ddd">drop your photo at public/sunny.jpg</text>
</svg>`;

/** Linea: a dark canvas with live strokes and two remote cursors. */
const linea = `
<svg viewBox="0 0 400 310" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
  <rect width="400" height="310" fill="#f5f4ef"/>
  <g stroke="#e3e1da" stroke-width="1">${Array.from({ length: 20 }, (_, i) => `<path d="M${i * 20} 0v310"/>`).join('')}${Array.from({ length: 16 }, (_, i) => `<path d="M0 ${i * 20}h400"/>`).join('')}</g>
  <rect x="0" y="0" width="400" height="34" fill="#141416"/>
  <circle cx="18" cy="17" r="5" fill="${C.red}"/><circle cx="34" cy="17" r="5" fill="${C.orange}"/><circle cx="50" cy="17" r="5" fill="${C.green}"/>
  <text x="200" y="22" text-anchor="middle" font-family="Archivo" font-weight="700" font-size="12" fill="#eee">linea.sunnybagal.com</text>
  <path d="M40 210c30-90 80-120 120-80s40 90 90 40 60-110 110-70" fill="none" stroke="${C.pink}" stroke-width="7" stroke-linecap="round"/>
  <path d="M60 120c40 10 70-20 110 0" fill="none" stroke="#2b6ef0" stroke-width="5" stroke-linecap="round"/>
  <rect x="230" y="70" width="120" height="70" rx="6" fill="none" stroke="#141416" stroke-width="4"/>
  <path d="M250 245l40-30 40 30" fill="none" stroke="${C.green}" stroke-width="6" stroke-linecap="round" stroke-linejoin="round"/>
  <g transform="translate(168 150)"><path d="M0 0l14 34 5-14 14-5Z" fill="${C.pink}"/><rect x="18" y="28" width="38" height="16" rx="4" fill="${C.pink}"/><text x="37" y="40" text-anchor="middle" font-family="Archivo" font-weight="700" font-size="10" fill="#fff">you</text></g>
  <g transform="translate(300 180)"><path d="M0 0l14 34 5-14 14-5Z" fill="#2b6ef0"/><rect x="18" y="28" width="44" height="16" rx="4" fill="#2b6ef0"/><text x="40" y="40" text-anchor="middle" font-family="Archivo" font-weight="700" font-size="10" fill="#fff">guest</text></g>
</svg>`;

/** Recall: a search box over ranked results with hybrid scores. */
const recall = `
<svg viewBox="0 0 400 310" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
  <rect width="400" height="310" fill="#101114"/>
  <rect x="26" y="24" width="348" height="40" rx="10" fill="#1c1d22" stroke="#33343b"/>
  <circle cx="48" cy="44" r="7" fill="none" stroke="${C.lime}" stroke-width="2.5"/><path d="M53 49l6 6" stroke="${C.lime}" stroke-width="2.5"/>
  <text x="68" y="49" font-family="Archivo" font-size="13" fill="#cfcbc2">that article about websocket backpressure</text>
  ${[0, 1, 2, 3]
    .map((i) => {
      const y = 82 + i * 54;
      const bm = [0.92, 0.71, 0.58, 0.4][i]!;
      const vec = [0.86, 0.8, 0.44, 0.52][i]!;
      return `<rect x="26" y="${y}" width="348" height="44" rx="8" fill="${i === 0 ? '#1f2a12' : '#18191d'}" stroke="${i === 0 ? C.lime : '#2a2b31'}"/>
      <rect x="40" y="${y + 12}" width="${150 - i * 16}" height="8" rx="4" fill="#d6d2c8"/>
      <rect x="40" y="${y + 26}" width="${110 - i * 10}" height="6" rx="3" fill="#5c5a55"/>
      <rect x="262" y="${y + 12}" width="${bm * 90}" height="7" rx="3.5" fill="${C.cyan}"/>
      <rect x="262" y="${y + 25}" width="${vec * 90}" height="7" rx="3.5" fill="${C.pink}"/>`;
    })
    .join('')}
  <text x="262" y="306" font-family="Archivo" font-weight="700" font-size="9" fill="${C.cyan}">BM25</text>
  <text x="300" y="306" font-family="Archivo" font-weight="700" font-size="9" fill="${C.pink}">VECTOR</text>
</svg>`;

/** TraceHound: a repo graph with one flagged node and a review comment. */
const tracehound = (() => {
  const nodes: [number, number][] = [
    [70, 70], [150, 50], [230, 80], [320, 60], [100, 150], [190, 140], [280, 150], [60, 230], [160, 220], [250, 230], [340, 210],
  ];
  const edges = [[0, 1], [1, 2], [2, 3], [0, 4], [1, 5], [2, 5], [2, 6], [3, 6], [4, 5], [4, 7], [5, 8], [5, 9], [6, 9], [6, 10], [7, 8], [8, 9]];
  return `
<svg viewBox="0 0 400 310" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
  <rect width="400" height="310" fill="#141416"/>
  <g stroke="#3a3b42" stroke-width="2">${edges.map(([a, b]) => `<line x1="${nodes[a!]![0]}" y1="${nodes[a!]![1]}" x2="${nodes[b!]![0]}" y2="${nodes[b!]![1]}"/>`).join('')}</g>
  <g stroke="${C.orange}" stroke-width="3"><line x1="190" y1="140" x2="250" y2="230"/><line x1="250" y1="230" x2="280" y2="150"/></g>
  ${nodes.map(([x, y], i) => `<circle cx="${x}" cy="${y}" r="${i === 9 ? 13 : 9}" fill="${i === 9 ? C.red : i === 5 || i === 6 ? C.orange : '#d6d2c8'}" stroke="#141416" stroke-width="3"/>`).join('')}
  <g transform="translate(206 14)">
    <rect width="176" height="48" rx="8" fill="${C.paper}"/>
    <text x="12" y="20" font-family="Bakbak One" font-size="11" fill="${C.red}">REVIEW · L42</text>
    <text x="12" y="36" font-family="Archivo" font-size="10.5" fill="#333">null path reaches this call</text>
  </g>
</svg>`;
})();

export const projectArt = { linea, recall, tracehound };

/** Duotone, halftoned single covers. */
export function coverArt(kind: 'inbox' | 'hound' | 'wave', hue: 'pink' | 'lime' | 'cyan') {
  const bg = C[hue];
  const dark = hue === 'lime' ? '#5b6b07' : hue === 'pink' ? '#5c0634' : '#0b4d60';
  const id = `ht-${kind}`;
  const halftone = `<pattern id="${id}" width="7" height="7" patternUnits="userSpaceOnUse"><circle cx="3.5" cy="3.5" r="1.6" fill="${dark}" opacity=".55"/></pattern>`;
  let shapes = '';
  if (kind === 'inbox') {
    // A tower of unopened envelopes.
    shapes = Array.from({ length: 9 }, (_, i) => {
      const y = 200 - i * 20;
      const x = 52 + (i % 3) * 8 - (i % 2) * 6;
      const r = (i % 2 ? 4 : -3) + i * 0.5;
      return `<g transform="rotate(${r} ${x + 70} ${y + 22})"><rect x="${x}" y="${y}" width="140" height="44" fill="${dark}" opacity=".85"/><path d="M${x} ${y}l70 26 70-26" fill="none" stroke="${bg}" stroke-width="3"/></g>`;
    }).join('') + `<text x="236" y="44" text-anchor="end" font-family="Bakbak One" font-size="30" fill="${dark}">100+</text>`;
  } else if (kind === 'hound') {
    // A nose on a trail of nodes.
    shapes = `<path d="M30 210c50-10 60-60 110-60s60 40 110 30" fill="none" stroke="${dark}" stroke-width="5" stroke-dasharray="2 12" stroke-linecap="round"/>
      ${[[40, 208], [100, 160], [160, 152], [215, 178]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="9" fill="${dark}"/>`).join('')}
      <circle cx="128" cy="96" r="44" fill="${dark}"/><circle cx="128" cy="96" r="14" fill="${bg}"/>
      <text x="236" y="52" text-anchor="end" font-family="Bakbak One" font-size="40" fill="${dark}">DAY 5</text>`;
  } else {
    // A long voice note collapsing into one line of text.
    shapes = Array.from({ length: 26 }, (_, i) => {
      const hgt = 10 + Math.abs(Math.sin(i * 1.7) * 70) + (i % 4) * 6;
      return `<rect x="${24 + i * 8}" y="${110 - hgt / 2}" width="5" height="${hgt}" rx="2.5" fill="${dark}"/>`;
    }).join('') + `<rect x="24" y="176" width="208" height="34" rx="17" fill="${dark}"/><text x="128" y="198" text-anchor="middle" font-family="Archivo" font-weight="700" font-size="12" fill="${bg}">Keep talking. Send the text.</text><text x="236" y="44" text-anchor="end" font-family="Bakbak One" font-size="20" fill="${dark}">4:00 → 1 LINE</text>`;
  }
  return `<svg viewBox="0 0 256 256" preserveAspectRatio="xMidYMid slice" aria-hidden="true"><defs>${halftone}</defs><rect width="256" height="256" fill="${bg}"/><rect width="256" height="256" fill="url(#${id})"/>${shapes}</svg>`;
}

/** Concentric rings for an open record's front cover. */
export function recordFront(fg: string) {
  return `<svg viewBox="0 0 200 200" aria-hidden="true"><g fill="none" stroke="${fg}" stroke-opacity=".55" stroke-width="3"><circle cx="122" cy="96" r="70"/><circle cx="122" cy="96" r="52"/></g><circle cx="122" cy="96" r="34" fill="${fg}" fill-opacity=".45"/></svg>`;
}

export function sprayCan(color: string, rainbow = false) {
  const body = rainbow
    ? `<linearGradient id="rb" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${C.pink}"/><stop offset=".33" stop-color="${C.orange}"/><stop offset=".66" stop-color="${C.lime}"/><stop offset="1" stop-color="${C.cyan}"/></linearGradient>`
    : '';
  const fill = rainbow ? 'url(#rb)' : color;
  return `<svg viewBox="0 0 26 40" aria-hidden="true"><defs>${body}<linearGradient id="shine" x1="0" x2="1"><stop offset="0" stop-color="#fff" stop-opacity=".35"/><stop offset=".4" stop-color="#fff" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity=".3"/></linearGradient></defs>
    <rect x="10" y="1" width="6" height="5" rx="1.5" fill="#d8d8d8"/><path d="M6 9c0-3 3-4 7-4s7 1 7 4Z" fill="#bfbfbf"/>
    <rect x="4" y="9" width="18" height="30" rx="4" fill="${fill}"/><rect x="4" y="9" width="18" height="30" rx="4" fill="url(#shine)"/>
    <rect x="4" y="15" width="18" height="2" fill="#000" opacity=".2"/></svg>`;
}

export const tonearm = `
<svg viewBox="0 0 70 200" aria-hidden="true">
  <circle cx="35" cy="18" r="16" fill="#2a2b31" stroke="#3c3d44" stroke-width="2"/>
  <circle cx="35" cy="18" r="8" fill="#cfcfd4"/>
  <path d="M35 22 L35 130 L22 168" fill="none" stroke="#c9c9ce" stroke-width="5" stroke-linecap="round" stroke-linejoin="round"/>
  <rect x="8" y="160" width="22" height="30" rx="3" fill="${C.red}" transform="rotate(30 19 175)"/>
</svg>`;
