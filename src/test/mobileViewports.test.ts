import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';

describe('Mobile Viewports & CSS Audit (320px, 360px, 390px, 430px, Tablet & Desktop)', () => {
  const hudCssPath = path.resolve(__dirname, '../styles/hud.css');
  const indexCssPath = path.resolve(__dirname, '../index.css');

  const hudCss = fs.readFileSync(hudCssPath, 'utf8');
  const indexCss = fs.readFileSync(indexCssPath, 'utf8');

  it('contains media query architecture covering 320px to 430px mobile widths', () => {
    // Audit mobile breakpoint (<= 768px)
    expect(hudCss).toContain('@media (max-width: 768px)');

    // Audit ultra-compact narrow phone breakpoint (<= 380px, covering 320px, 360px, 375px)
    expect(hudCss).toContain('@media (max-width: 380px)');

    // Audit landscape mobile breakpoint (height <= 520px)
    expect(hudCss).toContain('@media (max-height: 520px) and (orientation: landscape)');

    // Audit tablet range (769px to 1024px)
    expect(hudCss).toContain('@media (min-width: 769px) and (max-width: 1024px)');

    // Audit desktop range (>= 769px)
    expect(hudCss).toContain('@media (min-width: 769px)');
  });

  it('enforces safe area insets on mobile overlay and bars', () => {
    expect(hudCss).toContain('env(safe-area-inset-top');
    expect(hudCss).toContain('env(safe-area-inset-bottom');
  });

  it('optimizes touch responsiveness and eliminates 300ms mobile tap delay', () => {
    expect(hudCss).toContain('touch-action: manipulation');
    expect(hudCss).toContain('-webkit-tap-highlight-color: transparent');
  });

  it('respects prefers-reduced-motion across global UI and animations', () => {
    expect(hudCss).toContain('@media (prefers-reduced-motion: reduce)');
    expect(hudCss).toContain('animation-duration: 0.01ms !important');
  });

  it('prevents horizontal page overflow on narrow screens', () => {
    expect(indexCss).toContain('overflow-x: hidden');
    expect(hudCss).toContain('overflow: hidden');
    expect(hudCss).toContain('.mobile-runner-score-badge');
  });

  it('validates vercel.json configuration for Vite SPA with camera permissions and caching', () => {
    const vercelJsonPath = path.resolve(__dirname, '../../vercel.json');
    expect(fs.existsSync(vercelJsonPath)).toBe(true);

    const vercelConfig = JSON.parse(fs.readFileSync(vercelJsonPath, 'utf8'));
    expect(vercelConfig.framework).toBe('vite');
    expect(vercelConfig.buildCommand).toBe('npm run build');
    expect(vercelConfig.outputDirectory).toBe('dist');
    expect(vercelConfig.rewrites).toEqual([{ source: '/(.*)', destination: '/index.html' }]);
    
    // Validate Permissions-Policy allows camera
    const headers = vercelConfig.headers || [];
    const globalHeader = headers.find((h: { source: string }) => h.source === '/(.*)');
    expect(globalHeader).toBeDefined();
    const cameraPolicy = globalHeader.headers.find((kv: { key: string }) => kv.key === 'Permissions-Policy');
    expect(cameraPolicy.value).toContain('camera=(self)');
  });
});
