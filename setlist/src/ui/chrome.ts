// Fixed chrome around the sections: nav with active-section underline, the
// "now playing" pill, back-to-top, the stacked-card scroll effect and reveals.

import { nav, person } from '../content';
import { sound } from './audio';
import { h, icon } from './dom';

export function navBar() {
  const links = nav.map((n) => h('a', { href: `#${n.id}`, 'data-id': n.id }, n.label));
  const soundBtn = h('button.round', { type: 'button', 'aria-label': 'Sound', 'aria-pressed': 'false' }, icon('speakerOff'));
  soundBtn.addEventListener('click', () => sound.toggle());
  sound.onChange((on) => {
    soundBtn.setAttribute('aria-pressed', String(on));
    soundBtn.replaceChildren(icon(on ? 'speakerOn' : 'speakerOff'));
  });

  const menu = h('button.round.menu-btn', { type: 'button', 'aria-label': 'Menu', 'aria-expanded': 'false' }, icon('menu'));
  const bar = h(
    'header.nav',
    {},
    h('a.logo', { href: '#preview', 'aria-label': `${person.name}, home` }, person.handle),
    h('ul.nav-links', {}, ...links.map((a) => h('li', {}, a))),
    h(
      'div.nav-right',
      {},
      soundBtn,
      h('a.btn.green', { href: person.github, target: '_blank', rel: 'noopener', 'aria-label': 'GitHub' }, icon('github'), h('span', {}, 'GitHub')),
      menu,
    ),
  );
  menu.addEventListener('click', () => {
    const open = bar.classList.toggle('open');
    menu.setAttribute('aria-expanded', String(open));
  });
  for (const a of links) a.addEventListener('click', () => bar.classList.remove('open'));
  return { bar, links };
}

export function nowPlaying() {
  const R = 20;
  const circ = 2 * Math.PI * R;
  const ring = `<svg viewBox="0 0 44 44" aria-hidden="true"><circle cx="22" cy="22" r="${R}" fill="none" stroke="#2a2a2e" stroke-width="2.5"/><circle class="np-ring" cx="22" cy="22" r="${R}" fill="none" stroke="var(--np, var(--lime))" stroke-width="2.5" stroke-linecap="round" stroke-dasharray="${circ}" stroke-dashoffset="${circ}"/></svg>`;
  const disc = h('div.np-disc');
  disc.innerHTML = ring;
  disc.append(h('div.core'));
  const name = h('b', {}, 'The Preview');
  const el = h('div.now-playing', { 'aria-live': 'polite' }, disc, h('div.np-text', {}, h('small', {}, 'Now playing'), name));
  const progress = (k: number) => disc.querySelector<SVGCircleElement>('.np-ring')!.style.setProperty('stroke-dashoffset', String(circ * (1 - k)));
  return { el, name, progress };
}

export function wireChrome(sections: HTMLElement[], links: HTMLAnchorElement[], np: ReturnType<typeof nowPlaying>) {
  const toTop = h('a.to-top', { href: '#preview', 'aria-label': 'Back to top' }, icon('up'));
  document.body.append(np.el, toTop);

  // Tall sections stick by their bottom edge so the next one slides over them.
  const measure = () => {
    for (const s of sections) s.style.setProperty('--stick', `${Math.min(0, innerHeight - s.offsetHeight)}px`);
  };
  measure();
  new ResizeObserver(measure).observe(document.body);
  addEventListener('resize', measure);

  let active = '';
  let ticking = false;
  const update = () => {
    ticking = false;
    const vh = innerHeight;
    let current = sections[0]!;
    sections.forEach((s, i) => {
      const next = sections[i + 1];
      const top = s.getBoundingClientRect().top;
      if (top <= vh * 0.45) current = s;
      const cover = next ? Math.min(1, Math.max(0, 1 - next.getBoundingClientRect().top / vh)) : 0;
      s.style.setProperty('--cover', (cover * 0.65).toFixed(3));
    });

    const navId = current.dataset.nav ?? current.id;
    if (navId !== active) {
      active = navId;
      for (const a of links) a.classList.toggle('active', a.dataset.id === navId);
      np.name.textContent = current.dataset.name ?? '';
      np.el.style.setProperty('--np', current.dataset.np ?? 'var(--lime)');
    }

    const max = document.documentElement.scrollHeight - vh;
    np.progress(max > 0 ? scrollY / max : 0);
    toTop.classList.toggle('show', scrollY > vh * 0.8);
  };
  addEventListener(
    'scroll',
    () => {
      if (!ticking) requestAnimationFrame(update);
      ticking = true;
    },
    { passive: true },
  );
  update();

  const io = new IntersectionObserver(
    (entries) => {
      for (const e of entries) {
        if (!e.isIntersecting) continue;
        e.target.classList.add('in');
        io.unobserve(e.target);
      }
    },
    { rootMargin: '0px 0px -8% 0px' },
  );
  document.querySelectorAll('.reveal').forEach((el) => io.observe(el));
}
