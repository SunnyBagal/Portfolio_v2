import { trajectory, type Track } from '../content';
import { tonearm } from '../ui/art';
import { sound } from '../ui/audio';
import { watchExposure } from '../ui/chrome';
import { songFor } from '../ui/music';
import { h, heading, icon, rich, svg } from '../ui/dom';
import { renderLed } from '../ui/led';

export function trajectorySection() {
  let current = -1;
  let playing = true;

  const labelText = h('div');
  const label = h('div.label', {}, labelText);
  const record = h('div.record.spinning', {}, label);
  const deck = h(
    'div.deck.playing.reveal',
    {},
    h('div.platter', {}, record),
    h('div.tonearm', {}, svg(tonearm)),
  );

  const playBtn = h('button.deck-btn', { type: 'button' });
  const bpmLed = h('span.led', { style: 'display:flex;gap:2px;height:20px' });
  renderLed(bpmLed, String(trajectory.bpm), '#ff3b3b');
  deck.append(
    h(
      'div.deck-controls',
      {},
      playBtn,
      h('span.bpm', {}, bpmLed, 'BPM'),
      h('span.rpm', {}, '33⅓'),
    ),
  );

  const list = h('ol.tracks.playing-list');
  const buttons = trajectory.tracks.map((t, i) => {
    const btn = h(
      'button.track',
      { type: 'button', 'aria-pressed': 'false' },
      h('span.side', {}, t.side),
      h('span', {}, h('span.name', {}, t.name), h('span.role', {}, t.role)),
      h('span.when', {}, h('span.eq', { 'aria-hidden': 'true' }, h('i'), h('i'), h('i')), rich('span', t.when)),
    );
    btn.addEventListener('click', () => {
      sound.wake();
      select(i);
      setPlaying(true);
    });
    list.append(h('li', {}, btn));
    return btn;
  });

  const liner = h('article.liner.paper', { 'aria-live': 'polite' });

  function fillLiner(t: Track) {
    liner.replaceChildren(
      h('span.tape.red'),
      h('h3.display', {}, t.cardTitle),
      h('p.meta', {}, t.cardMeta),
      h('ul', {}, ...t.bullets.map((b) => rich('li', b))),
    );
  }

  function select(i: number) {
    if (i === current) return;
    current = i;
    const t = trajectory.tracks[i]!;
    buttons.forEach((b, j) => {
      b.classList.toggle('active', j === i);
      b.setAttribute('aria-pressed', String(j === i));
    });
    labelText.replaceChildren(h('small', {}, t.side), h('b', {}, t.name), h('small', {}, rich('span', t.when).textContent ?? ''));
    music();
    liner.classList.add('swap');
    setTimeout(() => {
      fillLiner(t);
      liner.classList.remove('swap');
    }, 180);
  }

  function setPlaying(on: boolean) {
    playing = on;
    deck.classList.toggle('playing', on);
    list.classList.toggle('playing-list', on);
    playBtn.replaceChildren(icon(on ? 'pause' : 'play'), on ? 'Pause' : 'Play');
    music();
  }
  playBtn.addEventListener('click', () => {
    sound.wake();
    setPlaying(!playing);
  });

  // Each track is its own tune; it plays while the deck spins and is on screen.
  function music() {
    const t = trajectory.tracks[current];
    if (playing && isVisible && t) sound.want('deck', songFor(`track:${t.side}`, t.name));
    else sound.release('deck');
  }

  // Only run the beat while the deck is on screen.
  let isVisible = false;
  watchExposure(deck, (exposed) => {
    isVisible = exposed;
    music();
  });

  select(0);
  setPlaying(true);

  return h(
    'section.sec.trajectory',
    { id: 'trajectory', 'data-name': 'Trajectory', 'data-np': 'var(--lime)' },
    h(
      'div.wrap',
      {},
      h('div.sec-head', {}, heading('Trajectory'), rich('p.intro', trajectory.intro)),
      h('div.traj-grid', {}, deck, h('div', {}, list, liner)),
    ),
  );
}
