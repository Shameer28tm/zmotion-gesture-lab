import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { GestureStudioMath, DEFAULT_STUDIO_CONFIG } from '../experiences/studio/gestureMath';
import { StudioSceneController } from '../experiences/studio/StudioSceneController';
import { GestureStudio } from '../experiences/studio/GestureStudio';
import { GestureProvider } from '../core/engine/GestureContext';
import type { GestureState } from '../core/types';
import { GestureClassifier } from '../core/gestures/GestureClassifier';

describe('GestureStudioMath — Deterministic Mapping Unit Tests', () => {
  describe('Gesture-to-Rotation Mapping', () => {
    it('returns zero rotation for neutral hand center (0, 0)', () => {
      const rot = GestureStudioMath.calculateRotation({ x: 0, y: 0, z: 0 });
      expect(rot.rotX).toBe(0);
      expect(rot.rotY).toBe(0);
    });

    it('maps horizontal hand offset to Y-axis yaw rotation with correct sign', () => {
      const rightHand = GestureStudioMath.calculateRotation({ x: 0.5, y: 0, z: 0 });
      expect(rightHand.rotY).toBeGreaterThan(0);
      expect(rightHand.rotX).toBe(0);

      const leftHand = GestureStudioMath.calculateRotation({ x: -0.5, y: 0, z: 0 });
      expect(leftHand.rotY).toBeLessThan(0);
      expect(leftHand.rotX).toBe(0);
    });

    it('maps vertical hand offset to X-axis pitch rotation with inverted screen coordinate', () => {
      const handAboveCenter = GestureStudioMath.calculateRotation({ x: 0, y: 0.5, z: 0 });
      expect(handAboveCenter.rotX).toBeLessThan(0);

      const handBelowCenter = GestureStudioMath.calculateRotation({ x: 0, y: -0.5, z: 0 });
      expect(handAboveCenter.rotX).toBeLessThan(0);
      expect(handBelowCenter.rotX).toBeGreaterThan(0);
    });

    it('strictly clamps extreme hand coordinates to safe maximum rotation bounds', () => {
      const extremeRight = GestureStudioMath.calculateRotation({ x: 3.5, y: 0, z: 0 });
      expect(extremeRight.rotY).toBeCloseTo(DEFAULT_STUDIO_CONFIG.maxRotY, 4);

      const extremeTop = GestureStudioMath.calculateRotation({ x: 0, y: 4.0, z: 0 });
      expect(extremeTop.rotX).toBeCloseTo(-DEFAULT_STUDIO_CONFIG.maxRotX, 4);
    });

    it('gracefully handles null, undefined, and NaN coordinates without throwing or returning NaN', () => {
      const fromNull = GestureStudioMath.calculateRotation(null);
      expect(fromNull).toEqual({ rotX: 0, rotY: 0 });

      const fromUndefined = GestureStudioMath.calculateRotation(undefined);
      expect(fromUndefined).toEqual({ rotX: 0, rotY: 0 });

      const fromNaNX = GestureStudioMath.calculateRotation({ x: NaN, y: 0.5, z: 0 });
      expect(fromNaNX).toEqual({ rotX: 0, rotY: 0 });

      const fromNaNY = GestureStudioMath.calculateRotation({ x: 0.5, y: NaN, z: 0 });
      expect(fromNaNY).toEqual({ rotX: 0, rotY: 0 });
    });
  });

  describe('Pinch-to-Scale Mapping & Limits', () => {
    it('maps tight pinch (strength = 1.0) to minimum scale', () => {
      const scale = GestureStudioMath.calculateScale(1.0);
      expect(scale).toBeCloseTo(DEFAULT_STUDIO_CONFIG.minScale, 4);
    });

    it('maps open fingers (strength = 0.0) to maximum scale', () => {
      const scale = GestureStudioMath.calculateScale(0.0);
      expect(scale).toBeCloseTo(DEFAULT_STUDIO_CONFIG.maxScale, 4);
    });

    it('maps intermediate pinch strength smoothly', () => {
      const scaleMid = GestureStudioMath.calculateScale(0.5);
      const expectedMid = DEFAULT_STUDIO_CONFIG.minScale + 0.5 * (DEFAULT_STUDIO_CONFIG.maxScale - DEFAULT_STUDIO_CONFIG.minScale);
      expect(scaleMid).toBeCloseTo(expectedMid, 4);
    });

    it('clamps negative or overshoot pinch strength values strictly between minScale and maxScale', () => {
      const negative = GestureStudioMath.calculateScale(-0.8);
      expect(negative).toBeLessThanOrEqual(DEFAULT_STUDIO_CONFIG.maxScale);

      const overshoot = GestureStudioMath.calculateScale(2.5);
      expect(overshoot).toBeGreaterThanOrEqual(DEFAULT_STUDIO_CONFIG.minScale);
    });

    it('returns baseScale when pinch strength is NaN', () => {
      const nanScale = GestureStudioMath.calculateScale(NaN, 1.25);
      expect(nanScale).toBe(1.25);
    });
  });

  describe('Pointing-Trigger Cooldown Logic', () => {
    it('blocks repeated triggers within the 700ms cooldown window', () => {
      const lastTrigger = 1000;
      const immediate = GestureStudioMath.shouldTriggerColorChange(lastTrigger, 1300, 700);
      expect(immediate).toBe(false);

      const justBefore = GestureStudioMath.shouldTriggerColorChange(lastTrigger, 1699, 700);
      expect(justBefore).toBe(false);
    });

    it('permits trigger when elapsed time meets or exceeds the cooldown threshold', () => {
      const lastTrigger = 1000;
      const atThreshold = GestureStudioMath.shouldTriggerColorChange(lastTrigger, 1700, 700);
      expect(atThreshold).toBe(true);

      const afterThreshold = GestureStudioMath.shouldTriggerColorChange(lastTrigger, 2500, 700);
      expect(afterThreshold).toBe(true);
    });

    it('returns false for NaN timestamps', () => {
      expect(GestureStudioMath.shouldTriggerColorChange(NaN, 1000)).toBe(false);
      expect(GestureStudioMath.shouldTriggerColorChange(1000, NaN)).toBe(false);
    });
  });
});

