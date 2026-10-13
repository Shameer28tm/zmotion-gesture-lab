import {
  Scene,
  PerspectiveCamera,
  WebGLRenderer,
  BufferGeometry,
  BufferAttribute,
  Points,
  PointsMaterial,
  AdditiveBlending,
} from 'three';
import type { GestureState } from '../../core/types';
import {
  type ParticlePresetShape,
  DEFAULT_PARTICLE_CONFIG,
  generatePresetPositions,
  generatePresetColors,
  easeCubicInOut,
} from './particleMath';
import { GestureStudioMath } from '../studio/gestureMath';

export interface ParticleSceneCallbacks {
  onShapeChange?: (shape: ParticlePresetShape) => void;
  onExpansionChange?: (expansion: number) => void;
  onControlModeChange?: (mode: 'GESTURE' | 'MANUAL') => void;
}

export class ParticleSceneController {
  private container: HTMLElement | null = null;
  private renderer: WebGLRenderer | null = null;
  private scene: Scene | null = null;
  private camera: PerspectiveCamera | null = null;
  private animationFrameId: number | null = null;
  private resizeObserver: ResizeObserver | null = null;

  // Particle System
  private particleCount: number = DEFAULT_PARTICLE_CONFIG.defaultCount;
  private pointsMesh: Points | null = null;
  private geometry: BufferGeometry | null = null;
  private material: PointsMaterial | null = null;

  // Position & Color Buffers
  private currentBasePositions: Float32Array = new Float32Array(0);
  private sourcePositions: Float32Array = new Float32Array(0);
  private targetPositions: Float32Array = new Float32Array(0);

  private currentColors: Float32Array = new Float32Array(0);
  private sourceColors: Float32Array = new Float32Array(0);
  private targetColors: Float32Array = new Float32Array(0);

  // Morph Animation State
  private currentShape: ParticlePresetShape = 'sphere';
  private isMorphing: boolean = false;
  private morphStartTime: number = 0;
  private morphDurationMs: number = DEFAULT_PARTICLE_CONFIG.morphDurationMs;

  // Continuous Dynamic Transforms
  private currentRotation = { x: 0, y: 0 };
  private targetRotation = { x: 0, y: 0 };
  private currentExpansion: number = 1.0;
  private targetExpansion: number = 1.0;
  private baseExpansion: number = 1.0;

  private isPaused: boolean = false;
  private controlMode: 'GESTURE' | 'MANUAL' = 'MANUAL';

  // Manual fallback pointer drag
  private isPointerDown: boolean = false;
  private previousPointerPos = { x: 0, y: 0 };
  private boundPointerDown: (e: PointerEvent) => void;
  private boundPointerMove: (e: PointerEvent) => void;
  private boundPointerUp: (e: PointerEvent) => void;
  private boundWheel: (e: WheelEvent) => void;

  private callbacks: ParticleSceneCallbacks;
  private lastFrameTime: number = performance.now();
  private elapsedSeconds: number = 0;

  constructor(callbacks: ParticleSceneCallbacks = {}) {
    this.callbacks = callbacks;

    this.boundPointerDown = this.onPointerDown.bind(this);
    this.boundPointerMove = this.onPointerMove.bind(this);
    this.boundPointerUp = this.onPointerUp.bind(this);
    this.boundWheel = this.onWheel.bind(this);
    this.renderLoop = this.renderLoop.bind(this);
  }

