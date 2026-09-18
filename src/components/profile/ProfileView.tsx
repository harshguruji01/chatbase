import React, { useState, useEffect } from 'react';
import {
  Copy,
  Edit3,
  Shield,
  Moon,
  Sun,
  Laptop,
  LogOut,
  Info,
  Trash2,
  Check,
  ShieldAlert,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { Avatar } from '../common/Avatar';
import { OutlinedButton } from '../common/OutlinedButton';
import { EditProfileModal } from './EditProfileModal';
import { PrivacySettingsModal } from './PrivacySettingsModal';
import { AboutModal } from './AboutModal';
import { Modal } from '../common/Modal';
import { copyToClipboard } from '../../lib/utils';
import { supabase } from '../../lib/supabase';
import type { Profile } from '../../types';
import { useToast } from '../common/Toast';

interface ProfileViewProps {
  onGoToAdmin?: () => void;
}

export const ProfileView: React.FC<ProfileViewProps> = ({ onGoToAdmin }) => {
  const { profile, signOut, deleteAccount, isAdmin } = useAuth();
  const { theme, setTheme } = useTheme();
  const { showToast } = useToast();

  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isPrivacyOpen, setIsPrivacyOpen] = useState(false);
  const [isAboutOpen, setIsAboutOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [copiedId, setCopiedId] = useState(false);

  const [followersCount, setFollowersCount] = useState(0);
  const [followingCount, setFollowingCount] = useState(0);
  const [showFollowListModal, setShowFollowListModal] = useState<'followers' | 'following' | null>(null);
  const [followListUsers, setFollowListUsers] = useState<Profile[]>([]);
  const [isLoadingFollows, setIsLoadingFollows] = useState(false);

  useEffect(() => {
    if (!profile) return;

    // Fetch counts
    supabase
      .from('follows')
      .select('id', { count: 'exact', head: true })
      .eq('following_id', profile.id)
      .then(({ count }) => setFollowersCount(count || 0));

    supabase
      .from('follows')
      .select('id', { count: 'exact', head: true })
      .eq('follower_id', profile.id)
      .then(({ count }) => setFollowingCount(count || 0));
  }, [profile]);

  const handleCopyCode = async () => {
    if (profile?.user_code) {
      await copyToClipboard(profile.user_code);
      setCopiedId(true);
      showToast(`Copied User ID: ${profile.user_code}`, 'success');
      setTimeout(() => setCopiedId(false), 2000);
    }
  };

  const loadFollowList = async (type: 'followers' | 'following') => {
    if (!profile) return;
    setShowFollowListModal(type);
    setIsLoadingFollows(true);
    try {
      if (type === 'followers') {
        const { data } = await supabase
          .from('follows')
          .select('profiles:follower_id(*)')
          .eq('following_id', profile.id);
        setFollowListUsers((data || []).map((row: any) => row.profiles).filter(Boolean));
      } else {
        const { data } = await supabase
          .from('follows')
          .select('profiles:following_id(*)')
          .eq('follower_id', profile.id);
        setFollowListUsers((data || []).map((row: any) => row.profiles).filter(Boolean));
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoadingFollows(false);
    }
  };

  const handleDeleteAccount = async () => {
    const { error } = await deleteAccount();
    if (error) {
      showToast(error, 'error');
    } else {
      showToast('Account permanently deleted.', 'info');
    }
  };

  if (!profile) return null;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: 'var(--bg-app)', overflowY: 'auto' }}>
      <div style={{ maxWidth: '600px', width: '100%', margin: '0 auto', padding: '24px 16px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
        {/* Profile Card */}
        <div className="card" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', padding: '28px 20px', gap: '16px' }}>
          <Avatar src={profile.avatar_url} name={profile.display_name} size="xl" />

          <div>
            <h2 style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--text-primary)' }}>
              {profile.display_name}
            </h2>
            <p style={{ fontSize: '0.88rem', color: 'var(--text-secondary)', marginTop: '2px' }}>
              @{profile.username}
            </p>
          </div>

          {/* User ID Pill with 1-Click Copy */}
          <div
            onClick={handleCopyCode}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              padding: '6px 14px',
              background: 'var(--color-primary-light)',
              border: '1px solid rgba(99, 102, 241, 0.3)',
              borderRadius: 'var(--radius-full)',
              cursor: 'pointer',
              transition: 'transform 0.15s',
            }}
            title="Click to copy your User ID"
          >
            <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>ID:</span>
            <strong style={{ fontFamily: 'monospace', fontSize: '0.95rem', color: 'var(--color-primary)', letterSpacing: '0.5px' }}>
              {profile.user_code}
            </strong>
            {copiedId ? <Check size={15} color="var(--color-success)" /> : <Copy size={15} color="var(--color-primary)" />}
          </div>

          {profile.bio && (
            <p style={{ fontSize: '0.9rem', color: 'var(--text-primary)', maxWidth: '400px', lineHeight: 1.5 }}>
              {profile.bio}
            </p>
          )}

          {/* Followers & Following Counters */}
          <div style={{ display: 'flex', gap: '32px', borderTop: '1px solid var(--border-color)', borderBottom: '1px solid var(--border-color)', width: '100%', padding: '14px 0', justifyContent: 'center' }}>
            <div onClick={() => loadFollowList('followers')} style={{ cursor: 'pointer', textAlign: 'center' }}>
              <div style={{ fontSize: '1.2rem', fontWeight: 700, color: 'var(--text-primary)' }}>{followersCount}</div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Followers</div>
            </div>

            <div onClick={() => loadFollowList('following')} style={{ cursor: 'pointer', textAlign: 'center' }}>
              <div style={{ fontSize: '1.2rem', fontWeight: 700, color: 'var(--text-primary)' }}>{followingCount}</div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Following</div>
            </div>
          </div>

          {/* Edit Profile Button */}
          <OutlinedButton
            variant="secondary"
            size="md"
            onClick={() => setIsEditOpen(true)}
            icon={<Edit3 size={16} />}
            style={{ width: '100%', maxWidth: '240px' }}
          >
            Edit Profile
          </OutlinedButton>
        </div>

        {/* Admin Dashboard Entry (If role = admin) */}
        {isAdmin && onGoToAdmin && (
          <div
            className="card"
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '16px 20px',
              border: '1px solid var(--color-primary)',
              background: 'rgba(99, 102, 241, 0.08)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <ShieldAlert size={22} color="var(--color-primary)" />
              <div>
                <span style={{ fontWeight: 700, fontSize: '0.95rem' }}>Admin Dashboard</span>
                <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', margin: 0 }}>
                  Manage platform users, metrics, abuse reports & system logs.
                </p>
              </div>
            </div>
            <OutlinedButton variant="primary" size="sm" onClick={onGoToAdmin}>
              Open /admin
            </OutlinedButton>
          </div>
        )}

        {/* Theme Settings Section */}
        <div className="card" style={{ padding: '18px 20px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <h4 style={{ fontSize: '0.95rem', fontWeight: 700 }}>Appearance & Theme</h4>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px' }}>
            <button
              onClick={() => setTheme('dark')}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                padding: '10px',
                borderRadius: 'var(--radius-md)',
                border: `1.5px solid ${theme === 'dark' ? 'var(--color-primary)' : 'var(--border-color)'}`,
                background: theme === 'dark' ? 'var(--color-primary-light)' : 'var(--bg-input)',
                color: theme === 'dark' ? 'var(--color-primary)' : 'var(--text-secondary)',
                fontWeight: 600,
                fontSize: '0.85rem',
                cursor: 'pointer',
              }}
            >
              <Moon size={16} /> Dark
            </button>

            <button
              onClick={() => setTheme('light')}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                padding: '10px',
                borderRadius: 'var(--radius-md)',
                border: `1.5px solid ${theme === 'light' ? 'var(--color-primary)' : 'var(--border-color)'}`,
                background: theme === 'light' ? 'var(--color-primary-light)' : 'var(--bg-input)',
                color: theme === 'light' ? 'var(--color-primary)' : 'var(--text-secondary)',
                fontWeight: 600,
                fontSize: '0.85rem',
                cursor: 'pointer',
              }}
            >
              <Sun size={16} /> Light
            </button>

            <button
              onClick={() => setTheme('system')}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                padding: '10px',
                borderRadius: 'var(--radius-md)',
                border: `1.5px solid ${theme === 'system' ? 'var(--color-primary)' : 'var(--border-color)'}`,
                background: theme === 'system' ? 'var(--color-primary-light)' : 'var(--bg-input)',
                color: theme === 'system' ? 'var(--color-primary)' : 'var(--text-secondary)',
                fontWeight: 600,
                fontSize: '0.85rem',
                cursor: 'pointer',
              }}
            >
              <Laptop size={16} /> Auto
            </button>
          </div>
        </div>

        {/* Settings Links */}
        <div className="card" style={{ padding: '8px', display: 'flex', flexDirection: 'column', gap: '2px' }}>
          <button
            onClick={() => setIsPrivacyOpen(true)}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '12px 14px',
              borderRadius: 'var(--radius-md)',
              border: 'none',
              background: 'transparent',
              color: 'var(--text-primary)',
              cursor: 'pointer',
              fontSize: '0.92rem',
              fontWeight: 500,
              width: '100%',
              textAlign: 'left',
            }}
            onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.background = 'var(--bg-card-hover)')}
            onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.background = 'transparent')}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <Shield size={18} color="var(--color-primary)" />
              <span>Privacy & Safety</span>
            </div>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Configure</span>
          </button>

          <button
            onClick={() => setIsAboutOpen(true)}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '12px 14px',
              borderRadius: 'var(--radius-md)',
              border: 'none',
              background: 'transparent',
              color: 'var(--text-primary)',
              cursor: 'pointer',
              fontSize: '0.92rem',
              fontWeight: 500,
              width: '100%',
              textAlign: 'left',
            }}
            onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.background = 'var(--bg-card-hover)')}
            onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.background = 'transparent')}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <Info size={18} color="var(--color-accent)" />
              <span>About ChatBase</span>
            </div>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Made by HarshGuruJi</span>
          </button>
        </div>

        {/* Logout and Delete Account */}
        <div style={{ display: 'flex', gap: '12px', marginTop: '10px' }}>
          <OutlinedButton
            variant="secondary"
            size="md"
            onClick={signOut}
            icon={<LogOut size={16} />}
            style={{ flex: 1 }}
          >
            Logout
          </OutlinedButton>

          <OutlinedButton
            variant="danger"
            size="md"
            onClick={() => setIsDeleteModalOpen(true)}
            icon={<Trash2 size={16} />}
            style={{ flex: 1 }}
          >
            Delete Account
          </OutlinedButton>
        </div>
      </div>

      {/* Modals */}
      <EditProfileModal isOpen={isEditOpen} onClose={() => setIsEditOpen(false)} />
      <PrivacySettingsModal isOpen={isPrivacyOpen} onClose={() => setIsPrivacyOpen(false)} />
      <AboutModal isOpen={isAboutOpen} onClose={() => setIsAboutOpen(false)} />

      {/* Delete Account Confirmation Modal */}
      <Modal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        title="Delete ChatBase Account?"
      >
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', lineHeight: 1.5, marginBottom: '20px' }}>
          This will permanently remove your profile, conversations, followers, and media from ChatBase. This action cannot be undone.
        </p>
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
          <OutlinedButton variant="secondary" onClick={() => setIsDeleteModalOpen(false)}>
            Cancel
          </OutlinedButton>
          <OutlinedButton variant="danger" onClick={handleDeleteAccount}>
            Permanently Delete
          </OutlinedButton>
        </div>
      </Modal>

      {/* Follow List Modal */}
      <Modal
        isOpen={showFollowListModal !== null}
        onClose={() => setShowFollowListModal(null)}
        title={showFollowListModal === 'followers' ? 'Followers' : 'Following'}
      >
        {isLoadingFollows ? (
          <p style={{ textAlign: 'center', padding: '20px', color: 'var(--text-muted)' }}>Loading...</p>
        ) : followListUsers.length === 0 ? (
          <p style={{ textAlign: 'center', padding: '20px', color: 'var(--text-muted)' }}>
            No {showFollowListModal} yet.
          </p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', maxHeight: '300px', overflowY: 'auto' }}>
            {followListUsers.map((u) => (
              <div key={u.id} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '8px' }}>
                <Avatar src={u.avatar_url} name={u.display_name} size="md" />
                <div>
                  <div style={{ fontWeight: 600 }}>{u.display_name}</div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>@{u.username} • {u.user_code}</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </Modal>
    </div>
  );
};
