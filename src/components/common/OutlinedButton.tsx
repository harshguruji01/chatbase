import React, { useState } from 'react';
import { Loader2 } from 'lucide-react';

interface OutlinedButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
  icon?: React.ReactNode;
  children?: React.ReactNode;
}

export const OutlinedButton: React.FC<OutlinedButtonProps> = ({
  variant = 'primary',
  size = 'md',
  isLoading = false,
  icon,
  children,
  disabled,
  onClick,
  className = '',
  style,
  ...props
}) => {
  const [coords, setCoords] = useState<{ x: number; y: number } | null>(null);
  const [isRippling, setIsRippling] = useState(false);

  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    setCoords({ x: e.clientX - rect.left, y: e.clientY - rect.top });
    setIsRippling(true);
    setTimeout(() => setIsRippling(false), 500);

    if (onClick && !isLoading && !disabled) {
      onClick(e);
    }
  };

  const variantClass = `btn-${variant}`;
  const sizeClass = size !== 'md' ? `btn-${size}` : '';

  return (
    <button
      className={`btn ${variantClass} ${sizeClass} ${className}`}
      disabled={disabled || isLoading}
      onClick={handleClick}
      style={style}
      {...props}
    >
      {isRippling && coords && (
        <span
          style={{
            position: 'absolute',
            left: coords.x,
            top: coords.y,
            transform: 'translate(-50%, -50%)',
            width: '180px',
            height: '180px',
            borderRadius: '50%',
            backgroundColor: 'rgba(255, 255, 255, 0.25)',
            pointerEvents: 'none',
            animation: 'ripple 0.5s ease-out',
          }}
        />
      )}

      {isLoading ? (
        <Loader2 size={size === 'sm' ? 14 : 18} className="spinner" />
      ) : (
        icon && <span style={{ display: 'inline-flex', alignItems: 'center' }}>{icon}</span>
      )}

      {children && <span>{children}</span>}

      <style>{`
        @keyframes ripple {
          0% {
            transform: translate(-50%, -50%) scale(0);
            opacity: 1;
          }
          100% {
            transform: translate(-50%, -50%) scale(1);
            opacity: 0;
          }
        }
      `}</style>
    </button>
  );
};
