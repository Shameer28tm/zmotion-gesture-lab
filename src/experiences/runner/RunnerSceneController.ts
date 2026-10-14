import {
  Scene,
  PerspectiveCamera,
  WebGLRenderer,
  BufferGeometry,
  BufferAttribute,
  Points,
  PointsMaterial,
  Mesh,
  BoxGeometry,
  CylinderGeometry,
  OctahedronGeometry,
  MeshBasicMaterial,
  Group,
  AdditiveBlending,
} from 'three';
import { RunnerEngine, type Obstacle } from './runnerEngine';

export class RunnerSceneController {
  private container: HTMLElement | null = null;
  private renderer: WebGLRenderer | null = null;
  private scene: Scene | null = null;
  private camera: PerspectiveCamera | null = null;
  private animationFrameId: number | null = null;
  private resizeObserver: ResizeObserver | null = null;

  // Scene Objects
  private playerGroup: Group = new Group();
  private trackGroup: Group = new Group();
  private obstacleMeshes: Map<number, Mesh | Group> = new Map();
  private thrusterParticles: Points | null = null;

  // Track Grid
  private gridZOffset: number = 0;
  private trackLines: Mesh[] = [];

  private boundRenderLoop: () => void;

  // Reusable materials
  private barrierMat: MeshBasicMaterial;
  private pylonMat: MeshBasicMaterial;
  private orbMat: MeshBasicMaterial;

  constructor() {
    this.barrierMat = new MeshBasicMaterial({
      color: 0xff3366,
      wireframe: true,
    });
    this.pylonMat = new MeshBasicMaterial({
      color: 0xffaa00,
      wireframe: true,
    });
    this.orbMat = new MeshBasicMaterial({
      color: 0x00f5d4,
      wireframe: false,
    });

    this.boundRenderLoop = this.renderLoop.bind(this);
  }

  public mount(container: HTMLElement): void {
    if (this.container) {
      this.dispose();
    }
    this.container = container;

    // 1. Scene & Camera
    this.scene = new Scene();
    const width = container.clientWidth || 800;
    const height = container.clientHeight || 600;
    this.camera = new PerspectiveCamera(55, width / height, 0.1, 120);
    this.camera.position.set(0, 3.2, -5.2);
    this.camera.lookAt(0, 1.2, 9.0);

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
      this.renderer.setClearColor(0x000000, 0); // Transparent for live camera layer

      const canvas = this.renderer.domElement;
      canvas.className = 'viewport-canvas';
      canvas.style.width = '100%';
      canvas.style.height = '100%';
      canvas.style.display = 'block';
      container.appendChild(canvas);
    } catch (err) {
      console.warn('Runner WebGL context creation failed (headless/fallback):', err);
      const fallback = document.createElement('div');
      fallback.setAttribute('data-testid', 'runner-webgl-fallback');
      fallback.style.width = '100%';
      fallback.style.height = '100%';
      fallback.innerText = '[Gesture Runner Standby Mode]';
      container.appendChild(fallback);
      return;
    }

    // 3. Build Cyber Runway Track
    this.buildTrack();
    this.scene.add(this.trackGroup);

    // 4. Build Player Hover Drone
    this.buildPlayer();
    this.scene.add(this.playerGroup);

    // 5. Thruster Particle Stream
    this.buildThrusters();

