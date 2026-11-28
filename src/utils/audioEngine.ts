export type MusicMood = 'midnight_jazz' | 'tension_pulse' | 'tender_piano' | 'passionate_strings' | 'dawn_warmth';
export type SceneEffect = 'none' | 'lightning' | 'heartbeat' | 'warm_glow' | 'shake';

class ProceduralAudioEngine {
  private ctx: AudioContext | null = null;
  private enabled: boolean = true;
  private currentMood: MusicMood | null = null;
  private chordTimer: number | null = null;
  private rainGain: GainNode | null = null;
  private masterGain: GainNode | null = null;

  public isEnabled(): boolean {
    return this.enabled;
  }

  public init(): void {
    if (this.ctx) {
      if (this.ctx.state === 'suspended') {
        this.ctx.resume().catch(() => {});
      }
      return;
    }
    try {
      const AudioCtx =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.ctx = new AudioCtx();
      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.value = this.enabled ? 0.35 : 0;
      this.masterGain.connect(this.ctx.destination);
      this.startRainTexture();
    } catch {
      // Ignore if Web Audio is unavailable
    }
  }

  public setEnabled(on: boolean): void {
    this.enabled = on;
    if (!this.ctx && on) {
      this.init();
    }
    if (this.ctx && this.masterGain) {
      const now = this.ctx.currentTime;
      this.masterGain.gain.cancelScheduledValues(now);
      this.masterGain.gain.linearRampToValueAtTime(on ? 0.35 : 0, now + 0.25);
    }
    if (on && this.currentMood) {
      this.setMood(this.currentMood, true);
    }
  }

  private startRainTexture(): void {
    if (!this.ctx || !this.masterGain) return;
    const bufferSize = this.ctx.sampleRate * 2;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const output = buffer.getChannelData(0);
    let lastOut = 0;
    for (let i = 0; i < bufferSize; i++) {
      const white = Math.random() * 2 - 1;
      output[i] = (lastOut + 0.02 * white) / 1.02;
      lastOut = output[i];
      output[i] *= 1.8;
    }

    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;
    noise.loop = true;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.value = 900;
    filter.Q.value = 0.7;

    this.rainGain = this.ctx.createGain();
    this.rainGain.gain.value = 0.08;

    noise.connect(filter);
    filter.connect(this.rainGain);
    this.rainGain.connect(this.masterGain);
    noise.start();
  }

  public setMood(mood: MusicMood, force = false): void {
    if (this.currentMood === mood && !force) return;
    this.currentMood = mood;
    if (this.chordTimer !== null) {
      window.clearInterval(this.chordTimer);
      this.chordTimer = null;
    }
    if (!this.ctx || !this.enabled) return;

    if (this.rainGain) {
      const rainVol = mood === 'dawn_warmth' ? 0.02 : 0.085;
      this.rainGain.gain.linearRampToValueAtTime(rainVol, this.ctx.currentTime + 1.0);
    }

    const progressions: Record<MusicMood, number[][]> = {
      midnight_jazz: [
        [220.0, 261.63, 329.63, 392.0], // Am7
        [196.0, 246.94, 293.66, 349.23], // G6/Dm
        [174.61, 220.0, 261.63, 329.63], // Fmaj7
        [164.81, 207.65, 246.94, 311.13], // E7alt
      ],
      tension_pulse: [
        [146.83, 220.0, 261.63, 311.13], // Dm(b5)
        [138.59, 207.65, 246.94, 329.63], // C#m7
        [130.81, 196.0, 233.08, 293.66], // Cm9
        [123.47, 185.0, 246.94, 293.66], // Bm
      ],
      tender_piano: [
        [261.63, 329.63, 392.0, 493.88], // Cmaj7
        [220.0, 261.63, 329.63, 392.0], // Am7
        [174.61, 220.0, 261.63, 349.23], // Fadd9
        [196.0, 246.94, 293.66, 392.0], // G
      ],
      passionate_strings: [
        [220.0, 261.63, 329.63, 440.0], // Am
        [174.61, 220.0, 261.63, 349.23], // F
        [261.63, 329.63, 392.0, 523.25], // C
        [196.0, 246.94, 329.63, 392.0], // Em/G
      ],
      dawn_warmth: [
        [293.66, 369.99, 440.0, 554.37], // Dmaj7
        [246.94, 293.66, 369.99, 440.0], // Bm7
        [196.0, 246.94, 293.66, 369.99], // Gmaj7
        [220.0, 277.18, 329.63, 440.0], // A
      ],
    };

    let step = 0;
    const playStep = () => {
      if (!this.ctx || !this.masterGain || !this.enabled) return;
      const chords = progressions[mood];
      const chord = chords[step % chords.length];
      step++;
      this.playWarmPadChord(chord, mood === 'passionate_strings' ? 3.8 : 4.2);
    };

    playStep();
    this.chordTimer = window.setInterval(playStep, 4300);
  }

