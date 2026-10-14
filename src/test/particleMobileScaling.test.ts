import { describe, it, expect } from 'vitest';
import {
  PARTICLE_SCALE_CONFIG,
  isMobileViewport,
  getBaseScale,
  generatePresetPositions,
  type ParticlePresetShape,
} from '../experiences/particles/particleMath';
import { ParticleSceneController } from '../experiences/particles/ParticleSceneController';
import type { GestureState } from '../core/types';

describe('Particle Universe Mobile Scaling & Framing Regression Tests', () => {
  const presets: ParticlePresetShape[] = ['sphere', 'heart', 'saturn', 'flower', 'dna'];

  it('1. Mobile base scale is smaller than desktop base scale (approx 0.40–0.60 of desktop)', () => {
    const desktopBase = PARTICLE_SCALE_CONFIG.desktopBaseScale;
    const mobileBase = PARTICLE_SCALE_CONFIG.mobileBaseScale;

    expect(desktopBase).toBe(1.0);
    expect(mobileBase).toBeLessThan(desktopBase);
    expect(mobileBase).toBeGreaterThanOrEqual(0.40);
    expect(mobileBase).toBeLessThanOrEqual(0.60);

    const ratio = mobileBase / desktopBase;
    expect(ratio).toBeCloseTo(0.52, 2);
  });

  it('2. Evaluates responsive base scale based on viewport dimensions and user agent', () => {
    // Mobile viewports (width <= 768 or portrait narrow aspect)
    expect(isMobileViewport(320, 568)).toBe(true);
    expect(isMobileViewport(360, 800)).toBe(true);
    expect(isMobileViewport(375, 667)).toBe(true);
    expect(isMobileViewport(390, 844)).toBe(true);
    expect(isMobileViewport(430, 932)).toBe(true);
    expect(isMobileViewport(768, 1024)).toBe(true);

    // Desktop viewports (width >= 1024 landscape)
    expect(isMobileViewport(1024, 768)).toBe(false);
    expect(isMobileViewport(1440, 900)).toBe(false);
    expect(isMobileViewport(1920, 1080)).toBe(false);

    expect(getBaseScale(true)).toBe(0.52);
    expect(getBaseScale(false)).toBe(1.0);
  });

  it('3. Every particle preset uses responsive scaling logic and fits within mobile viewport bounds', () => {
    presets.forEach((shape) => {
      const positions = generatePresetPositions(1000, shape);
      let maxRadius = 0;
      let maxHeight = 0;
      let maxWidth = 0;

      for (let i = 0; i < positions.length; i += 3) {
        const x = positions[i];
        const y = positions[i + 1];
        const z = positions[i + 2];
        const dist = Math.sqrt(x * x + y * y + z * z);
        if (dist > maxRadius) maxRadius = dist;
        if (Math.abs(y) > maxHeight) maxHeight = Math.abs(y);
        if (Math.abs(x) > maxWidth) maxWidth = Math.abs(x);
      }

      // Check scaled geometry on mobile base scale (0.52)
      const mobileScale = PARTICLE_SCALE_CONFIG.mobileBaseScale;
      const scaledWidth = maxWidth * 2 * mobileScale;
      const scaledHeight = maxHeight * 2 * mobileScale;

      // On mobile portrait (e.g. 390x844 with framed camera Z ~9.5-10.0), visible width is ~3.8 units
      // and visible height is ~8.0 units.
      // Every preset must fit with comfortable margins (less than available dimensions).
      expect(scaledWidth).toBeLessThan(3.8);
      expect(scaledHeight).toBeLessThan(5.5);
    });
  });

  it('4. Camera framing dynamically calculates safe camera distance across all required viewports', () => {
    const controller = new ParticleSceneController();
    const mockContainer = document.createElement('div');
    document.body.appendChild(mockContainer);

    const testViewports = [
      { w: 320, h: 568, name: '320px (iPhone SE)' },
      { w: 360, h: 800, name: '360px (Android compact)' },
      { w: 375, h: 667, name: '375px (iPhone 8)' },
      { w: 390, h: 844, name: '390px (iPhone 14)' },
      { w: 430, h: 932, name: '430px (iPhone 15 Pro Max)' },
      { w: 768, h: 1024, name: '768px (iPad Portrait)' },
      { w: 1024, h: 768, name: '1024px (Desktop 4:3)' },
      { w: 1440, h: 900, name: '1440px (Desktop wide)' },
    ];

    controller.mount(mockContainer);

    testViewports.forEach(({ w, h }) => {
      controller.resize(w, h);
      const camera = controller.getCamera();
      expect(camera).not.toBeNull();
      if (!camera) return;

      const isMobile = w <= 768 || (w < 1024 && w < h);
      if (isMobile) {
        expect(controller.getIsMobile()).toBe(true);
        expect(camera.position.z).toBeGreaterThanOrEqual(7.5);
        expect(camera.position.z).toBeLessThanOrEqual(10.0);
      } else {
        expect(controller.getIsMobile()).toBe(false);
        expect(camera.position.z).toBe(7.5);
      }
    });

    controller.dispose();
    document.body.removeChild(mockContainer);
  });

  it('5. Pinch inward decreases scale, pinch outward increases scale', () => {
    let currentExpansion = 1.0;
    const controller = new ParticleSceneController({
      onExpansionChange: (exp) => {
        currentExpansion = exp;
      },
    });

    controller.setIsMobile(true);
    expect(controller.getBaseScale()).toBe(0.52);

    const baseGesture: GestureState = {
      handDetected: true,
      activeGesture: 'NONE',
      handedness: 'Right',
      metrics: {
        handCenter: { x: 0, y: 0, z: 0 },
        rawPinchDistance: 0.1,
        pinchStrength: 0.5,
        palmSize: 0.15,
        fingerCurls: [0.3, 0.3, 0.3, 0.3, 0.3],
        confidence: 0.95,
      },
    };

    // A. Pinch inward (fingers together: pinchStrength = 0.90)
    controller.updateFromGesture(
      {
        ...baseGesture,
        activeGesture: 'PINCH',
        metrics: { ...baseGesture.metrics, pinchStrength: 0.90 },
      },
      1000
    );
    const contractedScale = currentExpansion;
    expect(contractedScale).toBeLessThan(0.52);
    expect(contractedScale).toBeGreaterThanOrEqual(0.28);

    // B. Pinch outward / spread open palm (pinchStrength = 0.05)
    controller.updateFromGesture(
      {
        ...baseGesture,
        activeGesture: 'OPEN_PALM',
        metrics: { ...baseGesture.metrics, pinchStrength: 0.05 },
      },
      1016
    );
    const expandedScale = currentExpansion;
    expect(expandedScale).toBeGreaterThan(0.52);
    expect(expandedScale).toBeGreaterThan(contractedScale);
    expect(expandedScale).toBeLessThanOrEqual(1.15);

    controller.dispose();
  });

  it('6. Scale stays within minimum and maximum limits on both mobile and desktop', () => {
    const controller = new ParticleSceneController();

    // Mobile bounds
    controller.setIsMobile(true);
    const mobileBounds = controller.getScaleBounds();
    expect(mobileBounds.minScale).toBe(0.28);
    expect(mobileBounds.maxScale).toBe(1.15);

    controller.setExpansion(0.05); // try too small
    expect(controller.getCurrentExpansion()).toBe(0.28);

    controller.setExpansion(5.0); // try too large
    expect(controller.getCurrentExpansion()).toBe(1.15);

    // Desktop bounds
    controller.setIsMobile(false);
    const desktopBounds = controller.getScaleBounds();
    expect(desktopBounds.minScale).toBe(0.50);
    expect(desktopBounds.maxScale).toBe(2.20);

    controller.setExpansion(0.1);
    expect(controller.getCurrentExpansion()).toBe(0.50);

    controller.setExpansion(9.0);
    expect(controller.getCurrentExpansion()).toBe(2.20);

    controller.dispose();
  });

  it('7. Scale remains unchanged when pinch input is released or hand returns to neutral', () => {
    let lastReportedExpansion = 0;
    const controller = new ParticleSceneController({
      onExpansionChange: (exp) => {
        lastReportedExpansion = exp;
      },
    });

    controller.setIsMobile(true);

    const mockGesture: GestureState = {
      handDetected: true,
      activeGesture: 'PINCH',
      handedness: 'Right',
      metrics: {
        handCenter: { x: 0, y: 0, z: 0 },
        rawPinchDistance: 0.04,
        pinchStrength: 0.75,
        palmSize: 0.15,
        fingerCurls: [0.5, 0.8, 0.8, 0.8, 0.8],
        confidence: 0.95,
      },
    };

    // User pinches inward
    controller.updateFromGesture(mockGesture, 1000);
    const scaleAfterPinch = lastReportedExpansion;
    expect(scaleAfterPinch).toBeLessThan(0.52);

    // User releases pinch -> neutral/none hand posture
    controller.updateFromGesture(
      {
        ...mockGesture,
        activeGesture: 'NONE',
        metrics: { ...mockGesture.metrics, pinchStrength: 0.45 },
      },
      1032
    );

    // CRITICAL: scale must NOT snap back to 0.52 or 1.0!
    expect(lastReportedExpansion).toBe(scaleAfterPinch);
    expect(controller.getCurrentExpansion()).toBe(scaleAfterPinch);

    // Hand leaves camera frame completely
    controller.updateFromGesture(
      {
        ...mockGesture,
        handDetected: false,
        activeGesture: 'NONE',
      },
      1064
    );

    // Scale remains preserved even when hand leaves frame
    expect(lastReportedExpansion).toBe(scaleAfterPinch);
    expect(controller.getCurrentExpansion()).toBe(scaleAfterPinch);

    controller.dispose();
  });

  it('8. Switching presets and resizing does not unexpectedly reset scale', () => {
    const controller = new ParticleSceneController();
    controller.setIsMobile(true);

    // User scales object to 0.85
    controller.setExpansion(0.85);
    expect(controller.getCurrentExpansion()).toBe(0.85);

    // Switch presets through all 5 shapes
    for (const shape of presets) {
      controller.setShape(shape);
      expect(controller.getCurrentShape()).toBe(shape);
      // Scale MUST be preserved!
      expect(controller.getCurrentExpansion()).toBe(0.85);
    }

    // Resize viewport in mobile mode (e.g. from 390x844 to 430x932)
    controller.resize(430, 932);
    expect(controller.getCurrentExpansion()).toBe(0.85);

    controller.dispose();
  });

  it('9. Resetting simulation returns to device-specific base scale', () => {
    const controller = new ParticleSceneController();

    // Mobile reset
    controller.setIsMobile(true);
    controller.setExpansion(0.95);
    controller.reset();
    expect(controller.getCurrentShape()).toBe('sphere');
    expect(controller.getCurrentExpansion()).toBe(0.52);

    // Desktop reset
    controller.setIsMobile(false);
    controller.setExpansion(1.8);
    controller.reset();
    expect(controller.getCurrentShape()).toBe('sphere');
    expect(controller.getCurrentExpansion()).toBe(1.0);

    controller.dispose();
  });
});
