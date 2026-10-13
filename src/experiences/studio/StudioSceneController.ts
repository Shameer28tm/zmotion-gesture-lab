import * as THREE from 'three';
import type { GestureState } from '../../core/types';
import { GestureStudioMath, DEFAULT_STUDIO_CONFIG } from './gestureMath';

export type StudioPresetShape = 'sphere' | 'cube' | 'torus';
export type StudioControlMode = 'GESTURE' | 'MANUAL';

export interface StudioSceneCallbacks {
  onColorChange?: (hexColor: string) => void;
  onControlModeChange?: (mode: StudioControlMode) => void;
  onScaleChange?: (scale: number) => void;
}

export class StudioSceneController {
  private container: HTMLElement | null = null;
  private renderer: THREE.WebGLRenderer | null = null;
  private scene: THREE.Scene | null = null;
  private camera: THREE.PerspectiveCamera | null = null;
  private animationFrameId: number | null = null;
  private resizeObserver: ResizeObserver | null = null;

  // Meshes and groups
  private objectGroup: THREE.Group | null = null;
  private solidMesh: THREE.Mesh | null = null;
  private wireframeMesh: THREE.Mesh | null = null;
  private accentPointLight: THREE.PointLight | null = null;
  private gridHelper: THREE.GridHelper | null = null;

  // Geometries cache
  private geometries: {
    sphere: { solid: THREE.BufferGeometry; wire: THREE.BufferGeometry };
    cube: { solid: THREE.BufferGeometry; wire: THREE.BufferGeometry };
    torus: { solid: THREE.BufferGeometry; wire: THREE.BufferGeometry };
  } | null = null;

  // Materials
  private solidMaterial: THREE.MeshStandardMaterial | null = null;
  private wireframeMaterial: THREE.MeshBasicMaterial | null = null;

  // Interactive state
  private currentShape: StudioPresetShape = 'sphere';
  private currentColorHex = '#00d2ff';
  private wireframeOnly = false;
  private controlMode: StudioControlMode = 'MANUAL';

  // Smooth transforms
  private currentRotation = { x: 0, y: 0 };
  private targetRotation = { x: 0, y: 0 };
  private currentScale = 1.0;
  private targetScale = 1.0;
  private baseScale = 1.0;

  // Pointing gesture cooldown
  private lastPointingTriggerTime = 0;
  private readonly palette = [
    '#00d2ff', // Electric Cyan
    '#00f5d4', // Bright Mint
    '#c084fc', // Cyber Lavender
    '#ff00aa', // Hot Magenta
    '#ffaa00', // Solar Amber
    '#ffffff', // Hyper White
  ];
  private paletteIndex = 0;

  // Pointer drag state for manual fallback
  private isPointerDown = false;
  private previousPointerPos = { x: 0, y: 0 };
  private boundPointerDown: (e: PointerEvent) => void;
  private boundPointerMove: (e: PointerEvent) => void;
  private boundPointerUp: (e: PointerEvent) => void;
  private boundWheel: (e: WheelEvent) => void;

  // Callbacks
  private callbacks: StudioSceneCallbacks = {};

  // Timing
  private lastFrameTime = performance.now();
  private elapsedSeconds = 0;

  public constructor(callbacks: StudioSceneCallbacks = {}) {
    this.callbacks = callbacks;

    this.boundPointerDown = this.onPointerDown.bind(this);
    this.boundPointerMove = this.onPointerMove.bind(this);
    this.boundPointerUp = this.onPointerUp.bind(this);
    this.boundWheel = this.onWheel.bind(this);
    this.renderLoop = this.renderLoop.bind(this);
  }

  public mount(container: HTMLElement): void {
    if (this.container) {
      this.dispose();
    }
    this.container = container;

    // 1. Scene
    this.scene = new THREE.Scene();

    // 2. Camera
    const width = container.clientWidth || 800;
    const height = container.clientHeight || 600;
    this.camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 100);
    this.camera.position.set(0, 0, 7.2);

