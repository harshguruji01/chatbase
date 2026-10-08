// Web Audio API Sound Effects Synthesizer for ChatBase
// Completely zero external assets required - 100% synthesized in-browser

type SoundType = 'send' | 'receive' | 'reaction' | 'click' | 'pop' | 'notify' | 'call_connect' | 'call_end';

class SoundEffectsManager {
  private audioCtx: AudioContext | null = null;
  private enabled: boolean = true;

  constructor() {
    const saved = localStorage.getItem('chatbase_sound_enabled');
    this.enabled = saved !== null ? saved === 'true' : true;
  }

  private getContext(): AudioContext | null {
    if (typeof window === 'undefined') return null;
    try {
      if (!this.audioCtx) {
        const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
        if (AudioCtx) {
          this.audioCtx = new AudioCtx();
        }
      }
      if (this.audioCtx && this.audioCtx.state === 'suspended') {
        this.audioCtx.resume().catch(() => {});
      }
      return this.audioCtx;
    } catch {
      return null;
    }
  }

  public isEnabled(): boolean {
    return this.enabled;
  }

  public setEnabled(val: boolean): void {
    this.enabled = val;
    localStorage.setItem('chatbase_sound_enabled', String(val));
  }

  public toggle(): boolean {
    const next = !this.enabled;
    this.setEnabled(next);
    if (next) {
      this.play('pop');
    }
    return next;
  }

