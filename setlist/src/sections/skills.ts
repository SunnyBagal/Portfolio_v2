import { skills, type Sticker } from '../content';
import { h, heading, icon } from '../ui/dom';

/** On narrow screens the board is taller, so the layout is re-flowed into fewer columns. */
function mobilePos(i: number, total: number) {
  const cols = 2;
  const rows = Math.ceil(total / cols);
  const col = i % cols;
  const row = Math.floor(i / cols);
  return { x: 3 + col * 48 + (row % 2 ? 4 : 0), y: 2 + (row / rows) * 90 };
}

export function skillsSection() {
  const board = h('div.board', { 'aria-label': 'Skills board, drag stickers to rearrange' });
  let z = 10;

  const place = (el: HTMLElement, s: Sticker, i: number) => {
    const narrow = matchMedia('(max-width: 640px)').matches;
    const pos = narrow ? mobilePos(i, skills.stickers.length) : s;
    el.style.left = `${pos.x}%`;
    el.style.top = `${pos.y}%`;
    el.style.transform = `rotate(${s.r}deg)`;
  };

  const els = skills.stickers.map((s, i) => {
    const el = h(
      `div.sticker.hue-${s.hue}.shape-${s.shape}.font-${s.font}` as 'div',
      { role: 'listitem', tabindex: 0, style: s.w ? `width:${s.w}px` : undefined },
      s.text,
    );
    place(el, s, i);
    drag(el);
    board.append(el);
    return el;
  });
  board.setAttribute('role', 'list');

  function drag(el: HTMLElement) {
    el.addEventListener('pointerdown', (e) => {
      e.preventDefault();
      el.setPointerCapture(e.pointerId);
      el.classList.add('dragging');
      el.style.zIndex = String(++z);
      const rect = board.getBoundingClientRect();
      const startX = e.clientX;
      const startY = e.clientY;
      const left = el.offsetLeft;
      const top = el.offsetTop;
      const rot = parseFloat(el.style.transform.replace(/[^-\d.]/g, '')) || 0;
      el.style.transform = `rotate(${rot}deg) scale(1.08)`;

      const move = (ev: PointerEvent) => {
        const x = Math.min(Math.max(left + ev.clientX - startX, -20), rect.width - el.offsetWidth + 20);
        const y = Math.min(Math.max(top + ev.clientY - startY, -20), rect.height - el.offsetHeight + 20);
        el.style.left = `${(x / rect.width) * 100}%`;
        el.style.top = `${(y / rect.height) * 100}%`;
      };
      const up = () => {
        el.classList.remove('dragging');
        // A fresh random tilt on every re-stick, like slapping it back down by hand.
        el.style.transform = `rotate(${(Math.random() * 16 - 8).toFixed(1)}deg)`;
        el.removeEventListener('pointermove', move);
        el.removeEventListener('pointerup', up);
        el.removeEventListener('pointercancel', up);
      };
      el.addEventListener('pointermove', move);
      el.addEventListener('pointerup', up);
      el.addEventListener('pointercancel', up);
    });
  }

  const reset = h('button.btn.ghost.small.board-reset', { type: 'button' }, icon('shuffle'), skills.reset);
  reset.addEventListener('click', () => els.forEach((el, i) => place(el, skills.stickers[i]!, i)));

  let wasNarrow = matchMedia('(max-width: 640px)').matches;
  addEventListener('resize', () => {
    const narrow = matchMedia('(max-width: 640px)').matches;
    if (narrow !== wasNarrow) els.forEach((el, i) => place(el, skills.stickers[i]!, i));
    wasNarrow = narrow;
  });

  const fallen = skills.fallen.map((s) =>
    h(
      `div.sticker.fallen.hue-${s.hue}.shape-${s.shape}.font-${s.font}` as 'div',
      { style: `left:${s.x}%;transform:rotate(${s.r}deg);min-height:0;padding:6px 14px`, 'aria-hidden': 'true' },
      s.text,
    ),
  );

  return h(
    'section.sec.skills',
    { id: 'skills', 'data-name': 'Skills', 'data-np': 'var(--pink)' },
    h(
      'div.wrap',
      {},
      h('div.sec-head', {}, h('div', {}, heading('Key skills', 'Skills'), h('p', {}, skills.intro)), reset),
      board,
    ),
    ...fallen,
  );
}