  private playWarmPadChord(freqs: number[], duration: number): void {
    if (!this.ctx || !this.masterGain) return;
    const now = this.ctx.currentTime;
    freqs.forEach((f, idx) => {
      if (!this.ctx || !this.masterGain) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      const filter = this.ctx.createBiquadFilter();

      osc.type = idx === 0 ? 'sine' : 'triangle';
      osc.frequency.value = f;

      filter.type = 'lowpass';
      filter.frequency.value = 950;

      const startDelay = idx * 0.09;
      gain.gain.setValueAtTime(0.0001, now + startDelay);
      gain.gain.linearRampToValueAtTime(0.038, now + startDelay + 0.8);
      gain.gain.exponentialRampToValueAtTime(0.0008, now + startDelay + duration);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(this.masterGain);

      osc.start(now + startDelay);
      osc.stop(now + startDelay + duration + 0.05);
    });
  }

  public playEffect(effect: SceneEffect): void {
    if (!this.ctx || !this.masterGain || !this.enabled || effect === 'none') return;
    const now = this.ctx.currentTime;

    if (effect === 'heartbeat') {
      [0, 0.24, 0.95, 1.19].forEach((offset, idx) => {
        if (!this.ctx || !this.masterGain) return;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(idx % 2 === 0 ? 68 : 54, now + offset);
        osc.frequency.exponentialRampToValueAtTime(32, now + offset + 0.18);
        gain.gain.setValueAtTime(0.001, now + offset);
        gain.gain.linearRampToValueAtTime(idx % 2 === 0 ? 0.24 : 0.16, now + offset + 0.03);
        gain.gain.exponentialRampToValueAtTime(0.001, now + offset + 0.22);
        osc.connect(gain);
        gain.connect(this.masterGain);
        osc.start(now + offset);
        osc.stop(now + offset + 0.24);
      });
    } else if (effect === 'lightning') {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(95, now);
      osc.frequency.exponentialRampToValueAtTime(34, now + 1.4);

      const filter = this.ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.value = 180;

      gain.gain.setValueAtTime(0.22, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 1.5);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(this.masterGain);
      osc.start(now);
      osc.stop(now + 1.55);
    } else if (effect === 'warm_glow') {
      [523.25, 659.25, 783.99].forEach((f, idx) => {
        if (!this.ctx || !this.masterGain) return;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sine';
        osc.frequency.value = f;
        gain.gain.setValueAtTime(0.001, now + idx * 0.08);
        gain.gain.linearRampToValueAtTime(0.07, now + idx * 0.08 + 0.05);
        gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.08 + 0.7);
        osc.connect(gain);
        gain.connect(this.masterGain);
        osc.start(now + idx * 0.08);
        osc.stop(now + idx * 0.08 + 0.75);
      });
    }
  }

  public playTap(isChoice = false): void {
    if (!this.ctx || !this.masterGain || !this.enabled) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(isChoice ? 587.33 : 440, now);
    if (isChoice) {
      osc.frequency.exponentialRampToValueAtTime(880, now + 0.11);
    }
    gain.gain.setValueAtTime(0.06, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + (isChoice ? 0.16 : 0.06));
    osc.connect(gain);
    gain.connect(this.masterGain);
    osc.start(now);
    osc.stop(now + (isChoice ? 0.18 : 0.07));
  }
}

export const audioEngine = new ProceduralAudioEngine();
