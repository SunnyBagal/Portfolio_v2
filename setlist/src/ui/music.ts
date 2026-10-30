// Generative lo-fi jazz. Every section and every disc has its own tune, written in
// content.ts as chord changes plus a feel (groove), a lead instrument and a tempo.
// Everything is synthesized, so there is nothing to license.
//
// Grooves: swing, boom-bap, bossa, ballad and ambient, each with its own drums, bass line
// and comping. The lead plays a two-bar motif generated from the tune's id, then a
// variation, an answer and a rest, so tunes sound composed rather than rolled.

import type { Tune } from '../content';

export type Feel = 'swing' | 'boombap' | 'bossa' | 'ballad' | 'ambient';
export type Lead = 'vibes' | 'horn' | 'flute' | 'keys';

export interface Song {
  readonly id: string;
  readonly title: string;
  readonly bpm: number;
  readonly feel: Feel;
  readonly lead: Lead;
  /** Each bar holds one chord, or two (split at beat 3). */
  readonly bars: readonly (readonly Chord[])[];
  readonly density: number;
  readonly tone: number;
  readonly crackle: number;
  readonly seed: number;
}

interface Chord {
  readonly root: number;
  readonly quality: Quality;
}

type Quality = 'maj7' | 'maj9' | 'maj7#11' | '69' | 'm7' | 'm9' | 'm11' | 'm6' | 'm7b5' | '9' | '13' | '7b9' | '7#9' | '7alt' | '9sus4';

/** Upper-structure voicings above the root (no root: the bass has it). */
const VOICING: Record<Quality, number[]> = {
  maj7: [4, 7, 11, 16],
  maj9: [4, 7, 11, 14],
  'maj7#11': [4, 11, 14, 18],
  '69': [4, 9, 14, 19],
  m7: [3, 7, 10, 15],
  m9: [3, 7, 10, 14],
  m11: [3, 10, 14, 17],
  m6: [3, 9, 14, 19],
  m7b5: [3, 6, 10, 15],
  '9': [4, 10, 14, 19],
  '13': [4, 10, 14, 21],
  '7b9': [4, 10, 13, 19],
  '7#9': [4, 10, 15, 19],
  '7alt': [4, 10, 15, 20],
  '9sus4': [5, 10, 14, 19],
};

/** The scale each chord implies, for melody and passing tones. */
const SCALE: Record<Quality, number[]> = {
  maj7: [0, 2, 4, 7, 9, 11],
  maj9: [0, 2, 4, 7, 9, 11],
  'maj7#11': [0, 2, 4, 6, 7, 9, 11],
  '69': [0, 2, 4, 7, 9],
  m7: [0, 2, 3, 5, 7, 10],
  m9: [0, 2, 3, 5, 7, 10],
  m11: [0, 2, 3, 5, 7, 10],
  m6: [0, 2, 3, 5, 7, 9],
  m7b5: [0, 3, 5, 6, 10],
  '9': [0, 2, 4, 7, 9, 10],
  '13': [0, 2, 4, 7, 9, 10],
  '7b9': [0, 1, 4, 7, 10],
  '7#9': [0, 3, 4, 7, 10],
  '7alt': [0, 1, 3, 4, 8, 10],
  '9sus4': [0, 2, 5, 7, 9, 10],
};

const ALIASES: Record<string, Quality> = { sus: '9sus4', '': 'maj7', m: 'm7', '7': '9' };
const NOTE: Record<string, number> = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 };

