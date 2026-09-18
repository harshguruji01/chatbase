import React, { useState, useRef } from 'react';
import { Upload, Send, Trash2, AlertCircle } from 'lucide-react';
import { Modal } from '../common/Modal';
import { OutlinedButton } from '../common/OutlinedButton';
import { formatBytes } from '../../lib/utils';
import { useToast } from '../common/Toast';

interface VideoUploaderModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSendVideo: (file: File) => Promise<void>;
  uploadProgress: number | null;
}

export const VideoUploaderModal: React.FC<VideoUploaderModalProps> = ({
  isOpen,
  onClose,
  onSendVideo,
  uploadProgress,
}) => {
  const { showToast } = useToast();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [videoPreviewUrl, setVideoPreviewUrl] = useState<string | null>(null);
  const [isSending, setIsSending] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];

      // Client-side 10 MB limit enforcement
      if (file.size > 10 * 1024 * 1024) {
        showToast('Video size exceeds 10 MB limit. Please select a smaller file.', 'error');
        return;
      }

      if (!file.type.startsWith('video/')) {
        showToast('Please select a valid video file (MP4, WebM, etc.).', 'error');
        return;
      }

      setSelectedFile(file);
      setVideoPreviewUrl(URL.createObjectURL(file));
    }
  };

  const handleSend = async () => {
    if (!selectedFile) return;
    setIsSending(true);
    try {
      await onSendVideo(selectedFile);
      cleanup();
      onClose();
    } catch (err: any) {
      showToast(err.message || 'Video upload failed. You can retry.', 'error');
    } finally {
      setIsSending(false);
    }
  };

  const cleanup = () => {
    if (videoPreviewUrl) {
      URL.revokeObjectURL(videoPreviewUrl);
    }
    setSelectedFile(null);
    setVideoPreviewUrl(null);
    setIsSending(false);
  };

  return (
    <Modal isOpen={isOpen} onClose={() => { cleanup(); onClose(); }} title="Send Video (Max 10 MB)">
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {!selectedFile ? (
          <div
            onClick={() => fileInputRef.current?.click()}
            style={{
              border: '2px dashed var(--border-color)',
              borderRadius: 'var(--radius-lg)',
              padding: '36px 20px',
              textAlign: 'center',
              cursor: 'pointer',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '12px',
              background: 'var(--bg-input)',
              transition: 'border-color 0.2s',
            }}
          >
            <div
              style={{
                width: '56px',
                height: '56px',
                borderRadius: '50%',
                background: 'var(--color-primary-light)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--color-primary)',
              }}
            >
              <Upload size={28} />
            </div>
            <div>
              <p style={{ fontWeight: 600, fontSize: '0.95rem' }}>Click or drag a video to upload</p>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem', marginTop: '4px' }}>
                MP4 or WebM under 10 MB
              </p>
            </div>
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileSelect}
              accept="video/mp4,video/webm,video/quicktime"
              style={{ display: 'none' }}
            />
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div
              style={{
                width: '100%',
                borderRadius: 'var(--radius-md)',
                overflow: 'hidden',
                background: '#000',
                maxHeight: '260px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <video
                src={videoPreviewUrl!}
                controls
                style={{ width: '100%', maxHeight: '260px', objectFit: 'contain' }}
              />
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.85rem' }}>
              <span style={{ color: 'var(--text-secondary)' }}>{selectedFile.name}</span>
              <strong style={{ color: 'var(--color-primary)' }}>{formatBytes(selectedFile.size)}</strong>
            </div>

            {uploadProgress !== null && (
              <div style={{ width: '100%' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', marginBottom: '4px' }}>
                  <span>Uploading video...</span>
                  <span>{uploadProgress}%</span>
                </div>
                <div
                  style={{
                    width: '100%',
                    height: '6px',
                    background: 'var(--border-color)',
                    borderRadius: '4px',
                    overflow: 'hidden',
                  }}
                >
                  <div
                    style={{
                      height: '100%',
                      width: `${uploadProgress}%`,
                      background: 'var(--gradient-brand)',
                      transition: 'width 0.2s ease',
                    }}
                  />
                </div>
              </div>
            )}

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '8px' }}>
              <OutlinedButton
                variant="secondary"
                size="md"
                onClick={cleanup}
                icon={<Trash2 size={16} />}
                disabled={isSending}
              >
                Change Video
              </OutlinedButton>

              <OutlinedButton
                variant="primary"
                size="md"
                onClick={handleSend}
                isLoading={isSending}
                icon={<Send size={16} />}
              >
                Send Video
              </OutlinedButton>
            </div>
          </div>
        )}

        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            fontSize: '0.78rem',
            color: 'var(--text-muted)',
            padding: '8px',
            background: 'var(--bg-input)',
            borderRadius: 'var(--radius-sm)',
          }}
        >
          <AlertCircle size={15} style={{ flexShrink: 0 }} />
          <span>Server and client security will automatically reject any video larger than 10 MB.</span>
        </div>
      </div>
    </Modal>
  );
};
