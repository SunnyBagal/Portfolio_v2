import { contact, footer, nav, person } from '../content';
import { h, icon, rich } from '../ui/dom';
import { graffitiWall } from '../ui/graffiti';

export function contactSection() {
  const copy = h('button.btn.ghost', { type: 'button' }, icon('copy'), contact.copy);
  copy.addEventListener('click', async () => {
    try {
      await navigator.clipboard.writeText(person.email);
      copy.lastChild!.textContent = contact.copied;
    } catch {
      location.href = `mailto:${person.email}`;
    }
    setTimeout(() => (copy.lastChild!.textContent = contact.copy), 1800);
  });

  const title = h('h2.display');
  contact.lines.forEach((line, i) => {
    if (i) title.append(h('br'));
    for (const part of line) title.append(part.script ? h('span.marker', {}, part.t) : part.t);
  });

  const left = h(
    'div.reveal',
    {},
    title,
    rich('p.lede', contact.body),
    h('a.big-mail', { href: `mailto:${person.email}` }, person.email),
    h(
      'div.contact-ctas',
      {},
      copy,
      h('a.btn.green', { href: person.github, target: '_blank', rel: 'noopener' }, icon('github'), person.githubLabel),
    ),
    h(
      'div.contact-links',
      {},
      h('span.link-u', {}, icon('pin'), `${person.location} · open to Bangalore`),
      h('span.link-u', {}, icon('download'), rich('span', [person.cv])),
    ),
  );

  return h(
    'section.sec.contact',
    { id: 'contact', 'data-name': 'Contact', 'data-np': 'var(--green)' },
    h('div.wrap.contact-grid', {}, left, graffitiWall()),
    footerEl(),
  );
}

function footerEl() {
  return h(
    'footer.footer',
    {},
    h(
      'div.wrap',
      {},
      h(
        'div.foot-grid',
        {},
        h('div', {}, h('a.logo', { href: '#preview' }, person.handle), h('p.blurb', {}, footer.blurb)),
        h(
          'div',
          {},
          h('h4', {}, footer.setlist),
          h('ul', {}, ...nav.map((n) => h('li', {}, h('a', { href: `#${n.id}` }, n.label)))),
        ),
        h(
          'div',
          {},
          h('h4', {}, footer.talk),
          h(
            'ul',
            {},
            h('li', {}, h('a', { href: `mailto:${person.email}` }, icon('mail'), person.email)),
            h('li', {}, h('a', { href: person.github, target: '_blank', rel: 'noopener' }, icon('github'), 'GitHub')),
            h('li', {}, h('a', { href: 'https://linea.sunnybagal.com', target: '_blank', rel: 'noopener' }, icon('arrow'), 'Linea')),
            h('li', {}, h('a', { href: 'https://recall.sunnybagal.com', target: '_blank', rel: 'noopener' }, icon('arrow'), 'Recall')),
          ),
        ),
      ),
      h(
        'div.foot-bottom',
        {},
        h('span', {}, footer.copyright),
        h('a', { href: '#preview' }, `${footer.top} ↑`),
      ),
    ),
  );
}