  public mount(container: HTMLElement, count: number = DEFAULT_PARTICLE_CONFIG.defaultCount): void {
    if (this.container) {
      this.dispose();
    }
    this.container = container;
    this.particleCount = count;

    // 1. Three.js Scene & Camera
    this.scene = new Scene();
    const width = container.clientWidth || 800;
    const height = container.clientHeight || 600;
    this.camera = new PerspectiveCamera(45, width / height, 0.1, 100);
    this.camera.position.set(0, 0, 7.5);

    // 2. High-performance Transparent Renderer
    try {
      this.renderer = new WebGLRenderer({
        antialias: true,
        alpha: true,
        preserveDrawingBuffer: true,
        powerPreference: 'high-performance',
      });
      this.renderer.setSize(width, height);
      this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
      this.renderer.setClearColor(0x000000, 0); // 100% transparent for live camera layer

      const canvas = this.renderer.domElement;
      canvas.className = 'viewport-canvas';
      canvas.style.width = '100%';
      canvas.style.height = '100%';
      canvas.style.display = 'block';
      canvas.style.touchAction = 'none';
      container.appendChild(canvas);
    } catch (err) {
      console.warn('Particle WebGL context creation failed (headless/fallback):', err);
      const fallback = document.createElement('div');
      fallback.setAttribute('data-testid', 'particle-webgl-fallback');
      fallback.style.width = '100%';
      fallback.style.height = '100%';
      fallback.style.display = 'flex';
      fallback.style.alignItems = 'center';
      fallback.style.justifyContent = 'center';
      fallback.style.color = 'var(--electric-cyan)';
      fallback.style.fontFamily = 'monospace';
      fallback.innerText = '[Particle Universe Standby Mode]';
      container.appendChild(fallback);
      return;
    }

    const canvas = this.renderer.domElement;

    // 3. Initialize Particle Buffers
    this.currentBasePositions = generatePresetPositions(this.particleCount, this.currentShape);
    this.sourcePositions = new Float32Array(this.currentBasePositions);
    this.targetPositions = new Float32Array(this.currentBasePositions);

    this.currentColors = generatePresetColors(this.particleCount, this.currentShape);
    this.sourceColors = new Float32Array(this.currentColors);
    this.targetColors = new Float32Array(this.currentColors);

    // 4. Construct Geometry & Points
    this.geometry = new BufferGeometry();
    this.geometry.setAttribute('position', new BufferAttribute(new Float32Array(this.currentBasePositions), 3));
    this.geometry.setAttribute('color', new BufferAttribute(new Float32Array(this.currentColors), 3));

    this.material = new PointsMaterial({
      size: 0.045,
      vertexColors: true,
      transparent: true,
      opacity: 0.92,
      blending: AdditiveBlending,
      depthWrite: false,
    });

    this.pointsMesh = new Points(this.geometry, this.material);
    this.scene.add(this.pointsMesh);

    // 5. User Input Listeners
    canvas.addEventListener('pointerdown', this.boundPointerDown);
    window.addEventListener('pointermove', this.boundPointerMove);
    window.addEventListener('pointerup', this.boundPointerUp);
    canvas.addEventListener('wheel', this.boundWheel, { passive: false });

    // 6. Resize Observer
    this.resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const { width: w, height: h } = entry.contentRect;
        this.resize(w, h);
      }
    });
    this.resizeObserver.observe(container);

    // 7. Start Animation Loop
    this.lastFrameTime = performance.now();
    this.animationFrameId = requestAnimationFrame(this.renderLoop);
  }

  public resize(width: number, height: number): void {
    if (!this.renderer || !this.camera || width <= 0 || height <= 0) return;
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(width, height);
  }

  /**
   * Smoothly morphs the particle cloud to a target preset shape
   */
  public setShape(nextShape: ParticlePresetShape): void {
    if (this.currentShape === nextShape && !this.isMorphing) return;

    this.sourcePositions = new Float32Array(this.currentBasePositions);
    this.targetPositions = generatePresetPositions(this.particleCount, nextShape);

    this.sourceColors = new Float32Array(this.currentColors);
    this.targetColors = generatePresetColors(this.particleCount, nextShape);

    this.currentShape = nextShape;
    this.morphStartTime = performance.now();
    this.isMorphing = true;

    this.callbacks.onShapeChange?.(nextShape);
  }

  public nextShape(): void {
    const presets: ParticlePresetShape[] = ['sphere', 'heart', 'saturn', 'flower', 'dna'];
    const currentIndex = presets.indexOf(this.currentShape);
    const nextIndex = (currentIndex + 1) % presets.length;
    this.setShape(presets[nextIndex]);
  }

  public setExpansion(expansion: number): void {
    this.baseExpansion = Math.max(
      DEFAULT_PARTICLE_CONFIG.minScale,
      Math.min(DEFAULT_PARTICLE_CONFIG.maxScale, expansion)
    );
    this.targetExpansion = this.baseExpansion;
    if (!this.pointsMesh) {
      this.currentExpansion = this.baseExpansion;
    }
    this.callbacks.onExpansionChange?.(Number(this.baseExpansion.toFixed(2)));
  }

  public togglePause(): boolean {
    this.isPaused = !this.isPaused;
    return this.isPaused;
  }

  public reset(): void {
    this.targetRotation = { x: 0, y: 0 };
    this.currentRotation = { x: 0, y: 0 };
    this.baseExpansion = 1.0;
    this.targetExpansion = 1.0;
    this.currentExpansion = 1.0;
    this.isPaused = false;
    this.controlMode = 'MANUAL';
    if (this.pointsMesh) {
      this.pointsMesh.rotation.set(0, 0, 0);
      this.pointsMesh.scale.set(1, 1, 1);
    }
    this.setShape('sphere');
    this.callbacks.onExpansionChange?.(1.0);
    this.callbacks.onControlModeChange?.('MANUAL');
  }

  /**
   * Per-frame gesture updates decoupled from React renders
   */
  public updateFromGesture(state: GestureState, _now: number): void {
    if (state.handDetected) {
      if (this.controlMode !== 'GESTURE') {
        this.controlMode = 'GESTURE';
        this.callbacks.onControlModeChange?.('GESTURE');
      }

      // 1. Hand position -> Universe Yaw/Pitch rotation
      const rot = GestureStudioMath.calculateRotation(state.metrics.handCenter);
      this.targetRotation.x = rot.rotX * 0.9;
      this.targetRotation.y = rot.rotY * 0.9;

      // 2. Continuous Universe Radial Expansion
      // Pinched (1.0) -> contracted (0.5x); Spread Open Palm (0.0) -> expanded (2.2x)
      if (state.activeGesture === 'PINCH' || state.activeGesture === 'OPEN_PALM') {
        const pinchStrength = Math.max(0, Math.min(1, state.metrics.pinchStrength));
        const targetScale =
          DEFAULT_PARTICLE_CONFIG.minScale +
          (1.0 - pinchStrength) * (DEFAULT_PARTICLE_CONFIG.maxScale - DEFAULT_PARTICLE_CONFIG.minScale);
        this.targetExpansion = Number(targetScale.toFixed(2));
        this.callbacks.onExpansionChange?.(this.targetExpansion);
      } else {
        this.targetExpansion = this.baseExpansion;
        this.callbacks.onExpansionChange?.(this.baseExpansion);
      }
    } else {
      // Hand out of frame: ease back towards base expansion
      this.targetExpansion = this.baseExpansion;
    }
  }

  // --- Manual Pointer & Wheel Fallbacks ---

  private onPointerDown(e: PointerEvent): void {
    if (e.button !== 0) return;
    this.isPointerDown = true;
    this.previousPointerPos = { x: e.clientX, y: e.clientY };
    if (this.controlMode !== 'MANUAL') {
      this.controlMode = 'MANUAL';
      this.callbacks.onControlModeChange?.('MANUAL');
    }
  }

  private onPointerMove(e: PointerEvent): void {
    if (!this.isPointerDown) return;
    const deltaX = e.clientX - this.previousPointerPos.x;
    const deltaY = e.clientY - this.previousPointerPos.y;
    this.previousPointerPos = { x: e.clientX, y: e.clientY };

    this.targetRotation.y += deltaX * 0.007;
    this.targetRotation.x += deltaY * 0.007;
    this.targetRotation.x = Math.max(-Math.PI * 0.75, Math.min(Math.PI * 0.75, this.targetRotation.x));
  }

  private onPointerUp(): void {
    this.isPointerDown = false;
  }

  private onWheel(e: WheelEvent): void {
    e.preventDefault();
    if (this.controlMode !== 'MANUAL') {
      this.controlMode = 'MANUAL';
      this.callbacks.onControlModeChange?.('MANUAL');
    }

    const direction = e.deltaY > 0 ? -1 : 1;
    const nextExpansion = Math.max(
      DEFAULT_PARTICLE_CONFIG.minScale,
      Math.min(DEFAULT_PARTICLE_CONFIG.maxScale, this.baseExpansion + direction * 0.12)
    );
    this.setExpansion(Number(nextExpansion.toFixed(2)));
  }

  // --- Render Loop ---

  private renderLoop(now: number): void {
    if (!this.renderer || !this.scene || !this.camera || !this.pointsMesh || !this.geometry) return;

    const delta = Math.min((now - this.lastFrameTime) / 1000, 0.1);
    this.lastFrameTime = now;
    this.elapsedSeconds += delta;

    // 1. Idle rotation drift when not interacting and not paused
    if (!this.isPaused && this.controlMode === 'MANUAL' && !this.isPointerDown) {
      this.targetRotation.y += 0.28 * delta;
    }

    // 2. Smooth Lerp Rotation with responsive tracking
    const rotLerpFactor = Math.min(1, 18 * delta);
    this.currentRotation.x += (this.targetRotation.x - this.currentRotation.x) * rotLerpFactor;
    this.currentRotation.y += (this.targetRotation.y - this.currentRotation.y) * rotLerpFactor;
    this.pointsMesh.rotation.x = this.currentRotation.x;
    this.pointsMesh.rotation.y = this.currentRotation.y;

    // 3. Smooth Lerp Expansion on GPU scale
    const expLerpFactor = Math.min(1, 18 * delta);
    this.currentExpansion += (this.targetExpansion - this.currentExpansion) * expLerpFactor;
    this.pointsMesh.scale.setScalar(this.currentExpansion);

    // 4. Subtle Cosmic Pulse/Float
    this.pointsMesh.position.y = Math.sin(this.elapsedSeconds * 1.5) * 0.05;

    // 5. Morph Position and Color Interpolation
    if (this.isMorphing) {
      const elapsedMorph = now - this.morphStartTime;
      const progress = Math.min(1.0, elapsedMorph / this.morphDurationMs);
      const eased = easeCubicInOut(progress);

      const posAttr = this.geometry.getAttribute('position') as BufferAttribute;
      const colAttr = this.geometry.getAttribute('color') as BufferAttribute;
      const posArray = posAttr.array as Float32Array;
      const colArray = colAttr.array as Float32Array;

      const totalFloats = this.particleCount * 3;
      for (let i = 0; i < totalFloats; i++) {
        // Position lerp
        const p0 = this.sourcePositions[i];
        const p1 = this.targetPositions[i];
        posArray[i] = p0 + (p1 - p0) * eased;
        this.currentBasePositions[i] = posArray[i];

        // Color lerp
        const c0 = this.sourceColors[i];
        const c1 = this.targetColors[i];
        colArray[i] = c0 + (c1 - c0) * eased;
        this.currentColors[i] = colArray[i];
      }

      posAttr.needsUpdate = true;
      colAttr.needsUpdate = true;

      if (progress >= 1.0) {
        this.isMorphing = false;
      }
    }

    // 6. Render Frame
    this.renderer.render(this.scene, this.camera);
    this.animationFrameId = requestAnimationFrame(this.renderLoop);
  }

  // --- Cleanup ---

  public dispose(): void {
    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }

    if (this.resizeObserver) {
      this.resizeObserver.disconnect();
      this.resizeObserver = null;
    }

    window.removeEventListener('pointermove', this.boundPointerMove);
    window.removeEventListener('pointerup', this.boundPointerUp);

    if (this.renderer) {
      const canvas = this.renderer.domElement;
      canvas.removeEventListener('pointerdown', this.boundPointerDown);
      canvas.removeEventListener('wheel', this.boundWheel);

      if (canvas.parentNode) {
        canvas.parentNode.removeChild(canvas);
      }

      this.renderer.dispose();
      this.renderer.forceContextLoss();
      this.renderer = null;
    }

    if (this.geometry) {
      this.geometry.dispose();
      this.geometry = null;
    }

    if (this.material) {
      this.material.dispose();
      this.material = null;
    }

    this.pointsMesh = null;
    this.scene = null;
    this.camera = null;
    this.container = null;
  }

  public getCurrentShape(): ParticlePresetShape {
    return this.currentShape;
  }

  public getCurrentExpansion(): number {
    return this.currentExpansion;
  }

  public getControlMode(): 'GESTURE' | 'MANUAL' {
    return this.controlMode;
  }
}
