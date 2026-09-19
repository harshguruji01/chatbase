import React, { useState, useEffect } from 'react';
import { X, Send } from 'lucide-react';
import { Modal } from '../common/Modal';
import { OutlinedButton } from '../common/OutlinedButton';

interface ImagePreviewModalProps {
  isOpen: boolean;
  imageFile: File | null;
  onClose: () => void;
  onSendImage: (file: File, caption: string) => Promise<void>;
}

export const ImagePreviewModal: React.FC<ImagePreviewModalProps> = ({
  isOpen,
  imageFile,
  onClose,
  onSendImage,
}) => {
  const [caption, setCaption] = useState('');
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isSending, setIsSending] = useState(false);

  useEffect(() => {
    if (imageFile) {
      const url = URL.createObjectURL(imageFile);
      setPreviewUrl(url);
      setCaption('');
      return () => URL.revokeObjectURL(url);
    } else {
      setPreviewUrl(null);
    }
  }, [imageFile]);

  const handleSend = async () => {
    if (!imageFile || isSending) return;
    setIsSending(true);
    try {
      await onSendImage(imageFile, caption.trim());
      onClose();
    } finally {
      setIsSending(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSend();
    }
  };

  if (!isOpen || !imageFile || !previewUrl) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Send Photo">
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {/* Photo Preview Container */}
        <div
          style={{
            position: 'relative',
            maxHeight: '360px',
            width: '100%',
            overflow: 'hidden',
            borderRadius: '16px',
            background: 'var(--bg-input)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            border: '1px solid var(--border-color)',
          }}
        >
          <img
            src={previewUrl}
            alt="Preview"
            style={{
              maxWidth: '100%',
              maxHeight: '340px',
              objectFit: 'contain',
              borderRadius: '14px',
            }}
          />

          {/* Quick Discard Cross */}
          <button
            onClick={onClose}
            style={{
              position: 'absolute',
              top: '10px',
              right: '10px',
              background: 'rgba(0, 0, 0, 0.65)',
              border: 'none',
              borderRadius: '50%',
              width: '32px',
              height: '32px',
              color: '#ffffff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              backdropFilter: 'blur(4px)',
            }}
            title="Cancel"
          >
            <X size={18} />
          </button>
        </div>

        {/* Caption Input */}
        <div className="input-wrapper">
          <input
            type="text"
            className="input-field"
            placeholder="Add a caption... (optional)"
            value={caption}
            onChange={(e) => setCaption(e.target.value)}
            onKeyDown={handleKeyDown}
            autoFocus
          />
        </div>

        {/* Footer Actions */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
          <OutlinedButton variant="secondary" onClick={onClose} disabled={isSending}>
            Cancel
          </OutlinedButton>
          <OutlinedButton
            variant="primary"
            onClick={handleSend}
            isLoading={isSending}
            icon={<Send size={16} />}
          >
            Send Photo
          </OutlinedButton>
        </div>
      </div>
    </Modal>
  );
};