    // 6. Resize Observer
    this.resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const { width: w, height: h } = entry.contentRect;
        this.resize(w, h);
      }
    });
    this.resizeObserver.observe(container);

    // 7. Start Animation Loop
    this.animationFrameId = requestAnimationFrame(this.boundRenderLoop);
  }

  public resize(width: number, height: number): void {
    if (!this.renderer || !this.camera || width <= 0 || height <= 0) return;
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(width, height);
  }

  private buildTrack(): void {
    const trackWidth = 8.0;
    const trackLength = 100.0;

    // Glowing Lane Dividers
    for (let i = 0; i < 4; i++) {
      const x = -3.3 + i * 2.2;
      const geo = new BoxGeometry(0.08, 0.02, trackLength);
      const mat = new MeshBasicMaterial({
        color: i === 0 || i === 3 ? 0x00d2ff : 0x00f5d4,
        transparent: true,
        opacity: 0.65,
      });
      const mesh = new Mesh(geo, mat);
      mesh.position.set(x, 0, trackLength / 2);
      this.trackGroup.add(mesh);
    }

    // Periodic horizontal cross-ties
    for (let z = 0; z < trackLength; z += 4) {
      const geo = new BoxGeometry(trackWidth, 0.02, 0.08);
      const mat = new MeshBasicMaterial({
        color: 0x00d2ff,
        transparent: true,
        opacity: 0.35,
      });
      const mesh = new Mesh(geo, mat);
      mesh.position.set(0, 0, z);
      this.trackLines.push(mesh);
      this.trackGroup.add(mesh);
    }
  }

  private buildPlayer(): void {
    // Cyberpunk Hover Craft Group
    const bodyGeo = new BoxGeometry(1.1, 0.35, 1.6);
    const bodyMat = new MeshBasicMaterial({ color: 0x05070d });
    const bodyMesh = new Mesh(bodyGeo, bodyMat);
    this.playerGroup.add(bodyMesh);

    // Glowing Neon Cyber Shell Edges
    const wireGeo = new BoxGeometry(1.15, 0.4, 1.65);
    const wireMat = new MeshBasicMaterial({
      color: 0x00d2ff,
      wireframe: true,
    });
    const wireMesh = new Mesh(wireGeo, wireMat);
    this.playerGroup.add(wireMesh);

    // Left Thruster
    const thrusterGeo = new BoxGeometry(0.2, 0.2, 0.6);
    const thrusterMat = new MeshBasicMaterial({ color: 0xff00aa });
    const leftThruster = new Mesh(thrusterGeo, thrusterMat);
    leftThruster.position.set(-0.45, -0.05, -0.7);
    this.playerGroup.add(leftThruster);

    // Right Thruster
    const rightThruster = new Mesh(thrusterGeo, thrusterMat);
    rightThruster.position.set(0.45, -0.05, -0.7);
    this.playerGroup.add(rightThruster);

    this.playerGroup.position.set(0, 0.5, 0);
  }

  private buildThrusters(): void {
    const particleCount = 120;
    const geometry = new BufferGeometry();
    const positions = new Float32Array(particleCount * 3);
    const colors = new Float32Array(particleCount * 3);

    for (let i = 0; i < particleCount; i++) {
      positions[i * 3 + 0] = (Math.random() - 0.5) * 0.6;
      positions[i * 3 + 1] = (Math.random() - 0.5) * 0.2;
      positions[i * 3 + 2] = -Math.random() * 2.5;

      colors[i * 3 + 0] = 0.0;
      colors[i * 3 + 1] = 0.9;
      colors[i * 3 + 2] = 1.0;
    }

    geometry.setAttribute('position', new BufferAttribute(positions, 3));
    geometry.setAttribute('color', new BufferAttribute(colors, 3));

    const material = new PointsMaterial({
      size: 0.08,
      vertexColors: true,
      transparent: true,
      opacity: 0.85,
      blending: AdditiveBlending,
    });

    this.thrusterParticles = new Points(geometry, material);
    this.playerGroup.add(this.thrusterParticles);
  }

  public triggerExplosion(): void {
    // Visually perturb drone orientation upon impact
    this.playerGroup.rotation.x = 0.45;
    this.playerGroup.rotation.z = -0.7;
  }

  /**
   * Reset all dynamic 3D scene entities (obstacles, player transforms) on game restart
   */
  public reset(): void {
    for (const mesh of this.obstacleMeshes.values()) {
      this.scene?.remove(mesh);
    }
    this.obstacleMeshes.clear();

    if (this.playerGroup) {
      this.playerGroup.position.set(0, 0.5, 0);
      this.playerGroup.rotation.set(0, 0, 0);
    }
    this.gridZOffset = 0;
  }

  public getPlayerGroup(): Group {
    return this.playerGroup;
  }

  public getCamera(): PerspectiveCamera | null {
    return this.camera;
  }

  public updateFromEngine(engine: RunnerEngine, dt: number): void {
    const player = engine.getPlayer();
    const obstacles = engine.getObstacles();

    // 1. Sync Player Mesh Position & Tilt
    // NOTE: Because camera is located at z = -5.2 and looks forward along +Z,
    // world +X projects to screen LEFT and world -X projects to screen RIGHT.
    // Invert X coordinate mapping (-player.x) so that moving left (player.x < 0)
    // projects to screen LEFT (NDC x < 0), and moving right projects to screen RIGHT.
    this.playerGroup.position.x = -player.x;
    this.playerGroup.position.y = 0.5 + player.y;
    this.playerGroup.rotation.z = -player.tilt;
    this.playerGroup.rotation.x = player.isJumping ? -0.15 : 0;

    // 2. Animate Track Cross-Ties (Stream backward to create hyperspace speed)
    const speed = engine.getSpeed();
    this.gridZOffset += speed * dt;
    for (let i = 0; i < this.trackLines.length; i++) {
      const line = this.trackLines[i];
      let z = (i * 4 - (this.gridZOffset % 4) + 100) % 100;
      line.position.z = z;
    }

    // 3. Sync & Render Obstacles
    const activeIds = new Set<number>();

    for (const obs of obstacles) {
      activeIds.add(obs.id);
      let mesh = this.obstacleMeshes.get(obs.id);

      if (!mesh) {
        mesh = this.createObstacleMesh(obs);
        this.obstacleMeshes.set(obs.id, mesh);
        this.scene?.add(mesh);
      }

      // Position mesh (negate X to match camera +Z projection and player alignment)
      mesh.position.set(-obs.lane * 2.2, obs.height / 2, obs.z);

      // Rotate energy orbs
      if (obs.type === 'ENERGY_ORB') {
        mesh.rotation.y += 3.0 * dt;
        mesh.rotation.x += 1.5 * dt;
        if (obs.collected) {
          mesh.visible = false;
        }
      }
    }

    // Remove deleted obstacles
    for (const [id, mesh] of this.obstacleMeshes.entries()) {
      if (!activeIds.has(id)) {
        this.scene?.remove(mesh);
        this.obstacleMeshes.delete(id);
      }
    }
  }

  private createObstacleMesh(obs: Obstacle): Mesh | Group {
    if (obs.type === 'BARRIER') {
      const geo = new BoxGeometry(obs.width, obs.height, 0.6);
      return new Mesh(geo, this.barrierMat);
    } else if (obs.type === 'PYLON') {
      const geo = new CylinderGeometry(0.35, 0.45, obs.height, 8);
      return new Mesh(geo, this.pylonMat);
    } else {
      const geo = new OctahedronGeometry(0.45);
      return new Mesh(geo, this.orbMat);
    }
  }

  private renderLoop(): void {
    if (!this.renderer || !this.scene || !this.camera) return;

    this.renderer.render(this.scene, this.camera);
    this.animationFrameId = requestAnimationFrame(this.boundRenderLoop);
  }

  public dispose(): void {
    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }

    if (this.resizeObserver) {
      this.resizeObserver.disconnect();
      this.resizeObserver = null;
    }

    // Clean up obstacle meshes
    for (const mesh of this.obstacleMeshes.values()) {
      if ('geometry' in mesh && mesh.geometry) {
        mesh.geometry.dispose();
      }
      this.scene?.remove(mesh);
    }
    this.obstacleMeshes.clear();

    // Clean up track group children
    this.trackGroup.traverse((child) => {
      const m = child as Mesh;
      if (m.isMesh) {
        m.geometry?.dispose();
        if (Array.isArray(m.material)) {
          m.material.forEach((mat) => mat.dispose());
        } else if (m.material) {
          m.material.dispose();
        }
      }
    });
    this.trackGroup.clear();
    this.trackLines = [];

    // Clean up player group children
    this.playerGroup.traverse((child) => {
      const m = child as Mesh;
      if (m.isMesh) {
        m.geometry?.dispose();
        if (Array.isArray(m.material)) {
          m.material.forEach((mat) => mat.dispose());
        } else if (m.material) {
          m.material.dispose();
        }
      }
    });
    this.playerGroup.clear();

    if (this.thrusterParticles) {
      this.thrusterParticles.geometry?.dispose();
      if (this.thrusterParticles.material) {
        (this.thrusterParticles.material as PointsMaterial).dispose();
      }
      this.thrusterParticles = null;
    }

    if (this.renderer) {
      const canvas = this.renderer.domElement;
      if (canvas.parentNode) {
        canvas.parentNode.removeChild(canvas);
      }
      this.renderer.dispose();
      this.renderer.forceContextLoss();
      this.renderer = null;
    }

    this.barrierMat.dispose();
    this.pylonMat.dispose();
    this.orbMat.dispose();

    this.scene = null;
    this.camera = null;
    this.container = null;
  }
}
