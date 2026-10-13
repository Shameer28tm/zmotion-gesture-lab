import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Sparkles,
  Heart,
  Globe,
  Flower2,
  Dna,
  Play,
  Pause,
  FastForward,
  RotateCcw,
  ZoomIn,
  ZoomOut,
  Sliders,
} from 'lucide-react';
import { ControlCenter } from '../../components/hud/ControlCenter';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { useGestureEngine } from '../../core/engine/GestureContext';
import {
  ParticleSceneController,
} from './ParticleSceneController';
import {
  type ParticlePresetShape,
  DEFAULT_PARTICLE_CONFIG,
} from './particleMath';
import { CameraBackdrop } from '../../components/camera/CameraBackdrop';
import { CaptureControls } from '../../components/capture/CaptureControls';
import '../../styles/hud.css';

export const ParticleUniverse: React.FC = () => {
  const canvasContainerRef = useRef<HTMLDivElement | null>(null);
  const controllerRef = useRef<ParticleSceneController | null>(null);

  const { engine, gestureState, isRunning } = useGestureEngine();

  const shapes: ParticlePresetShape[] = ['sphere', 'heart', 'saturn', 'flower', 'dna'];
  const [currentShape, setCurrentShape] = useState<ParticlePresetShape>('sphere');
  const [particleCount, setParticleCount] = useState<number>(DEFAULT_PARTICLE_CONFIG.defaultCount);
  const [isPaused, setIsPaused] = useState(false);
  const [expansion, setExpansion] = useState(1.0);
  const [controlMode, setControlMode] = useState<'GESTURE' | 'MANUAL'>('MANUAL');

  // Initialize and mount Three.js Particle Scene Controller
  useEffect(() => {
    if (!canvasContainerRef.current) return;

    const controller = new ParticleSceneController({
      onShapeChange: (shape) => setCurrentShape(shape),
      onExpansionChange: (exp) => setExpansion(exp),
      onControlModeChange: (mode) => setControlMode(mode),
    });

    controller.mount(canvasContainerRef.current, particleCount);
    controllerRef.current = controller;

    // Synchronize initial configuration
    controller.setShape(currentShape);
    controller.setExpansion(expansion);

    // High-frequency per-frame gesture subscription (decoupled from React render cycle)
    const unsubscribeFrame = engine.onFrame((state) => {
      controller.updateFromGesture(state, performance.now());
    });

    // Discrete fist gesture trigger: switches to next shape construct
    const unsubscribeFist = engine.onFistTrigger(() => {
      controller.nextShape();
    });

    return () => {
      unsubscribeFrame();
      unsubscribeFist();
      controller.dispose();
      controllerRef.current = null;
    };
  }, [engine, particleCount]);

  // Handle Preset Shape Switch
  const handleSelectShape = useCallback((shape: ParticlePresetShape) => {
    setCurrentShape(shape);
    controllerRef.current?.setShape(shape);
  }, []);

  const handleNextShape = useCallback(() => {
    controllerRef.current?.nextShape();
  }, []);

  // Handle Manual Expansion / Spread
  const handleExpansionStep = useCallback((delta: number) => {
    setExpansion((prev) => {
      const next = Math.max(
        DEFAULT_PARTICLE_CONFIG.minScale,
        Math.min(DEFAULT_PARTICLE_CONFIG.maxScale, Number((prev + delta).toFixed(2)))
      );
      controllerRef.current?.setExpansion(next);
      return next;
    });
  }, []);

  // Handle Play/Pause Drift
  const handleTogglePause = useCallback(() => {
    if (controllerRef.current) {
      const paused = controllerRef.current.togglePause();
      setIsPaused(paused);
    }
  }, []);

  // Handle Viewport & Simulation Reset
  const handleResetScene = useCallback(() => {
    controllerRef.current?.reset();
    setCurrentShape('sphere');
    setExpansion(1.0);
    setIsPaused(false);
    setControlMode('MANUAL');
  }, []);

  // Keyboard accessibility shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement)?.tagName)) return;

      switch (e.key) {
        case '1':
          handleSelectShape('sphere');
          break;
        case '2':
          handleSelectShape('heart');
          break;
        case '3':
          handleSelectShape('saturn');
          break;
        case '4':
          handleSelectShape('flower');
          break;
        case '5':
          handleSelectShape('dna');
          break;
        case ' ':
          e.preventDefault();
          handleTogglePause();
          break;
        case 'r':
        case 'R':
          handleResetScene();
          break;
        case '+':
        case '=':
          handleExpansionStep(0.15);
          break;
        case '-':
        case '_':
          handleExpansionStep(-0.15);
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleSelectShape, handleTogglePause, handleResetScene, handleExpansionStep]);

  const getShapeIcon = (shape: ParticlePresetShape) => {
    switch (shape) {
      case 'heart':
        return <Heart size={14} />;
      case 'saturn':
        return <Globe size={14} />;
      case 'flower':
        return <Flower2 size={14} />;
      case 'dna':
        return <Dna size={14} />;
      default:
        return <Sparkles size={14} />;
    }
  };

  const shapeIndex = shapes.indexOf(currentShape);
  const isGestureActive = controlMode === 'GESTURE' && gestureState.handDetected;

  return (
    <div
      className="experience-container"
      role="region"
      aria-label="3D Particle Universe Viewport"
      tabIndex={0}
    >
      {/* Live Camera Backdrop Layer (visible when camera is on) */}
      <CameraBackdrop />

      {/* Three.js Canvas Container (transparent over camera) */}
      <div
        ref={canvasContainerRef}
        className={`viewport-canvas-wrapper ${isRunning ? 'camera-active' : ''}`}
        data-testid="particle-canvas-container"
      />

      {/* Cyberpunk Telemetry HUD Overlay */}
      <div className="hud-overlay">
        {/* Top Telemetry */}
        <header className="hud-top-bar hud-interactive">
          <div className="hud-title-card">
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span
                style={{
                  fontFamily: 'var(--font-mono)',
                  fontSize: '11px',
                  color: 'var(--electric-cyan)',
                  letterSpacing: '0.05em',
                }}
              >
                EXPERIMENT 02
              </span>
              <span style={{ color: 'var(--text-muted)' }}>/</span>
              <h1
                style={{
                  margin: 0,
                  fontWeight: 700,
                  fontSize: '14px',
                  color: '#fff',
                  letterSpacing: '0.02em',
                }}
              >
                PARTICLE UNIVERSE
              </h1>
            </div>
            <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
              Parametric Three.js Point Cloud & GPU Vertex Interpolation
            </span>
          </div>

          <div className="hud-telemetry-cluster">
            {/* Control Mode Badge */}
            <div className="telemetry-card">
              <span className="telemetry-label">CONTROL MODE</span>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '2px' }}>
                <span
                  className={`led-indicator ${isGestureActive ? 'live' : 'standby'}`}
                  style={{ width: '6px', height: '6px' }}
                />
                <span
                  className="telemetry-value"
                  style={{
                    color: isGestureActive ? 'var(--electric-cyan)' : 'var(--text-secondary)',
                    fontSize: '11px',
                  }}
                >
                  {isGestureActive ? 'GESTURE CONTROL' : 'MANUAL / POINTER'}
                </span>
              </div>
            </div>

            {/* Current Shape Construct */}
            <div className="telemetry-card">
              <span className="telemetry-label">CONSTRUCT</span>
              <span className="telemetry-value" style={{ color: 'var(--electric-cyan)' }}>
                {currentShape.toUpperCase()}
              </span>
            </div>

            {/* Active Particle Count */}
            <div className="telemetry-card">
              <span className="telemetry-label">PARTICLE COUNT</span>
              <span className="telemetry-value">{particleCount.toLocaleString()}</span>
            </div>

            {/* Radial Expansion */}
            <div className="telemetry-card">
              <span className="telemetry-label">EXPANSION</span>
              <span className="telemetry-value">{expansion.toFixed(2)}x</span>
            </div>

            {/* Privacy-First Capture Controls */}
            <CaptureControls canvasContainerRef={canvasContainerRef} />
          </div>
        </header>

        {/* Bottom Control Dock */}
        <div className="hud-controls-dock">
          {/* Bottom Left: Shape Presets & Animation Controls */}
          <section
            className="hud-panel-bottom-left hud-interactive"
            aria-label="Particle Preset and Geometry Controls"
          >
            <Card style={{ padding: '14px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Sparkles size={14} color="var(--electric-cyan)" />
                  <span
                    style={{
                      fontFamily: 'var(--font-mono)',
                      fontSize: '11px',
                      color: 'var(--text-muted)',
                      letterSpacing: '0.05em',
                    }}
                  >
                    MORPHING CONSTRUCTS (FIST TRIGGER)
                  </span>
                </div>
                <Badge label={`${shapeIndex + 1} / ${shapes.length}`} variant="blue" />
              </div>

              {/* Shape Pill Buttons */}
              <div
                style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '6px' }}
                role="radiogroup"
                aria-label="Preset shape selection"
              >
                {shapes.map((s, idx) => {
                  const isActive = currentShape === s;
                  return (
                    <button
                      key={s}
                      role="radio"
                      aria-checked={isActive}
                      onClick={() => handleSelectShape(s)}
                      style={{
                        padding: '8px 4px',
                        borderRadius: '6px',
                        border: '1px solid',
                        borderColor: isActive ? 'var(--electric-cyan)' : 'var(--border-subtle)',
                        background: isActive ? 'rgba(0, 245, 212, 0.2)' : 'rgba(255, 255, 255, 0.02)',
                        color: isActive ? '#fff' : 'var(--text-secondary)',
                        fontFamily: 'var(--font-mono)',
                        fontSize: '10px',
                        cursor: 'pointer',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        gap: '4px',
                        textTransform: 'uppercase',
                        transition: 'all 0.15s ease',
                      }}
                      title={`Select ${s} shape (Shortcut: ${idx + 1})`}
                    >
                      {getShapeIcon(s)}
                      <span>{s}</span>
                    </button>
                  );
                })}
              </div>

              {/* Action Buttons: Next Shape, Pause, Reset */}
              <div style={{ display: 'flex', gap: '8px' }}>
                <Button
                  variant="primary"
                  size="sm"
                  icon={<FastForward size={14} />}
                  onClick={handleNextShape}
                  style={{ flex: 1 }}
                  title="Morph to next shape preset"
                >
                  Next Morph
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  icon={isPaused ? <Play size={14} /> : <Pause size={14} />}
                  onClick={handleTogglePause}
                  title="Pause/Resume rotation drift (Shortcut: Space)"
                >
                  {isPaused ? 'Resume' : 'Pause'}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  icon={<RotateCcw size={14} />}
                  onClick={handleResetScene}
                  title="Reset universe transformation and preset (Shortcut: R)"
                >
                  Reset
                </Button>
              </div>

              {/* Radial Expansion Controls */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: '2px' }}>
                <span
                  style={{
                    fontSize: '11px',
                    color: 'var(--text-muted)',
                    fontFamily: 'var(--font-mono)',
                    letterSpacing: '0.04em',
                  }}
                >
                  RADIAL EXPANSION (PINCH)
                </span>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Button
                    variant="outline"
                    size="sm"
                    icon={<ZoomOut size={12} />}
                    onClick={() => handleExpansionStep(-0.2)}
                    disabled={expansion <= DEFAULT_PARTICLE_CONFIG.minScale}
                    style={{ padding: '4px 6px', height: '24px' }}
                    title="Contract cloud (-)"
                  />
                  <span
                    style={{
                      fontFamily: 'var(--font-mono)',
                      fontSize: '11px',
                      color: 'var(--electric-cyan)',
                      minWidth: '38px',
                      textAlign: 'center',
                    }}
                  >
                    {expansion.toFixed(1)}x
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    icon={<ZoomIn size={12} />}
                    onClick={() => handleExpansionStep(0.2)}
                    disabled={expansion >= DEFAULT_PARTICLE_CONFIG.maxScale}
                    style={{ padding: '4px 6px', height: '24px' }}
                    title="Expand cloud (+)"
                  />
                </div>
              </div>

              {/* Quality Settings / Particle Density */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  borderTop: '1px solid var(--border-subtle)',
                  paddingTop: '8px',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <Sliders size={12} color="var(--text-muted)" />
                  <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                    GPU DENSITY TIER
                  </span>
                </div>
                <div style={{ display: 'flex', gap: '6px' }}>
                  {[5000, 15000, 30000].map((count) => (
                    <button
                      key={count}
                      onClick={() => setParticleCount(count)}
                      style={{
                        padding: '3px 8px',
                        borderRadius: '4px',
                        border: '1px solid',
                        borderColor: particleCount === count ? 'var(--electric-cyan)' : 'var(--border-subtle)',
                        background: particleCount === count ? 'rgba(0, 245, 212, 0.2)' : 'transparent',
                        color: particleCount === count ? 'var(--electric-cyan)' : 'var(--text-muted)',
                        fontSize: '10px',
                        fontFamily: 'var(--font-mono)',
                        cursor: 'pointer',
                        transition: 'all 0.15s ease',
                      }}
                      title={`Set particle buffer count to ${count}`}
                    >
                      {count >= 1000 ? `${count / 1000}K` : count}
                    </button>
                  ))}
                </div>
              </div>
            </Card>
          </section>

          {/* Bottom Right: Shared Control Center HUD */}
          <aside
            className="hud-panel-bottom-right"
            aria-label="Vision Engine Status and Diagnostics"
          >
            <ControlCenter
              activeExperienceTitle="Particle Universe"
              onResetScene={handleResetScene}
            />
          </aside>
        </div>
      </div>
    </div>
  );
};
