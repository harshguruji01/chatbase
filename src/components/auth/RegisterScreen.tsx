import React, { useState, useRef, useEffect } from 'react';
import { Mail, Phone, Camera, ArrowRight, CheckCircle2, XCircle, Loader2 } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../lib/supabase';
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
  const [usernameStatus, setUsernameStatus] = useState<'idle' | 'checking' | 'available' | 'taken'>('idle');

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Realtime Live Username Uniqueness Check
  useEffect(() => {
    const clean = username.trim().toLowerCase();
    if (clean.length < 3) {
      setUsernameStatus('idle');
      return;
    }
    setUsernameStatus('checking');
    const timer = setTimeout(async () => {
      try {
        const { data } = await supabase.rpc('get_email_by_identifier', { identifier: clean });
        if (data) {
          setUsernameStatus('taken');
        } else {
          setUsernameStatus('available');
        }
      } catch {
        setUsernameStatus('idle');
      }
    }, 350);
    return () => clearTimeout(timer);
  }, [username]);

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!username.trim() || !displayName.trim() || !email.trim() || !password) {
      showToast('Please fill in all required fields.', 'error');
      return;
    }

    if (username.length < 3) {
      showToast('Username must be at least 3 characters.', 'error');
      return;
    }

    if (usernameStatus === 'taken') {
      showToast('This username is already taken. Please choose a different username.', 'error');
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
      showToast('Account created successfully! Welcome to ChatBase.', 'success');
    }
  };

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
        padding: '32px 20px',
        backgroundColor: 'var(--bg-app)',
        backgroundImage: 'radial-gradient(ellipse at top, rgba(99, 102, 241, 0.12) 0%, transparent 70%)',
        overflowY: 'auto',
      }}
    >
      <div
        className="card fade-in-up auth-desktop-wrapper"
        style={{
          width: '100%',
          maxWidth: '960px',
          boxShadow: 'var(--shadow-lg)',
          display: 'flex',
          flexDirection: 'row',
          borderRadius: 'var(--radius-lg)',
          overflow: 'hidden',
          padding: 0,
          border: '1px solid var(--border-color)',
        }}
      >
        {/* Left Web Showcase Panel (Desktop only) */}
        <div
          className="auth-web-showcase"
          style={{
            flex: '1 1 45%',
            background: 'linear-gradient(145deg, #0F1626 0%, #172138 100%)',
            padding: '40px 36px',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            borderRight: '1px solid var(--border-color)',
            color: '#F8FAFC',
          }}
        >
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '28px' }}>
              <img
                src="/chatbase.png"
                alt="ChatBase Logo"
                style={{
                  width: '52px',
                  height: '52px',
                  borderRadius: '14px',
                  boxShadow: '0 4px 20px rgba(99, 102, 241, 0.4)',
                }}
              />
              <div>
                <h1 style={{ fontFamily: 'var(--font-brand)', fontSize: '1.75rem', fontWeight: 800, margin: 0, letterSpacing: '-0.5px' }}>
                  Chat<span style={{ color: 'var(--color-primary)' }}>Base</span>
                </h1>
                <p style={{ fontSize: '0.82rem', color: '#94A3B8', margin: 0 }}>Join the Social Network</p>
              </div>
            </div>

            <h2 style={{ fontSize: '1.3rem', fontWeight: 700, marginBottom: '12px', color: '#FFFFFF' }}>
              Create your permanent account
            </h2>
            <p style={{ color: '#94A3B8', fontSize: '0.9rem', lineHeight: 1.6, marginBottom: '24px' }}>
              Registration par aapko ek permanent <strong>8-character Unique ID</strong> assign hogi jisse aap Web aur Android App dono par kabhi bhi instantly login kar sakte hain.
            </p>

            {/* Checklist */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '0.88rem' }}>
                <span style={{ color: 'var(--color-primary)' }}>✓</span>
                <span>Har username 100% unique hota hai (No duplicates)</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '0.88rem' }}>
                <span style={{ color: 'var(--color-primary)' }}>✓</span>
                <span>Automatic 8-digit permanent ChatBase ID</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '0.88rem' }}>
                <span style={{ color: 'var(--color-primary)' }}>✓</span>
                <span>Web aur Android dono par same account se chat</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '0.88rem' }}>
                <span style={{ color: 'var(--color-primary)' }}>✓</span>
                <span>100% Free & No email verification delays</span>
              </div>
            </div>
          </div>

          <div style={{ marginTop: '36px', paddingTop: '18px', borderTop: '1px solid rgba(255,255,255,0.08)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.78rem', color: '#94A3B8' }}>
            <span>Made by <strong>HarshGuruJi</strong></span>
            <a href="https://www.webguruji.online" target="_blank" rel="noopener noreferrer" style={{ color: '#818CF8', textDecoration: 'none', fontWeight: 600 }}>
              www.webguruji.online ↗
            </a>
          </div>
        </div>

        {/* Right Form Panel */}
        <div
          style={{
            flex: '1 1 55%',
            padding: '36px 32px',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            background: 'var(--bg-card)',
            maxHeight: '92vh',
            overflowY: 'auto',
          }}
        >
          {/* Mobile Header */}
          <div className="auth-mobile-header" style={{ display: 'none', marginBottom: '16px' }}>
            <BrandHeader size="sm" />
          </div>

          <div style={{ marginBottom: '16px' }}>
            <h2 style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--text-primary)' }}>Create Your Account</h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.84rem', marginTop: '2px' }}>
              Enter your details to generate your unique ChatBase ID
            </p>
          </div>

          {/* Profile Picture Upload */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '18px' }}>
            <div
              onClick={() => fileInputRef.current?.click()}
              style={{
                position: 'relative',
                width: '64px',
                height: '64px',
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
              title="Upload Profile Picture (Optional)"
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
                onChange={handleAvatarChange}
                accept="image/*"
                style={{ display: 'none' }}
              />
            </div>
            <div>
              <div style={{ fontWeight: 600, fontSize: '0.85rem' }}>Profile Picture (Optional)</div>
              <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>Tap circle to choose photo (auto retina compressed)</div>
            </div>
          </div>

          <form onSubmit={handleSubmit} style={{ width: '100%' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div className="input-group">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <label className="input-label">Username *</label>
                  {usernameStatus === 'checking' && (
                    <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '3px' }}>
                      <Loader2 size={12} className="spin-anim" /> Checking...
                    </span>
                  )}
                  {usernameStatus === 'available' && (
                    <span style={{ fontSize: '0.72rem', color: 'var(--color-success)', display: 'flex', alignItems: 'center', gap: '3px', fontWeight: 600 }}>
                      <CheckCircle2 size={12} /> Available
                    </span>
                  )}
                  {usernameStatus === 'taken' && (
                    <span style={{ fontSize: '0.72rem', color: 'var(--color-danger)', display: 'flex', alignItems: 'center', gap: '3px', fontWeight: 600 }}>
                      <XCircle size={12} /> Already taken
                    </span>
                  )}
                </div>
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
                {usernameStatus === 'taken' && (
                  <div style={{ fontSize: '0.72rem', color: 'var(--color-danger)', marginTop: '2px' }}>
                    Yeh username kisi aur ne liya hua hai.
                  </div>
                )}
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
  </div>
);
};
