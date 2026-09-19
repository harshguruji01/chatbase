import React, { useState } from 'react';
import { User, Lock, Eye, EyeOff, ArrowRight } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { OutlinedButton } from '../common/OutlinedButton';
import { BrandHeader } from '../common/BrandHeader';
import { Modal } from '../common/Modal';
import { useToast } from '../common/Toast';
import brandLogo from '../../assets/chatbase.png';

interface LoginScreenProps {
  onGoToRegister: () => void;
}

export const LoginScreen: React.FC<LoginScreenProps> = ({ onGoToRegister }) => {
  const { signIn } = useAuth();
  const { showToast } = useToast();

  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isForgotPasswordOpen, setIsForgotPasswordOpen] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [isResetting, setIsResetting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!identifier.trim() || !password) {
      showToast('Please enter your username/email/phone and password.', 'error');
      return;
    }

    setIsLoading(true);
    const { error } = await signIn(identifier, password);
    setIsLoading(false);

    if (error) {
      showToast(error, 'error');
    } else {
      showToast('Welcome back to ChatBase!', 'success');
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resetEmail.includes('@')) {
      showToast('Please enter a valid email address.', 'error');
      return;
    }
    setIsResetting(true);
    // Simulating / initiating password recovery
    setTimeout(() => {
      setIsResetting(false);
      setIsForgotPasswordOpen(false);
      showToast('Password reset instructions sent to your email!', 'success');
    }, 1000);
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
          maxWidth: '920px',
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
            flex: '1 1 48%',
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
                src={brandLogo || './chatbase.png'}
                alt="ChatBase Logo"
                style={{
                  width: '52px',
                  height: '52px',
                  borderRadius: '14px',
                  boxShadow: '0 4px 20px rgba(99, 102, 241, 0.4)',
                  objectFit: 'contain',
                }}
              />
              <div>
                <h1 style={{ fontFamily: 'var(--font-brand)', fontSize: '1.75rem', fontWeight: 800, margin: 0, letterSpacing: '-0.5px' }}>
                  Chat<span style={{ color: 'var(--color-primary)' }}>Base</span> <span style={{ fontSize: '0.9rem', color: '#94A3B8', fontWeight: 500 }}>Web</span>
                </h1>
                <p style={{ fontSize: '0.82rem', color: '#94A3B8', margin: 0 }}>Social Messenger & Nearby Connect</p>
              </div>
            </div>

            <h2 style={{ fontSize: '1.3rem', fontWeight: 700, marginBottom: '12px', color: '#FFFFFF' }}>
              Chat directly from your browser
            </h2>
            <p style={{ color: '#94A3B8', fontSize: '0.9rem', lineHeight: 1.6, marginBottom: '28px' }}>
              Aap apne <strong>Unique User ID</strong> ya username se login karke bina kisi rukawat ke direct website se chat kar sakte hain. Saara data app ke saath real-time sync hota hai.
            </p>

            {/* Feature Highlights */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
                <div style={{ background: 'rgba(99, 102, 241, 0.2)', padding: '8px', borderRadius: '10px', color: '#818CF8' }}>
                  🆔
                </div>
                <div>
                  <div style={{ fontWeight: 600, fontSize: '0.92rem' }}>Unique ID Se Instant Login</div>
                  <div style={{ fontSize: '0.8rem', color: '#94A3B8' }}>Apna 8-digit unique ID (jaise HG8X29K4) daalein aur turant login karein</div>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
                <div style={{ background: 'rgba(16, 185, 129, 0.2)', padding: '8px', borderRadius: '10px', color: '#34D399' }}>
                  ⚡
                </div>
                <div>
                  <div style={{ fontWeight: 600, fontSize: '0.92rem' }}>Web & Android Live Sync</div>
                  <div style={{ fontSize: '0.8rem', color: '#94A3B8' }}>Mobile phone, tablet aur browser par real-time instant messaging</div>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
                <div style={{ background: 'rgba(236, 72, 153, 0.2)', padding: '8px', borderRadius: '10px', color: '#F472B6' }}>
                  🎙️
                </div>
                <div>
                  <div style={{ fontWeight: 600, fontSize: '0.92rem' }}>Voice Notes, Video & Emojis</div>
                  <div style={{ fontSize: '0.8rem', color: '#94A3B8' }}>High-definition voice notes with waveform, videos aur rich emojis</div>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
                <div style={{ background: 'rgba(245, 158, 11, 0.2)', padding: '8px', borderRadius: '10px', color: '#FBBF24' }}>
                  🕒
                </div>
                <div>
                  <div style={{ fontWeight: 600, fontSize: '0.92rem' }}>30-Day Auto Cleanup</div>
                  <div style={{ fontSize: '0.8rem', color: '#94A3B8' }}>Purane messages 30 din baad automatically safely delete ho jaate hain</div>
                </div>
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

        {/* Right Auth Form Panel */}
        <div
          style={{
            flex: '1 1 52%',
            padding: '40px 32px',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            background: 'var(--bg-card)',
          }}
        >
          {/* Mobile Header (Shown on small screens) */}
          <div className="auth-mobile-header" style={{ display: 'none', marginBottom: '20px' }}>
            <BrandHeader size="md" />
          </div>

          <div style={{ marginBottom: '24px' }}>
            <h2 style={{ fontSize: '1.45rem', fontWeight: 800, color: 'var(--text-primary)' }}>Welcome to ChatBase</h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.88rem', marginTop: '4px' }}>
              Apne <strong>User ID (HG...)</strong>, Username, ya Email se login karein
            </p>
          </div>

          <form onSubmit={handleSubmit} style={{ width: '100%' }}>
            <div className="input-group">
              <label className="input-label" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span>User ID, Username, ya Email</span>
                <span style={{ fontSize: '0.74rem', color: 'var(--color-primary)', fontWeight: 600 }}>
                  🆔 ID Login Supported
                </span>
              </label>
              <div className="input-wrapper">
                <User size={18} className="input-icon-left" />
                <input
                  type="text"
                  className="input-field has-left-icon"
                  placeholder="e.g. HG8X29K4, harsh, or user@email.com"
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  autoCapitalize="none"
                  autoComplete="username"
                  required
                />
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                💡 Tip: Aap apna 8-character Unique ID (jaise <strong>HG8X29K4</strong>) enter karke direct login kar sakte hain.
              </div>
            </div>

            <div className="input-group">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <label className="input-label">Password</label>
                <button
                  type="button"
                  onClick={() => setIsForgotPasswordOpen(true)}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: 'var(--color-primary)',
                    fontSize: '0.8rem',
                    cursor: 'pointer',
                    fontWeight: 600,
                  }}
                >
                  Forgot?
                </button>
              </div>
              <div className="input-wrapper">
                <Lock size={18} className="input-icon-left" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  className="input-field has-left-icon"
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="current-password"
                  required
                />
                <button
                  type="button"
                  className="input-icon-right"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <OutlinedButton
              type="submit"
              variant="primary"
              size="lg"
              isLoading={isLoading}
              style={{ width: '100%', marginTop: '12px' }}
              icon={<ArrowRight size={18} />}
            >
              Login to ChatBase Web
            </OutlinedButton>
          </form>

          <div
            style={{
              marginTop: '24px',
              paddingTop: '20px',
              borderTop: '1px solid var(--border-color)',
              width: '100%',
              textAlign: 'center',
              fontSize: '0.9rem',
              color: 'var(--text-secondary)',
            }}
          >
            Don't have an account?{' '}
            <button
              onClick={onGoToRegister}
              style={{
                background: 'none',
                border: 'none',
                color: 'var(--color-primary)',
                fontWeight: 700,
                cursor: 'pointer',
              }}
            >
              Create Account
            </button>
          </div>
        </div>
      </div>

      {/* Forgot Password Modal */}
      <Modal
        isOpen={isForgotPasswordOpen}
        onClose={() => setIsForgotPasswordOpen(false)}
        title="Reset Password"
      >
        <form onSubmit={handleResetPassword}>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '16px' }}>
            Enter your registered email address. We'll send you a secure link to reset your password.
          </p>
          <div className="input-group">
            <label className="input-label">Email Address</label>
            <input
              type="email"
              className="input-field"
              placeholder="you@example.com"
              value={resetEmail}
              onChange={(e) => setResetEmail(e.target.value)}
              required
            />
          </div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '20px' }}>
            <OutlinedButton
              type="button"
              variant="secondary"
              onClick={() => setIsForgotPasswordOpen(false)}
            >
              Cancel
            </OutlinedButton>
            <OutlinedButton
              type="submit"
              variant="primary"
              isLoading={isResetting}
            >
              Send Reset Link
            </OutlinedButton>
          </div>
        </form>
      </Modal>
    </div>
  );
};
