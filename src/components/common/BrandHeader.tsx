import React from 'react';

interface BrandHeaderProps {
  size?: 'sm' | 'md' | 'lg';
  showSubtitle?: boolean;
}

export const BrandHeader: React.FC<BrandHeaderProps> = ({ size = 'md', showSubtitle = true }) => {
  const logoSizes = {
    sm: '28px',
    md: '40px',
    lg: '64px',
  };

  const titleSizes = {
    sm: '1.1rem',
    md: '1.4rem',
    lg: '2.2rem',
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
        <img
          src="/logo.svg"
          alt="ChatBase Logo"
          style={{ width: logoSizes[size], height: logoSizes[size] }}
        />
        <span
          style={{
            fontFamily: 'var(--font-brand)',
            fontWeight: 800,
            fontSize: titleSizes[size],
            background: 'var(--gradient-brand)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            letterSpacing: '-0.5px',
          }}
        >
          ChatBase
        </span>
      </div>

      {showSubtitle && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
          <span>Made by</span>
          <a
            href="https://www.webguruji.online"
            target="_blank"
            rel="noopener noreferrer"
            style={{
              color: 'var(--color-primary)',
              fontWeight: 600,
              textDecoration: 'none',
            }}
          >
            HarshGuruJi
          </a>
        </div>
      )}
    </div>
  );
};
