import React, { useEffect } from 'react';
import { X, Download } from 'lucide-react';
import { useBackButton } from '../../lib/useBackButton';

interface ImageLightboxModalProps {
  isOpen: boolean;
  imageUrl: string | null;
  caption?: string | null;
  senderName?: string;
  timestamp?: string;
  onClose: () => void;
}

export const ImageLightboxModal: React.FC<ImageLightboxModalProps> = ({
  isOpen,
  imageUrl,
  caption,
  senderName,
  timestamp,
  onClose,
}) => {
  // Automatically intercept hardware / browser back button to close lightbox
  useBackButton(onClose, isOpen, 110);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen || !imageUrl) return null;

  const handleDownload = async (e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      const response = await fetch(imageUrl);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `chatbase-photo-${Date.now()}.jpg`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch {
      window.open(imageUrl, '_blank');
    }
  };

  return (
    <div
      className="ig-lightbox-backdrop fade-in-up"
      onClick={onClose}
    >
      {/* Top Bar */}
      <div
        style={{
          position: 'absolute',
          top: '20px',
          left: '20px',
          right: '20px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          color: '#ffffff',
          zIndex: 210,
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div>
          {senderName && (
            <div style={{ fontWeight: 700, fontSize: '1rem' }}>{senderName}</div>
          )}
          {timestamp && (
            <div style={{ fontSize: '0.8rem', opacity: 0.7 }}>{timestamp}</div>
          )}
        </div>

        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
          <button
            onClick={handleDownload}
            style={{
              background: 'rgba(255, 255, 255, 0.15)',
              border: 'none',
              borderRadius: '50%',
              width: '40px',
              height: '40px',
              color: '#ffffff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              transition: 'background 0.2s',
            }}
            title="Download image"
          >
            <Download size={20} />
          </button>

          <button
            onClick={onClose}
            style={{
              background: 'rgba(255, 255, 255, 0.15)',
              border: 'none',
              borderRadius: '50%',
              width: '40px',
              height: '40px',
              color: '#ffffff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              transition: 'background 0.2s',
            }}
            title="Close"
          >
            <X size={22} />
          </button>
        </div>
      </div>

      {/* Main Image */}
      <img
        src={imageUrl}
        alt={caption || 'Chat photo'}
        className="ig-lightbox-img"
        onClick={(e) => e.stopPropagation()}
      />

      {/* Caption at bottom */}
      {caption && (
        <div
          style={{
            position: 'absolute',
            bottom: '24px',
            background: 'rgba(0, 0, 0, 0.65)',
            backdropFilter: 'blur(8px)',
            color: '#ffffff',
            padding: '10px 20px',
            borderRadius: '24px',
            maxWidth: '80%',
            textAlign: 'center',
            fontSize: '0.95rem',
          }}
          onClick={(e) => e.stopPropagation()}
        >
          {caption}
        </div>
      )}
    </div>
  );
};
