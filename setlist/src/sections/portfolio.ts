import { person, portfolio } from '../content';
import { projectArt } from '../ui/art';
import { sound } from '../ui/audio';
import { brickTexture } from '../ui/bricks';
import { h, heading, icon, rich, svg } from '../ui/dom';
import { songFrom } from '../ui/music';

const FRAME: Record<string, string> = {
  lime: 'var(--lime)',
  ink: '#0e0e10',
  orange: 'var(--orange)',
};

export function portfolioSection() {
  const wall = h('div.wall');
  for (const p of portfolio.projects) {
    const card = h(
      'a.shot-card.paper.reveal',
      { href: p.href, target: '_blank', rel: 'noopener', style: `--tilt:${p.tilt}deg` },
      h('span.tape.l'),
      h('span.tape.r'),
      h(
        'div.shot-frame',
        { style: `--frame:${FRAME[p.frame] ?? 'var(--lime)'}` },
        h(
          'div.shot-art',
          {},
          svg(projectArt[p.id]),
          h('div.over', {}, h('small', {}, p.kicker), h('b', {}, p.overlay)),
        ),
        h('span.btn.small.view-chip', {}, 'View project', icon('arrow')),
      ),
      h('h3.display', {}, p.title),
      h('p.meta', {}, p.meta),
    );
    // Hovering or focusing a polaroid plays that project's tune.
    const source = `project:${p.id}`;
    const on = () => sound.want(source, songFrom(source, p.tune));
    const off = () => sound.release(source);
    card.addEventListener('pointerenter', (e) => e.pointerType === 'mouse' && on());
    card.addEventListener('pointerleave', (e) => e.pointerType === 'mouse' && off());
    card.addEventListener('focus', on);
    card.addEventListener('blur', off);
    wall.append(card);
  }

  const marks = portfolio.marks.map((m, i) => h(`span.wm-${i % 7}` as 'span', {}, m));
  const marks2 = portfolio.marks.map((m, i) => h(`span.wm-${i % 7}` as 'span', {}, m));

  const section = h(
    'section.sec.portfolio.bricks',
    { id: 'portfolio', 'data-name': 'Portfolio', 'data-np': 'var(--cyan)' },
    h(
      'div.wrap',
      {},
      h('div.sec-head', {}, heading('Portfolio', ''), rich('p.intro', portfolio.intro)),
      wall,
      h(
        'div.wall-cta',
        {},
        h('a.btn.cyan', { href: person.github, target: '_blank', rel: 'noopener' }, icon('github'), portfolio.allLabel),
      ),
    ),
    h('div.logo-tape', { 'aria-label': 'Places and projects' }, h('div.marquee', { style: '--dur:30s' }, ...marks, ...marks2)),
  );

  // The wall is painted once, after first paint, so it never blocks startup.
  const paint = () => section.style.setProperty('--bricks', `url(${brickTexture()})`);
  if ('requestIdleCallback' in window) requestIdleCallback(paint, { timeout: 800 });
  else setTimeout(paint, 0);
  return section;
}
