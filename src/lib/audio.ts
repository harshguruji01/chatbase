export class VoiceRecorder {
  private mediaRecorder: MediaRecorder | null = null;
  private audioChunks: Blob[] = [];
  private stream: MediaStream | null = null;
  private startTime: number = 0;
  private timerInterval: ReturnType<typeof setInterval> | null = null;
  private audioContext: AudioContext | null = null;
  private analyser: AnalyserNode | null = null;
  private animFrameId: number | null = null;

  public onTick?: (seconds: number) => void;
  public onMaxDurationReached?: () => void;
  public onAudioLevel?: (level: number) => void;

  async start(): Promise<void> {
    this.audioChunks = [];
    try {
      this.stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      });

      // Setup Web Audio Analyser for dynamic live waveform visualization
      try {
        const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
        if (AudioCtx) {
          this.audioContext = new AudioCtx();
          const source = this.audioContext.createMediaStreamSource(this.stream);
          this.analyser = this.audioContext.createAnalyser();
          this.analyser.fftSize = 64;
          this.analyser.smoothingTimeConstant = 0.5;
          source.connect(this.analyser);

          const dataArray = new Uint8Array(this.analyser.frequencyBinCount);
          const reportLevel = () => {
            if (this.analyser && this.onAudioLevel) {
              this.analyser.getByteFrequencyData(dataArray);
              let sum = 0;
              for (let i = 0; i < dataArray.length; i++) {
                sum += dataArray[i];
              }
              const avg = sum / (dataArray.length * 255); // 0 to 1
              this.onAudioLevel(avg);
              this.animFrameId = requestAnimationFrame(reportLevel);
            }
          };
          reportLevel();
        }
      } catch (audioErr) {
        console.warn('Live audio analyser not available:', audioErr);
      }

      // Prefer audio/webm or audio/mp4/ogg
      let mimeType = 'audio/webm';
      if (!MediaRecorder.isTypeSupported('audio/webm')) {
        if (MediaRecorder.isTypeSupported('audio/mp4')) {
          mimeType = 'audio/mp4';
        } else if (MediaRecorder.isTypeSupported('audio/ogg')) {
          mimeType = 'audio/ogg';
        } else {
          mimeType = '';
        }
      }

      const options: MediaRecorderOptions = {
        audioBitsPerSecond: 48000, // 48 kbps: crisp studio voice clarity, ultra-compact file size
        ...(mimeType ? { mimeType } : {}),
      };
      this.mediaRecorder = new MediaRecorder(this.stream, options);

      this.mediaRecorder.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) {
          this.audioChunks.push(event.data);
        }
      };

      this.mediaRecorder.start(100); // chunk every 100ms
      this.startTime = Date.now();

      // Tick interval for UI timer and 60-second limit enforcement
      this.timerInterval = setInterval(() => {
        const elapsed = Math.floor((Date.now() - this.startTime) / 1000);
        if (this.onTick) {
          this.onTick(elapsed);
        }
        if (elapsed >= 60) {
          // Hard cap at 60 seconds (1 minute)
          this.stop();
          if (this.onMaxDurationReached) {
            this.onMaxDurationReached();
          }
        }
      }, 500);
    } catch (err: any) {
      this.cleanup();
      throw new Error(err.message || 'Microphone access denied or unavailable.');
    }
  }

  stop(): Promise<{ blob: Blob; durationSeconds: number; url: string }> {
    return new Promise((resolve, reject) => {
      if (!this.mediaRecorder) {
        reject(new Error('Recorder is not active.'));
        return;
      }

      this.mediaRecorder.onstop = () => {
        const durationSeconds = Math.min(60, Math.max(1, Math.floor((Date.now() - this.startTime) / 1000)));
        const mimeType = this.mediaRecorder?.mimeType || 'audio/webm';
        const blob = new Blob(this.audioChunks, { type: mimeType });
        const url = URL.createObjectURL(blob);
        this.cleanup();
        resolve({ blob, durationSeconds, url });
      };

      if (this.mediaRecorder.state !== 'inactive') {
        this.mediaRecorder.stop();
      }
    });
  }

  cancel(): void {
    if (this.mediaRecorder && this.mediaRecorder.state !== 'inactive') {
      this.mediaRecorder.stop();
    }
    this.cleanup();
  }

  private cleanup(): void {
    if (this.animFrameId) {
      cancelAnimationFrame(this.animFrameId);
      this.animFrameId = null;
    }
    if (this.audioContext) {
      this.audioContext.close().catch(() => {});
      this.audioContext = null;
      this.analyser = null;
    }
    if (this.timerInterval) {
      clearInterval(this.timerInterval);
      this.timerInterval = null;
    }
    if (this.stream) {
      this.stream.getTracks().forEach((track) => track.stop());
      this.stream = null;
    }
    this.audioChunks = [];
  }
}
