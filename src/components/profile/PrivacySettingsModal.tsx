import React, { useState, useEffect } from 'react';
import { Eye, MapPin, Lock, Ban, Check, UserX } from 'lucide-react';
import { Modal } from '../common/Modal';
import { OutlinedButton } from '../common/OutlinedButton';
import { useAuth } from '../../context/AuthContext';
import { useChat } from '../../context/ChatContext';
import { supabase } from '../../lib/supabase';
import type { Profile } from '../../types';
import { Avatar } from '../common/Avatar';
import { useToast } from '../common/Toast';

interface PrivacySettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const PrivacySettingsModal: React.FC<PrivacySettingsModalProps> = ({ isOpen, onClose }) => {
  const { profile, updateProfile } = useAuth();
  const { blockedUserIds, unblockUser } = useChat();
  const { showToast } = useToast();

  const [appearNearby, setAppearNearby] = useState(profile?.appear_in_nearby ?? true);
  const [showOnline, setShowOnline] = useState(profile?.show_online_status ?? true);
  const [isPrivate, setIsPrivate] = useState(profile?.is_private ?? false);
  const [blockedProfiles, setBlockedProfiles] = useState<Profile[]>([]);
  const [isLoadingBlocks, setIsLoadingBlocks] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (isOpen && blockedUserIds.length > 0) {
      setIsLoadingBlocks(true);
      supabase
        .from('profiles')
        .select('*')
        .in('id', blockedUserIds)
        .then(({ data }) => {
          if (data) setBlockedProfiles(data as Profile[]);
          setIsLoadingBlocks(false);
        });
    } else {
      setBlockedProfiles([]);
    }
  }, [isOpen, blockedUserIds]);

  const handleToggleSave = async () => {
    setIsSaving(true);
    const { error } = await updateProfile({
      appear_in_nearby: appearNearby,
      show_online_status: showOnline,
      is_private: isPrivate,
    });
    setIsSaving(false);

    if (error) {
      showToast(error, 'error');
    } else {
      showToast('Privacy preferences updated!', 'success');
      onClose();
    }
  };

  const handleUnblock = async (userId: string, username: string) => {
    const { error } = await unblockUser(userId);
    if (error) {
      showToast(error, 'error');
    } else {
      setBlockedProfiles((prev) => prev.filter((p) => p.id !== userId));
      showToast(`Unblocked @${username}`, 'success');
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Privacy & Safety Settings" maxWidth="520px">
      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        {/* Toggle Items */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          {/* Appear in Nearby People */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '12px 14px',
              borderRadius: 'var(--radius-md)',
              background: 'var(--bg-input)',
              border: '1px solid var(--border-color)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <MapPin size={20} color="var(--color-primary)" />
              <div>
                <span style={{ fontWeight: 600, fontSize: '0.92rem' }}>Appear in Nearby People</span>
                <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', margin: 0 }}>
                  Allow nearby users to discover your profile with approximate distance.
                </p>
              </div>
            </div>
            <input
              type="checkbox"
              checked={appearNearby}
              onChange={(e) => setAppearNearby(e.target.checked)}
              style={{ width: '20px', height: '20px', cursor: 'pointer', accentColor: 'var(--color-primary)' }}
            />
          </div>

          {/* Show Online Status */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '12px 14px',
              borderRadius: 'var(--radius-md)',
              background: 'var(--bg-input)',
              border: '1px solid var(--border-color)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <Eye size={20} color="var(--color-success)" />
              <div>
                <span style={{ fontWeight: 600, fontSize: '0.92rem' }}>Show Online Status</span>
                <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', margin: 0 }}>
                  Show a green dot and active timestamp when you are using ChatBase.
                </p>
              </div>
            </div>
            <input
              type="checkbox"
              checked={showOnline}
              onChange={(e) => setShowOnline(e.target.checked)}
              style={{ width: '20px', height: '20px', cursor: 'pointer', accentColor: 'var(--color-primary)' }}
            />
          </div>

          {/* Private Account */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '12px 14px',
              borderRadius: 'var(--radius-md)',
              background: 'var(--bg-input)',
              border: '1px solid var(--border-color)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <Lock size={20} color="var(--color-accent)" />
              <div>
                <span style={{ fontWeight: 600, fontSize: '0.92rem' }}>Private Account</span>
                <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', margin: 0 }}>
                  Require your approval for new follow requests before they can follow you.
                </p>
              </div>
            </div>
            <input
              type="checkbox"
              checked={isPrivate}
              onChange={(e) => setIsPrivate(e.target.checked)}
              style={{ width: '20px', height: '20px', cursor: 'pointer', accentColor: 'var(--color-primary)' }}
            />
          </div>
        </div>

        {/* Blocked Users Section */}
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
            <Ban size={18} color="var(--color-danger)" />
            <h4 style={{ fontSize: '0.95rem', fontWeight: 700 }}>Blocked Users ({blockedProfiles.length})</h4>
          </div>

          {isLoadingBlocks ? (
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Loading blocked list...</p>
          ) : blockedProfiles.length === 0 ? (
            <div
              style={{
                padding: '14px',
                borderRadius: 'var(--radius-md)',
                background: 'var(--bg-input)',
                border: '1px solid var(--border-color)',
                textAlign: 'center',
                fontSize: '0.82rem',
                color: 'var(--text-muted)',
              }}
            >
              No blocked users.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '160px', overflowY: 'auto' }}>
              {blockedProfiles.map((b) => (
                <div
                  key={b.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '8px 12px',
                    borderRadius: 'var(--radius-sm)',
                    background: 'var(--bg-input)',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Avatar src={b.avatar_url} name={b.display_name} size="sm" />
                    <span style={{ fontSize: '0.88rem', fontWeight: 600 }}>{b.display_name}</span>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>@{b.username}</span>
                  </div>

                  <OutlinedButton
                    variant="danger"
                    size="sm"
                    onClick={() => handleUnblock(b.id, b.username)}
                    icon={<UserX size={12} />}
                  >
                    Unblock
                  </OutlinedButton>
                </div>
              ))}
            </div>
          )}
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', borderTop: '1px solid var(--border-color)', paddingTop: '14px' }}>
          <OutlinedButton variant="secondary" onClick={onClose}>
            Cancel
          </OutlinedButton>
          <OutlinedButton variant="primary" onClick={handleToggleSave} isLoading={isSaving} icon={<Check size={16} />}>
            Save Preferences
          </OutlinedButton>
        </div>
      </div>
    </Modal>
  );
};
