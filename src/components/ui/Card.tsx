import React from 'react';

export interface CardProps {
  children: React.ReactNode;
  variant?: 'glass' | 'subtle';
  cyberCorners?: boolean;
  className?: string;
  style?: React.CSSProperties;
}

export const Card: React.FC<CardProps> = ({
  children,
  variant = 'glass',
  cyberCorners = false,
  className = '',
  style,
}) => {
  const panelClass = variant === 'glass' ? 'glass-panel' : 'glass-panel-subtle';
  const cornerClass = cyberCorners ? 'cyber-corners' : '';

  return (
    <div className={`${panelClass} ${cornerClass} ${className}`} style={style}>
      {children}
    </div>
  );
};
