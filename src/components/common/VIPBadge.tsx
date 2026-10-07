import React from 'react';
import { Crown, Sparkles } from 'lucide-react';
import { usePremium } from '../../context/PremiumContext';

interface VIPBadgeProps {
  size?: 'xs' | 'sm' | 'md' | 'lg';
  showLabel?: boolean;
  clickable?: boolean;
  className?: string;
  style?: React.CSSProperties;
}

export const VIPBadge: React.FC<VIPBadgeProps> = ({
  size = 'sm',
  showLabel = true,
  clickable = true,
  className = '',
  style,
}) => {
  const { isPremium, openUpgradeModal } = usePremium();

  const sizeStyles = {
    xs: { fontSize: '10px', padding: '1px 5px', iconSize: 10, gap: '3px' },
    sm: { fontSize: '11px', padding: '2px 7px', iconSize: 12, gap: '4px' },
    md: { fontSize: '12px', padding: '4px 10px', iconSize: 14, gap: '5px' },
    lg: { fontSize: '14px', padding: '6px 14px', iconSize: 16, gap: '6px' },
  }[size];

  const handleClick = (e: React.MouseEvent) => {
    if (clickable) {
      e.stopPropagation();
      openUpgradeModal();
    }
  };

  if (!isPremium) {
    return (
      <span
        onClick={clickable ? handleClick : undefined}
        title="Upgrade to ChatBase VIP"
        className={`vip-badge-free ${className}`}
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: sizeStyles.gap,
          fontSize: sizeStyles.fontSize,
          fontWeight: 700,
          letterSpacing: '0.04em',
          borderRadius: '999px',
          padding: sizeStyles.padding,
          background: 'linear-gradient(135deg, rgba(234, 179, 8, 0.12), rgba(245, 158, 11, 0.2))',
          color: '#fbbf24',
          border: '1px solid rgba(245, 158, 11, 0.35)',
          cursor: clickable ? 'pointer' : 'default',
          userSelect: 'none',
          whiteSpace: 'nowrap',
          transition: 'all 0.2s ease',
          ...style,
        }}
      >
        <Sparkles size={sizeStyles.iconSize} color="#f59e0b" />
        {showLabel && <span>VIP</span>}
      </span>
    );
  }

  return (
    <span
      onClick={clickable ? handleClick : undefined}
      title="ChatBase VIP Member 👑"
      className={`vip-badge-active ${className}`}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: sizeStyles.gap,
        fontSize: sizeStyles.fontSize,
        fontWeight: 800,
        letterSpacing: '0.05em',
        borderRadius: '999px',
        padding: sizeStyles.padding,
        background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 40%, #b45309 100%)',
        color: '#ffffff',
        border: '1px solid rgba(254, 240, 138, 0.6)',
        boxShadow: '0 0 10px rgba(245, 158, 11, 0.4), inset 0 1px 1px rgba(255, 255, 255, 0.5)',
        cursor: clickable ? 'pointer' : 'default',
        userSelect: 'none',
        whiteSpace: 'nowrap',
        textShadow: '0 1px 2px rgba(0, 0, 0, 0.3)',
        transition: 'all 0.2s ease',
        ...style,
      }}
    >
      <Crown size={sizeStyles.iconSize} color="#fff" />
      {showLabel && <span>VIP</span>}
    </span>
  );
};