describe('StudioSceneController — Lifecycle & Fallback Controls', () => {
  it('instantiates, sets shape, sets color, and resets cleanly', () => {
    const onColorChange = vi.fn();
    const onControlModeChange = vi.fn();
    const onScaleChange = vi.fn();

    const controller = new StudioSceneController({
      onColorChange,
      onControlModeChange,
      onScaleChange,
    });

    expect(controller.getCurrentShape()).toBe('sphere');
    expect(controller.getCurrentColor()).toBe('#00d2ff');
    expect(controller.getControlMode()).toBe('MANUAL');

    // Switch shape
    controller.setShape('cube');
    expect(controller.getCurrentShape()).toBe('cube');

    controller.setShape('torus');
    expect(controller.getCurrentShape()).toBe('torus');

    // Set color
    controller.setColor('#ff00aa');
    expect(controller.getCurrentColor()).toBe('#ff00aa');
    expect(onColorChange).toHaveBeenCalledWith('#ff00aa');

    // Toggle wireframe
    controller.setWireframeOnly(true);
    expect(controller.isWireframe()).toBe(true);

    // Reset
    controller.reset();
    expect(controller.getCurrentShape()).toBe('sphere');
    expect(controller.getCurrentColor()).toBe('#00d2ff');
    expect(controller.isWireframe()).toBe(false);
    expect(controller.getControlMode()).toBe('MANUAL');

    // Clean disposal
    controller.dispose();
  });

  it('updates from gesture state when hand is detected vs missing', () => {
    const onColorChange = vi.fn();
    const onControlModeChange = vi.fn();
    const onScaleChange = vi.fn();

    const controller = new StudioSceneController({
      onColorChange,
      onControlModeChange,
      onScaleChange,
    });

    const activeState: GestureState = {
      activeGesture: 'PINCH',
      metrics: {
        ...GestureClassifier.createEmptyMetrics(),
        pinchStrength: 0.8,
        handCenter: { x: 0.3, y: -0.2, z: 0 },
      },
      handDetected: true,
      handedness: 'Right',
    };

    // Update with active hand
    controller.updateFromGesture(activeState, 1000);
    expect(controller.getControlMode()).toBe('GESTURE');
    expect(onControlModeChange).toHaveBeenCalledWith('GESTURE');

    // Update with lost hand (hand disappears)
    const lostHandState: GestureState = {
      activeGesture: 'NONE',
      metrics: GestureClassifier.createEmptyMetrics(),
      handDetected: false,
      handedness: 'Unknown',
    };

    expect(() => {
      controller.updateFromGesture(lostHandState, 2000);
    }).not.toThrow();

    controller.dispose();
  });
});

