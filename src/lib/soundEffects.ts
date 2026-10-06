// Web Audio API Sound Effects Synthesizer for ChatBase
// Completely zero external assets required - 100% synthesized in-browser

type SoundType = 'send' | 'receive' | 'reaction' | 'click' | 'pop' | 'notify';

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
      }
    } catch (err) {
      console.warn('Sound effect error:', err);
    }
  }
}

export const soundEffects = new SoundEffectsManager();
