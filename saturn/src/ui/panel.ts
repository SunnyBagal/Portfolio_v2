import { kindLabel, stories, type Rich, type Story } from '../content';
import { rich } from './rich';

/** The story panel: a right-hand sidebar on desktop, a bottom sheet on phones (see style.css). */
export function createPanel(handlers: { onBack: () => void; onOpenStory: (id: string) => void }) {
  const el = document.getElementById('panel')!;
  const kind = el.querySelector<HTMLElement>('.panel-kind')!;
  const title = el.querySelector<HTMLElement>('.panel-title')!;
  const facts = el.querySelector<HTMLElement>('.facts')!;
  const body = el.querySelector<HTMLElement>('.panel-body')!;
  const rawToggle = el.querySelector<HTMLButtonElement>('.raw-toggle')!;
  el.querySelector('.back')!.addEventListener('click', handlers.onBack);

  let story: Story | null = null;
  let showRaw = false;
  el.inert = true;

  const section = (heading: string, paragraphs: readonly Rich[], className = '') => {
    const s = document.createElement('section');
    s.className = `panel-section ${className}`;
    const h = document.createElement('h3');
    h.textContent = heading;
    s.append(h, ...paragraphs.map((p) => rich('p', p)));
    return s;
  };

  function render() {
    if (!story) return;
    kind.textContent = kindLabel(story);
    kind.dataset.kind = story.kind;
    title.textContent = story.title;
    facts.replaceChildren(...story.facts.map((f) => rich('li', f)));
    rawToggle.setAttribute('aria-pressed', String(showRaw));

    if (showRaw) {
      const note = document.createElement('p');
      note.className = 'raw-note';
      note.textContent = 'The raw voice transcript this section was built from.';
      body.replaceChildren(note, section('Raw dictation', story.rawDictation, 'is-raw'));
      return;
    }

    const h = story.headings ?? {};
    const parts = [section(h.summary ?? 'Summary', story.summary)];
    if (story.whatHappened) parts.push(section(h.whatHappened ?? 'What happened', story.whatHappened));
    if (story.whatChanged) parts.push(section(h.whatChanged ?? 'What changed', story.whatChanged));

    const related = story.related && stories.find((s) => s.id === story!.related);
    if (related) {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'related';
      btn.innerHTML = '<span>Read next</span>';
      btn.append(related.title, ' →');
      btn.addEventListener('click', () => handlers.onOpenStory(related.id));
      parts.push(btn);
    }
    body.replaceChildren(...parts);
  }

  rawToggle.addEventListener('click', () => {
    showRaw = !showRaw;
    render();
  });

  return {
    el,
    get isOpen() {
      return story !== null;
    },
    open(next: Story) {
      story = next;
      showRaw = false;
      render();
      el.scrollTop = 0;
      el.inert = false;
      el.classList.add('is-open');
      el.setAttribute('aria-hidden', 'false');
      title.focus({ preventScroll: true });
    },
    close() {
      story = null;
      el.classList.remove('is-open');
      el.setAttribute('aria-hidden', 'true');
      el.inert = true;
    },
  };
}
