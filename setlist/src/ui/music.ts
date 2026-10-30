// Generative lo-fi jazz. Every disc on the page hashes to its own tune: key, tempo,
// progression and melody seed. Everything is synthesized, so there is nothing to license.
//
// Voices: Rhodes-style FM electric piano comping rootless voicings, a walking upright bass,
// brushed drums with a swung ride, a soft vibraphone melody and vinyl crackle on top.

export interface Song {
  readonly title: string;
  readonly bpm: number;
  readonly key: number;
  readonly bars: readonly Chord[];
  readonly seed: number;
}

interface Chord {
  /** Semitones above the key. */
  readonly root: number;
  readonly quality: Quality;
}

type Quality = 'maj9' | 'm9' | '13' | '7b9' | 'm7b5' | '7alt' | '69' | 'm11';

/** Upper-structure voicings above the root (no root: the bass has it). */
const VOICING: Record<Quality, number[]> = {
  maj9: [4, 7, 11, 14],
  m9: [3, 7, 10, 14],
  '13': [4, 10, 14, 21],
  '7b9': [4, 10, 13, 19],
  m7b5: [3, 6, 10, 15],
  '7alt': [4, 10, 15, 20],
  '69': [4, 9, 14, 19],
  m11: [3, 10, 14, 17],
};

/** Notes that sound good over each chord, for the melody and bass passing tones. */
const SCALE: Record<Quality, number[]> = {
  maj9: [0, 2, 4, 7, 9, 11],
  m9: [0, 2, 3, 5, 7, 10],
  '13': [0, 2, 4, 7, 9, 10],
  '7b9': [0, 1, 4, 7, 10],
  m7b5: [0, 3, 5, 6, 10],
  '7alt': [0, 1, 3, 4, 8, 10],
  '69': [0, 2, 4, 7, 9],
  m11: [0, 2, 3, 5, 7, 10],
};

const c = (root: number, quality: Quality): Chord => ({ root, quality });

/** Progressions in the lo-fi / jazz-standard idiom (chord changes, not melodies). */
const PROGRESSIONS: Chord[][] = [
  [c(2, 'm9'), c(7, '13'), c(0, 'maj9'), c(9, '7b9')],
  [c(0, 'maj9'), c(9, 'm9'), c(2, 'm9'), c(7, '13')],
  [c(5, 'maj9'), c(4, 'm9'), c(2, 'm9'), c(0, 'maj9')],
  [c(9, 'm9'), c(2, '13'), c(7, 'maj9'), c(0, 'maj9'), c(6, 'm7b5'), c(11, '7alt'), c(4, 'm9'), c(4, 'm9')],
  [c(0, 'm9'), c(5, 'm11'), c(10, '13'), c(3, 'maj9'), c(8, 'maj9'), c(2, 'm7b5'), c(7, '7alt'), c(0, 'm9')],
  [c(0, 'maj9'), c(0, 'maj9'), c(1, 'maj9'), c(1, 'maj9')],
  [c(4, 'm9'), c(9, '13'), c(2, 'maj9'), c(7, '69')],
  [c(0, 'm11'), c(0, 'm11'), c(5, '13'), c(5, '13')],
];

function hash(s: string) {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 16777619);
  return h >>> 0;
}

