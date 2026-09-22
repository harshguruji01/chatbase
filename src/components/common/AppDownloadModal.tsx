import React from 'react';
import { Download, Mic, Compass, Bell, Shield, ExternalLink, Sparkles } from 'lucide-react';
import { Modal } from './Modal';
import { OutlinedButton } from './OutlinedButton';

interface AppDownloadModalProps {
  isOpen: boolean;
  onClose: () => void;
  feature?: 'voice' | 'radar' | 'general';
}

export const AppDownloadModal: React.FC<AppDownloadModalProps> = ({
  isOpen,
  onClose,
  feature = 'general',
}) => {
  const storeUrl = 'https://webguruji.online/store-detail.html?slug=chatbase';

  const handleDownload = () => {
    window.location.href = storeUrl;
  };

  const getFeatureHeadline = () => {
    switch (feature) {
      case 'voice':
        return {
          badge: '🎙️ Voice Notes Exclusive',
          title: 'HD Voice Notes are Android App Exclusive',
          desc: 'To ensure crystal-clear studio audio, live interactive waveforms, and background playback, voice recording is engineered exclusively for the ChatBase Android App.',
        };
      case 'radar':
        return {
          badge: '🧭 Radar Scanner Exclusive',
          title: 'Nearby GPS Radar is Android App Exclusive',
          desc: 'Live proximity discovery requires native smartphone GPS hardware sensors to accurately scan and ping active users within your 100km radius.',
        };
      default:
        return {
          badge: '✨ Get the Native Experience',
          title: 'Unlock Full Power with ChatBase Android',
          desc: 'The web version provides essential messaging, but the Android APK unlocks our most powerful, hardware-accelerated communication features.',
        };
    }
  };

  const info = getFeatureHeadline();

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="ChatBase for Android">
      <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
        {/* Top Promotional Header */}
        <div
          style={{
            background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.15), rgba(168, 85, 247, 0.2))',
            border: '1px solid rgba(99, 102, 241, 0.3)',
            borderRadius: 'var(--radius-lg)',
            padding: '18px',
            textAlign: 'center',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '8px',
          }}
        >
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '4px 12px',
              background: 'var(--color-primary)',
              color: '#ffffff',
              borderRadius: 'var(--radius-full)',
              fontSize: '0.75rem',
              fontWeight: 700,
              textTransform: 'uppercase',
              letterSpacing: '0.5px',
            }}
          >
            <Sparkles size={13} />
            {info.badge}
          </div>

          <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--text-primary)', marginTop: '4px' }}>
            {info.title}
          </h3>

          <p style={{ fontSize: '0.86rem', color: 'var(--text-secondary)', lineHeight: 1.5, maxWidth: '420px' }}>
            {info.desc}
          </p>
        </div>

        {/* Feature Grid Comparison */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
          <div
            style={{
              padding: '12px',
              background: 'var(--bg-input)',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--border-color)',
              display: 'flex',
              flexDirection: 'column',
              gap: '4px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--color-primary)' }}>
              <Mic size={18} />
              <strong style={{ fontSize: '0.85rem' }}>HD Voice Notes</strong>
            </div>
            <p style={{ fontSize: '0.76rem', color: 'var(--text-muted)', margin: 0 }}>
              Live waveforms & studio noise cancellation.
            </p>
          </div>

          <div
            style={{
              padding: '12px',
              background: 'var(--bg-input)',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--border-color)',
              display: 'flex',
              flexDirection: 'column',
              gap: '4px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--color-accent)' }}>
              <Compass size={18} />
              <strong style={{ fontSize: '0.85rem' }}>Live GPS Radar</strong>
            </div>
            <p style={{ fontSize: '0.76rem', color: 'var(--text-muted)', margin: 0 }}>
              Scan chatmates nearby in real time.
            </p>
          </div>

          <div
            style={{
              padding: '12px',
              background: 'var(--bg-input)',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--border-color)',
              display: 'flex',
              flexDirection: 'column',
              gap: '4px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#10B981' }}>
              <Bell size={18} />
              <strong style={{ fontSize: '0.85rem' }}>Push Notifications</strong>
            </div>
            <p style={{ fontSize: '0.76rem', color: 'var(--text-muted)', margin: 0 }}>
              Instant alerts even when phone is locked.
            </p>
          </div>

          <div
            style={{
              padding: '12px',
              background: 'var(--bg-input)',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--border-color)',
              display: 'flex',
              flexDirection: 'column',
              gap: '4px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#F59E0B' }}>
              <Shield size={18} />
              <strong style={{ fontSize: '0.85rem' }}>Hardware Biometrics</strong>
            </div>
            <p style={{ fontSize: '0.76rem', color: 'var(--text-muted)', margin: 0 }}>
              Fingerprint chat security & 120Hz speed.
            </p>
          </div>
        </div>

        {/* CTA Buttons */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '6px' }}>
          <button
            onClick={handleDownload}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '10px',
              padding: '14px',
              background: 'linear-gradient(135deg, #6366F1, #8B5CF6)',
              color: '#ffffff',
              border: 'none',
              borderRadius: 'var(--radius-md)',
              fontWeight: 700,
              fontSize: '0.95rem',
              cursor: 'pointer',
              boxShadow: '0 4px 14px rgba(99, 102, 241, 0.4)',
              transition: 'transform 0.15s ease',
            }}
            onMouseDown={(e) => (e.currentTarget.style.transform = 'scale(0.98)')}
            onMouseUp={(e) => (e.currentTarget.style.transform = 'scale(1)')}
          >
            <Download size={20} />
            <span>Download ChatBase App (Official)</span>
          </button>

          <a
            href={storeUrl}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
              padding: '10px',
              background: 'transparent',
              color: 'var(--text-secondary)',
              border: 'none',
              borderRadius: 'var(--radius-md)',
              fontSize: '0.82rem',
              textDecoration: 'none',
              cursor: 'pointer',
            }}
          >
            <ExternalLink size={14} />
            <span>Open in WebGuruJi Store ↗</span>
          </a>

          <OutlinedButton variant="secondary" onClick={onClose} style={{ marginTop: '2px' }}>
            Continue with Web Limitations
          </OutlinedButton>
        </div>
      </div>
    </Modal>
  );
};
