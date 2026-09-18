import React, { useState, useEffect, useRef } from 'react';
import { Square, Play, Pause, Trash2, Send } from 'lucide-react';
import { Modal } from '../common/Modal';
import { OutlinedButton } from '../common/OutlinedButton';
import { VoiceRecorder } from '../../lib/audio';
import { formatDuration } from '../../lib/utils';
import { useToast } from '../common/Toast';

interface VoiceRecorderModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSendVoice: (blob: Blob, durationSeconds: number) => Promise<void>;
}

export const VoiceRecorderModal: React.FC<VoiceRecorderModalProps> = ({
  isOpen,
  onClose,
  onSendVoice,
}) => {
  const { showToast } = useToast();
  const [isRecording, setIsRecording] = useState(false);
  const [recordedAudio, setRecordedAudio] = useState<{ blob: Blob; duration: number; url: string } | null>(null);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [isPlayingPreview, setIsPlayingPreview] = useState(false);
  const [isSending, setIsSending] = useState(false);

  const recorderRef = useRef<VoiceRecorder | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    if (isOpen) {
      startRecording();
    } else {
      cleanup();
    }
    return () => cleanup();
  }, [isOpen]);

  const startRecording = async () => {
    cleanup();
    try {
      const recorder = new VoiceRecorder();
      recorderRef.current = recorder;

      recorder.onTick = (sec) => {
        setElapsedSeconds(sec);
      };

      recorder.onMaxDurationReached = async () => {
        showToast('Maximum 1 minute duration reached.', 'info');
        stopRecording();
      };

      await recorder.start();
      setIsRecording(true);
    } catch (err: any) {
      showToast(err.message || 'Microphone access denied.', 'error');
      onClose();
    }
  };

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

  const cancelRecording = () => {
    cleanup();
    onClose();
  };

  const togglePreview = () => {
    if (!audioRef.current && recordedAudio) {
      const audio = new Audio(recordedAudio.url);
      audio.onended = () => setIsPlayingPreview(false);
      audioRef.current = audio;
    }

    if (audioRef.current) {
      if (isPlayingPreview) {
        audioRef.current.pause();
        setIsPlayingPreview(false);
      } else {
        audioRef.current.play();
        setIsPlayingPreview(true);
      }
    }
  };

  const handleSend = async () => {
    if (!recordedAudio) return;
    setIsSending(true);
    try {
      await onSendVoice(recordedAudio.blob, recordedAudio.duration);
      cleanup();
      onClose();
    } catch (err: any) {
      showToast(err.message || 'Failed to send voice message.', 'error');
    } finally {
      setIsSending(false);
    }
  };

  const cleanup = () => {
    if (recorderRef.current) {
      recorderRef.current.cancel();
      recorderRef.current = null;
    }
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }
    setIsRecording(false);
    setRecordedAudio(null);
    setElapsedSeconds(0);
    setIsPlayingPreview(false);
  };

  return (
    <Modal isOpen={isOpen} onClose={cancelRecording} title="Voice Message (Max 1 min)">
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '20px', padding: '10px 0' }}>
        {/* Animated Sound Waves / Status */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            height: '60px',
            gap: '6px',
            width: '100%',
          }}
        >
          {isRecording ? (
            <>
              <div className="wave-bar" />
              <div className="wave-bar" />
              <div className="wave-bar" />
              <div className="wave-bar" />
              <div className="wave-bar" />
              <div className="wave-bar" />
            </>
          ) : (
            <div style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
              Preview your recording before sending
            </div>
          )}
        </div>

        {/* Timer */}
        <div
          style={{
            fontFamily: 'monospace',
            fontSize: '1.8rem',
            fontWeight: 700,
            color: isRecording ? 'var(--color-danger)' : 'var(--text-primary)',
          }}
        >
          {formatDuration(isRecording ? elapsedSeconds : recordedAudio?.duration || 0)} / 01:00
        </div>

        {/* Actions Controls */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px', width: '100%', justifyContent: 'center' }}>
          {isRecording ? (
            <>
              <OutlinedButton
                variant="danger"
                size="md"
                onClick={cancelRecording}
                icon={<Trash2 size={16} />}
              >
                Cancel
              </OutlinedButton>
              <OutlinedButton
                variant="primary"
                size="lg"
                onClick={stopRecording}
                icon={<Square size={16} fill="currentColor" />}
                style={{ minWidth: '140px' }}
              >
                Stop & Review
              </OutlinedButton>
            </>
          ) : (
            <>
              <OutlinedButton
                variant="ghost"
                size="md"
                className="btn-icon"
                onClick={cancelRecording}
                title="Discard"
              >
                <Trash2 size={18} color="var(--color-danger)" />
              </OutlinedButton>

              <OutlinedButton
                variant="secondary"
                size="md"
                onClick={togglePreview}
                icon={isPlayingPreview ? <Pause size={18} /> : <Play size={18} />}
              >
                {isPlayingPreview ? 'Pause' : 'Play Preview'}
              </OutlinedButton>

              <OutlinedButton
                variant="primary"
                size="md"
                onClick={handleSend}
                isLoading={isSending}
                icon={<Send size={16} />}
              >
                Send Voice Note
              </OutlinedButton>
            </>
          )}
        </div>
      </div>
    </Modal>
  );
};
