import React from 'react';

export interface BadgeProps {
  label: string;
  variant?: 'live' | 'blue' | 'muted' | 'warn' | 'err';
  pulse?: boolean;
  className?: string;
  style?: React.CSSProperties;
}

export const Badge: React.FC<BadgeProps> = ({
  label,
  variant = 'blue',
  pulse = false,
  className = '',
  style,
}) => {
  const isStatusLive = variant === 'live';
  const isStatusWarn = variant === 'warn';
  const isStatusErr = variant === 'err';

  return (
    <span className={`badge badge-${variant} ${className}`} style={style}>
      {pulse && (
        <span
          className={`led-indicator ${
            isStatusLive ? 'live' : isStatusWarn ? 'warn' : isStatusErr ? 'err' : ''
          }`}
        />
      )}
      {label}
    </span>
  );
};