    // 3. Renderer with antialiasing and safe device pixel ratio
    try {
      this.renderer = new THREE.WebGLRenderer({
        antialias: true,
        alpha: true,
        powerPreference: 'high-performance',
      });
      this.renderer.setSize(width, height);
      this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
      this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
      this.renderer.toneMappingExposure = 1.15;

      const canvas = this.renderer.domElement;
      canvas.style.width = '100%';
      canvas.style.height = '100%';
      canvas.style.display = 'block';
      canvas.style.touchAction = 'none'; // prevent touch scroll conflicts
      container.appendChild(canvas);
    } catch (err) {
      // Gracefully handle environments where WebGL context cannot be created (headless JSDOM, disabled GPU)
      console.warn('WebGL context creation failed (headless/unsupported GPU):', err);
      const fallback = document.createElement('div');
      fallback.setAttribute('data-testid', 'webgl-fallback');
      fallback.style.width = '100%';
      fallback.style.height = '100%';
      fallback.style.display = 'flex';
      fallback.style.alignItems = 'center';
      fallback.style.justifyContent = 'center';
      fallback.style.color = 'var(--electric-cyan)';
      fallback.style.fontFamily = 'monospace';
      fallback.style.fontSize = '12px';
      fallback.innerText = '[WebGL Hardware Standby Mode]';
      container.appendChild(fallback);
      return;
    }

    const canvas = this.renderer.domElement;

    // 4. Lights
    const ambientLight = new THREE.AmbientLight(0x0a1628, 1.8);
    this.scene.add(ambientLight);

    const keyLight = new THREE.DirectionalLight(0xffffff, 2.2);
    keyLight.position.set(5, 7, 6);
    this.scene.add(keyLight);

    const rimLight = new THREE.DirectionalLight(0x00d2ff, 1.6);
    rimLight.position.set(-6, -4, -4);
    this.scene.add(rimLight);

    this.accentPointLight = new THREE.PointLight(
      new THREE.Color(this.currentColorHex),
      2.5,
      12
    );
    this.accentPointLight.position.set(0, 0, 3.8);
    this.scene.add(this.accentPointLight);

    // 5. Sci-Fi Research Grid Platform
    this.gridHelper = new THREE.GridHelper(12, 24, 0x00d2ff, 0x1e293b);
    this.gridHelper.position.y = -2.8;
    this.scene.add(this.gridHelper);

    // 6. Geometries
    this.geometries = {
      sphere: {
        solid: new THREE.SphereGeometry(1.6, 64, 64),
        wire: new THREE.SphereGeometry(1.64, 32, 32),
      },
      cube: {
        solid: new THREE.BoxGeometry(2.3, 2.3, 2.3, 8, 8, 8),
        wire: new THREE.BoxGeometry(2.36, 2.36, 2.36, 4, 4, 4),
      },
      torus: {
        solid: new THREE.TorusGeometry(1.45, 0.52, 32, 100),
        wire: new THREE.TorusGeometry(1.48, 0.54, 16, 50),
      },
    };

    // 7. Materials
    this.solidMaterial = new THREE.MeshStandardMaterial({
      color: new THREE.Color(0x0c1a2e),
      roughness: 0.22,
      metalness: 0.82,
      emissive: new THREE.Color(this.currentColorHex),
      emissiveIntensity: 0.38,
    });

    this.wireframeMaterial = new THREE.MeshBasicMaterial({
      color: new THREE.Color(this.currentColorHex),
      wireframe: true,
      transparent: true,
      opacity: 0.38,
    });

    // 8. Meshes and Group
    this.objectGroup = new THREE.Group();
    const activeGeom = this.geometries[this.currentShape];

    this.solidMesh = new THREE.Mesh(activeGeom.solid, this.solidMaterial);
    this.wireframeMesh = new THREE.Mesh(activeGeom.wire, this.wireframeMaterial);

    this.objectGroup.add(this.solidMesh);
    this.objectGroup.add(this.wireframeMesh);
    this.scene.add(this.objectGroup);

    // 9. Pointer and Wheel listeners for fallback manual control
    canvas.addEventListener('pointerdown', this.boundPointerDown);
    window.addEventListener('pointermove', this.boundPointerMove);
    window.addEventListener('pointerup', this.boundPointerUp);
    canvas.addEventListener('wheel', this.boundWheel, { passive: false });

