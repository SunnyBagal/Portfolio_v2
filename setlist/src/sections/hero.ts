import { about, hero, person } from '../content';
import { photoPlaceholder } from '../ui/art';
import { h, icon, reducedMotion, rich, svg } from '../ui/dom';
import { renderLed } from '../ui/led';

const HUE_VAR: Record<string, string> = {
  red: '#ff3b3b',
  orange: '#ffaa2b',
  green: '#4dff8a',
  cyan: '#3fd4ff',
};

function photo() {
  const shot = h('div.shot');
  const img = h('img', { src: hero.photo, alt: person.name, loading: 'eager' });
  img.addEventListener('error', () => img.replaceWith(svg(photoPlaceholder)));
  shot.append(img);
  return h('figure.polaroid.paper', {}, h('span.tape'), shot, h('figcaption', {}, person.name));
}

function stats() {
  const wrap = h('div.stats', { role: 'list' });
  const counters: { el: HTMLElement; to: number; color: string; width: number }[] = [];
  for (const s of hero.stats) {
    const color = HUE_VAR[s.hue] ?? '#fff';
    const width = Math.max(2, String(s.value).length);
    const digits = h('div.digits');
    const led = h('span', { style: 'display:flex;gap:3px' });
    digits.append(led, s.suffix ? h('span.suffix', { style: `color:${color}` }, s.suffix) : '');
    renderLed(led, String(s.value), color, width);
    counters.push({ el: led, to: s.value, color, width });
    wrap.append(h('div.stat', { role: 'listitem' }, digits, h('p', {}, s.label)));
  }

  // Count up the first time the panel scrolls into view.
  if (!reducedMotion()) {
    const io = new IntersectionObserver((entries) => {
      if (!entries.some((e) => e.isIntersecting)) return;
      io.disconnect();
      const t0 = performance.now();
      const tick = (t: number) => {
        const k = Math.min(1, (t - t0) / 1400);
        const ease = 1 - Math.pow(1 - k, 3);
        for (const c of counters) renderLed(c.el, String(Math.round(c.to * ease)), c.color, c.width);
        if (k < 1) requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
    });
    io.observe(wrap);
  }
  return wrap;
}

export function tapeBand(items: readonly string[], cls = 'tape-band', dur = 38) {
  const span = () => items.map((t) => h('span', {}, t));
  return h(`div.${cls}` as 'div', { 'aria-hidden': 'true' }, h('div.marquee', { style: `--dur:${dur}s` }, ...span(), ...span()));
}

export function heroSection() {
  const left = h(
    'div.hero-left',
    {},
    h(
      'div.name-tag',
      { role: 'img', 'aria-label': `Hey yo, they call me ${person.handle}` },
      h('div.hey', {}, hero.greeting),
      h('div.call', {}, hero.callMe),
      h('div.name', {}, person.handle),
    ),
    h(
      'h1.hero-title.display',
      {},
      hero.title[0],
      ' ',
      h('span.amp', {}, hero.title[1]),
      h('br'),
      hero.title[2],
    ),
    h('p.hero-tags', {}, hero.tags.join(' · ')),
    h('p.hero-intro', {}, hero.intro),
    h(
      'div.hero-ctas',
      {},
      h('a.btn', { href: `mailto:${person.email}` }, icon('mail'), person.email),
      h('a.btn.green', { href: person.github, target: '_blank', rel: 'noopener' }, icon('github'), 'GitHub'),
    ),
  );

  const grid = h('div.hero-grid', {}, left, h('div', {}, photo()));
  for (const s of hero.stickers) {
    grid.append(
      h(
        `div.hero-sticker.hue-${s.hue}${s.font === 'marker' ? '.marker' : ''}${s.wideOnly ? '.wide-only' : ''}` as 'div',
        { style: `left:${s.x};top:${s.y};transform:rotate(${s.r}deg)`, 'aria-hidden': 'true' },
        s.text,
      ),
    );
  }

  return h(
    'section.sec.hero',
    { id: 'preview', 'data-name': 'The Preview', 'data-np': 'var(--lime)' },
    h('span.watermark', { 'aria-hidden': 'true' }, person.handle),
    h('div.blob', { style: 'width:70px;height:70px;background:var(--pink);top:70px;left:43%;opacity:.9' }),
    h('div.blob', { style: 'width:150px;height:150px;background:var(--lime);top:56%;right:-50px;opacity:.85' }),
    h('div.blob', { style: 'width:40px;height:40px;background:var(--pink);top:64%;right:58px;border:3px solid var(--lime)' }),
    h('div.wrap', {}, grid, stats()),
    h('div.tape-band.under'),
    tapeBand(hero.tape),
  );
}

export function aboutSection() {
  const card = h(
    'div.about-card.paper.reveal',
    {},
    h('span.tape'),
    h('span.tape'),
    h('h2.display', {}, about.heading, h('span.marker', {}, about.script)),
    h('div.about-cols', {}, ...about.columns.map((c) => rich('p', c))),
    h('div.pills', {}, ...about.pills.map((p) => h('span.pill', {}, p))),
  );
  const note = h(
    'a.note.reveal',
    { href: '#contact' },
    h('h3.display', {}, about.note.title),
    h('p', {}, about.note.body),
    h('span.go', {}, about.note.cta, icon('arrow')),
  );
  return h(
    'section.sec.about',
    { id: 'about', 'data-name': 'The Preview', 'data-np': 'var(--lime)' },
    h('div.wrap.about-grid', {}, card, note),
  );
}
