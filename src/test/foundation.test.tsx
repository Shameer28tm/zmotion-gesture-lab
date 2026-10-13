import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import App from '../App';

describe('ZMotion Foundation Tests', () => {
  beforeEach(() => {
    window.location.hash = '';
    window.scrollTo = () => {};
  });

  it('renders the header with ZMotion branding and status badge', () => {
    render(<App />);
    expect(screen.getByText('ZMOTION')).toBeDefined();
    expect(screen.getByText('GESTURE LAB')).toBeDefined();
    expect(screen.getByText('VISION ENGINE')).toBeDefined();
  });

  it('renders home hero section and calls to action', () => {
    render(<App />);
    expect(screen.getByText(/Touchless Interaction in/i)).toBeDefined();
    expect(screen.getAllByText('Launch Particle Universe').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Open 3D Gesture Studio').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Play Cyber Runner').length).toBeGreaterThan(0);
  });

  it('navigates to Gesture Studio when clicking studio action', async () => {
    render(<App />);
    const studioBtn = screen.getAllByText('Open 3D Gesture Studio')[0];
    fireEvent.click(studioBtn);
    expect(await screen.findByText('GESTURE STUDIO')).toBeDefined();
    expect(await screen.findByText('SHAPE PRESETS')).toBeDefined();
  });

  it('navigates to Particle Universe when clicking particles action', async () => {
    render(<App />);
    const particlesBtn = screen.getAllByText('Launch Particle Universe')[0];
    fireEvent.click(particlesBtn);
    expect(await screen.findByText('PARTICLE UNIVERSE')).toBeDefined();
    expect(await screen.findByText(/MORPHING CONSTRUCTS/i)).toBeDefined();
  });

  it('navigates to Gesture Runner when clicking runner action', async () => {
    render(<App />);
    const runnerBtn = screen.getAllByText('Play Cyber Runner')[0];
    fireEvent.click(runnerBtn);
    expect(await screen.findByText('GESTURE RUNNER')).toBeDefined();
    expect(await screen.findByText(/INPUT CONTROLLER/i)).toBeDefined();
  });

  it('opens and closes the onboarding modal when Controls button is clicked', () => {
    render(<App />);
    const controlsBtn = screen.getByText('Controls');
    fireEvent.click(controlsBtn);
    expect(screen.getByText('ZMotion Gesture Lab — Controls & Calibration')).toBeDefined();

    const enterBtn = screen.getByText('Enter Gesture Lab');
    fireEvent.click(enterBtn);
    expect(screen.queryByText('ZMotion Gesture Lab — Controls & Calibration')).toBeNull();
  });
});
