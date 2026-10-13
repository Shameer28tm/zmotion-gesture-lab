import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Box,
  Circle,
  Disc,
  ZoomIn,
  ZoomOut,
  Sparkles,
  MousePointer,
  Hand,
  RotateCcw,
} from 'lucide-react';
import { ControlCenter } from '../../components/hud/ControlCenter';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { useGestureEngine } from '../../core/engine/GestureContext';
import {
  StudioSceneController,
  type StudioPresetShape,
  type StudioControlMode,
} from './StudioSceneController';
import { CameraBackdrop } from '../../components/camera/CameraBackdrop';
import { CaptureControls } from '../../components/capture/CaptureControls';
import '../../styles/hud.css';

export const GestureStudio: React.FC = () => {
  const canvasContainerRef = useRef<HTMLDivElement | null>(null);
  const controllerRef = useRef<StudioSceneController | null>(null);

  const { engine, gestureState, cameraStatus, isRunning } = useGestureEngine();

  const [selectedShape, setSelectedShape] = useState<StudioPresetShape>('sphere');
  const [scaleFactor, setScaleFactor] = useState(1.0);
  const [currentColor, setCurrentColor] = useState('#00d2ff');
  const [wireframeOnly, setWireframeOnly] = useState(false);
  const [controlMode, setControlMode] = useState<StudioControlMode>('MANUAL');

  const palette = ['#00d2ff', '#00f5d4', '#c084fc', '#ff00aa', '#ffaa00', '#ffffff'];

  // Initialize and mount Three.js Scene Controller
  useEffect(() => {
    if (!canvasContainerRef.current) return;

    const controller = new StudioSceneController({
      onColorChange: (hex) => setCurrentColor(hex),
      onControlModeChange: (mode) => setControlMode(mode),
      onScaleChange: (sc) => setScaleFactor(sc),
    });

    controller.mount(canvasContainerRef.current);
    controllerRef.current = controller;

    // Synchronize initial configuration
    controller.setShape(selectedShape);
    controller.setColor(currentColor);
    controller.setWireframeOnly(wireframeOnly);

    // High-frequency per-frame gesture subscription (decoupled from React render cycle)
    const unsubscribeFrame = engine.onFrame((state) => {
      controller.updateFromGesture(state, performance.now());
    });

    // Discrete pointing trigger for color changes (fires once, requires release)
    const unsubscribePointing = engine.onPointingTrigger(() => {
      controller.cycleNextColor();
    });

    return () => {
      unsubscribeFrame();
      unsubscribePointing();
      controller.dispose();
      controllerRef.current = null;
    };
  }, [engine]);

  // Handle Preset Shape Switch
  const handleSelectShape = useCallback((shape: StudioPresetShape) => {
    setSelectedShape(shape);
    controllerRef.current?.setShape(shape);
  }, []);

  // Handle Color Accent Switch
  const handleSelectColor = useCallback((hex: string) => {
    setCurrentColor(hex);
    controllerRef.current?.setColor(hex);
  }, []);

  // Handle Wireframe Toggle
  const handleToggleWireframe = useCallback(() => {
    setWireframeOnly((prev) => {
      const next = !prev;
      controllerRef.current?.setWireframeOnly(next);
      return next;
    });
  }, []);

  // Handle Manual Zoom Controls
  const handleZoom = useCallback((delta: number) => {
    setScaleFactor((prev) => {
      const next = Math.max(0.4, Math.min(2.4, Number((prev + delta).toFixed(2))));
      controllerRef.current?.setBaseScale(next);
      return next;
    });
  }, []);

  // Handle Viewport Reset
  const handleResetScene = useCallback(() => {
    controllerRef.current?.reset();
    setSelectedShape('sphere');
    setCurrentColor('#00d2ff');
    setScaleFactor(1.0);
    setWireframeOnly(false);
    setControlMode('MANUAL');
  }, []);

  // Keyboard accessibility shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if user is typing in an input
      if (['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement)?.tagName)) return;

      switch (e.key) {
        case '1':
          handleSelectShape('sphere');
          break;
        case '2':
          handleSelectShape('cube');
          break;
        case '3':
          handleSelectShape('torus');
          break;
        case 'w':
        case 'W':
          handleToggleWireframe();
          break;
        case 'r':
        case 'R':
          handleResetScene();
          break;
        case '+':
        case '=':
          handleZoom(0.15);
          break;
        case '-':
        case '_':
          handleZoom(-0.15);
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleSelectShape, handleToggleWireframe, handleResetScene, handleZoom]);

  const isGestureActive = controlMode === 'GESTURE' && gestureState.handDetected;

  return (
    <div
      className="experience-container"
      role="region"
      aria-label="3D Gesture Studio Viewport"
      tabIndex={0}
    >
      {/* Live Camera Backdrop Layer */}
      <CameraBackdrop />

      {/* Three.js Canvas Container */}
      <div
        ref={canvasContainerRef}
        className={`viewport-canvas-wrapper ${isRunning ? 'camera-active' : ''}`}
        data-testid="studio-canvas-container"
      />

      {/* Laboratory HUD Overlay */}
      <div className="hud-overlay">
        {/* Top Telemetry Bar */}
        <header className="hud-top-bar hud-interactive">
          <div className="hud-title-card">
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span
                style={{
                  fontFamily: 'var(--font-mono)',
                  fontSize: '11px',
                  color: 'var(--electric-blue)',
                  letterSpacing: '0.05em',
                }}
              >
                EXPERIMENT 01
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
                GESTURE STUDIO
              </h1>
            </div>
            <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
              Interactive 3D Spatial Geometry • Webcam or Pointer Controlled
            </span>
          </div>

          <div className="hud-telemetry-cluster">
            {/* Control Mode Badge */}
            <div className="telemetry-card">
              <span className="telemetry-label">CONTROL MODE</span>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '2px' }}>
                {isGestureActive ? (
                  <>
                    <Hand size={13} style={{ color: 'var(--status-live)' }} />
                    <Badge label="GESTURE ACTIVE" variant="live" pulse />
                  </>
                ) : (
                  <>
                    <MousePointer size={13} style={{ color: 'var(--text-muted)' }} />
                    <Badge label="MANUAL POINTER" variant="muted" />
                  </>
                )}
              </div>
            </div>

            {/* Selected Preset Construct */}
            <div className="telemetry-card">
              <span className="telemetry-label">CONSTRUCT</span>
              <span
                className="telemetry-value"
                style={{ color: currentColor, textTransform: 'uppercase' }}
              >
                {selectedShape.toUpperCase()}
              </span>
            </div>

            {/* Dynamic Scale Factor */}
            <div className="telemetry-card">
              <span className="telemetry-label">SCALE FACTOR</span>
              <span className="telemetry-value">{`${scaleFactor.toFixed(2)}x`}</span>
            </div>

            {/* Accent Color Hex */}
            <div className="telemetry-card">
              <span className="telemetry-label">ACCENT COLOR</span>
              <span className="telemetry-value" style={{ color: currentColor }}>
                {currentColor.toUpperCase()}
              </span>
            </div>

            {/* Active Gesture Pill (if hand detected) */}
            {gestureState.handDetected && (
              <div className="telemetry-card">
                <span className="telemetry-label">LIVE GESTURE</span>
                <span
                  className="telemetry-value"
                  style={{
                    color: 'var(--electric-cyan)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                  }}
                >
                  <Sparkles size={12} />
                  {gestureState.activeGesture}
                </span>
              </div>
            )}

            {/* Privacy-First Capture Controls */}
            <CaptureControls canvasContainerRef={canvasContainerRef} />
          </div>
        </header>

        {/* Ambient Interaction Hints Bar */}
        <div
          style={{
            alignSelf: 'center',
            background: 'rgba(8, 13, 26, 0.75)',
            backdropFilter: 'blur(8px)',
            border: '1px solid var(--border-subtle)',
            borderRadius: '20px',
            padding: '6px 16px',
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            fontSize: '11px',
            fontFamily: 'var(--font-mono)',
            color: 'var(--text-secondary)',
            pointerEvents: 'none',
          }}
        >
          {isGestureActive ? (
            <>
              <span style={{ color: 'var(--status-live)' }}>● GESTURE ENGINE ENGAGED</span>
              <span>• Hand Position: Yaw/Pitch</span>
              <span>• Pinch: Scale Zoom</span>
              <span>• Point: Color Shift</span>
              <span>• Open Palm: Center Reset</span>
            </>
          ) : (
            <>
              <span style={{ color: 'var(--text-muted)' }}>○ FALLBACK CONTROLS</span>
              <span>• Click & Drag: Rotate</span>
              <span>• Wheel/Trackpad: Zoom</span>
              <span>• Enable Camera for Spatial Gestures</span>
            </>
          )}
        </div>

        {/* Bottom HUD Controls Dock */}
        <footer className="hud-controls-dock">
          {/* Bottom Left: Presets, Palette & Fallback Tooling */}
          <section
            className="hud-panel-bottom-left hud-interactive"
            aria-label="Preset Controls and Color Palette"
          >
            <Card
              cyberCorners
              style={{
                padding: '14px',
                display: 'flex',
                flexDirection: 'column',
                gap: '12px',
                boxShadow: '0 8px 30px rgba(0, 0, 0, 0.6)',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span
                  style={{
                    fontFamily: 'var(--font-mono)',
                    fontSize: '11px',
                    color: 'var(--text-muted)',
                  }}
                >
                  SHAPE PRESETS
                </span>
                <span
                  style={{
                    fontSize: '11px',
                    color: 'var(--electric-cyan)',
                    fontFamily: 'var(--font-mono)',
                  }}
                >
                  Keys 1-3
                </span>
              </div>

              {/* Shape Selection Buttons */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px' }}>
                <Button
                  variant={selectedShape === 'sphere' ? 'primary' : 'glass'}
                  size="sm"
                  icon={<Circle size={14} />}
                  onClick={() => handleSelectShape('sphere')}
                  aria-pressed={selectedShape === 'sphere'}
                >
                  Sphere
                </Button>
                <Button
                  variant={selectedShape === 'cube' ? 'primary' : 'glass'}
                  size="sm"
                  icon={<Box size={14} />}
                  onClick={() => handleSelectShape('cube')}
                  aria-pressed={selectedShape === 'cube'}
                >
                  Cube
                </Button>
                <Button
                  variant={selectedShape === 'torus' ? 'primary' : 'glass'}
                  size="sm"
                  icon={<Disc size={14} />}
                  onClick={() => handleSelectShape('torus')}
                  aria-pressed={selectedShape === 'torus'}
                >
                  Torus
                </Button>
              </div>

              {/* Color Presets */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  paddingTop: '2px',
                }}
              >
                <span
                  style={{
                    fontSize: '11px',
                    color: 'var(--text-muted)',
                    fontFamily: 'var(--font-mono)',
                  }}
                >
                  EMISSIVE PALETTE
                </span>
                <div style={{ display: 'flex', gap: '8px' }} role="group" aria-label="Color Swatches">
                  {palette.map((c) => (
                    <button
                      key={c}
                      onClick={() => handleSelectColor(c)}
                      aria-label={`Select color ${c}`}
                      style={{
                        width: '20px',
                        height: '20px',
                        borderRadius: '50%',
                        backgroundColor: c,
                        border:
                          currentColor === c
                            ? '2px solid #ffffff'
                            : '1px solid rgba(255,255,255,0.25)',
                        boxShadow: currentColor === c ? `0 0 10px ${c}` : 'none',
                        cursor: 'pointer',
                        padding: 0,
                        transition: 'transform 0.15s ease, box-shadow 0.15s ease',
                        transform: currentColor === c ? 'scale(1.15)' : 'scale(1)',
                      }}
                      title={c}
                    />
                  ))}
                </div>
              </div>

              {/* Manual Scale Controls Fallback */}
              <div style={{ display: 'flex', gap: '8px' }}>
                <Button
                  variant="outline"
                  size="sm"
                  icon={<ZoomOut size={13} />}
                  onClick={() => handleZoom(-0.2)}
                  style={{ flex: 1 }}
                  title="Zoom Out (Key -)"
                >
                  Scale -
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  icon={<ZoomIn size={13} />}
                  onClick={() => handleZoom(0.2)}
                  style={{ flex: 1 }}
                  title="Zoom In (Key +)"
                >
                  Scale +
                </Button>
                <Button
                  variant={wireframeOnly ? 'primary' : 'outline'}
                  size="sm"
                  onClick={handleToggleWireframe}
                  style={{ flex: 1 }}
                  title="Toggle Wireframe Shell (Key W)"
                >
                  {wireframeOnly ? 'Wireframe' : 'Solid Shell'}
                </Button>
                <Button
                  variant="glass"
                  size="sm"
                  icon={<RotateCcw size={13} />}
                  onClick={handleResetScene}
                  title="Reset Viewport (Key R)"
                  aria-label="Reset Viewport"
                />
              </div>
            </Card>
          </section>

          {/* Bottom Right: Shared Control Center */}
          <section
            className="hud-panel-bottom-right"
            aria-label="Gesture and Camera Control Center"
          >
            <ControlCenter
              activeExperienceTitle="Gesture Studio"
              onResetScene={handleResetScene}
              showOverlayToggle={cameraStatus === 'streaming'}
            />
          </section>
        </footer>
      </div>
    </div>
  );
};

export default GestureStudio;
