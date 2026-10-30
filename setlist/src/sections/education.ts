import { education } from '../content';
import { recordFront } from '../ui/art';
import { h, heading, icon, rich, svg } from '../ui/dom';

const INK: Record<string, string> = { ink: '#141416', paper: '#f3f0ea', red: '#e3232b' };

export function educationSection() {
  let current = -1;
  const records = education.records;

  const shelf = h('div.crate-records', { role: 'listbox', 'aria-label': 'Records' });
  const vinyls = records.map((r, i) => {
    const ink = INK[r.ink] ?? '#141416';
    const el = h(
      `button.vinyl.hue-${r.hue}.pat-${r.pattern}` as 'button',
      {
        type: 'button',
        role: 'option',
        'aria-label': `${r.year}: ${r.title}`,
        style: `color:${ink};--lean:${i % 3 === 1 ? -2 : i % 3 === 2 ? 1.5 : 0}deg`,
      },
      h('span.front', {}, svg(recordFront(ink)), h('small', {}, r.where)),
      h('span.spine', {}, r.spine),
    );
    el.addEventListener('click', () => select(i));
    shelf.append(el);
    return el;
  });

  const card = h('article.crate-card.paper', { 'aria-live': 'polite' });
  const prev = h('button', { type: 'button' }, icon('arrowLeft'), 'Previous');
  const next = h('button', { type: 'button' }, 'Next', icon('arrow'));
  prev.addEventListener('click', () => select(current - 1));
  next.addEventListener('click', () => select(current + 1));

  function select(i: number) {
    if (i < 0 || i >= records.length || i === current) return;
    current = i;
    const r = records[i]!;
    vinyls.forEach((v, j) => {
      v.classList.toggle('open', j === i);
      v.setAttribute('aria-selected', String(j === i));
    });
    // Keep the pulled record in view inside the crate.
    const v = vinyls[i]!;
    shelf.scrollTo({ left: v.offsetLeft - shelf.clientWidth / 2 + 98, behavior: 'smooth' });

    card.classList.add('swap');
    setTimeout(() => {
      card.replaceChildren(
        h('span.tape'),
        h('span.year', {}, r.year),
        h('h3.display', {}, r.title),
        h('p.where', {}, r.where),
        rich('p', r.body),
        h('div.crate-nav', {}, prev, next),
      );
      prev.disabled = i === 0;
      next.disabled = i === records.length - 1;
      card.classList.remove('swap');
    }, 200);
  }
  select(0);

  return h(
    'section.sec.education',
    { id: 'education', 'data-name': 'Education', 'data-np': 'var(--orange)' },
    h(
      'div.wrap',
      {},
      h(
        'div.sec-head',
        {},
        heading('Education', 'Crates'),
        introEl(),
      ),
      h(
        'div.crate-grid',
        {},
        h('div.crate.reveal', {}, shelf, h('div.crate-box', {}, h('span', {}, education.label))),
        card,
      ),
    ),
  );
}

function introEl() {
  const p = rich('p.intro', education.intro);
  p.prepend(h('span.dig', {}, education.dig));
  return p;
}