function rng(seed: number) {
  return () => {
    seed = (seed + 0x6d2b79f5) >>> 0;
    let t = seed;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** The same id always gives the same tune. */
export function songFor(id: string, title: string): Song {
  const h = hash(id);
  return {
    title,
    bpm: 72 + (h % 7) * 3,
    key: (h >>> 3) % 12,
    bars: PROGRESSIONS[(h >>> 7) % PROGRESSIONS.length]!,
    seed: h,
  };
}

const midiHz = (m: number) => 440 * Math.pow(2, (m - 69) / 12);

export class JazzBand {
  private readonly out: GainNode;
  private timer = 0;
  private song?: Song;
  private rand = Math.random;
  private next = 0;
  private step = 0;
  private lastMelody = 72;
  private crackle?: AudioBufferSourceNode;

  constructor(
    private readonly ctx: AudioContext,
    destination: AudioNode,
    private readonly noise: AudioBuffer,
  ) {
    // Warm, slightly dark bus: low-pass plus gentle compression, like a worn record.
    const tone = ctx.createBiquadFilter();
    tone.type = 'lowpass';
    tone.frequency.value = 5200;
    tone.Q.value = 0.4;
    const comp = ctx.createDynamicsCompressor();
    comp.threshold.value = -20;
    comp.ratio.value = 3;
    this.out = ctx.createGain();
    this.out.gain.value = 0;
    this.out.connect(tone).connect(comp).connect(destination);
  }

  get playing() {
    return this.song;
  }

  play(song: Song) {
    if (this.song?.seed === song.seed) return;
    const t = this.ctx.currentTime;
    this.song = song;
    this.rand = rng(song.seed);
    this.step = 0;
    this.next = t + 0.08;
    this.out.gain.cancelScheduledValues(t);
    this.out.gain.setTargetAtTime(0.9, t, 0.25);
    if (!this.timer) this.timer = window.setInterval(() => this.schedule(), 25);
    this.startCrackle();
  }

  stop() {
    if (!this.song) return;
    const t = this.ctx.currentTime;
    this.song = undefined;
    this.out.gain.cancelScheduledValues(t);
    this.out.gain.setTargetAtTime(0, t, 0.3);
    clearInterval(this.timer);
    this.timer = 0;
    this.crackle?.stop(t + 1.5);
    this.crackle = undefined;
  }

  private schedule() {
    const song = this.song;
    if (!song) return;
    const beat = 60 / song.bpm;
    const eighth = beat / 2;
    // 8th-note grid with a triplet swing on the off-beats.
    while (this.next < this.ctx.currentTime + 0.15) {
      const s = this.step;
      const barIndex = Math.floor(s / 8) % song.bars.length;
      const chord = song.bars[barIndex]!;
      const nextChord = song.bars[(barIndex + 1) % song.bars.length]!;
      const inBar = s % 8;
      const swing = inBar % 2 ? eighth * 0.33 : 0;
      const t = this.next + swing;
      const root = song.key + chord.root;

      this.drums(t, inBar, beat);
      if (inBar % 2 === 0) this.bass(t, inBar / 2, root, chord, song.key + nextChord.root, beat);
      this.comp(t, inBar, root, chord, beat);
      this.melody(t, inBar, root, chord, eighth);

      this.next += eighth;
      this.step++;
    }
  }

  // ---- band ----

  private comp(t: number, inBar: number, root: number, chord: Chord, beat: number) {
    // Lazy comping: on 1, sometimes on the and-of-2, sometimes anticipating 4.
    const r = this.rand();
    const hit = inBar === 0 || (inBar === 3 && r < 0.55) || (inBar === 6 && r < 0.3);
    if (!hit) return;
    const base = 48 + (((root % 12) + 12) % 12);
    const notes = VOICING[chord.quality].map((n) => base + n);
    const len = inBar === 0 ? beat * 1.8 : beat * 1.1;
    notes.forEach((n, i) => this.rhodes(t + i * 0.012, midiHz(n > 76 ? n - 12 : n), len, 0.085));
  }

  private bass(t: number, beatInBar: number, root: number, chord: Chord, nextRoot: number, beat: number) {
    const low = 36 + (((root % 12) + 12) % 12);
    const scale = SCALE[chord.quality];
    let note: number;
    if (beatInBar === 0) note = low;
    else if (beatInBar === 3) {
      // Chromatic approach into the next chord's root.
      const target = 36 + (((nextRoot % 12) + 12) % 12);
      note = target + (this.rand() < 0.5 ? -1 : 1);
    } else note = low + scale[Math.floor(this.rand() * scale.length)]!;
    if (note > 52) note -= 12;
    this.upright(t, midiHz(note), beat * 0.92);
  }

  private melody(t: number, inBar: number, root: number, chord: Chord, eighth: number) {
    // Sparse phrases: rests are most of the music.
    if (this.step % 64 < 8) return;
    if (this.rand() > (inBar % 2 ? 0.22 : 0.38)) return;
    const scale = SCALE[chord.quality];
    const candidates: number[] = [];
    for (let o = 60; o <= 84; o += 12) for (const n of scale) candidates.push(o + ((root % 12) + 12) % 12 + n);
    // Step-wise motion from the last note sounds like a person, not a dice roll.
    const near = candidates.filter((n) => Math.abs(n - this.lastMelody) <= 5 && n >= 67 && n <= 86);
    const pool = near.length ? near : candidates.filter((n) => n >= 67 && n <= 86);
    const note = pool[Math.floor(this.rand() * pool.length)]!;
    this.lastMelody = note;
    this.vibes(t, midiHz(note), eighth * (this.rand() < 0.3 ? 3 : 1.6));
  }

  private drums(t: number, inBar: number, beat: number) {
    // Ride: ding, ding-a, ding, ding-a.
    if (inBar % 2 === 0 || inBar === 3 || inBar === 7) this.ride(t, inBar % 4 === 0 ? 0.05 : 0.035);
    if (inBar === 0 || (inBar === 5 && this.rand() < 0.4)) this.kick(t);
    if (inBar === 2 || inBar === 6) this.brush(t, beat);
  }

  // ---- instruments ----

  private rhodes(t: number, f: number, len: number, level: number) {
    const ctx = this.ctx;
    const car = ctx.createOscillator();
    const mod = ctx.createOscillator();
    const modGain = ctx.createGain();
    const amp = ctx.createGain();
    car.frequency.value = f;
    mod.frequency.value = f;
    // The bell of the tine: bright attack, mellowing fast.
    modGain.gain.setValueAtTime(f * 1.4, t);
    modGain.gain.exponentialRampToValueAtTime(f * 0.08, t + 0.4);
    mod.connect(modGain).connect(car.frequency);
    amp.gain.setValueAtTime(0, t);
    amp.gain.linearRampToValueAtTime(level, t + 0.008);
    amp.gain.exponentialRampToValueAtTime(level * 0.35, t + 0.5);
    amp.gain.exponentialRampToValueAtTime(0.0001, t + len + 0.4);
    // Tremolo.
    const trem = ctx.createOscillator();
    const tremGain = ctx.createGain();
    trem.frequency.value = 4.2;
    tremGain.gain.value = level * 0.18;
    trem.connect(tremGain).connect(amp.gain);
    car.connect(amp).connect(this.out);
    for (const o of [car, mod, trem]) {
      o.start(t);
      o.stop(t + len + 0.45);
    }
  }

  private upright(t: number, f: number, len: number) {
    const ctx = this.ctx;
    const osc = ctx.createOscillator();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(f * 1.02, t);
    osc.frequency.exponentialRampToValueAtTime(f, t + 0.04);
    const lp = ctx.createBiquadFilter();
    lp.type = 'lowpass';
    lp.frequency.setValueAtTime(900, t);
    lp.frequency.exponentialRampToValueAtTime(260, t + 0.25);
    const amp = ctx.createGain();
    amp.gain.setValueAtTime(0, t);
    amp.gain.linearRampToValueAtTime(0.42, t + 0.012);
    amp.gain.exponentialRampToValueAtTime(0.16, t + 0.18);
    amp.gain.exponentialRampToValueAtTime(0.0001, t + len);
    osc.connect(lp).connect(amp).connect(this.out);
    osc.start(t);
    osc.stop(t + len + 0.05);
  }

  private vibes(t: number, f: number, len: number) {
    const ctx = this.ctx;
    const amp = ctx.createGain();
    amp.gain.setValueAtTime(0, t);
    amp.gain.linearRampToValueAtTime(0.07, t + 0.005);
    amp.gain.exponentialRampToValueAtTime(0.0001, t + len + 0.8);
    const trem = ctx.createOscillator();
    const tremGain = ctx.createGain();
    trem.frequency.value = 5.5;
    tremGain.gain.value = 0.025;
    trem.connect(tremGain).connect(amp.gain);
    const partials = [
      [1, 1],
      [4, 0.18],
      [10, 0.04],
    ] as const;
    const oscs = partials.map(([ratio, gain]) => {
      const o = ctx.createOscillator();
      o.frequency.value = f * ratio;
      const g = ctx.createGain();
      g.gain.setValueAtTime(gain, t);
      g.gain.exponentialRampToValueAtTime(0.0001, t + (ratio === 1 ? len + 0.8 : 0.25));
      o.connect(g).connect(amp);
      return o;
    });
    amp.connect(this.out);
    for (const o of [...oscs, trem]) {
      o.start(t);
      o.stop(t + len + 0.9);
    }
  }

  private kick(t: number) {
    const ctx = this.ctx;
    const osc = ctx.createOscillator();
    const g = ctx.createGain();
    osc.frequency.setValueAtTime(95, t);
    osc.frequency.exponentialRampToValueAtTime(45, t + 0.12);
    g.gain.setValueAtTime(0.32, t);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 0.3);
    osc.connect(g).connect(this.out);
    osc.start(t);
    osc.stop(t + 0.32);
  }

  private brush(t: number, beat: number) {
    // A slow swish: noise swelling in, not a crack.
    const ctx = this.ctx;
    const src = ctx.createBufferSource();
    src.buffer = this.noise;
    const bp = ctx.createBiquadFilter();
    bp.type = 'bandpass';
    bp.frequency.value = 3200;
    bp.Q.value = 0.7;
    const g = ctx.createGain();
    g.gain.setValueAtTime(0, t);
    g.gain.linearRampToValueAtTime(0.09, t + 0.03);
    g.gain.exponentialRampToValueAtTime(0.0001, t + beat * 0.7);
    src.connect(bp).connect(g).connect(this.out);
    src.start(t, this.rand() * 0.5, beat);
  }

  private ride(t: number, level: number) {
    const ctx = this.ctx;
    const src = ctx.createBufferSource();
    src.buffer = this.noise;
    const hp = ctx.createBiquadFilter();
    hp.type = 'highpass';
    hp.frequency.value = 7500;
    const g = ctx.createGain();
    g.gain.setValueAtTime(level, t);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 0.32);
    src.connect(hp).connect(g).connect(this.out);
    src.start(t, this.rand() * 0.5, 0.35);
    // A bit of bell so it reads as a cymbal, not hiss.
    const bell = ctx.createOscillator();
    bell.type = 'square';
    bell.frequency.value = 5120;
    const bg = ctx.createGain();
    bg.gain.setValueAtTime(level * 0.06, t);
    bg.gain.exponentialRampToValueAtTime(0.0001, t + 0.2);
    bell.connect(bg).connect(this.out);
    bell.start(t);
    bell.stop(t + 0.22);
  }

  private startCrackle() {
    if (this.crackle) return;
    const ctx = this.ctx;
    // Sparse pops over a faint hiss, looped.
    const len = ctx.sampleRate * 4;
    const buf = ctx.createBuffer(1, len, ctx.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < len; i++) {
      data[i] = (Math.random() * 2 - 1) * 0.006;
      if (Math.random() < 0.0004) {
        const amp = Math.random() * 0.5 + 0.1;
        for (let k = 0; k < 40 && i + k < len; k++) data[i + k] += (Math.random() * 2 - 1) * amp * Math.exp(-k / 6);
      }
    }
    const src = ctx.createBufferSource();
    src.buffer = buf;
    src.loop = true;
    const hp = ctx.createBiquadFilter();
    hp.type = 'highpass';
    hp.frequency.value = 1200;
    const g = ctx.createGain();
    g.gain.value = 0.5;
    src.connect(hp).connect(g).connect(this.out);
    src.start();
    this.crackle = src;
  }
}
