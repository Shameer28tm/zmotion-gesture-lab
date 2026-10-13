import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import {
  generatePresetPositions,
  generatePresetColors,
  easeCubicInOut,
  type ParticlePresetShape,
  DEFAULT_PARTICLE_CONFIG,
} from '../experiences/particles/particleMath';
import { ParticleSceneController } from '../experiences/particles/ParticleSceneController';
import type { GestureState } from '../core/types';

describe('Particle Math & Generators', () => {
  const shapes: ParticlePresetShape[] = ['sphere', 'heart', 'saturn', 'flower', 'dna'];
  const count = 1000;

  shapes.forEach((shape) => {
    it(`generates valid deterministic positions for preset: ${shape}`, () => {
      const positions = generatePresetPositions(count, shape);
      expect(positions).toBeInstanceOf(Float32Array);
      expect(positions.length).toBe(count * 3);

      let hasNaN = false;
      let minVal = Infinity;
      let maxVal = -Infinity;

      for (let i = 0; i < positions.length; i++) {
        const val = positions[i];
        if (Number.isNaN(val) || !Number.isFinite(val)) {
          hasNaN = true;
          break;
        }
        if (val < minVal) minVal = val;
        if (val > maxVal) maxVal = val;
      }

      expect(hasNaN).toBe(false);
      // Verify reasonable bounding box
      expect(minVal).toBeGreaterThan(-15);
      expect(maxVal).toBeLessThan(15);
    });

    it(`generates valid normalized color attributes for preset: ${shape}`, () => {
      const colors = generatePresetColors(count, shape);
      expect(colors).toBeInstanceOf(Float32Array);
      expect(colors.length).toBe(count * 3);

      let allNormalized = true;
      for (let i = 0; i < colors.length; i++) {
        const c = colors[i];
        if (c < 0 || c > 1 || Number.isNaN(c)) {
          allNormalized = false;
          break;
        }
      }

      expect(allNormalized).toBe(true);
    });
  });

  it('computes cubic bezier easing curves correctly', () => {
    expect(easeCubicInOut(0)).toBeCloseTo(0, 5);
    expect(easeCubicInOut(0.5)).toBeCloseTo(0.5, 5);
    expect(easeCubicInOut(1)).toBeCloseTo(1, 5);

    // Monotonic progression
    const steps = [0.1, 0.25, 0.5, 0.75, 0.9];
    let prev = 0;
    for (const s of steps) {
      const val = easeCubicInOut(s);
      expect(val).toBeGreaterThan(prev);
      prev = val;
    }
  });
});

describe('ParticleSceneController Lifecycle & Morphing', () => {
  let container: HTMLDivElement;

  beforeEach(() => {
    container = document.createElement('div');
    Object.defineProperty(container, 'clientWidth', { value: 800, configurable: true });
    Object.defineProperty(container, 'clientHeight', { value: 600, configurable: true });
    document.body.appendChild(container);
  });

  afterEach(() => {
    if (container.parentNode) {
      container.parentNode.removeChild(container);
    }
  });

  it('initializes, mounts, and gracefully handles headless WebGL context', () => {
    const controller = new ParticleSceneController();
    expect(controller.getCurrentShape()).toBe('sphere');
    expect(controller.getCurrentExpansion()).toBe(1.0);
    expect(controller.getControlMode()).toBe('MANUAL');

    // Mount into container
    controller.mount(container, 500);

    // Should have appended a canvas or fallback element
    expect(container.children.length).toBeGreaterThan(0);

    // Clean disposal
    controller.dispose();
    expect(controller.getCurrentShape()).toBe('sphere');
  });

  it('cycles through preset shapes correctly', () => {
    const shapesRecorded: ParticlePresetShape[] = [];
    const controller = new ParticleSceneController({
      onShapeChange: (shape) => shapesRecorded.push(shape),
    });

    controller.setShape('heart');
    expect(controller.getCurrentShape()).toBe('heart');

    controller.nextShape();
    expect(controller.getCurrentShape()).toBe('saturn');

    controller.nextShape();
    expect(controller.getCurrentShape()).toBe('flower');

    controller.nextShape();
    expect(controller.getCurrentShape()).toBe('dna');

    controller.nextShape();
    expect(controller.getCurrentShape()).toBe('sphere');

    expect(shapesRecorded).toEqual(['heart', 'saturn', 'flower', 'dna', 'sphere']);
    controller.dispose();
  });

  it('clamps expansion factor within configured safety limits', () => {
    const controller = new ParticleSceneController();

    // Below minimum
    controller.setExpansion(-5.0);
    expect(controller.getCurrentExpansion()).toBeGreaterThanOrEqual(DEFAULT_PARTICLE_CONFIG.minScale);

    // Above maximum
    controller.setExpansion(100.0);
    expect(controller.getCurrentExpansion()).toBeLessThanOrEqual(DEFAULT_PARTICLE_CONFIG.maxScale);

    // Safe midpoint
    controller.setExpansion(1.8);
    expect(controller.getCurrentExpansion()).toBe(1.8);

    controller.dispose();
  });

  it('maps continuous gesture input to expansion and switches to GESTURE mode', () => {
    let modeState: 'GESTURE' | 'MANUAL' = 'MANUAL';
    let expansionReported = 1.0;

    const controller = new ParticleSceneController({
      onControlModeChange: (m) => {
        modeState = m;
      },
      onExpansionChange: (exp) => {
        expansionReported = exp;
      },
    });

    const mockGestureState: GestureState = {
      handDetected: true,
      activeGesture: 'PINCH',
      handedness: 'Right',
      metrics: {
        handCenter: { x: 0.2, y: -0.1, z: 0 },
        rawPinchDistance: 0.03,
        pinchStrength: 0.85,
        palmSize: 0.15,
        fingerCurls: [0.5, 0.8, 0.8, 0.8, 0.8],
        confidence: 0.95,
      },
    };

    controller.updateFromGesture(mockGestureState, 1000);

    expect(modeState).toBe('GESTURE');
    expect(controller.getControlMode()).toBe('GESTURE');
    expect(expansionReported).toBeLessThan(1.0); // Pinched -> contracted

    // Test open palm spread -> expansion
    const spreadGestureState: GestureState = {
      ...mockGestureState,
      activeGesture: 'OPEN_PALM',
      metrics: {
        ...mockGestureState.metrics,
        pinchStrength: 0.05,
      },
    };

    controller.updateFromGesture(spreadGestureState, 1016);
    expect(expansionReported).toBeGreaterThan(1.8); // Spread -> expanded

    controller.dispose();
  });

  it('resets universe transforms and returns to defaults', () => {
    const controller = new ParticleSceneController();
    controller.setShape('flower');
    controller.setExpansion(2.2);

    controller.reset();
    expect(controller.getCurrentShape()).toBe('sphere');
    expect(controller.getCurrentExpansion()).toBe(1.0);
    expect(controller.getControlMode()).toBe('MANUAL');

    controller.dispose();
  });
});
