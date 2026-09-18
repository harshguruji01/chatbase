import React, { useEffect, useState } from 'react';

interface SplashScreenProps {
  onComplete: () => void;
}

export const SplashScreen: React.FC<SplashScreenProps> = ({ onComplete }) => {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          setTimeout(onComplete, 400);
          return 100;
        }
        return prev + 15;
      });
    }, 120);

    return () => clearInterval(interval);
  }, [onComplete]);

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'var(--bg-app)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 99999,
        padding: '24px',
      }}
    >
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '20px',
        }}
      >
        <div className="logo-glow-anim">
          <img
            src="/logo.svg"
            alt="ChatBase"
            style={{ width: '96px', height: '96px' }}
          />
        </div>

        <div style={{ textAlign: 'center' }}>
          <h1
            style={{
              fontFamily: 'var(--font-brand)',
              fontSize: '2.4rem',
              fontWeight: 800,
              letterSpacing: '-1px',
              background: 'var(--gradient-brand)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              marginBottom: '6px',
            }}
          >
            ChatBase
          </h1>
          <p
            style={{
              fontSize: '0.95rem',
              color: 'var(--text-secondary)',
              fontWeight: 500,
            }}
          >
            Connect, Discover & Chat Instantly
          </p>
        </div>

        {/* Loading Progress Bar */}
        <div
          style={{
            width: '180px',
            height: '4px',
            background: 'var(--border-color)',
            borderRadius: '4px',
            overflow: 'hidden',
            marginTop: '16px',
          }}
        >
          <div
            style={{
              height: '100%',
              width: `${progress}%`,
              background: 'var(--gradient-brand)',
              transition: 'width 0.15s ease',
            }}
          />
        </div>
      </div>

      {/* Footer Branding */}
      <div
        style={{
          position: 'absolute',
          bottom: '32px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '4px',
          fontSize: '0.85rem',
          color: 'var(--text-muted)',
        }}
      >
        <span>Made by <strong style={{ color: 'var(--text-primary)' }}>HarshGuruJi</strong></span>
        <a
          href="https://www.webguruji.online"
          target="_blank"
          rel="noopener noreferrer"
          style={{ color: 'var(--color-primary)', textDecoration: 'none', fontWeight: 600 }}
        >
          www.webguruji.online
        </a>
      </div>
    </div>
  );
};
