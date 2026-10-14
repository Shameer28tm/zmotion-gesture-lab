import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import App from '../App';
import { NAV_ITEMS } from '../types/navigation';

describe('Route Hygiene & Developer Attribution Tests (Tasks 3 & 4)', () => {
  beforeEach(() => {
    window.location.hash = '';
    window.scrollTo = () => {};
  });

  it('renders elegant editorial developer credit Developed by Shameer TM on landing page', () => {
    render(<App />);

    const devCredits = screen.getAllByText('Developed by');
    expect(devCredits.length).toBeGreaterThan(0);

    const devLink = screen.getByLabelText(/Developer LinkedIn Profile: Shameer TM/i);
    expect(devLink).toBeDefined();
    expect(devLink.getAttribute('href')).toBe('https://www.linkedin.com/in/shameerion');
    expect(devLink.getAttribute('target')).toBe('_blank');
    expect(devLink.getAttribute('rel')).toContain('noopener');

    // Brand slogan is preserved
    expect(
      screen.getByText('Leverage Early. Move Differently. Sky Is the Limit.')
    ).toBeDefined();
  });

  it('removes Tech & Architecture route from navigation items', () => {
    const routeIds = NAV_ITEMS.map((item) => item.id);
    expect(routeIds).not.toContain('about');
    expect(NAV_ITEMS.find((item) => item.label.includes('Architecture'))).toBeUndefined();
    expect(routeIds).toEqual(['home', 'studio', 'particles', 'runner']);
  });

  it('safely redirects obsolete #about hash route to home landing page', () => {
    window.location.hash = '#about';
    render(<App />);

    // Renders home landing content instead of failing
    expect(screen.getByText(/Real-Time Hand Gesture Control in 3D/i)).toBeDefined();
    expect(screen.getByText('100% USER-SIDE PRIVACY')).toBeDefined();
  });
});