describe('GestureStudio Component — UI & Fallback Testing', () => {
  beforeEach(() => {
    window.scrollTo = () => {};
  });

  it('renders Studio viewport and top HUD telemetry cluster', () => {
    render(
      <GestureProvider>
        <GestureStudio />
      </GestureProvider>
    );

    expect(screen.getByTestId('studio-canvas-container')).toBeDefined();
    expect(screen.getByText('GESTURE STUDIO')).toBeDefined();
    expect(screen.getByText('SHAPE PRESETS')).toBeDefined();
    expect(screen.getByText('CONSTRUCT')).toBeDefined();
    expect(screen.getByText('SCALE FACTOR')).toBeDefined();
    expect(screen.getByText('MANUAL POINTER')).toBeDefined();
  });

  it('allows clicking shape presets and updates active construct selection', () => {
    render(
      <GestureProvider>
        <GestureStudio />
      </GestureProvider>
    );

    const cubeBtn = screen.getByRole('button', { name: /Cube/i });
    fireEvent.click(cubeBtn);
    expect(screen.getByText('CUBE')).toBeDefined();

    const torusBtn = screen.getByRole('button', { name: /Torus/i });
    fireEvent.click(torusBtn);
    expect(screen.getByText('TORUS')).toBeDefined();

    const sphereBtn = screen.getByRole('button', { name: /Sphere/i });
    fireEvent.click(sphereBtn);
    expect(screen.getByText('SPHERE')).toBeDefined();
  });

  it('allows clicking color swatches to change accent color', () => {
    render(
      <GestureProvider>
        <GestureStudio />
      </GestureProvider>
    );

    const pinkSwatch = screen.getByLabelText('Select color #ff00aa');
    fireEvent.click(pinkSwatch);
    expect(screen.getByText('#FF00AA')).toBeDefined();
  });

  it('allows clicking manual scale zoom buttons', () => {
    render(
      <GestureProvider>
        <GestureStudio />
      </GestureProvider>
    );

    const zoomInBtn = screen.getByTitle('Zoom In (Key +)');
    fireEvent.click(zoomInBtn);
    expect(screen.getByText('1.20x')).toBeDefined();

    const zoomOutBtn = screen.getByTitle('Zoom Out (Key -)');
    fireEvent.click(zoomOutBtn);
    expect(screen.getByText('1.00x')).toBeDefined();
  });

  it('allows clicking wireframe toggle and reset buttons', () => {
    render(
      <GestureProvider>
        <GestureStudio />
      </GestureProvider>
    );

    const wireframeBtn = screen.getByTitle('Toggle Wireframe Shell (Key W)');
    fireEvent.click(wireframeBtn);
    expect(screen.getByText('Wireframe')).toBeDefined();

    const resetBtn = screen.getByTitle('Reset Viewport (Key R)');
    fireEvent.click(resetBtn);
    expect(screen.getByText('Solid Shell')).toBeDefined();
    expect(screen.getByText('SPHERE')).toBeDefined();
  });
});
