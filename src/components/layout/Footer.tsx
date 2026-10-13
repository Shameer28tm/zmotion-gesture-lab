import React from 'react';
import { Code2, Cpu, Eye, Sparkles } from 'lucide-react';

export const Footer: React.FC = () => {
  return (
    <footer
      style={{
        padding: '24px',
        backgroundColor: 'rgba(5, 7, 13, 0.95)',
        borderTop: '1px solid var(--border-subtle)',
        display: 'flex',
        flexWrap: 'wrap',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '16px',
        fontSize: '12px',
        color: 'var(--text-muted)',
        zIndex: 20,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>
        <span style={{ color: 'var(--text-secondary)', fontWeight: 600 }}>
          ZMotion — Gesture Lab
        </span>
        <span>•</span>
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
          <Eye size={13} color="var(--electric-blue)" /> Client-Side MediaPipe Vision
        </span>
        <span>•</span>
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
          <Cpu size={13} color="var(--electric-cyan)" /> Three.js WebGL Engine
        </span>
        <span>•</span>
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
          <Sparkles size={13} color="#00ff88" /> Zero Server Video Streaming
        </span>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
        <a
          href="https://github.com/Shameer28tm/zmotion-gesture-lab"
          target="_blank"
          rel="noreferrer"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            color: 'var(--text-secondary)',
            textDecoration: 'none',
            transition: 'color var(--transition-fast)',
          }}
          onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--electric-blue)')}
          onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--text-secondary)')}
        >
          <Code2 size={14} />
          <span>GitHub Source</span>
        </a>
      </div>
    </footer>
  );
};
