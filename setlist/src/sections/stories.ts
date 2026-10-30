import { person, PLACEHOLDER, stories } from '../content';
import { coverArt } from '../ui/art';
import { sound } from '../ui/audio';
import { songFrom } from '../ui/music';
import { h, heading, icon, rich, svg } from '../ui/dom';

export function storiesSection() {
  const grid = h('div.singles');
  stories.singles.forEach((s, i) => {
    // Without a published link the card is not clickable and says so.
    const tag = s.href ? 'a' : 'div';
    const card = h(
      `${tag}.single.reveal` as 'a',
      s.href ? { href: s.href, target: '_blank', rel: 'noopener' } : { tabindex: 0 },
      h(
        'div.sleeve',
        {},
        h('div.disc'),
        h('div.cover', {}, svg(coverArt(s.art, s.cover)), h('span.side-tag', {}, s.side), h('span.rpm45', {}, '45')),
        s.href ? h('span.btn.cyan.small.read-chip', {}, 'Read story', icon('arrow')) : '',
      ),
      h('p.meta', {}, s.meta),
      h('h3', {}, s.title),
      rich('p', s.blurb),
      h('div.tags', {}, ...s.tags.map((t) => h('span', {}, t))),
      s.href ? '' : rich('p', [PLACEHOLDER('link to where this story is published')]),
    );
    // Hovering a single drops the needle on it; tapping toggles it on touch screens.
    const source = `single:${i}`;
    const song = songFrom(source, s.tune);
    const on = () => sound.want(source, song);
    const off = () => sound.release(source);
    card.addEventListener('pointerenter', (e) => e.pointerType === 'mouse' && on());
    card.addEventListener('pointerleave', (e) => e.pointerType === 'mouse' && off());
    card.addEventListener('focus', on);
    card.addEventListener('blur', off);
    let tapped = false;
    card.addEventListener('click', () => {
      sound.wake();
      tapped = !tapped || matchMedia('(hover: hover)').matches;
      if (tapped) on();
      else off();
    });
    grid.append(card);
  });

  return h(
    'section.sec.stories',
    { id: 'stories', 'data-name': 'Stories', 'data-np': 'var(--paper)' },
    h(
      'div.wrap',
      {},
      h('div.sec-head', {}, heading('Stories', 'Side A'), h('p.intro', {}, stories.intro)),
      grid,
      h(
        'div.stories-cta',
        {},
        h('a.btn.paper', { href: person.github, target: '_blank', rel: 'noopener' }, icon('github'), stories.more),
      ),
    ),
  );
}
