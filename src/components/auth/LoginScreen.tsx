import React, { useState } from 'react';
import { User, Lock, Eye, EyeOff, ArrowRight } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { OutlinedButton } from '../common/OutlinedButton';
import { BrandHeader } from '../common/BrandHeader';
import { Modal } from '../common/Modal';
import { useToast } from '../common/Toast';

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
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
        padding: '24px 16px',
        backgroundColor: 'var(--bg-app)',
        overflowY: 'auto',
      }}
    >
      <div
        className="card fade-in-up"
        style={{
          width: '100%',
          maxWidth: '420px',
          boxShadow: 'var(--shadow-lg)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          padding: '32px 24px',
        }}
      >
        <BrandHeader size="lg" />

        <div style={{ textAlign: 'center', margin: '20px 0 24px' }}>
          <h2 style={{ fontSize: '1.4rem', fontWeight: 700 }}>Welcome Back</h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.88rem', marginTop: '4px' }}>
            Login with your Email, Username, or User ID
          </p>
        </div>

        <form onSubmit={handleSubmit} style={{ width: '100%' }}>
          <div className="input-group">
            <label className="input-label">Email, Username, or Unique ID</label>
            <div className="input-wrapper">
              <User size={18} className="input-icon-left" />
              <input
                type="text"
                className="input-field has-left-icon"
                placeholder="e.g. harsh, HG8X29K4, or email"
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                autoCapitalize="none"
                autoComplete="username"
                required
              />
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
            style={{ width: '100%', marginTop: '8px' }}
            icon={<ArrowRight size={18} />}
          >
            Login to ChatBase
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
