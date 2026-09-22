import React, { useState, useEffect, useRef } from 'react';
import { Trash2, Square, Play, Pause, Send, RotateCcw } from 'lucide-react';
import { VoiceRecorder } from '../../lib/audio';
import { formatDuration } from '../../lib/utils';
import { useToast } from '../common/Toast';

interface InlineVoiceRecorderProps {
  onSendVoice: (blob: Blob, durationSeconds: number) => Promise<void>;
  onCancel: () => void;
}

export const InlineVoiceRecorder: React.FC<InlineVoiceRecorderProps> = ({
  onSendVoice,
  onCancel,
}) => {
  const { showToast } = useToast();
  const [isRecording, setIsRecording] = useState(true);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [audioLevel, setAudioLevel] = useState(0.2);
  const [recordedAudio, setRecordedAudio] = useState<{
    blob: Blob;
    duration: number;
    url: string;
  } | null>(null);
  const [isPlayingPreview, setIsPlayingPreview] = useState(false);
  const [previewProgress, setPreviewProgress] = useState(0);
  const [isSending, setIsSending] = useState(false);

  const recorderRef = useRef<VoiceRecorder | null>(null);
  const audioPreviewRef = useRef<HTMLAudioElement | null>(null);
  const stopRecordingRef = useRef<(() => Promise<void>) | null>(null);

  const cleanup = React.useCallback(() => {
    if (recorderRef.current) {
      recorderRef.current.cancel();
      recorderRef.current = null;
    }
    if (audioPreviewRef.current) {
      audioPreviewRef.current.pause();
      audioPreviewRef.current = null;
    }
    setIsRecording(false);
    setRecordedAudio(null);
    setElapsedSeconds(0);
    setIsPlayingPreview(false);
  }, []);

  const startRecording = React.useCallback(async () => {
    cleanup();
    try {
      const recorder = new VoiceRecorder();
      recorderRef.current = recorder;

      recorder.onTick = (sec) => {
        setElapsedSeconds(sec);
      };

      recorder.onAudioLevel = (level) => {
        setAudioLevel(Math.max(0.15, Math.min(1, level * 3)));
      };

      recorder.onMaxDurationReached = async () => {
        showToast('Max 1 minute duration reached.', 'info');
        stopRecordingRef.current?.();
      };

      await recorder.start();
      setIsRecording(true);
    } catch (err: any) {
      showToast(err.message || 'Microphone access denied.', 'error');
      onCancel();
    }
  }, [cleanup, onCancel, showToast]);

  useEffect(() => {
    startRecording();
    return () => cleanup();
  }, [startRecording, cleanup]);

  const stopRecording = async () => {
    if (!recorderRef.current || !isRecording) return;
    try {
      const result = await recorderRef.current.stop();
      setIsRecording(false);
      setRecordedAudio({
        blob: result.blob,
        duration: result.durationSeconds,
        url: result.url,
      });
    } catch (err) {
      console.error(err);
    }
  };
  stopRecordingRef.current = stopRecording;

  const togglePreview = () => {
    if (!audioPreviewRef.current && recordedAudio) {
      const audio = new Audio(recordedAudio.url);
      audio.ontimeupdate = () => {
        if (audio.duration && !isNaN(audio.duration)) {
          setPreviewProgress((audio.currentTime / audio.duration) * 100);
        }
      };
      audio.onended = () => {
        setIsPlayingPreview(false);
        setPreviewProgress(0);
        if (audioPreviewRef.current) {
          audioPreviewRef.current.currentTime = 0;
        }
      };
      audioPreviewRef.current = audio;
    }

    if (audioPreviewRef.current) {
      if (isPlayingPreview) {
        audioPreviewRef.current.pause();
        setIsPlayingPreview(false);
      } else {
        if (audioPreviewRef.current.ended || (audioPreviewRef.current.duration && audioPreviewRef.current.currentTime >= audioPreviewRef.current.duration)) {
          audioPreviewRef.current.currentTime = 0;
          setPreviewProgress(0);
        }
        audioPreviewRef.current
          .play()
          .then(() => setIsPlayingPreview(true))
          .catch((err) => {
            console.warn('Preview play error:', err);
            setIsPlayingPreview(false);
          });
      }
    }
  };

  const handleSeekPreview = (e: React.MouseEvent<HTMLDivElement>) => {
    if (audioPreviewRef.current && audioPreviewRef.current.duration) {
      const rect = e.currentTarget.getBoundingClientRect();
      const clickX = e.clientX - rect.left;
      const percentage = Math.max(0, Math.min(1, clickX / rect.width));
      audioPreviewRef.current.currentTime = percentage * audioPreviewRef.current.duration;
      setPreviewProgress(percentage * 100);
      if (!isPlayingPreview) {
        audioPreviewRef.current.play().then(() => setIsPlayingPreview(true)).catch(console.warn);
      }
    }
  };

  const handleSend = async () => {
    setIsSending(true);
    try {
      if (isRecording && recorderRef.current) {
        const result = await recorderRef.current.stop();
        await onSendVoice(result.blob, result.durationSeconds);
      } else if (recordedAudio) {
        await onSendVoice(recordedAudio.blob, recordedAudio.duration);
      }
      cleanup();
      onCancel();
    } catch (err: any) {
      showToast(err.message || 'Failed to send voice note.', 'error');
    } finally {
      setIsSending(false);
    }
  };



  // Generate 16 bars for the dynamic equalizer
  const bars = [0.4, 0.7, 0.5, 0.9, 0.3, 0.8, 0.6, 1.0, 0.7, 0.5, 0.9, 0.4, 0.75, 0.55, 0.85, 0.4];

  return (
    <div className="ig-voice-bar fade-in-up" style={{ width: '100%' }}>
      {/* Trash / Cancel button */}
      <button
        type="button"
        onClick={() => {
          cleanup();
          onCancel();
        }}
        className="ig-action-btn"
        style={{ color: 'var(--color-danger)' }}
        title="Discard recording"
      >
        <Trash2 size={20} />
      </button>

      {isRecording ? (
        <>
          {/* Pulsing red recording dot */}
          <div className="ig-rec-dot" />

          {/* Live Timer */}
          <span
            style={{
              fontFamily: 'monospace',
              fontSize: '0.9rem',
              fontWeight: 700,
              color: 'var(--text-primary)',
              minWidth: '70px',
            }}
          >
            {formatDuration(elapsedSeconds)} / 01:00
          </span>

          {/* Dynamic Live Audio Equalizer Waveform */}
          <div className="ig-waveform-live">
            {bars.map((weight, i) => {
              const height = Math.max(4, Math.round(weight * audioLevel * 24));
              return (
                <div
                  key={i}
                  className="ig-waveform-bar"
                  style={{
                    height: `${height}px`,
                    background: i % 2 === 0 ? 'var(--color-primary)' : 'var(--color-pink)',
                  }}
                />
              );
            })}
          </div>

          {/* Stop & Review Button */}
          <button
            type="button"
            onClick={stopRecording}
            className="ig-action-btn"
            style={{ color: 'var(--text-primary)' }}
            title="Stop & review"
          >
            <Square size={18} fill="currentColor" />
          </button>
        </>
      ) : (
        <>
          {/* Review Play/Pause Button */}
          <button
            type="button"
            onClick={togglePreview}
            className="ig-action-btn"
            style={{
              background: 'var(--color-primary-light)',
              color: 'var(--color-primary)',
            }}
            title={isPlayingPreview ? 'Pause' : 'Play preview'}
          >
            {isPlayingPreview ? <Pause size={18} /> : <Play size={18} />}
          </button>

          {/* Scrub Bar & Duration */}
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <div
              onClick={handleSeekPreview}
              title="Click to scrub preview"
              style={{
                height: '5px',
                background: 'rgba(255, 255, 255, 0.12)',
                borderRadius: '3px',
                overflow: 'hidden',
                cursor: 'pointer',
              }}
            >
              <div
                style={{
                  height: '100%',
                  width: `${previewProgress}%`,
                  background: 'var(--gradient-brand)',
                  transition: 'width 0.1s linear',
                }}
              />
            </div>
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                fontSize: '0.74rem',
                color: 'var(--text-muted)',
              }}
            >
              <span>{isPlayingPreview ? 'Playing preview...' : 'Ready to send'}</span>
              <span>{formatDuration(recordedAudio?.duration || 0)}</span>
            </div>
          </div>

          {/* Re-record button */}
          <button
            type="button"
            onClick={startRecording}
            className="ig-action-btn"
            title="Record again"
          >
            <RotateCcw size={18} />
          </button>
        </>
      )}

      {/* Send Button */}
      <button
        type="button"
        onClick={handleSend}
        disabled={isSending}
        className="ig-send-btn"
        title="Send voice note"
      >
        <Send size={18} />
      </button>
    </div>
  );
};
