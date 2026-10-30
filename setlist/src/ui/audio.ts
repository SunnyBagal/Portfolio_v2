// All sound is synthesized with Web Audio: a generative jazz tune for whichever disc is
// playing (see music.ts) and a filtered-noise hiss for the spray can.
//
// Several things can want to play at once: the section you're in has a background tune,
// and discs (the turntable, a pulled record, a hovered card) play over it. Higher priority
// wins, then the most recent request; when it lets go, the next one takes over.

import { JazzBand, type Song } from './music';

type Listener<T> = (value: T) => void;

class Sound {
  enabled = false;
  private userMuted = false;
  private ctx?: AudioContext;
  private master?: GainNode;
  private noise?: AudioBuffer;
  private band?: JazzBand;
  private requests: { source: string; song: Song; priority: number }[] = [];
  private hiss?: { src: AudioBufferSourceNode; gain: GainNode };
  private onToggle: Listener<boolean>[] = [];
  private onSongChange: Listener<Song | undefined>[] = [];

  onChange(fn: Listener<boolean>) {
    this.onToggle.push(fn);
  }

  onSong(fn: Listener<Song | undefined>) {
    this.onSongChange.push(fn);
  }

  /** The speaker button. */
  toggle() {
    this.setEnabled(!this.enabled);
    this.userMuted = !this.enabled;
  }

  /** A click on a disc turns sound on, unless the visitor muted it on purpose. */
  wake() {
    if (!this.enabled && !this.userMuted) this.setEnabled(true);
  }

  /** priority 0 is a section's background tune; discs use 1. */
  want(source: string, song: Song, priority = 1) {
    const existing = this.requests.find((r) => r.source === source);
    if (existing?.song === song && existing.priority === priority) return;
    this.requests = this.requests.filter((r) => r.source !== source);
    this.requests.push({ source, song, priority });
    this.sync();
  }

  release(source: string) {
    const before = this.requests.length;
    this.requests = this.requests.filter((r) => r.source !== source);
    if (this.requests.length !== before) this.sync();
  }

  /** Spray-can hiss; pressure 0..1. */
  spray(on: boolean, pressure = 0.7) {
    if (!this.enabled || !this.ctx || !this.master || !this.noise) return;
    if (on && !this.hiss) {
      const src = this.ctx.createBufferSource();
      src.buffer = this.noise;
      src.loop = true;
      const band = this.ctx.createBiquadFilter();
      band.type = 'highpass';
      band.frequency.value = 2400;
      const gain = this.ctx.createGain();
      gain.gain.value = 0;
      gain.gain.setTargetAtTime(0.06 + pressure * 0.1, this.ctx.currentTime, 0.02);
      src.connect(band).connect(gain).connect(this.master);
      src.start();
      this.hiss = { src, gain };
    } else if (!on && this.hiss) {
      const { src, gain } = this.hiss;
      gain.gain.setTargetAtTime(0, this.ctx.currentTime, 0.03);
      src.stop(this.ctx.currentTime + 0.2);
      this.hiss = undefined;
    }
  }

  private setEnabled(on: boolean) {
    this.enabled = on;
    if (on) this.ensure();
    if (this.master && this.ctx) this.master.gain.setTargetAtTime(on ? 0.8 : 0, this.ctx.currentTime, 0.08);
    this.sync();
    for (const fn of this.onToggle) fn(on);
  }

  private sync() {
    let top: Song | undefined;
    if (this.enabled) {
      let best = -1;
      // Later requests win ties, so iterate in order and keep >=.
      for (const r of this.requests) {
        if (r.priority >= best) {
          best = r.priority;
          top = r.song;
        }
      }
    }
    if (!this.band) {
      for (const fn of this.onSongChange) fn(undefined);
      return;
    }
    const before = this.band.playing;
    if (top) this.band.play(top);
    else this.band.stop();
    if (before !== this.band.playing) for (const fn of this.onSongChange) fn(this.band.playing);
  }

  private ensure() {
    if (this.ctx) {
      void this.ctx.resume();
      return;
    }
    this.ctx = new AudioContext();
    this.master = this.ctx.createGain();
    this.master.gain.value = 0;
    this.master.connect(this.ctx.destination);
    const len = this.ctx.sampleRate;
    this.noise = this.ctx.createBuffer(1, len, this.ctx.sampleRate);
    const data = this.noise.getChannelData(0);
    for (let i = 0; i < len; i++) data[i] = Math.random() * 2 - 1;
    this.band = new JazzBand(this.ctx, this.master, this.noise);
  }
}

export const sound = new Sound();

// Dev-only handle for poking at the audio graph from the console or test scripts.
if (import.meta.env.DEV) (window as unknown as { sound: Sound }).sound = sound;