  public play(type: SoundType): void {
    if (!this.enabled) return;
    const ctx = this.getContext();
    if (!ctx) return;

    try {
      const now = ctx.currentTime;

      switch (type) {
        case 'send': {
          // Subtle cheerful sending swoop (600Hz -> 1100Hz)
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = 'sine';
          osc.frequency.setValueAtTime(620, now);
          osc.frequency.exponentialRampToValueAtTime(1150, now + 0.12);

          gain.gain.setValueAtTime(0.12, now);
          gain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);

          osc.connect(gain);
          gain.connect(ctx.destination);

          osc.start(now);
          osc.stop(now + 0.16);
          break;
        }

        case 'receive': {
          // Melodic dual-tone gentle notification chime (523Hz -> 784Hz)
          const osc1 = ctx.createOscillator();
          const osc2 = ctx.createOscillator();
          const gain = ctx.createGain();

          osc1.type = 'sine';
          osc2.type = 'triangle';

          osc1.frequency.setValueAtTime(523.25, now); // C5
          osc1.frequency.setValueAtTime(783.99, now + 0.08); // G5

          osc2.frequency.setValueAtTime(659.25, now); // E5
          osc2.frequency.setValueAtTime(1046.5, now + 0.08); // C6

          gain.gain.setValueAtTime(0.15, now);
          gain.gain.exponentialRampToValueAtTime(0.001, now + 0.28);

          osc1.connect(gain);
          osc2.connect(gain);
          gain.connect(ctx.destination);

          osc1.start(now);
          osc2.start(now);
          osc1.stop(now + 0.3);
          osc2.stop(now + 0.3);
          break;
        }

        case 'reaction': {
          // Bright spark / high harmonic ping (1200Hz)
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = 'sine';
          osc.frequency.setValueAtTime(1200, now);
          osc.frequency.exponentialRampToValueAtTime(1800, now + 0.09);

          gain.gain.setValueAtTime(0.14, now);
          gain.gain.exponentialRampToValueAtTime(0.001, now + 0.18);

          osc.connect(gain);
          gain.connect(ctx.destination);

          osc.start(now);
          osc.stop(now + 0.2);
          break;
        }

        case 'pop': {
          // Soft bubble pop
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = 'sine';
          osc.frequency.setValueAtTime(450, now);
          osc.frequency.exponentialRampToValueAtTime(800, now + 0.05);

          gain.gain.setValueAtTime(0.12, now);
          gain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);

          osc.connect(gain);
          gain.connect(ctx.destination);

          osc.start(now);
          osc.stop(now + 0.09);
          break;
        }

        case 'click': {
          // Ultra-short micro tactile tick
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = 'triangle';
          osc.frequency.setValueAtTime(800, now);
          osc.frequency.exponentialRampToValueAtTime(200, now + 0.03);

          gain.gain.setValueAtTime(0.06, now);
          gain.gain.exponentialRampToValueAtTime(0.001, now + 0.04);

          osc.connect(gain);
          gain.connect(ctx.destination);

          osc.start(now);
          osc.stop(now + 0.05);
          break;
        }

        case 'notify': {
          // Tri-tone soft notice
          const notes = [440, 554, 659];
          notes.forEach((freq, i) => {
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.type = 'sine';
            osc.frequency.setValueAtTime(freq, now + i * 0.06);

            gain.gain.setValueAtTime(0.1, now + i * 0.06);
            gain.gain.exponentialRampToValueAtTime(0.001, now + (i + 1) * 0.06 + 0.1);

            osc.connect(gain);
            gain.connect(ctx.destination);

            osc.start(now + i * 0.06);
            osc.stop(now + (i + 1) * 0.06 + 0.12);
          });
          break;
        }

        case 'call_connect': {
          // Cheerful upward chime (440 -> 660 -> 880Hz)
          [440, 660, 880].forEach((freq, i) => {
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.type = 'sine';
            osc.frequency.setValueAtTime(freq, now + i * 0.08);
            gain.gain.setValueAtTime(0.12, now + i * 0.08);
            gain.gain.exponentialRampToValueAtTime(0.001, now + (i + 1) * 0.08 + 0.1);
            osc.connect(gain);
            gain.connect(ctx.destination);
            osc.start(now + i * 0.08);
            osc.stop(now + (i + 1) * 0.08 + 0.12);
          });
          break;
        }

        case 'call_end': {
          // Gentle downward double tone (480Hz -> 320Hz)
          const osc1 = ctx.createOscillator();
          const osc2 = ctx.createOscillator();
          const gain = ctx.createGain();
          osc1.type = 'triangle';
          osc2.type = 'triangle';
          osc1.frequency.setValueAtTime(480, now);
          osc2.frequency.setValueAtTime(320, now + 0.14);
          gain.gain.setValueAtTime(0.15, now);
          gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);
          osc1.connect(gain);
          osc2.connect(gain);
          gain.connect(ctx.destination);
          osc1.start(now);
          osc1.stop(now + 0.14);
          osc2.start(now + 0.14);
          osc2.stop(now + 0.35);
          break;
        }
      }
    } catch (err) {
      console.warn('Sound effect error:', err);
    }
  }

  private ringtoneInterval: ReturnType<typeof setInterval> | null = null;
  private dialingInterval: ReturnType<typeof setInterval> | null = null;

  public startRingtone(): void {
    if (!this.enabled || this.ringtoneInterval) return;
    const playRingCycle = () => {
      const ctx = this.getContext();
      if (!ctx) return;
      const now = ctx.currentTime;
      // Melodic double chime sequence
      const melody = [587, 784, 880, 1046, 784];
      melody.forEach((freq, i) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now + i * 0.12);
        gain.gain.setValueAtTime(0.15, now + i * 0.12);
        gain.gain.exponentialRampToValueAtTime(0.001, now + (i + 1) * 0.12 + 0.05);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now + i * 0.12);
        osc.stop(now + (i + 1) * 0.12 + 0.08);
      });
    };

    playRingCycle();
    this.ringtoneInterval = setInterval(playRingCycle, 2400);
  }

  public stopRingtone(): void {
    if (this.ringtoneInterval) {
      clearInterval(this.ringtoneInterval);
      this.ringtoneInterval = null;
    }
  }

  public startDialing(): void {
    if (!this.enabled || this.dialingInterval) return;
    const playDialTone = () => {
      const ctx = this.getContext();
      if (!ctx) return;
      const now = ctx.currentTime;
      // Standard gentle dial pulse (440Hz + 480Hz dual tone)
      const osc1 = ctx.createOscillator();
      const osc2 = ctx.createOscillator();
      const gain = ctx.createGain();
      osc1.frequency.setValueAtTime(440, now);
      osc2.frequency.setValueAtTime(480, now);
      gain.gain.setValueAtTime(0.08, now);
      gain.gain.linearRampToValueAtTime(0.08, now + 1.2);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 1.25);
      osc1.connect(gain);
      osc2.connect(gain);
      gain.connect(ctx.destination);
      osc1.start(now);
      osc2.start(now);
      osc1.stop(now + 1.25);
      osc2.stop(now + 1.25);
    };

    playDialTone();
    this.dialingInterval = setInterval(playDialTone, 3200);
  }

  public stopDialing(): void {
    if (this.dialingInterval) {
      clearInterval(this.dialingInterval);
      this.dialingInterval = null;
    }
  }
}

export const soundEffects = new SoundEffectsManager();

