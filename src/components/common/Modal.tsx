import React, { useEffect } from 'react';
import { X } from 'lucide-react';
import { OutlinedButton } from './OutlinedButton';
import { useBackButton } from '../../lib/useBackButton';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  maxWidth?: string;
}

export const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  title,
  children,
  maxWidth = '460px',
}) => {
  // Automatically intercept hardware / browser back button to close modal
  useBackButton(onClose, isOpen, 100);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal-content fade-in-up"
        style={{ maxWidth }}
        onClick={(e) => e.stopPropagation()}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: '18px',
            borderBottom: '1px solid var(--border-color)',
            paddingBottom: '14px',
          }}
        >
          <h3 style={{ fontFamily: 'var(--font-brand)', fontSize: '1.2rem', fontWeight: 700 }}>
            {title}
          </h3>
          <OutlinedButton
            variant="ghost"
            size="sm"
            className="btn-icon"
            onClick={onClose}
            aria-label="Close"
          >
            <X size={18} />
          </OutlinedButton>
        </div>

        <div>{children}</div>
      </div>
    </div>
  );
};
