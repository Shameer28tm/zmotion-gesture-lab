import React from 'react';
import '../../styles/spaceBackground.css';

export const CosmicSpaceBackground: React.FC = () => {
  return (
    <div className="cosmic-space-canvas" aria-hidden="true">
      {/* Distant Layered Starfield */}
      <div className="cosmic-stars-distant" />
      <div className="cosmic-stars-bright" />

      {/* Subtle Orbital Ellipse (Pure SVG) */}
      <svg className="cosmic-orbit-svg" viewBox="0 0 1100 600" fill="none">
        <ellipse
          cx="550"
          cy="300"
          rx="520"
          ry="240"
          stroke="url(#orbitGradient)"
          strokeWidth="1"
          strokeDasharray="4 8"
        />
        <defs>
          <linearGradient id="orbitGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#00d2ff" stopOpacity="0.05" />
            <stop offset="50%" stopColor="#00f5d4" stopOpacity="0.22" />
            <stop offset="100%" stopColor="#00d2ff" stopOpacity="0.05" />
          </linearGradient>
        </defs>
      </svg>

      {/* Primary Sapphire Planet & Ring */}
      <div className="cosmic-planet-primary">
        <div className="cosmic-planet-ring" />
      </div>

      {/* Distant Moon */}
      <div className="cosmic-moon" />

      {/* Occasional Shooting Star Streak */}
      <div className="cosmic-shooting-star" />
    </div>
  );
};
