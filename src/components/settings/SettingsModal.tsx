import React, { useState, useRef } from 'react';
import {
  Lock,
  User,
  Moon,
  Sun,
  Users,
  LogOut,
  Camera,
  Check,
  Eye,
  EyeOff,
  Save,
  Trash2,
  KeyRound,
  Shield,
  Laptop,
  Languages,
} from 'lucide-react';
import { Modal } from '../common/Modal';
import { OutlinedButton } from '../common/OutlinedButton';
import { Avatar } from '../common/Avatar';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { useLanguage } from '../../context/LanguageContext';
import { useToast } from '../common/Toast';
import { supabase } from '../../lib/supabase';
import { compressImage } from '../../lib/compression';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultTab?: 'biodata' | 'password' | 'theme' | 'accounts';
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  defaultTab = 'biodata',
}) => {
  const {
    profile,
    updateProfile,
    changePassword,
    savedAccounts,
    removeSavedAccount,
    signOut,
  } = useAuth();
  const { theme, setTheme } = useTheme();
  const { language, setLanguage, t } = useLanguage();
  const { showToast } = useToast();

  const [activeTab, setActiveTab] = useState<'biodata' | 'password' | 'theme' | 'accounts'>(defaultTab);

  // Biodata state
  const [displayName, setDisplayName] = useState(profile?.display_name || '');
  const [bio, setBio] = useState(profile?.bio || '');
  const [phone, setPhone] = useState(profile?.phone || '');
  const [avatarPreview, setAvatarPreview] = useState<string | null>(profile?.avatar_url || null);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [isSavingBio, setIsSavingBio] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Password state
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isSavingPassword, setIsSavingPassword] = useState(false);

  // Sync profile when opened
  React.useEffect(() => {
    if (profile) {
      setDisplayName(profile.display_name || '');
      setBio(profile.bio || '');
      setPhone(profile.phone || '');
      setAvatarPreview(profile.avatar_url || null);
    }
  }, [profile, isOpen]);

  const handleAvatarSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      try {
        const compressed = await compressImage(file, { maxWidth: 800, maxHeight: 800, quality: 0.85 });
        setAvatarFile(compressed);
        setAvatarPreview(URL.createObjectURL(compressed));
      } catch {
        setAvatarFile(file);
        setAvatarPreview(URL.createObjectURL(file));
      }
    }
  };

  const handleSaveBiodata = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!displayName.trim()) {
      showToast('Display name cannot be empty.', 'error');
      return;
    }

    setIsSavingBio(true);
    try {
      let avatarUrl = profile?.avatar_url;

      if (avatarFile && profile) {
        const fileExt = avatarFile.name.split('.').pop();
        const fileName = `${profile.id}/${Date.now()}.${fileExt}`;
        const { error: uploadErr } = await supabase.storage
          .from('avatars')
          .upload(fileName, avatarFile, { upsert: true });

        if (!uploadErr) {
          const { data: publicUrlData } = supabase.storage
            .from('avatars')
            .getPublicUrl(fileName);
          avatarUrl = publicUrlData.publicUrl;
        }
      }

      const { error } = await updateProfile({
        display_name: displayName.trim(),
        bio: bio.trim(),
        phone: phone.trim() || null,
        avatar_url: avatarUrl,
      });

      if (error) {
        showToast(error, 'error');
      } else {
        showToast('Biodata updated successfully!', 'success');
      }
    } catch (err: any) {
      showToast(err.message, 'error');
    } finally {
      setIsSavingBio(false);
    }
  };

  const handleSavePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword.length < 6) {
      showToast('Password must be at least 6 characters.', 'error');
      return;
    }
    if (newPassword !== confirmPassword) {
      showToast('Passwords do not match.', 'error');
      return;
    }

    setIsSavingPassword(true);
    const { error } = await changePassword(newPassword);
    setIsSavingPassword(false);

    if (error) {
      showToast(error, 'error');
    } else {
      showToast('Password changed successfully! Keep it safe.', 'success');
      setNewPassword('');
      setConfirmPassword('');
    }
  };

  const handleSwitchToAccount = async (targetAccount: any) => {
    if (targetAccount.id === profile?.id) {
      showToast('This account is already active.', 'info');
      return;
    }
    // Sign out current and let user sign into the other
    await signOut();
    onClose();
    showToast(`Switched from @${profile?.username}. Enter password for @${targetAccount.username}.`, 'info');
  };

  if (!isOpen) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Account Settings">
      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        {/* Settings Navigation Tabs */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(4, 1fr)',
            background: 'var(--bg-input)',
            borderRadius: 'var(--radius-md)',
            padding: '4px',
            gap: '4px',
          }}
        >
          <button
            type="button"
            onClick={() => setActiveTab('biodata')}
            style={{
              padding: '8px 4px',
              borderRadius: 'var(--radius-sm)',
              border: 'none',
              background: activeTab === 'biodata' ? 'var(--color-primary)' : 'transparent',
              color: activeTab === 'biodata' ? '#ffffff' : 'var(--text-secondary)',
              fontWeight: 600,
              fontSize: '0.78rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
              cursor: 'pointer',
              transition: 'background 0.15s',
            }}
          >
            <User size={15} />
            <span>Bio</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('password')}
            style={{
              padding: '8px 4px',
              borderRadius: 'var(--radius-sm)',
              border: 'none',
              background: activeTab === 'password' ? 'var(--color-primary)' : 'transparent',
              color: activeTab === 'password' ? '#ffffff' : 'var(--text-secondary)',
              fontWeight: 600,
              fontSize: '0.78rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
              cursor: 'pointer',
              transition: 'background 0.15s',
            }}
          >
            <Lock size={15} />
            <span>Password</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('theme')}
            style={{
              padding: '8px 4px',
              borderRadius: 'var(--radius-sm)',
              border: 'none',
              background: activeTab === 'theme' ? 'var(--color-primary)' : 'transparent',
              color: activeTab === 'theme' ? '#ffffff' : 'var(--text-secondary)',
              fontWeight: 600,
              fontSize: '0.78rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
              cursor: 'pointer',
              transition: 'background 0.15s',
            }}
          >
            <Moon size={15} />
            <span>Theme</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('accounts')}
            style={{
              padding: '8px 4px',
              borderRadius: 'var(--radius-sm)',
              border: 'none',
              background: activeTab === 'accounts' ? 'var(--color-primary)' : 'transparent',
              color: activeTab === 'accounts' ? '#ffffff' : 'var(--text-secondary)',
              fontWeight: 600,
              fontSize: '0.78rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
              cursor: 'pointer',
              transition: 'background 0.15s',
            }}
          >
            <Users size={15} />
            <span>Accounts</span>
          </button>
        </div>

        {/* Tab 1: Biodata / Profile */}
        {activeTab === 'biodata' && (
          <form onSubmit={handleSaveBiodata} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
              <div
                onClick={() => fileInputRef.current?.click()}
                style={{
                  position: 'relative',
                  width: '72px',
                  height: '72px',
                  borderRadius: '50%',
                  background: avatarPreview ? `url(${avatarPreview}) center/cover no-repeat` : 'var(--bg-input)',
                  border: '2px dashed var(--color-primary)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  overflow: 'hidden',
                  flexShrink: 0,
                }}
                title="Tap to change profile picture"
              >
                {!avatarPreview && (
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', color: 'var(--text-muted)' }}>
                    <Camera size={20} />
                    <span style={{ fontSize: '0.62rem', marginTop: '2px' }}>Photo</span>
                  </div>
                )}
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleAvatarSelect}
                  accept="image/*"
                  style={{ display: 'none' }}
                />
              </div>

              <div>
                <div style={{ fontWeight: 700, fontSize: '0.95rem' }}>{profile?.display_name}</div>
                <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>@{profile?.username}</div>
                <div style={{ fontSize: '0.74rem', color: 'var(--color-primary)', marginTop: '4px', cursor: 'pointer' }} onClick={() => fileInputRef.current?.click()}>
                  Change Profile Photo ↗
                </div>
              </div>
            </div>

            <div className="input-group">
              <label className="input-label">Display Name *</label>
              <input
                type="text"
                className="input-field"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="Your full name or moniker"
                required
              />
            </div>

            <div className="input-group">
              <label className="input-label">Biodata / About Me (Instagram style)</label>
              <textarea
                className="input-field"
                rows={3}
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                placeholder="Write something interesting about yourself, interests, bio..."
                style={{ resize: 'vertical', fontFamily: 'inherit', fontSize: '0.9rem' }}
              />
              <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                This bio is visible to users in Search, Nearby radar, and chat profiles.
              </span>
            </div>

            <div className="input-group">
              <label className="input-label">Phone Number (Optional)</label>
              <input
                type="tel"
                className="input-field"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+91 98765 43210"
              />
            </div>

            <OutlinedButton variant="primary" type="submit" disabled={isSavingBio} style={{ marginTop: '6px' }}>
              <Save size={16} />
              {isSavingBio ? 'Saving Biodata...' : 'Save Changes'}
            </OutlinedButton>
          </form>
        )}

        {/* Tab 2: Change Password */}
        {activeTab === 'password' && (
          <form onSubmit={handleSavePassword} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ background: 'rgba(99, 102, 241, 0.08)', border: '1px solid rgba(99, 102, 241, 0.25)', borderRadius: 'var(--radius-md)', padding: '12px 16px', display: 'flex', alignItems: 'center', gap: '12px' }}>
              <Shield size={20} color="var(--color-primary)" />
              <div style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
                Naya password enter karein. Update hone ke baad aapka naya password Web aur App dono par turant active ho jayega.
              </div>
            </div>

            <div className="input-group">
              <label className="input-label">New Password *</label>
              <div className="input-wrapper">
                <input
                  type={showPassword ? 'text' : 'password'}
                  className="input-field has-right-icon"
                  placeholder="At least 6 characters"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required
                />
                <button
                  type="button"
                  className="input-icon-right"
                  onClick={() => setShowPassword(!showPassword)}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <div className="input-group">
              <label className="input-label">Confirm New Password *</label>
              <div className="input-wrapper">
                <input
                  type={showPassword ? 'text' : 'password'}
                  className="input-field"
                  placeholder="Repeat new password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                />
              </div>
            </div>

            <OutlinedButton variant="primary" type="submit" disabled={isSavingPassword} style={{ marginTop: '6px' }}>
              <KeyRound size={16} />
              {isSavingPassword ? 'Updating Password...' : 'Change Password'}
            </OutlinedButton>
          </form>
        )}

        {/* Tab 3: Appearance & Theme */}
        {activeTab === 'theme' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
              Choose your preferred visual aesthetic for ChatBase:
            </p>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '10px' }}>
              <div
                onClick={() => {
                  setTheme('dark');
                  showToast('Dark Mode activated.', 'info');
                }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '14px 18px',
                  borderRadius: 'var(--radius-md)',
                  border: `2px solid ${theme === 'dark' ? 'var(--color-primary)' : 'var(--border-color)'}`,
                  background: theme === 'dark' ? 'var(--color-primary-light)' : 'var(--bg-input)',
                  cursor: 'pointer',
                  transition: 'all 0.15s',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <Moon size={20} color="var(--color-primary)" />
                  <div>
                    <div style={{ fontWeight: 700, fontSize: '0.92rem' }}>Dark Theme (Default)</div>
                    <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>Sleek navy dark background, easy on the eyes</div>
                  </div>
                </div>
                {theme === 'dark' && <Check size={18} color="var(--color-primary)" />}
              </div>

              <div
                onClick={() => {
                  setTheme('light');
                  showToast('Light Mode activated.', 'info');
                }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '14px 18px',
                  borderRadius: 'var(--radius-md)',
                  border: `2px solid ${theme === 'light' ? 'var(--color-primary)' : 'var(--border-color)'}`,
                  background: theme === 'light' ? 'var(--color-primary-light)' : 'var(--bg-input)',
                  cursor: 'pointer',
                  transition: 'all 0.15s',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <Sun size={20} color="#F59E0B" />
                  <div>
                    <div style={{ fontWeight: 700, fontSize: '0.92rem' }}>Light Theme</div>
                    <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>Crisp white background for bright environments</div>
                  </div>
                </div>
                {theme === 'light' && <Check size={18} color="var(--color-primary)" />}
              </div>

              <div
                onClick={() => {
                  setTheme('system');
                  showToast('Auto System Theme activated.', 'info');
                }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '14px 18px',
                  borderRadius: 'var(--radius-md)',
                  border: `2px solid ${theme === 'system' ? 'var(--color-primary)' : 'var(--border-color)'}`,
                  background: theme === 'system' ? 'var(--color-primary-light)' : 'var(--bg-input)',
                  cursor: 'pointer',
                  transition: 'all 0.15s',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <Laptop size={20} color="var(--text-secondary)" />
                  <div>
                    <div style={{ fontWeight: 700, fontSize: '0.92rem' }}>System Auto</div>
                    <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>Automatically match device OS theme</div>
                  </div>
                </div>
                {theme === 'system' && <Check size={18} color="var(--color-primary)" />}
              </div>
            </div>

            {/* Language Selection */}
            <div style={{ marginTop: '14px', paddingTop: '14px', borderTop: '1px solid var(--border-color)', display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Languages size={18} color="var(--color-primary)" />
                <span style={{ fontWeight: 700, fontSize: '0.92rem', color: 'var(--text-primary)' }}>
                  {t('language')} / Language
                </span>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div
                  onClick={() => {
                    setLanguage('en');
                    showToast('Language set to English', 'info');
                  }}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '12px 14px',
                    borderRadius: 'var(--radius-md)',
                    border: `2px solid ${language === 'en' ? 'var(--color-primary)' : 'var(--border-color)'}`,
                    background: language === 'en' ? 'var(--color-primary-light)' : 'var(--bg-input)',
                    cursor: 'pointer',
                    fontWeight: 600,
                    fontSize: '0.88rem',
                  }}
                >
                  <span>English</span>
                  {language === 'en' && <Check size={16} color="var(--color-primary)" />}
                </div>

                <div
                  onClick={() => {
                    setLanguage('hi');
                    showToast('भाषा हिंदी में सेट हो गई है', 'info');
                  }}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '12px 14px',
                    borderRadius: 'var(--radius-md)',
                    border: `2px solid ${language === 'hi' ? 'var(--color-primary)' : 'var(--border-color)'}`,
                    background: language === 'hi' ? 'var(--color-primary-light)' : 'var(--bg-input)',
                    cursor: 'pointer',
                    fontWeight: 600,
                    fontSize: '0.88rem',
                  }}
                >
                  <span>हिंदी (Hindi)</span>
                  {language === 'hi' && <Check size={16} color="var(--color-primary)" />}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tab 4: Switch Accounts */}
        {activeTab === 'accounts' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div>
              <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '12px' }}>
                Manage multiple ChatBase accounts on this device (Instagram style):
              </div>

              {/* Current Active Account */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '12px 16px',
                  borderRadius: 'var(--radius-md)',
                  border: '1.5px solid var(--color-primary)',
                  background: 'rgba(99, 102, 241, 0.1)',
                  marginBottom: '12px',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <Avatar src={profile?.avatar_url} name={profile?.display_name || 'Me'} size="sm" />
                  <div>
                    <div style={{ fontWeight: 700, fontSize: '0.9rem' }}>{profile?.display_name}</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                      @{profile?.username} • <code style={{ color: 'var(--color-primary)' }}>{profile?.user_code}</code>
                    </div>
                  </div>
                </div>
                <span style={{ fontSize: '0.72rem', background: 'var(--color-primary)', color: '#fff', padding: '2px 8px', borderRadius: '9999px', fontWeight: 700 }}>
                  Active
                </span>
              </div>

              {/* Other Saved Accounts */}
              {savedAccounts.filter((a) => a.id !== profile?.id).length > 0 && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '16px' }}>
                  <span style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-muted)' }}>
                    Other Accounts On This Device:
                  </span>
                  {savedAccounts
                    .filter((a) => a.id !== profile?.id)
                    .map((acc) => (
                      <div
                        key={acc.id}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          padding: '10px 14px',
                          borderRadius: 'var(--radius-md)',
                          border: '1px solid var(--border-color)',
                          background: 'var(--bg-input)',
                        }}
                      >
                        <div
                          style={{ display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer', flex: 1 }}
                          onClick={() => handleSwitchToAccount(acc)}
                        >
                          <Avatar src={acc.avatar_url} name={acc.display_name} size="sm" />
                          <div>
                            <div style={{ fontWeight: 600, fontSize: '0.85rem' }}>{acc.display_name}</div>
                            <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>
                              @{acc.username} • {acc.user_code}
                            </div>
                          </div>
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <OutlinedButton variant="secondary" size="sm" onClick={() => handleSwitchToAccount(acc)}>
                            Switch
                          </OutlinedButton>
                          <button
                            type="button"
                            onClick={() => removeSavedAccount(acc.id)}
                            style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '4px' }}
                            title="Remove from saved accounts"
                          >
                            <Trash2 size={15} />
                          </button>
                        </div>
                      </div>
                    ))}
                </div>
              )}

              {/* Add / Switch Account Button */}
              <OutlinedButton
                variant="secondary"
                size="md"
                onClick={async () => {
                  await signOut();
                  onClose();
                  showToast('Enter your other ChatBase User ID or Username to login.', 'info');
                }}
                style={{ width: '100%' }}
              >
                <Users size={16} />
                Switch / Log in to another account
              </OutlinedButton>
            </div>
          </div>
        )}

        {/* Modal Footer with Quick Logout */}
        <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <button
            type="button"
            onClick={signOut}
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--color-danger)',
              fontSize: '0.82rem',
              fontWeight: 600,
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              cursor: 'pointer',
            }}
          >
            <LogOut size={15} /> Log Out @{profile?.username}
          </button>

          <OutlinedButton variant="secondary" size="sm" onClick={onClose}>
            Close
          </OutlinedButton>
        </div>
      </div>
    </Modal>
  );
};
