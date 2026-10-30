// Fixed chrome around the sections: nav with active-section underline, the
// "now playing" pill, back-to-top, the stacked-card scroll effect and reveals.

import { nav, person } from '../content';
import { sound } from './audio';
import { h, icon, reducedMotion } from './dom';

// Elements that care whether they can actually be seen. IntersectionObserver can't tell,
// because a section buried under the sticky stack still "intersects" the viewport.
const watchers: { el: HTMLElement; cb: (exposed: boolean) => void; exposed?: boolean }[] = [];
export function watchExposure(el: HTMLElement, cb: (exposed: boolean) => void) {
  watchers.push({ el, cb });
}

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
  const label = h('small', {}, 'Now playing');
  const el = h('div.now-playing', { 'aria-live': 'polite' }, disc, h('div.np-text', {}, label, name));
  const progress = (k: number) => disc.querySelector<SVGCircleElement>('.np-ring')!.style.setProperty('stroke-dashoffset', String(circ * (1 - k)));

  // Shows the section you're in, or the tune when a disc is spinning.
  let section = 'The Preview';
  let tune: string | undefined;
  const render = () => {
    name.textContent = tune ? `♪ ${tune}` : section;
    el.classList.toggle('tune', !!tune);
  };
  sound.onSong((song) => {
    tune = song?.title;
    render();
  });
  const setSection = (text: string) => {
    section = text;
    render();
  };
  return { el, setSection, progress };
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
  addEventListener('resize', () => {
    measure();
    update();
  });

  // Stuck sticky sections report where they're stuck, not where they sit in the page,
  // so in-page links scroll to the section's flow position instead of trusting the browser.
  const flowTop = (target: HTMLElement) => {
    let y = sections[0]!.parentElement!.getBoundingClientRect().top + scrollY;
    for (const s of sections) {
      if (s === target) return y;
      y += s.offsetHeight;
    }
    return y;
  };
  const go = (id: string, smooth: boolean) => {
    const target = sections.find((s) => s.id === id);
    if (!target) return false;
    scrollTo({ top: flowTop(target), behavior: smooth && !reducedMotion() ? 'smooth' : 'auto' });
    return true;
  };
  document.addEventListener('click', (e) => {
    const a = (e.target as Element).closest<HTMLAnchorElement>('a[href^="#"]');
    if (a && go(a.hash.slice(1), true)) {
      e.preventDefault();
      history.replaceState(null, '', a.hash);
    }
  });
  if (location.hash) requestAnimationFrame(() => go(location.hash.slice(1), false));

  // One overlay per section, faded as the next section slides over it.
  const dims = sections.map((s) => s.appendChild(h('div.dim', { 'aria-hidden': 'true' })));

  let active = '';
  let ticking = false;
  const update = () => {
    ticking = false;
    const vh = innerHeight;
    let current = sections[0]!;
    const rects = sections.map((s) => s.getBoundingClientRect());
    // The last section that fills the whole viewport hides everything stacked beneath it.
    let floor = -1;
    rects.forEach((r, i) => {
      if (r.top <= 1 && r.bottom >= vh - 2) floor = i;
    });
    // For each section, the y below which a later section covers it.
    const coverTop = rects.map((_, i) => Math.min(vh, ...rects.slice(i + 1).map((r) => Math.max(0, r.top))));
    for (const w of watchers) {
      const i = sections.findIndex((s) => s.contains(w.el));
      const r = w.el.getBoundingClientRect();
      const seen = Math.min(r.bottom, coverTop[i] ?? vh) - Math.max(r.top, 0);
      const exposed = seen > Math.min(r.height, vh) * 0.3;
      if (exposed !== w.exposed) {
        w.exposed = exposed;
        w.cb(exposed);
      }
    }

    sections.forEach((s, i) => {
      if (rects[i]!.top <= vh * 0.45) current = s;
      const buried = i < floor;
      if (buried !== s.classList.contains('buried')) s.classList.toggle('buried', buried);
      const next = rects[i + 1];
      const cover = next && !buried ? Math.min(1, Math.max(0, 1 - next.top / vh)) * 0.65 : 0;
      const dim = dims[i]!;
      const value = cover.toFixed(2);
      if (dim.style.opacity !== value) dim.style.opacity = value;
    });

    const navId = current.dataset.nav ?? current.id;
    if (navId !== active) {
      active = navId;
      for (const a of links) a.classList.toggle('active', a.dataset.id === navId);
      np.setSection(current.dataset.name ?? '');
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
