import type { Inline, Rich } from '../content';

function inline(piece: Inline): Node {
  if (typeof piece === 'string') return document.createTextNode(piece);
  if ('placeholder' in piece) {
    const span = document.createElement('span');
    span.className = 'ph';
    span.title = 'Placeholder: replace in src/content.ts';
    span.textContent = `PLACEHOLDER: ${piece.placeholder}`;
    return span;
  }
  const a = document.createElement('a');
  a.href = piece.href;
  a.textContent = piece.text;
  if (!piece.href.startsWith('mailto:')) {
    a.target = '_blank';
    a.rel = 'noopener';
  }
  return a;
}

/** Renders a Rich value into a new element of the given tag. */
export function rich<K extends keyof HTMLElementTagNameMap>(tag: K, value: Rich, className?: string) {
  const el = document.createElement(tag);
  if (className) el.className = className;
  el.append(...(typeof value === 'string' ? [inline(value)] : value.map(inline)));
  return el;
}
