import React, { useState } from 'react';
import { MapPin, ShieldCheck, Navigation } from 'lucide-react';
import { Modal } from '../common/Modal';
import { OutlinedButton } from '../common/OutlinedButton';
import { getCurrentPosition } from '../../lib/location';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../common/Toast';

interface LocationPermissionModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const LocationPermissionModal: React.FC<LocationPermissionModalProps> = ({
  isOpen,
  onClose,
}) => {
  const { updateLocation } = useAuth();
  const { showToast } = useToast();
  const [isLoading, setIsLoading] = useState(false);

  const handleAllowLocation = async () => {
    setIsLoading(true);
    try {
      const pos = await getCurrentPosition();
      await updateLocation(pos.latitude, pos.longitude);
      showToast('Location permission granted! Nearby people enabled.', 'success');
      localStorage.setItem('chatbase_location_prompted', 'true');
      onClose();
    } catch (err: any) {
      showToast(err.message || 'Location access denied. App will continue working.', 'info');
      localStorage.setItem('chatbase_location_prompted', 'true');
      onClose();
    } finally {
      setIsLoading(false);
    }
  };

  const handleSkip = () => {
    localStorage.setItem('chatbase_location_prompted', 'true');
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={handleSkip} title="Discover People Nearby">
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', gap: '16px' }}>
        <div
          style={{
            width: '64px',
            height: '64px',
            borderRadius: '50%',
            background: 'var(--color-primary-light)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'var(--color-primary)',
          }}
        >
          <MapPin size={32} />
        </div>

        <div>
          <h4 style={{ fontSize: '1.15rem', fontWeight: 700, marginBottom: '6px' }}>
            Allow Location Access
          </h4>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', lineHeight: 1.5 }}>
            Allow ChatBase to access your location to help you discover people nearby and connect with users in your area.
          </p>
        </div>

        <div
          style={{
            background: 'var(--bg-input)',
            border: '1px solid var(--border-color)',
            borderRadius: 'var(--radius-md)',
            padding: '12px 16px',
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            textAlign: 'left',
            width: '100%',
          }}
        >
          <ShieldCheck size={20} color="var(--color-success)" style={{ flexShrink: 0 }} />
          <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
            <strong>Privacy Protected:</strong> Your exact GPS coordinates and address are never revealed. Other users only see an approximate distance (e.g. ~2 km).
          </span>
        </div>

        <div style={{ display: 'flex', gap: '12px', width: '100%', marginTop: '8px' }}>
          <OutlinedButton
            variant="secondary"
            onClick={handleSkip}
            style={{ flex: 1 }}
          >
            Not Now
          </OutlinedButton>
          <OutlinedButton
            variant="primary"
            onClick={handleAllowLocation}
            isLoading={isLoading}
            icon={<Navigation size={16} />}
            style={{ flex: 1.4 }}
          >
            Allow Location
          </OutlinedButton>
        </div>
      </div>
    </Modal>
  );
};
