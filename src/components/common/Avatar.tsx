import React from 'react';

interface AvatarProps {
  src?: string | null;
  name?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  isOnline?: boolean;
  className?: string;
  onClick?: () => void;
}

export const Avatar: React.FC<AvatarProps> = ({
  src,
  name = 'User',
  size = 'md',
  isOnline,
  className = '',
  onClick,
}) => {
  const getInitials = (str: string) => {
    const parts = str.trim().split(' ');
    if (parts.length > 1) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return str.substring(0, 2).toUpperCase();
  };

  return (
    <div
      className={`avatar avatar-${size} ${className}`}
      onClick={onClick}
      style={{ cursor: onClick ? 'pointer' : 'default' }}
      title={name}
    >
      {src ? (
        <img
          src={src}
          alt={name}
          onError={(e) => {
            // fallback if image fails to load
            (e.target as HTMLElement).style.display = 'none';
          }}
        />
      ) : (
        <span>{getInitials(name)}</span>
      )}

      {isOnline && <span className="avatar-online-dot" />}
    </div>
  );
};
