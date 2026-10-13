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

      <div style={{ display: 'flex', alignItems: 'center', gap: '14px', flexWrap: 'wrap' }}>
        <a
          href="https://www.linkedin.com/in/shameerion"
          target="_blank"
          rel="noreferrer"
          aria-label="Personal LinkedIn (opens in new tab)"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '5px',
            color: 'var(--text-secondary)',
            textDecoration: 'none',
            transition: 'color var(--transition-fast)',
          }}
          onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--electric-blue)')}
          onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--text-secondary)')}
        >
          <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor">
            <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z"/>
          </svg>
          <span>LinkedIn</span>
        </a>

        <a
          href="https://instagram.com/shameerion"
          target="_blank"
          rel="noreferrer"
          aria-label="Personal Instagram (opens in new tab)"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '5px',
            color: 'var(--text-secondary)',
            textDecoration: 'none',
            transition: 'color var(--transition-fast)',
          }}
          onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--electric-cyan)')}
          onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--text-secondary)')}
        >
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect width="20" height="20" x="2" y="2" rx="5" ry="5"/>
            <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/>
            <line x1="17.5" x2="17.51" y1="6.5" y2="6.5"/>
          </svg>
          <span>Instagram</span>
        </a>

        <a
          href="https://instagram.com/zcloud_digitech"
          target="_blank"
          rel="noreferrer"
          aria-label="Zcloud Digitech Instagram (opens in new tab)"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '5px',
            color: 'var(--text-secondary)',
            textDecoration: 'none',
            transition: 'color var(--transition-fast)',
          }}
          onMouseEnter={(e) => (e.currentTarget.style.color = '#ffaa00')}
          onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--text-secondary)')}
        >
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect width="20" height="20" x="2" y="2" rx="5" ry="5"/>
            <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/>
            <line x1="17.5" x2="17.51" y1="6.5" y2="6.5"/>
          </svg>
          <span>Zcloud Digitech</span>
        </a>

        <a
          href="https://github.com/Shameer28tm/zmotion-gesture-lab"
          target="_blank"
          rel="noreferrer"
          aria-label="GitHub Repository (opens in new tab)"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '5px',
            color: 'var(--text-secondary)',
            textDecoration: 'none',
            transition: 'color var(--transition-fast)',
          }}
          onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--electric-blue)')}
          onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--text-secondary)')}
        >
          <Code2 size={13} />
          <span>GitHub</span>
        </a>
      </div>
    </footer>
  );
};
