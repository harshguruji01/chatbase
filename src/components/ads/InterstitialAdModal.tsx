import React, { useState, useEffect } from 'react';
import { Sparkles, Download, Star, ArrowRight } from 'lucide-react';
import { Modal } from '../common/Modal';
import { AD_CONFIG } from '../../config/ads';

interface InterstitialAdModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const InterstitialAdModal: React.FC<InterstitialAdModalProps> = ({ isOpen, onClose }) => {
  const [countdown, setCountdown] = useState(5);
  const [canSkip, setCanSkip] = useState(false);

  useEffect(() => {
    if (!isOpen) {
      setCountdown(5);
      setCanSkip(false);
      return;
    }

    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          setCanSkip(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isOpen]);

  if (!isOpen) return null;

  const handleAction = () => {
    window.open(AD_CONFIG.defaultTargetUrl, '_blank', 'noopener,noreferrer');
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={canSkip ? onClose : () => {}} title="Sponsored Feature">
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', textAlign: 'center' }}>
        {/* Top Ad Timer Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span
            style={{
              padding: '3px 8px',
              borderRadius: '4px',
              fontSize: '0.72rem',
              fontWeight: 800,
              background: 'var(--color-primary)',
              color: '#ffffff',
            }}
          >
            Ad • Interstitial
          </span>

          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
            {canSkip ? (
              <button
                onClick={onClose}
                style={{
                  background: 'var(--bg-input)',
                  border: '1px solid var(--border-color)',
                  color: 'var(--text-primary)',
                  padding: '4px 10px',
                  borderRadius: 'var(--radius-full)',
                  cursor: 'pointer',
                  fontWeight: 600,
                  fontSize: '0.78rem',
                }}
              >
                Skip Ad ✕
              </button>
            ) : (
              <span>Close in {countdown}s...</span>
            )}
          </div>
        </div>

        {/* Featured App Showcase Card */}
        <div
          onClick={handleAction}
          style={{
            background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.15), rgba(168, 85, 247, 0.2))',
            border: '1.5px solid rgba(99, 102, 241, 0.35)',
            borderRadius: 'var(--radius-lg)',
            padding: '24px 16px',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '12px',
            cursor: 'pointer',
          }}
        >
          <div
            style={{
              width: '64px',
              height: '64px',
              borderRadius: '16px',
              background: 'linear-gradient(135deg, #6366F1 0%, #8B5CF6 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#ffffff',
              boxShadow: '0 8px 24px rgba(99, 102, 241, 0.4)',
            }}
          >
            <Sparkles size={32} />
          </div>

          <div>
            <h3 style={{ fontSize: '1.3rem', fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>
              ChatBase Pro on WebGuruJi
            </h3>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', marginTop: '6px', fontSize: '0.82rem', color: '#F59E0B' }}>
              <Star size={14} fill="#F59E0B" />
              <strong>4.9 ★ Rating</strong>
              <span style={{ color: 'var(--text-muted)' }}>• Official App Release</span>
            </div>
            <p style={{ fontSize: '0.88rem', color: 'var(--text-secondary)', marginTop: '8px', lineHeight: 1.5, maxWidth: '340px' }}>
              Experience next-generation private messaging with real-time GPS Radar, studio Voice Notes, and instant cloud sync!
            </p>
          </div>

          <button
            onClick={handleAction}
            style={{
              width: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '10px',
              padding: '14px',
              background: 'linear-gradient(135deg, #6366F1, #8B5CF6)',
              color: '#ffffff',
              border: 'none',
              borderRadius: 'var(--radius-md)',
              fontWeight: 800,
              fontSize: '0.96rem',
              cursor: 'pointer',
              boxShadow: '0 4px 16px rgba(99, 102, 241, 0.45)',
              marginTop: '8px',
            }}
          >
            <Download size={20} />
            <span>Install & Open WebGuruJi Store</span>
            <ArrowRight size={18} />
          </button>
        </div>
      </div>
    </Modal>
  );
};
