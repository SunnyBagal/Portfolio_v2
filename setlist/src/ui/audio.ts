// All sound is synthesized with Web Audio: a 90 BPM boom-bap loop for the turntable
// and a filtered-noise hiss for the spray can. Muted until the speaker button is pressed.

type Listener = (on: boolean) => void;

class Sound {
  enabled = false;
  private ctx?: AudioContext;
  private master?: GainNode;
  private noise?: AudioBuffer;
  private beatTimer = 0;
  private nextBeat = 0;
  private step = 0;
  private bpm = 90;
  private playing = false;
  private hiss?: { src: AudioBufferSourceNode; gain: GainNode };
  private listeners: Listener[] = [];

  onChange(fn: Listener) {
    this.listeners.push(fn);
  }

  toggle() {
    this.enabled = !this.enabled;
    if (this.enabled) this.ensure();
    if (this.master && this.ctx) this.master.gain.setTargetAtTime(this.enabled ? 0.8 : 0, this.ctx.currentTime, 0.05);
    this.syncBeat();
    for (const fn of this.listeners) fn(this.enabled);
  }

  setPlaying(on: boolean, bpm = this.bpm) {
    this.playing = on;
    this.bpm = bpm;
    this.syncBeat();
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
      gain.gain.setTargetAtTime(0.08 + pressure * 0.12, this.ctx.currentTime, 0.02);
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

  private ensure() {
    if (this.ctx) {
      void this.ctx.resume();
      return;
    }
    this.ctx = new AudioContext();
    this.master = this.ctx.createGain();
    this.master.gain.value = 0.8;
    this.master.connect(this.ctx.destination);
    const len = this.ctx.sampleRate;
    this.noise = this.ctx.createBuffer(1, len, this.ctx.sampleRate);
    const data = this.noise.getChannelData(0);
    for (let i = 0; i < len; i++) data[i] = Math.random() * 2 - 1;
  }

  private syncBeat() {
    const want = this.enabled && this.playing;
    if (want && !this.beatTimer && this.ctx) {
      this.nextBeat = this.ctx.currentTime + 0.05;
      this.step = 0;
      this.beatTimer = window.setInterval(() => this.schedule(), 25);
    } else if (!want && this.beatTimer) {
      clearInterval(this.beatTimer);
      this.beatTimer = 0;
    }
  }

  // 16-step pattern: kick, snare, hats, with a little swing.
  private schedule() {
    const ctx = this.ctx!;
    const sixteenth = 60 / this.bpm / 4;
    while (this.nextBeat < ctx.currentTime + 0.12) {
      const s = this.step % 16;
      const t = this.nextBeat + (s % 2 ? sixteenth * 0.12 : 0);
      if ([0, 7, 10].includes(s)) this.kick(t);
      if (s === 4 || s === 12) this.snare(t);
      if (s % 2 === 0) this.hat(t, s % 4 === 0 ? 0.05 : 0.03);
      this.nextBeat += sixteenth;
      this.step++;
    }
  }

  private kick(t: number) {
    const ctx = this.ctx!;
    const osc = ctx.createOscillator();
    const g = ctx.createGain();
    osc.frequency.setValueAtTime(130, t);
    osc.frequency.exponentialRampToValueAtTime(42, t + 0.18);
    g.gain.setValueAtTime(0.9, t);
    g.gain.exponentialRampToValueAtTime(0.001, t + 0.4);
    osc.connect(g).connect(this.master!);
    osc.start(t);
    osc.stop(t + 0.42);
  }

  private snare(t: number) {
    const ctx = this.ctx!;
    const src = ctx.createBufferSource();
    src.buffer = this.noise!;
    const bp = ctx.createBiquadFilter();
    bp.type = 'bandpass';
    bp.frequency.value = 1800;
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.45, t);
    g.gain.exponentialRampToValueAtTime(0.001, t + 0.2);
    src.connect(bp).connect(g).connect(this.master!);
    src.start(t, Math.random() * 0.5, 0.25);
  }

  private hat(t: number, level: number) {
    const ctx = this.ctx!;
    const src = ctx.createBufferSource();
    src.buffer = this.noise!;
    const hp = ctx.createBiquadFilter();
    hp.type = 'highpass';
    hp.frequency.value = 7000;
    const g = ctx.createGain();
    g.gain.setValueAtTime(level, t);
    g.gain.exponentialRampToValueAtTime(0.001, t + 0.05);
    src.connect(hp).connect(g).connect(this.master!);
    src.start(t, Math.random() * 0.5, 0.06);
  }
}

export const sound = new Sound();
