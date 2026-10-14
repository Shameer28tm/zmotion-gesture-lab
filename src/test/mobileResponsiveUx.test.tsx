import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { GestureProvider } from '../core/engine/GestureContext';
import { GestureStudio } from '../experiences/studio/GestureStudio';
import { ParticleUniverse } from '../experiences/particles/ParticleUniverse';
import { GestureRunner } from '../experiences/runner/GestureRunner';

describe('Mobile Responsive Layout & Drawer Architecture (Task 1)', () => {
  it('renders Gesture Studio mobile bar and opens/closes advanced controls drawer', async () => {
    render(
      <GestureProvider>
        <GestureStudio />
      </GestureProvider>
    );

    // Mobile header bar controls
    expect(screen.getAllByText('Gesture Studio').length).toBeGreaterThan(0);

    // Photo and Record buttons are visible in mobile bar
    expect(screen.getAllByTitle(/Capture Snapshot/i).length).toBeGreaterThan(0);
    expect(screen.getAllByTitle(/Record/i).length).toBeGreaterThan(0);

    // Drawer is closed initially
    expect(screen.queryByRole('dialog', { name: /Gesture Studio Controls/i })).toBeNull();

    // Click More button to open collapsible drawer
    const moreBtn = screen.getByRole('button', { name: /Open advanced controls drawer/i });
    fireEvent.click(moreBtn);

    // Drawer is open
    const drawer = await screen.findByRole('dialog', { name: /Gesture Studio Controls/i });
    expect(drawer).toBeDefined();
    expect(screen.getByText('CONSTRUCT SELECTION')).toBeDefined();
    expect(screen.getByText('EMISSIVE ACCENT COLOR')).toBeDefined();

    // Close with explicit Done button
    const closeBtn = screen.getByRole('button', { name: /Close controls drawer/i });
    fireEvent.click(closeBtn);

    expect(screen.queryByRole('dialog', { name: /Gesture Studio Controls/i })).toBeNull();
  });

  it('renders Particle Universe mobile bar and opens/closes advanced drawer', async () => {
    render(
      <GestureProvider>
        <ParticleUniverse />
      </GestureProvider>
    );

    // Mobile header bar with title
    expect(screen.getAllByText('Particle Universe').length).toBeGreaterThan(0);

    // Click More button
    const moreBtn = screen.getByRole('button', { name: /Open advanced controls drawer/i });
    fireEvent.click(moreBtn);

    // Drawer is open with particle parameters
    const drawer = await screen.findByRole('dialog', { name: /Particle Universe Controls/i });
    expect(drawer).toBeDefined();
    expect(screen.getByText(/PARAMETRIC CONSTRUCTS/i)).toBeDefined();
    expect(screen.getByText(/GPU PARTICLE DENSITY TIER/i)).toBeDefined();

    // Close with backdrop click
    const backdrop = document.querySelector('.mobile-drawer-backdrop');
    expect(backdrop).toBeDefined();
    if (backdrop) {
      fireEvent.click(backdrop);
    }

    expect(screen.queryByRole('dialog', { name: /Particle Universe Controls/i })).toBeNull();
  });

  it('renders Gesture Runner mobile touch controls bar and opens/closes settings drawer', async () => {
    render(
      <GestureProvider>
        <GestureRunner />
      </GestureProvider>
    );

    // Mobile header bar with title
    expect(screen.getAllByText('Gesture Runner').length).toBeGreaterThan(0);

    // Dedicated mobile touch runner bar buttons
    const leftBtn = screen.getByRole('button', { name: /Move Lane Left/i });
    const jumpBtn = screen.getByRole('button', { name: /Jump Over Obstacle/i });
    const rightBtn = screen.getByRole('button', { name: /Move Lane Right/i });

    expect(leftBtn).toBeDefined();
    expect(jumpBtn).toBeDefined();
    expect(rightBtn).toBeDefined();

    // Clicking Left/Right/Jump triggers actions without throwing
    fireEvent.click(leftBtn);
    fireEvent.click(jumpBtn);
    fireEvent.click(rightBtn);

    // Open runner settings drawer
    const moreBtn = screen.getByRole('button', { name: /Open advanced controls drawer/i });
    fireEvent.click(moreBtn);

    const drawer = await screen.findByRole('dialog', { name: /Gesture Runner Settings/i });
    expect(drawer).toBeDefined();
    expect(screen.getByText('GAME DIFFICULTY')).toBeDefined();
    expect(screen.getByText(/RUNNER TELEMETRY/i)).toBeDefined();

    // Close drawer via Escape key
    fireEvent.keyDown(window, { key: 'Escape' });
    expect(screen.queryByRole('dialog', { name: /Gesture Runner Settings/i })).toBeNull();
  });
});