/** "Dm9 G13 | Cmaj9 | A7b9" → bars of chords. */
function parseChanges(changes: string): Chord[][] {
  return changes.split('|').map((bar) =>
    bar
      .trim()
      .split(/\s+/)
      .map((name) => {
        const m = /^([A-G])([#b]?)(.*)$/.exec(name);
        if (!m) throw new Error(`Bad chord "${name}"`);
        const root = (NOTE[m[1]!]! + (m[2] === '#' ? 1 : m[2] === 'b' ? -1 : 0) + 12) % 12;
        const quality = (ALIASES[m[3]!] ?? m[3]) as Quality;
        if (!VOICING[quality]) throw new Error(`Unknown chord quality "${m[3]}" in "${name}"`);
        return { root, quality };
      }),
  );
}

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

const songs = new Map<string, Song>();

/** Builds (once) the playable song for a tune written in content.ts. */
export function songFrom(id: string, tune: Tune): Song {
  let song = songs.get(id);
  if (!song) {
    song = {
      id,
      title: tune.title,
      bpm: tune.bpm,
      feel: tune.feel,
      lead: tune.lead,
      bars: parseChanges(tune.changes),
      density: tune.density ?? 0.4,
      tone: tune.tone ?? 5200,
      crackle: tune.crackle ?? 0.5,
      seed: hash(id),
    };
    songs.set(id, song);
  }
  return song;
}

const SWING: Record<Feel, number> = { swing: 0.33, boombap: 0.24, bossa: 0, ballad: 0.3, ambient: 0 };
/** Evens out loudness: grooves without drums need a lift to sit beside the others. */
const LEVEL: Record<Feel, number> = { swing: 0.9, boombap: 0.85, bossa: 0.85, ballad: 1.25, ambient: 2.2 };
const LEAD_CENTER: Record<Lead, number> = { vibes: 74, horn: 67, flute: 77, keys: 72 };

const midiHz = (m: number) => 440 * Math.pow(2, (m - 69) / 12);
const pc = (n: number) => ((n % 12) + 12) % 12;

/** A two-bar motif: for each eighth, a scale step relative to the phrase's anchor, or a rest. */
function makeMotif(rand: () => number, density: number) {
  const motif: (number | null)[] = [];
  let degree = 0;
  for (let i = 0; i < 16; i++) {
    const strong = i % 2 === 0;
    const p = density * (strong ? 1 : 0.6) * (i >= 12 ? 0.5 : 1);
    if (rand() < p) {
      degree += Math.round((rand() - 0.5) * 4);
      degree = Math.max(-4, Math.min(5, degree));
      motif.push(degree);
    } else motif.push(null);
  }
  // Every phrase starts by saying something.
  if (motif[0] === null) motif[0] = 0;
  return motif;
}

export class JazzBand {
  private readonly out: GainNode;
  private readonly tone: BiquadFilterNode;
  private readonly crackleGain: GainNode;
  private timer = 0;
  private song?: Song;
  private rand = Math.random;
  private next = 0;
  private step = 0;
  private motifs: (number | null)[][] = [];
  private crackle?: AudioBufferSourceNode;

  constructor(
    private readonly ctx: AudioContext,
    destination: AudioNode,
    private readonly noise: AudioBuffer,
  ) {
    // Warm, slightly dark bus: low-pass plus gentle compression, like a worn record.
    this.tone = ctx.createBiquadFilter();
    this.tone.type = 'lowpass';
    this.tone.frequency.value = 5200;
    this.tone.Q.value = 0.4;
    const comp = ctx.createDynamicsCompressor();
    comp.threshold.value = -20;
    comp.ratio.value = 3;
    this.out = ctx.createGain();
    this.out.gain.value = 0;
    this.out.connect(this.tone).connect(comp).connect(destination);
    this.crackleGain = ctx.createGain();
    this.crackleGain.gain.value = 0;
    this.crackleGain.connect(destination);
  }

  get playing() {
    return this.song;
  }

  play(song: Song) {
    if (this.song?.id === song.id) return;
    const t = this.ctx.currentTime;
    const switching = !!this.song;
    this.song = song;
    this.rand = rng(song.seed);
    const motifRand = rng(song.seed ^ 0x9e3779b9);
    this.motifs = [makeMotif(motifRand, song.density), makeMotif(motifRand, song.density)];
    this.step = 0;
    // Crossfade: dip the band, swap tunes under the dip, bring it back.
    const start = t + (switching ? 0.45 : 0.08);
    this.next = start;
    const g = this.out.gain;
    g.cancelScheduledValues(t);
    g.setValueAtTime(g.value, t);
    if (switching) g.setTargetAtTime(0, t, 0.1);
    g.setTargetAtTime(LEVEL[song.feel], start, 0.3);
    this.tone.frequency.setTargetAtTime(song.tone, start, 0.4);
    this.crackleGain.gain.setTargetAtTime(song.crackle * 0.45, start, 0.4);
    if (!this.timer) this.timer = window.setInterval(() => this.schedule(), 25);
    this.startCrackle();
  }

  stop() {
    if (!this.song) return;
    const t = this.ctx.currentTime;
    this.song = undefined;
    this.out.gain.cancelScheduledValues(t);
    this.out.gain.setTargetAtTime(0, t, 0.3);
    this.crackleGain.gain.setTargetAtTime(0, t, 0.3);
    clearInterval(this.timer);
    this.timer = 0;
  }

  private chordAt(bar: number, inBar: number) {
    const chords = this.song!.bars[bar % this.song!.bars.length]!;
    return chords.length > 1 && inBar >= 4 ? chords[1]! : chords[0]!;
  }

  private schedule() {
    const song = this.song;
    if (!song) return;
    const beat = 60 / song.bpm;
    const eighth = beat / 2;
    while (this.next < this.ctx.currentTime + 0.15) {
      const s = this.step;
      const bar = Math.floor(s / 8);
      const inBar = s % 8;
      const t = this.next + (inBar % 2 ? eighth * SWING[song.feel] : 0);
      const chord = this.chordAt(bar, inBar);
      // The chord the bass walks toward: next half-bar change, or next bar.
      const ahead = inBar < 4 && this.song!.bars[bar % song.bars.length]!.length > 1 ? this.chordAt(bar, 4) : this.chordAt(bar + 1, 0);

      this.drums(song.feel, t, bar, inBar, beat);
      this.bass(song.feel, t, inBar, chord, ahead, beat);
      this.comp(song.feel, t, bar, inBar, chord, beat);
      this.melody(song, t, bar, inBar, chord, eighth);

      this.next += eighth;
      this.step++;
    }
  }

  // ---- arrangement per feel ----

  private drums(feel: Feel, t: number, bar: number, inBar: number, beat: number) {
    const r = this.rand();
    switch (feel) {
      case 'swing':
        if (inBar % 2 === 0 || inBar === 3 || inBar === 7) this.ride(t, inBar % 4 === 0 ? 0.05 : 0.035);
        if (inBar === 0 || (inBar === 5 && r < 0.4)) this.kick(t, 0.32);
        if (inBar === 2 || inBar === 6) this.brush(t, beat * 0.7, 0.09);
        break;
      case 'boombap': {
        const kicks = bar % 2 ? [0, 5, 7] : [0, 3, 5];
        if (kicks.includes(inBar) && (inBar === 0 || r < 0.85)) this.kick(t, inBar === 0 ? 0.55 : 0.4);
        if (inBar === 2 || inBar === 6) this.snare(t, 0.3);
        this.hat(t, inBar % 2 ? 0.025 : 0.045, inBar === 7 && bar % 4 === 3 ? 0.25 : 0.05);
        break;
      }
      case 'bossa': {
        const two = (bar % 2) * 8 + inBar;
        if ([0, 3, 6, 10, 12].includes(two)) this.rim(t);
        if ([0, 3, 4, 7].includes(inBar)) this.kick(t, inBar % 4 === 0 ? 0.3 : 0.18);
        this.shaker(t, inBar % 2 ? 0.035 : 0.02);
        break;
      }
      case 'ballad':
        if (inBar === 0) this.brush(t, beat * 4, 0.035);
        if (inBar === 2 || inBar === 6) this.brush(t, beat * 0.5, 0.05);
        if (inBar === 0) this.kick(t, 0.18);
        if (inBar % 2 === 0) this.ride(t, 0.018);
        break;
      case 'ambient':
        if (inBar === 0 && bar % 2 === 0) this.ride(t, 0.012);
        break;
    }
  }

  private bass(feel: Feel, t: number, inBar: number, chord: Chord, ahead: Chord, beat: number) {
    const low = 36 + chord.root;
    const fifth = low + 7;
    const scale = SCALE[chord.quality];
    const approach = () => 36 + ahead.root + (this.rand() < 0.5 ? -1 : 1);
    let note: number | null = null;
    let len = beat * 0.92;
    switch (feel) {
      case 'swing':
        if (inBar % 2) return;
        if (inBar === 0 || inBar === 4) note = inBar === 0 ? low : low + scale[Math.floor(this.rand() * scale.length)]!;
        else if (inBar === 6) note = approach();
        else note = low + scale[Math.floor(this.rand() * scale.length)]!;
        break;
      case 'boombap':
        if (inBar === 0) [note, len] = [low, beat * 1.6];
        else if (inBar === 3) [note, len] = [this.rand() < 0.5 ? low + 12 : fifth, beat * 0.4];
        else if (inBar === 5) [note, len] = [low, beat * 0.8];
        else if (inBar === 7 && this.rand() < 0.5) [note, len] = [approach(), beat * 0.4];
        break;
      case 'bossa':
        if (inBar === 0 || inBar === 7) [note, len] = [inBar === 0 ? low : approach(), beat * 0.9];
        else if (inBar === 3 || inBar === 4) [note, len] = [fifth, beat * 0.45];
        break;
      case 'ballad':
        if (inBar === 0) [note, len] = [low, beat * 1.9];
        else if (inBar === 4) [note, len] = [this.rand() < 0.6 ? fifth : low + scale[2]!, beat * 1.9];
        break;
      case 'ambient':
        if (inBar === 0) [note, len] = [low, beat * 3.9];
        break;
    }
    if (note === null) return;
    while (note > 52) note -= 12;
    while (note < 33) note += 12;
    this.upright(t, midiHz(note), len, feel === 'ambient' ? 0.3 : 0.42);
  }

  private comp(feel: Feel, t: number, bar: number, inBar: number, chord: Chord, beat: number) {
    const base = 48 + chord.root;
    const notes = VOICING[chord.quality].map((n) => (base + n > 77 ? base + n - 12 : base + n));
    const r = this.rand();
    const play = (len: number, level: number, roll = 0.012) => notes.forEach((n, i) => this.rhodes(t + i * roll, midiHz(n), len, level));
    switch (feel) {
      case 'swing':
        if (inBar === 0 || (inBar === 3 && r < 0.55) || (inBar === 6 && r < 0.3)) play(inBar === 0 ? beat * 1.8 : beat * 1.1, 0.085);
        break;
      case 'boombap':
        if (inBar === 0) play(beat * 1.7, 0.09, 0.02);
        else if ((inBar === 5 && r < 0.7) || (inBar === 3 && r < 0.25)) play(beat * 0.45, 0.07);
        break;
      case 'bossa': {
        const hits = bar % 2 ? [1, 4, 6] : [0, 3, 6];
        if (hits.includes(inBar)) play(beat * 0.55, 0.07, 0.006);
        break;
      }
      case 'ballad':
        if (inBar === 0) play(beat * 3.8, 0.08, 0.06);
        break;
      case 'ambient':
        if (inBar === 0) play(beat * 4, 0.05, 0.12);
        if (inBar % 2 === 0) this.rhodes(t, midiHz(notes[(inBar / 2 + bar) % notes.length]! + 12), beat * 1.5, 0.035);
        break;
    }
  }

  private melody(song: Song, t: number, bar: number, inBar: number, chord: Chord, eighth: number) {
    // Eight-bar plan: motif, motif varied, answer, rest. The first two bars are an intro.
    if (bar < 2) return;
    const phrase = Math.floor((bar - 2) / 2) % 4;
    if (phrase === 3) return;
    const motif = phrase === 2 ? this.motifs[1]! : this.motifs[0]!;
    const idx = ((bar - 2) % 2) * 8 + inBar;
    let degree = motif[idx];
    if (degree === null || degree === undefined) return;
    if (phrase === 1 && idx >= 8) degree += 1;

    // Place the degree on the current chord's scale around the lead's register.
    const center = LEAD_CENTER[song.lead];
    const scale = SCALE[chord.quality];
    const notes: number[] = [];
    for (let o = center - 24; o <= center + 24; o += 12) for (const n of scale) notes.push(o - pc(o) + pc(chord.root + n));
    notes.sort((a, b) => a - b);
    let anchor = 0;
    for (let i = 0; i < notes.length; i++) if (Math.abs(notes[i]! - center) < Math.abs(notes[anchor]! - center)) anchor = i;
    const note = notes[Math.max(0, Math.min(notes.length - 1, anchor + degree))]!;

    // Hold until the motif's next note (at most a bar).
    let hold = 1;
    while (hold < 8 && motif[idx + hold] === null && idx + hold < 16) hold++;
    const len = eighth * Math.max(1, hold) * 0.95;
    const f = midiHz(note);
    switch (song.lead) {
      case 'vibes':
        return this.vibes(t, f, len);
      case 'horn':
        return this.horn(t, f, len);
      case 'flute':
        return this.flute(t, f, len);
      case 'keys':
        return this.rhodes(t, f, len, 0.11);
    }
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

  private upright(t: number, f: number, len: number, level: number) {
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
    amp.gain.linearRampToValueAtTime(level, t + 0.012);
    amp.gain.exponentialRampToValueAtTime(level * 0.4, t + 0.18);
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
    const oscs = (
      [
        [1, 1],
        [4, 0.18],
        [10, 0.04],
      ] as const
    ).map(([ratio, gain]) => {
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

  /** A Harmon-muted trumpet: buzzy saw through a tight resonant filter, late vibrato. */
  private horn(t: number, f: number, len: number) {
    const ctx = this.ctx;
    const osc = ctx.createOscillator();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(f * 0.985, t);
    osc.frequency.linearRampToValueAtTime(f, t + 0.06);
    const vib = ctx.createOscillator();
    const vibGain = ctx.createGain();
    vib.frequency.value = 5.2;
    vibGain.gain.setValueAtTime(0, t);
    vibGain.gain.linearRampToValueAtTime(f * 0.008, t + Math.min(len, 0.5));
    vib.connect(vibGain).connect(osc.frequency);
    const bp = ctx.createBiquadFilter();
    bp.type = 'bandpass';
    bp.frequency.value = Math.min(2400, f * 2.2);
    bp.Q.value = 2.2;
    const lp = ctx.createBiquadFilter();
    lp.type = 'lowpass';
    lp.frequency.value = 2600;
    const amp = ctx.createGain();
    amp.gain.setValueAtTime(0, t);
    amp.gain.linearRampToValueAtTime(0.13, t + 0.05);
    amp.gain.setTargetAtTime(0.09, t + 0.06, 0.15);
    amp.gain.setTargetAtTime(0, t + len, 0.06);
    osc.connect(bp).connect(lp).connect(amp).connect(this.out);
    for (const o of [osc, vib]) {
      o.start(t);
      o.stop(t + len + 0.4);
    }
  }

  /** A breathy flute: sine plus a touch of octave, band-passed air, gentle vibrato. */
  private flute(t: number, f: number, len: number) {
    const ctx = this.ctx;
    const amp = ctx.createGain();
    amp.gain.setValueAtTime(0, t);
    amp.gain.linearRampToValueAtTime(0.08, t + 0.07);
    amp.gain.setTargetAtTime(0, t + len, 0.08);
    const osc = ctx.createOscillator();
    osc.frequency.value = f;
    const oct = ctx.createOscillator();
    oct.type = 'triangle';
    oct.frequency.value = f * 2;
    const octGain = ctx.createGain();
    octGain.gain.value = 0.12;
    oct.connect(octGain).connect(amp);
    const vib = ctx.createOscillator();
    const vibGain = ctx.createGain();
    vib.frequency.value = 4.8;
    vibGain.gain.setValueAtTime(0, t);
    vibGain.gain.linearRampToValueAtTime(f * 0.006, t + Math.min(len, 0.4));
    vib.connect(vibGain).connect(osc.frequency);
    osc.connect(amp);
    const air = ctx.createBufferSource();
    air.buffer = this.noise;
    const bp = ctx.createBiquadFilter();
    bp.type = 'bandpass';
    bp.frequency.value = f * 2;
    bp.Q.value = 1.5;
    const airGain = ctx.createGain();
    airGain.gain.setValueAtTime(0.25, t);
    airGain.gain.setTargetAtTime(0.06, t + 0.05, 0.05);
    air.connect(bp).connect(airGain).connect(amp);
    amp.connect(this.out);
    for (const o of [osc, oct, vib]) {
      o.start(t);
      o.stop(t + len + 0.5);
    }
    air.start(t, this.rand() * 0.5, len + 0.4);
  }

  private kick(t: number, level: number) {
    const ctx = this.ctx;
    const osc = ctx.createOscillator();
    const g = ctx.createGain();
    osc.frequency.setValueAtTime(110, t);
    osc.frequency.exponentialRampToValueAtTime(44, t + 0.12);
    g.gain.setValueAtTime(level, t);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 0.32);
    osc.connect(g).connect(this.out);
    osc.start(t);
    osc.stop(t + 0.34);
  }

  private noiseHit(t: number, type: BiquadFilterType, freq: number, q: number, level: number, decay: number, attack = 0.002) {
    const ctx = this.ctx;
    const src = ctx.createBufferSource();
    src.buffer = this.noise;
    const f = ctx.createBiquadFilter();
    f.type = type;
    f.frequency.value = freq;
    f.Q.value = q;
    const g = ctx.createGain();
    g.gain.setValueAtTime(0, t);
    g.gain.linearRampToValueAtTime(level, t + attack);
    g.gain.exponentialRampToValueAtTime(0.0001, t + decay);
    src.connect(f).connect(g).connect(this.out);
    src.start(t, this.rand() * 0.5, decay + 0.05);
  }

  private snare(t: number, level: number) {
    this.noiseHit(t, 'bandpass', 1900, 0.8, level, 0.18);
    // Body.
    const ctx = this.ctx;
    const osc = ctx.createOscillator();
    osc.frequency.setValueAtTime(220, t);
    osc.frequency.exponentialRampToValueAtTime(160, t + 0.06);
    const g = ctx.createGain();
    g.gain.setValueAtTime(level * 0.5, t);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 0.09);
    osc.connect(g).connect(this.out);
    osc.start(t);
    osc.stop(t + 0.1);
  }

  private hat(t: number, level: number, decay: number) {
    this.noiseHit(t, 'highpass', 8000, 0.7, level, decay);
  }

  private shaker(t: number, level: number) {
    this.noiseHit(t, 'bandpass', 6500, 1.2, level, 0.07, 0.015);
  }

  private rim(t: number) {
    this.noiseHit(t, 'bandpass', 2600, 6, 0.12, 0.04);
  }

  private brush(t: number, len: number, level: number) {
    // A slow swish: noise swelling in, not a crack.
    this.noiseHit(t, 'bandpass', 3200, 0.7, level, len, Math.min(0.06, len * 0.2));
  }

  private ride(t: number, level: number) {
    this.noiseHit(t, 'highpass', 7500, 0.7, level, 0.32);
    const ctx = this.ctx;
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
    // Sparse pops over a faint hiss, looped; its level follows the tune.
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
    src.connect(hp).connect(this.crackleGain);
    src.start();
    this.crackle = src;
  }
}
