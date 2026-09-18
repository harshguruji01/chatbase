import React from 'react';
import { Globe, Heart, Shield, Sparkles, ExternalLink } from 'lucide-react';
import { Modal } from '../common/Modal';
import { BrandHeader } from '../common/BrandHeader';
import { OutlinedButton } from '../common/OutlinedButton';

interface AboutModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AboutModal: React.FC<AboutModalProps> = ({ isOpen, onClose }) => {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title="About ChatBase">
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', gap: '16px' }}>
        <BrandHeader size="lg" showSubtitle={false} />

        <div>
          <h4 style={{ fontSize: '1.15rem', fontWeight: 700, marginBottom: '4px' }}>
            ChatBase v1.0.0
          </h4>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.88rem' }}>
            Production-grade social chat platform engineered for seamless connection.
          </p>
        </div>

        <div
          style={{
            background: 'var(--bg-input)',
            border: '1px solid var(--border-color)',
            borderRadius: 'var(--radius-md)',
            padding: '16px',
            width: '100%',
            display: 'flex',
            flexDirection: 'column',
            gap: '10px',
            textAlign: 'left',
            fontSize: '0.85rem',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Sparkles size={16} color="var(--color-primary)" />
            <span><strong>Nearby Discovery:</strong> Privacy-preserving location search</span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Shield size={16} color="var(--color-success)" />
            <span><strong>30-Day Auto Cleanup:</strong> Automated scheduled message expiration</span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Heart size={16} color="var(--color-pink)" />
            <span><strong>Rich Media:</strong> 60-second voice notes & 10 MB video sharing</span>
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', width: '100%', alignItems: 'center' }}>
          <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
            Developed with excellence by:
          </span>
          <strong style={{ fontSize: '1.05rem', color: 'var(--text-primary)' }}>
            HarshGuruJi
          </strong>

          <a
            href="https://www.webguruji.online"
            target="_blank"
            rel="noopener noreferrer"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              color: 'var(--color-primary)',
              fontWeight: 600,
              fontSize: '0.9rem',
              textDecoration: 'none',
              marginTop: '4px',
            }}
          >
            <Globe size={16} />
            <span>www.webguruji.online</span>
            <ExternalLink size={14} />
          </a>
        </div>

        <div style={{ width: '100%', marginTop: '12px' }}>
          <OutlinedButton variant="secondary" onClick={onClose} style={{ width: '100%' }}>
            Close
          </OutlinedButton>
        </div>
      </div>
    </Modal>
  );
};
