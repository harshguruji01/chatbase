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
  Lock,
  Settings,
  Users,
  User as UserIcon,
  Languages,
  Download,
  Smartphone,
} from 'lucide-react';
import { Capacitor } from '@capacitor/core';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { useLanguage } from '../../context/LanguageContext';
import { Avatar } from '../common/Avatar';
import { OutlinedButton } from '../common/OutlinedButton';
import { PrivacySettingsModal } from './PrivacySettingsModal';
import { AboutModal } from './AboutModal';
import { SettingsModal } from '../settings/SettingsModal';
import { AppDownloadModal } from '../common/AppDownloadModal';
import { Modal } from '../common/Modal';
import { copyToClipboard } from '../../lib/utils';
import { supabase } from '../../lib/supabase';
import type { Profile } from '../../types';
import { useToast } from '../common/Toast';

export const ProfileView: React.FC = () => {
  const { profile, signOut, deleteAccount } = useAuth();
  const { theme, setTheme } = useTheme();
  const { language, setLanguage, t } = useLanguage();
  const { showToast } = useToast();

  const [isDownloadOpen, setIsDownloadOpen] = useState(false);

  const [isPrivacyOpen, setIsPrivacyOpen] = useState(false);
  const [isAboutOpen, setIsAboutOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [settingsTab, setSettingsTab] = useState<'biodata' | 'password' | 'theme' | 'accounts'>('biodata');
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

          {/* Action Buttons: Edit Biodata & Settings */}
          <div style={{ display: 'flex', gap: '10px', width: '100%', maxWidth: '340px' }}>
            <OutlinedButton
              variant="secondary"
              size="md"
              onClick={() => {
                setSettingsTab('biodata');
                setIsSettingsOpen(true);
              }}
              icon={<Edit3 size={16} />}
              style={{ flex: 1 }}
            >
              Edit Biodata
            </OutlinedButton>

            <OutlinedButton
              variant="primary"
              size="md"
              onClick={() => {
                setSettingsTab('password');
                setIsSettingsOpen(true);
              }}
              icon={<Settings size={16} />}
              style={{ flex: 1 }}
            >
              Settings
            </OutlinedButton>
          </div>
        </div>

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

        {/* Language Selection Section */}
        <div className="card" style={{ padding: '18px 20px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Languages size={18} color="var(--color-primary)" />
            <h4 style={{ fontSize: '0.95rem', fontWeight: 700, margin: 0 }}>{t('language')} / Language</h4>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
            <button
              onClick={() => setLanguage('en')}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                padding: '10px',
                borderRadius: 'var(--radius-md)',
                border: `1.5px solid ${language === 'en' ? 'var(--color-primary)' : 'var(--border-color)'}`,
                background: language === 'en' ? 'var(--color-primary-light)' : 'var(--bg-input)',
                color: language === 'en' ? 'var(--color-primary)' : 'var(--text-secondary)',
                fontWeight: 600,
                fontSize: '0.88rem',
                cursor: 'pointer',
              }}
            >
              English
            </button>
            <button
              onClick={() => setLanguage('hi')}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                padding: '10px',
                borderRadius: 'var(--radius-md)',
                border: `1.5px solid ${language === 'hi' ? 'var(--color-primary)' : 'var(--border-color)'}`,
                background: language === 'hi' ? 'var(--color-primary-light)' : 'var(--bg-input)',
                color: language === 'hi' ? 'var(--color-primary)' : 'var(--text-secondary)',
                fontWeight: 600,
                fontSize: '0.88rem',
                cursor: 'pointer',
              }}
            >
              हिंदी (Hindi)
            </button>
          </div>
        </div>

        {/* Settings Links */}
        <div className="card" style={{ padding: '8px', display: 'flex', flexDirection: 'column', gap: '2px' }}>
          <button
            onClick={() => {
              setSettingsTab('password');
              setIsSettingsOpen(true);
            }}
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
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <Lock size={18} color="var(--color-primary)" />
              <span>Change Password</span>
            </div>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Update ↗</span>
          </button>

          <button
            onClick={() => {
              setSettingsTab('biodata');
              setIsSettingsOpen(true);
            }}
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
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <UserIcon size={18} color="var(--color-primary)" />
              <span>Biodata / About Me</span>
            </div>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Edit ↗</span>
          </button>

          <button
            onClick={() => {
              setSettingsTab('accounts');
              setIsSettingsOpen(true);
            }}
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
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <Users size={18} color="var(--color-primary)" />
              <span>Switch to Another Account</span>
            </div>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Manage ↗</span>
          </button>

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
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <Info size={18} color="var(--color-accent)" />
              <span>About ChatBase</span>
            </div>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Made by HarshGuruJi</span>
          </button>
        </div>

        {/* Android App Promotion Card (Web Only) */}
        {!Capacitor.isNativePlatform() && (
          <div
            className="card"
            style={{
              padding: '20px',
              background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.12), rgba(168, 85, 247, 0.16))',
              border: '1px solid rgba(99, 102, 241, 0.25)',
              borderRadius: 'var(--radius-lg)',
              display: 'flex',
              flexDirection: 'column',
              gap: '12px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div
                style={{
                  width: '38px',
                  height: '38px',
                  borderRadius: '10px',
                  background: 'var(--color-primary)',
                  color: '#ffffff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Smartphone size={22} />
              </div>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <h4 style={{ fontSize: '1rem', fontWeight: 800, margin: 0 }}>Get ChatBase for Android</h4>
                  <span style={{ fontSize: '0.68rem', padding: '2px 6px', background: 'var(--color-primary)', color: '#fff', borderRadius: '4px', fontWeight: 700 }}>
                    RECOMMENDED
                  </span>
                </div>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', margin: '2px 0 0' }}>
                  Unlock HD Voice Notes, Live GPS Radar, and Instant Notifications.
                </p>
              </div>
            </div>

            <button
              onClick={() => setIsDownloadOpen(true)}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                padding: '10px',
                background: 'var(--color-primary)',
                color: '#ffffff',
                border: 'none',
                borderRadius: 'var(--radius-md)',
                fontWeight: 700,
                fontSize: '0.88rem',
                cursor: 'pointer',
                boxShadow: '0 4px 12px rgba(99, 102, 241, 0.3)',
              }}
            >
              <Download size={16} />
              <span>Download Official Android App (APK)</span>
            </button>
          </div>
        )}

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
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        defaultTab={settingsTab}
      />
      <PrivacySettingsModal isOpen={isPrivacyOpen} onClose={() => setIsPrivacyOpen(false)} />
      <AboutModal isOpen={isAboutOpen} onClose={() => setIsAboutOpen(false)} />
      <AppDownloadModal isOpen={isDownloadOpen} onClose={() => setIsDownloadOpen(false)} feature="general" />

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