    // 10. Resize Observer
    this.resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const { width: w, height: h } = entry.contentRect;
        this.resize(w, h);
      }
    });
    this.resizeObserver.observe(container);

    // 11. Start RAF
    this.lastFrameTime = performance.now();
    this.animationFrameId = requestAnimationFrame(this.renderLoop);
  }

  public resize(width: number, height: number): void {
    if (!this.renderer || !this.camera || width <= 0 || height <= 0) return;
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(width, height);
  }

  public setShape(shape: StudioPresetShape): void {
    this.currentShape = shape;
    if (!this.geometries || !this.solidMesh || !this.wireframeMesh) return;
    const geom = this.geometries[shape];
    this.solidMesh.geometry = geom.solid;
    this.wireframeMesh.geometry = geom.wire;

    // Subtle scale punch on shape switch
    this.currentScale = this.baseScale * 0.85;
  }

  public setColor(hexColor: string): void {
    this.currentColorHex = hexColor;
    const threeColor = new THREE.Color(hexColor);

    if (this.solidMaterial) {
      this.solidMaterial.emissive.set(threeColor);
    }
    if (this.wireframeMaterial) {
      this.wireframeMaterial.color.set(threeColor);
    }
    if (this.accentPointLight) {
      this.accentPointLight.color.set(threeColor);
    }
    if (this.gridHelper) {
      const materials = Array.isArray(this.gridHelper.material)
        ? this.gridHelper.material
        : [this.gridHelper.material];
      const primaryLineMat = materials[0] as THREE.LineBasicMaterial | undefined;
      if (primaryLineMat && 'color' in primaryLineMat) {
        primaryLineMat.color.set(threeColor);
      }
    }

    const index = this.palette.indexOf(hexColor);
    if (index !== -1) {
      this.paletteIndex = index;
    }

    this.callbacks.onColorChange?.(hexColor);
  }

  public setWireframeOnly(wireframeOnly: boolean): void {
    this.wireframeOnly = wireframeOnly;
    if (this.solidMesh) {
      this.solidMesh.visible = !wireframeOnly;
    }
    if (this.wireframeMaterial) {
      this.wireframeMaterial.opacity = wireframeOnly ? 0.9 : 0.38;
    }
  }

  public setBaseScale(scale: number): void {
    this.baseScale = Math.max(
      DEFAULT_STUDIO_CONFIG.minScale,
      Math.min(DEFAULT_STUDIO_CONFIG.maxScale, scale)
    );
    this.targetScale = this.baseScale;
    this.callbacks.onScaleChange?.(this.baseScale);
  }

  public reset(): void {
    this.targetRotation = { x: 0, y: 0 };
    this.currentRotation = { x: 0, y: 0 };
    this.baseScale = 1.0;
    this.targetScale = 1.0;
    this.currentScale = 1.0;
    this.setShape('sphere');
    this.setColor('#00d2ff');
    this.setWireframeOnly(false);
    this.setControlMode('MANUAL');
    if (this.objectGroup) {
      this.objectGroup.rotation.set(0, 0, 0);
      this.objectGroup.scale.set(1, 1, 1);
    }
    this.callbacks.onScaleChange?.(1.0);
  }

  /**
   * Called per animation frame from GestureEngine.onFrame
   * Decoupled from React renders for optimal 60 FPS performance.
   */
  public updateFromGesture(state: GestureState, now: number): void {
    if (state.handDetected) {
      this.setControlMode('GESTURE');

      // 1. Hand Position -> Object Rotation (Yaw & Pitch)
      const rot = GestureStudioMath.calculateRotation(state.metrics.handCenter);
      this.targetRotation.x = rot.rotX;
      this.targetRotation.y = rot.rotY;

      // 2. Pinch -> Object Scale
      if (state.activeGesture === 'PINCH') {
        const pinchScale = GestureStudioMath.calculateScale(
          state.metrics.pinchStrength,
          this.baseScale
        );
        this.targetScale = pinchScale;
        this.callbacks.onScaleChange?.(Number(pinchScale.toFixed(2)));
      } else {
        // Pinch release: smoothly returns towards baseline scale
        this.targetScale = this.baseScale;
        this.callbacks.onScaleChange?.(Number(this.baseScale.toFixed(2)));
      }

      // 3. Pointing Gesture -> Trigger Color Change with Cooldown
      if (state.activeGesture === 'POINTING') {
        if (
          GestureStudioMath.shouldTriggerColorChange(
            this.lastPointingTriggerTime,
            now,
            DEFAULT_STUDIO_CONFIG.pointingCooldownMs
          )
        ) {
          this.lastPointingTriggerTime = now;
          this.paletteIndex = (this.paletteIndex + 1) % this.palette.length;
          const nextColor = this.palette[this.paletteIndex];
          this.setColor(nextColor);
        }
      }

      // 4. Open Palm -> Soft orientation center reset
      if (state.activeGesture === 'OPEN_PALM') {
        this.targetRotation.x = 0;
        this.targetRotation.y = 0;
      }
    } else {
      // Hand not detected: ease pinch back to base scale
      this.targetScale = this.baseScale;
      // Do not force controlMode immediately to allow seamless mouse takeover
    }
  }

  public getControlMode(): StudioControlMode {
    return this.controlMode;
  }

  public getCurrentScale(): number {
    return this.currentScale;
  }

  public getCurrentColor(): string {
    return this.currentColorHex;
  }

  public getCurrentShape(): StudioPresetShape {
    return this.currentShape;
  }

  public isWireframe(): boolean {
    return this.wireframeOnly;
  }

  private setControlMode(mode: StudioControlMode): void {
    if (this.controlMode !== mode) {
      this.controlMode = mode;
      this.callbacks.onControlModeChange?.(mode);
    }
  }

  // --- Manual Pointer & Wheel Fallbacks ---

  private onPointerDown(e: PointerEvent): void {
    if (e.button !== 0) return; // primary click only
    this.isPointerDown = true;
    this.previousPointerPos = { x: e.clientX, y: e.clientY };
    this.setControlMode('MANUAL');
  }

  private onPointerMove(e: PointerEvent): void {
    if (!this.isPointerDown) return;
    const deltaX = e.clientX - this.previousPointerPos.x;
    const deltaY = e.clientY - this.previousPointerPos.y;
    this.previousPointerPos = { x: e.clientX, y: e.clientY };

    // Update target rotation from drag deltas
    this.targetRotation.y += deltaX * 0.008;
    this.targetRotation.x += deltaY * 0.008;

    // Clamp X rotation to prevent complete gimbal flips
    this.targetRotation.x = Math.max(
      -DEFAULT_STUDIO_CONFIG.maxRotX,
      Math.min(DEFAULT_STUDIO_CONFIG.maxRotX, this.targetRotation.x)
    );
  }

  private onPointerUp(): void {
    this.isPointerDown = false;
  }

  private onWheel(e: WheelEvent): void {
    e.preventDefault();
    this.setControlMode('MANUAL');

    const zoomStep = 0.12;
    const direction = e.deltaY > 0 ? -1 : 1;
    const newScale = Math.max(
      DEFAULT_STUDIO_CONFIG.minScale,
      Math.min(DEFAULT_STUDIO_CONFIG.maxScale, this.baseScale + direction * zoomStep)
    );
    this.setBaseScale(Number(newScale.toFixed(2)));
  }

  // --- Render Loop ---

  private renderLoop(now: number): void {
    if (!this.renderer || !this.scene || !this.camera || !this.objectGroup) return;

    const delta = Math.min((now - this.lastFrameTime) / 1000, 0.1);
    this.lastFrameTime = now;
    this.elapsedSeconds += delta;

    // 1. Idle rotation drift when in MANUAL mode and not dragging
    if (this.controlMode === 'MANUAL' && !this.isPointerDown) {
      this.targetRotation.y += 0.35 * delta;
    }

    // 2. Smooth Lerp Rotation
    const rotLerpFactor = Math.min(1, 10 * delta);
    this.currentRotation.x +=
      (this.targetRotation.x - this.currentRotation.x) * rotLerpFactor;
    this.currentRotation.y +=
      (this.targetRotation.y - this.currentRotation.y) * rotLerpFactor;

    this.objectGroup.rotation.x = this.currentRotation.x;
    this.objectGroup.rotation.y = this.currentRotation.y;

    // 3. Smooth Lerp Scale
    const scaleLerpFactor = Math.min(1, 12 * delta);
    this.currentScale += (this.targetScale - this.currentScale) * scaleLerpFactor;
    this.objectGroup.scale.setScalar(this.currentScale);

    // 4. Subtle Organic Lab Floating/Hover
    this.objectGroup.position.y = Math.sin(this.elapsedSeconds * 1.8) * 0.08;

    // 5. Wireframe Shell Slow Counter-Rotation for Hologram Accent
    if (this.wireframeMesh) {
      this.wireframeMesh.rotation.z += 0.25 * delta;
    }

    // 6. Render
    this.renderer.render(this.scene, this.camera);

    this.animationFrameId = requestAnimationFrame(this.renderLoop);
  }

  // --- Resource Cleanup & Disposal ---

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

    // Dispose Geometries
    if (this.geometries) {
      Object.values(this.geometries).forEach((preset) => {
        preset.solid.dispose();
        preset.wire.dispose();
      });
      this.geometries = null;
    }

    // Dispose Materials
    if (this.solidMaterial) {
      this.solidMaterial.dispose();
      this.solidMaterial = null;
    }
    if (this.wireframeMaterial) {
      this.wireframeMaterial.dispose();
      this.wireframeMaterial = null;
    }

    // Dispose Grid
    if (this.gridHelper) {
      this.gridHelper.geometry.dispose();
      if (Array.isArray(this.gridHelper.material)) {
        this.gridHelper.material.forEach((m) => m.dispose());
      } else {
        this.gridHelper.material.dispose();
      }
      this.gridHelper = null;
    }

    this.scene = null;
    this.camera = null;
    this.objectGroup = null;
    this.solidMesh = null;
    this.wireframeMesh = null;
    this.accentPointLight = null;
    this.container = null;
  }
}
