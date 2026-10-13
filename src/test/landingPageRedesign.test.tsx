import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { HomeLanding } from '../experiences/home/HomeLanding';
import App from '../App';

describe('Landing Page Redesign & Space Background (Priority 5 & 6)', () => {
  it('renders exact H1 with visual prominence and length under 75 chars', () => {
    const handleNavigate = vi.fn();
    const handleOnboarding = vi.fn();
    render(<HomeLanding onNavigate={handleNavigate} onOpenOnboarding={handleOnboarding} />);

    const h1 = screen.getByRole('heading', { level: 1 });
    expect(h1).toBeDefined();
    expect(h1.textContent?.replace(/\s+/g, ' ').trim()).toBe(
      'ZMotion: Real-Time Hand Gesture Control in 3D'
    );
    expect(h1.textContent?.length).toBeLessThan(75);
  });

  it('renders concise human-readable hero product description', () => {
    const handleNavigate = vi.fn();
    const handleOnboarding = vi.fn();
    render(<HomeLanding onNavigate={handleNavigate} onOpenOnboarding={handleOnboarding} />);

    expect(
      screen.getByText(
        'Turn your webcam into a touch-free creative space. Move, shape, and play with hand gestures — privately, right in your browser.'
      )
    ).toBeDefined();
  });

  it('renders 100% USER-SIDE PRIVACY statement with supporting text', () => {
    const handleNavigate = vi.fn();
    const handleOnboarding = vi.fn();
    render(<HomeLanding onNavigate={handleNavigate} onOpenOnboarding={handleOnboarding} />);

    expect(screen.getByText('100% USER-SIDE PRIVACY')).toBeDefined();
    expect(
      screen.getByText(
        'Your camera is yours. Explore, create, capture, and download — without uploading your photos or videos to our servers.'
      )
    ).toBeDefined();
  });

  it('renders the brand signature slogan', () => {
    const handleNavigate = vi.fn();
    const handleOnboarding = vi.fn();
    render(<HomeLanding onNavigate={handleNavigate} onOpenOnboarding={handleOnboarding} />);

    expect(
      screen.getByText('Leverage Early. Move Differently. Sky Is the Limit.')
    ).toBeDefined();
  });

  it('renders accessible social profiles directly on the landing page', () => {
    const handleNavigate = vi.fn();
    const handleOnboarding = vi.fn();
    render(<HomeLanding onNavigate={handleNavigate} onOpenOnboarding={handleOnboarding} />);

    const linkedinLink = screen.getByLabelText(/LinkedIn profile of Shameer/i);
    expect(linkedinLink.getAttribute('href')).toBe('https://www.linkedin.com/in/shameerion');

    const personalIg = screen.getByLabelText(/Personal Instagram of Shameer/i);
    expect(personalIg.getAttribute('href')).toBe('https://instagram.com/shameerion');

    const studioIg = screen.getByLabelText(/Zcloud Digitech Studio Instagram/i);
    expect(studioIg.getAttribute('href')).toBe('https://instagram.com/zcloud_digitech');
  });

  it('does NOT contain old tech badges, CTA button row, or old technical cards on landing page', () => {
    const handleNavigate = vi.fn();
    const handleOnboarding = vi.fn();
    render(<HomeLanding onNavigate={handleNavigate} onOpenOnboarding={handleOnboarding} />);

    // Old badges removed
    expect(screen.queryByText('MEDIAPIPE TASKS VISION')).toBeNull();
    expect(screen.queryByText('THREE.JS WEBGL ENGINE')).toBeNull();
    expect(screen.queryByText('ZERO CLOUD STREAMING')).toBeNull();

    // Old technical feature cards removed
    expect(screen.queryByText('Decoupled 60 FPS Render')).toBeNull();
    expect(screen.queryByText('Adaptive Filtering')).toBeNull();
  });

  it('removes top navigation row on landing route in App', () => {
    render(<App />);
    // Navigation bar with route buttons should not be in the DOM when on home route
    expect(screen.queryByText('VISION ENGINE')).toBeNull();
    expect(screen.queryByText('Controls')).toBeNull();
  });

  it('renders lightweight 2D cosmic space background element', () => {
    const { container } = render(
      <HomeLanding onNavigate={vi.fn()} onOpenOnboarding={vi.fn()} />
    );
    expect(container.querySelector('.cosmic-space-canvas')).toBeDefined();
    expect(container.querySelector('.cosmic-stars-distant')).toBeDefined();
    expect(container.querySelector('.cosmic-planet-primary')).toBeDefined();
  });
});
