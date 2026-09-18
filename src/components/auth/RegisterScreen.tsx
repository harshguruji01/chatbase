import React, { useState, useRef } from 'react';
import { Mail, Phone, Camera, ArrowRight } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { OutlinedButton } from '../common/OutlinedButton';
import { BrandHeader } from '../common/BrandHeader';
import { useToast } from '../common/Toast';

import { compressImage } from '../../lib/compression';

interface RegisterScreenProps {
  onGoToLogin: () => void;
}

export const RegisterScreen: React.FC<RegisterScreenProps> = ({ onGoToLogin }) => {
  const { signUp } = useAuth();
  const { showToast } = useToast();

  const [username, setUsername] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      try {
        // Smart compression keeping retina sharpness
        const compressed = await compressImage(file, { maxWidth: 800, maxHeight: 800, quality: 0.85 });
        setAvatarFile(compressed);
        setAvatarPreview(URL.createObjectURL(compressed));
      } catch {
        setAvatarFile(file);
        setAvatarPreview(URL.createObjectURL(file));
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validations
    if (!username.trim() || !displayName.trim() || !email.trim() || !password) {
      showToast('Please fill in all required fields.', 'error');
      return;
    }

    if (username.length < 3) {
      showToast('Username must be at least 3 characters.', 'error');
      return;
    }

    if (!email.includes('@') || !email.includes('.')) {
      showToast('Please enter a valid email address.', 'error');
      return;
    }

    if (password.length < 6) {
      showToast('Password must be at least 6 characters.', 'error');
      return;
    }

    if (password !== confirmPassword) {
      showToast('Passwords do not match.', 'error');
      return;
    }

    setIsLoading(true);
    const { error } = await signUp({
      username: username.trim(),
      displayName: displayName.trim(),
      email: email.trim(),
      phone: phone.trim() || undefined,
      password,
      avatarFile,
    });
    setIsLoading(false);

    if (error) {
      showToast(error, 'error');
    } else {
      showToast('Account created successfully! Unique User ID assigned.', 'success');
    }
  };

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
        padding: '32px 16px',
        backgroundColor: 'var(--bg-app)',
        overflowY: 'auto',
      }}
    >
      <div
        className="card fade-in-up"
        style={{
          width: '100%',
          maxWidth: '460px',
          boxShadow: 'var(--shadow-lg)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          padding: '32px 24px',
        }}
      >
        <BrandHeader size="md" />

        <div style={{ textAlign: 'center', margin: '16px 0 20px' }}>
          <h2 style={{ fontSize: '1.4rem', fontWeight: 700 }}>Create Your Account</h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginTop: '4px' }}>
            A permanent unique User ID (e.g. HG8X29K4) will be generated for you
          </p>
        </div>

        {/* Profile Picture Upload */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: '20px' }}>
          <div
            onClick={() => fileInputRef.current?.click()}
            style={{
              position: 'relative',
              width: '80px',
              height: '80px',
              borderRadius: '50%',
              background: avatarPreview ? `url(${avatarPreview}) center/cover no-repeat` : 'var(--bg-input)',
              border: '2px dashed var(--color-primary)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              overflow: 'hidden',
            }}
            title="Upload Profile Picture (Optional)"
          >
            {!avatarPreview && (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', color: 'var(--text-muted)' }}>
                <Camera size={24} />
                <span style={{ fontSize: '0.68rem', marginTop: '2px' }}>Photo</span>
              </div>
            )}
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleAvatarChange}
              accept="image/*"
              style={{ display: 'none' }}
            />
          </div>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '6px' }}>
            Profile Picture (Optional)
          </span>
        </div>

        <form onSubmit={handleSubmit} style={{ width: '100%' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div className="input-group">
              <label className="input-label">Username *</label>
              <div className="input-wrapper">
                <input
                  type="text"
                  className="input-field"
                  placeholder="e.g. harsh_01"
                  value={username}
                  onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''))}
                  required
                />
              </div>
            </div>

            <div className="input-group">
              <label className="input-label">Display Name *</label>
              <div className="input-wrapper">
                <input
                  type="text"
                  className="input-field"
                  placeholder="e.g. Harsh Guru"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  required
                />
              </div>
            </div>
          </div>

          <div className="input-group">
            <label className="input-label">Email Address *</label>
            <div className="input-wrapper">
              <Mail size={18} className="input-icon-left" />
              <input
                type="email"
                className="input-field has-left-icon"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="input-group">
            <label className="input-label">Phone Number (Optional)</label>
            <div className="input-wrapper">
              <Phone size={18} className="input-icon-left" />
              <input
                type="tel"
                className="input-field has-left-icon"
                placeholder="+91 9876543210"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
              />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div className="input-group">
              <label className="input-label">Password *</label>
              <div className="input-wrapper">
                <input
                  type={showPassword ? 'text' : 'password'}
                  className="input-field"
                  placeholder="Min 6 chars"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="input-group">
              <label className="input-label">Confirm *</label>
              <div className="input-wrapper">
                <input
                  type={showPassword ? 'text' : 'password'}
                  className="input-field"
                  placeholder="Re-type"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                />
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
            <input
              type="checkbox"
              id="show-pass"
              checked={showPassword}
              onChange={() => setShowPassword(!showPassword)}
              style={{ cursor: 'pointer' }}
            />
            <label htmlFor="show-pass" style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', cursor: 'pointer' }}>
              Show password
            </label>
          </div>

          <OutlinedButton
            type="submit"
            variant="primary"
            size="lg"
            isLoading={isLoading}
            style={{ width: '100%' }}
            icon={<ArrowRight size={18} />}
          >
            Create ChatBase Account
          </OutlinedButton>
        </form>

        <div
          style={{
            marginTop: '20px',
            paddingTop: '16px',
            borderTop: '1px solid var(--border-color)',
            width: '100%',
            textAlign: 'center',
            fontSize: '0.88rem',
            color: 'var(--text-secondary)',
          }}
        >
          Already have an account?{' '}
          <button
            onClick={onGoToLogin}
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--color-primary)',
              fontWeight: 700,
              cursor: 'pointer',
            }}
          >
            Sign In
          </button>
        </div>
      </div>
    </div>
  );
};
