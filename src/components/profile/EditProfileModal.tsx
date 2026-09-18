import React, { useState, useRef } from 'react';
import { Camera, Save } from 'lucide-react';
import { Modal } from '../common/Modal';
import { OutlinedButton } from '../common/OutlinedButton';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../lib/supabase';
import { useToast } from '../common/Toast';

interface EditProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const EditProfileModal: React.FC<EditProfileModalProps> = ({ isOpen, onClose }) => {
  const { profile, updateProfile } = useAuth();
  const { showToast } = useToast();

  const [displayName, setDisplayName] = useState(profile?.display_name || '');
  const [bio, setBio] = useState(profile?.bio || '');
  const [phone, setPhone] = useState(profile?.phone || '');
  const [avatarPreview, setAvatarPreview] = useState<string | null>(profile?.avatar_url || null);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleAvatarSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (file.size > 5 * 1024 * 1024) {
        showToast('Avatar must be under 5 MB.', 'error');
        return;
      }
      setAvatarFile(file);
      setAvatarPreview(URL.createObjectURL(file));
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!displayName.trim()) {
      showToast('Display name cannot be empty.', 'error');
      return;
    }

    setIsSaving(true);
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
        showToast('Profile updated successfully!', 'success');
        onClose();
      }
    } catch (err: any) {
      showToast(err.message, 'error');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Edit Profile">
      <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {/* Avatar Picker */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <div
            onClick={() => fileInputRef.current?.click()}
            style={{
              position: 'relative',
              width: '84px',
              height: '84px',
              borderRadius: '50%',
              background: avatarPreview ? `url(${avatarPreview}) center/cover no-repeat` : 'var(--bg-input)',
              border: '2px dashed var(--color-primary)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              overflow: 'hidden',
            }}
          >
            <div
              style={{
                position: 'absolute',
                inset: 0,
                background: 'rgba(0, 0, 0, 0.4)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#FFFFFF',
                opacity: avatarPreview ? 0 : 1,
                transition: 'opacity 0.2s',
              }}
              onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.opacity = '1')}
              onMouseLeave={(e) => {
                if (avatarPreview) (e.currentTarget as HTMLElement).style.opacity = '0';
              }}
            >
              <Camera size={24} />
            </div>
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleAvatarSelect}
              accept="image/*"
              style={{ display: 'none' }}
            />
          </div>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '6px' }}>
            Tap to change photo
          </span>
        </div>

        <div className="input-group">
          <label className="input-label">Display Name *</label>
          <input
            type="text"
            className="input-field"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            required
          />
        </div>

        <div className="input-group">
          <label className="input-label">Bio</label>
          <textarea
            className="input-field"
            rows={3}
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            placeholder="Tell friends about yourself..."
            style={{ resize: 'none' }}
          />
        </div>

        <div className="input-group">
          <label className="input-label">Phone</label>
          <input
            type="tel"
            className="input-field"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="+91 9876543210"
          />
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '8px' }}>
          <OutlinedButton variant="secondary" type="button" onClick={onClose}>
            Cancel
          </OutlinedButton>
          <OutlinedButton variant="primary" type="submit" isLoading={isSaving} icon={<Save size={16} />}>
            Save Changes
          </OutlinedButton>
        </div>
      </form>
    </Modal>
  );
};
