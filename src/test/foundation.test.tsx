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

  it('navigates to Gesture Studio when clicking studio action', () => {
    render(<App />);
    const studioBtn = screen.getAllByText('Open 3D Gesture Studio')[0];
    fireEvent.click(studioBtn);
    expect(screen.getByText('GESTURE STUDIO')).toBeDefined();
    expect(screen.getByText('SHAPE PRESETS')).toBeDefined();
  });

  it('navigates to Particle Universe when clicking particles action', () => {
    render(<App />);
    const particlesBtn = screen.getAllByText('Launch Particle Universe')[0];
    fireEvent.click(particlesBtn);
    expect(screen.getByText('PARTICLE UNIVERSE')).toBeDefined();
    expect(screen.getByText(/MORPHING CONSTRUCTS/i)).toBeDefined();
  });

  it('navigates to Gesture Runner when clicking runner action', () => {
    render(<App />);
    const runnerBtn = screen.getAllByText('Play Cyber Runner')[0];
    fireEvent.click(runnerBtn);
    expect(screen.getByText('GESTURE RUNNER')).toBeDefined();
    expect(screen.getByText(/INPUT CONTROLLER/i)).toBeDefined();
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
