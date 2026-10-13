import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Gamepad2,
  Play,
  RotateCcw,
  Pause,
  ArrowLeft,
  ArrowRight,
  ArrowUp,
  AlertTriangle,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { ControlCenter } from '../../components/hud/ControlCenter';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { useGestureEngine } from '../../core/engine/GestureContext';
import { RunnerEngine, type RunnerGameState } from './runnerEngine';
import { RunnerSceneController } from './RunnerSceneController';
import { CameraBackdrop } from '../../components/camera/CameraBackdrop';
import '../../styles/hud.css';

export const GestureRunner: React.FC = () => {
  const canvasContainerRef = useRef<HTMLDivElement | null>(null);
  const controllerRef = useRef<RunnerSceneController | null>(null);
  const engineRef = useRef<RunnerEngine>(new RunnerEngine());

  const { engine: gestureEngine, gestureState, isRunning } = useGestureEngine();

  // Low-frequency UI reactive state
  const [gameState, setGameState] = useState<RunnerGameState>('IDLE');
  const [score, setScore] = useState(0);
  const [distance, setDistance] = useState(0);
  const [highScore, setHighScore] = useState(0);
  const [speed, setSpeed] = useState(22);
  const [multiplier, setMultiplier] = useState(1.0);
  const [isNewRecord, setIsNewRecord] = useState(false);

  // Initialize Scene Controller & Game Loop
  useEffect(() => {
    if (!canvasContainerRef.current) return;

    const gameEngine = engineRef.current;
    setHighScore(gameEngine.getHighScore());

    const controller = new RunnerSceneController();
    controller.mount(canvasContainerRef.current);
    controllerRef.current = controller;

    let lastTick = performance.now();
    let animId: number;
    let lastUiSync = 0;

    const gameLoop = (now: number) => {
      const dt = (now - lastTick) / 1000;
      lastTick = now;

      // Update physics and collision
      const result = gameEngine.update(dt);
      if (result.collision) {
        controller.triggerExplosion();
      }

      // Sync 3D scene visual representations
      controller.updateFromEngine(gameEngine, dt);

      // Throttled UI state sync (approx 8 times/sec) to avoid React render overhead
      if (now - lastUiSync >= 120) {
        lastUiSync = now;
        setGameState(gameEngine.getState());
        setScore(gameEngine.getScore());
        setDistance(gameEngine.getDistance());
        setSpeed(gameEngine.getSpeed());
        setMultiplier(gameEngine.getMultiplier());
        setHighScore(gameEngine.getHighScore());
      }

      animId = requestAnimationFrame(gameLoop);
    };

    animId = requestAnimationFrame(gameLoop);

    // High-frequency gesture listener for horizontal steering
    const unsubFrame = gestureEngine.onFrame((state) => {
      if (state.handDetected && gameEngine.getState() === 'PLAYING') {
        gameEngine.setNormalizedHandX(state.metrics.handCenter.x);
      }
    });

    // Discrete fist gesture listener for jumping
    const unsubFist = gestureEngine.onFistTrigger(() => {
      if (gameEngine.getState() === 'PLAYING') {
        gameEngine.jump();
      }
    });

    return () => {
      cancelAnimationFrame(animId);
      unsubFrame();
      unsubFist();
      controller.dispose();
      controllerRef.current = null;
    };
  }, [gestureEngine]);

  // Handle Start / Restart
  const handleStartGame = useCallback(() => {
    const game = engineRef.current;
    game.start();
    setGameState('PLAYING');
    setIsNewRecord(false);
  }, []);

  const handlePauseToggle = useCallback(() => {
    const game = engineRef.current;
    if (game.getState() === 'PLAYING') {
      game.pause();
      setGameState('PAUSED');
    } else if (game.getState() === 'PAUSED') {
      game.resume();
      setGameState('PLAYING');
    }
  }, []);

  const handleRestart = useCallback(() => {
    const game = engineRef.current;
    game.restart();
    setGameState('PLAYING');
    setIsNewRecord(false);
  }, []);

  // Check high score celebration
  useEffect(() => {
    if (gameState === 'GAME_OVER') {
      const currentFinal = engineRef.current.getScore();
      if (currentFinal > highScore && currentFinal > 50) {
        setIsNewRecord(true);
        try {
          confetti({
            particleCount: 80,
            spread: 70,
            origin: { y: 0.6 },
            colors: ['#00d2ff', '#00f5d4', '#ff00aa', '#ffaa00'],
          });
        } catch {
          // Confetti optional
        }
      }
    }
  }, [gameState, highScore]);

  // Keyboard controls
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement)?.tagName)) return;

      const game = engineRef.current;

      switch (e.key) {
        case 'ArrowLeft':
        case 'a':
        case 'A':
          game.moveLeft();
          break;
        case 'ArrowRight':
        case 'd':
        case 'D':
          game.moveRight();
          break;
        case 'ArrowUp':
        case 'w':
        case 'W':
        case ' ':
          if (game.getState() === 'PLAYING') {
            e.preventDefault();
            game.jump();
          } else if (game.getState() === 'IDLE' || game.getState() === 'GAME_OVER') {
            e.preventDefault();
            handleStartGame();
          }
          break;
        case 'Escape':
        case 'p':
        case 'P':
          e.preventDefault();
          handlePauseToggle();
          break;
        case 'Enter':
          if (game.getState() === 'IDLE' || game.getState() === 'GAME_OVER') {
            e.preventDefault();
            handleStartGame();
          }
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleStartGame, handlePauseToggle]);

  return (
    <div
      className="experience-container"
      role="region"
      aria-label="3D Gesture Runner Viewport"
      tabIndex={0}
    >
      {/* Live Camera Backdrop Layer (visible when camera is on) */}
      <CameraBackdrop />

      {/* Three.js Canvas Container (transparent over camera) */}
      <div
        ref={canvasContainerRef}
        className={`viewport-canvas-wrapper ${isRunning ? 'camera-active' : ''}`}
        data-testid="runner-canvas-container"
      />

      {/* Cyberpunk Telemetry HUD Overlay */}
      <div className="hud-overlay">
        {/* Top Telemetry Bar */}
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
                EXPERIMENT 03
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
                GESTURE RUNNER
              </h1>
            </div>
            <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
              Vision-Driven Endless Cyber Runway & Obstacle Navigation
            </span>
          </div>

          <div className="hud-telemetry-cluster">
            {/* Live Score */}
            <div className="telemetry-card">
              <span className="telemetry-label">SCORE</span>
              <span className="telemetry-value" style={{ color: 'var(--electric-cyan)', fontSize: '15px' }}>
                {score.toLocaleString()}
              </span>
            </div>

            {/* Distance */}
            <div className="telemetry-card">
              <span className="telemetry-label">DISTANCE</span>
              <span className="telemetry-value">{distance.toLocaleString()}m</span>
            </div>

            {/* Best Score */}
            <div className="telemetry-card">
              <span className="telemetry-label">BEST RECORD</span>
              <span className="telemetry-value" style={{ color: '#ffaa00' }}>
                {highScore.toLocaleString()}
              </span>
            </div>

            {/* Speed & Multiplier */}
            <div className="telemetry-card">
              <span className="telemetry-label">SPEED</span>
              <span className="telemetry-value">{speed} m/s</span>
            </div>

            <div className="telemetry-card">
              <span className="telemetry-label">MULTIPLIER</span>
              <span className="telemetry-value">{multiplier}x</span>
            </div>
          </div>
        </header>

        {/* Center Game State Overlays */}
        {gameState === 'IDLE' && (
          <div
            style={{
              position: 'absolute',
              top: '46%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              zIndex: 10,
              maxWidth: '420px',
              width: '90%',
            }}
          >
            <Card
              cyberCorners
              style={{
                padding: '24px',
                textAlign: 'center',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '16px',
                background: 'rgba(8, 13, 26, 0.9)',
                backdropFilter: 'blur(20px)',
                border: '1px solid var(--border-glass)',
                boxShadow: '0 20px 50px rgba(0, 0, 0, 0.8)',
              }}
            >
              <div
                style={{
                  width: '56px',
                  height: '56px',
                  borderRadius: '14px',
                  background: 'rgba(0, 210, 255, 0.1)',
                  border: '1px solid rgba(0, 210, 255, 0.3)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: '0 0 30px rgba(0, 210, 255, 0.25)',
                }}
              >
                <Gamepad2 size={32} color="var(--electric-blue)" />
              </div>

              <div>
                <h2 style={{ margin: '0 0 6px 0', fontSize: '20px', color: '#fff', fontWeight: 800 }}>
                  ENDLESS CYBER RUNNER
                </h2>
                <p style={{ margin: 0, fontSize: '13px', color: 'var(--text-secondary)' }}>
                  Steer left/right and jump over high-voltage barriers in real time.
                </p>
              </div>

              {/* Instructions Summary */}
              <div
                style={{
                  width: '100%',
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr',
                  gap: '8px',
                  textAlign: 'left',
                  fontSize: '11px',
                  fontFamily: 'var(--font-mono)',
                  background: 'rgba(0, 0, 0, 0.4)',
                  padding: '12px',
                  borderRadius: '8px',
                  border: '1px solid var(--border-subtle)',
                }}
              >
                <div>
                  <span style={{ color: 'var(--electric-cyan)', fontWeight: 700 }}>HAND LEFT/RIGHT:</span>
                  <div style={{ color: 'var(--text-muted)' }}>Change Lanes (A / D)</div>
                </div>
                <div>
                  <span style={{ color: '#ffaa00', fontWeight: 700 }}>CLOSED FIST:</span>
                  <div style={{ color: 'var(--text-muted)' }}>Jump Barrier (Space)</div>
                </div>
              </div>

              <Button
                variant="primary"
                size="lg"
                glow
                icon={<Play size={16} />}
                onClick={handleStartGame}
                style={{ width: '100%' }}
              >
                START RUN (SPACE)
              </Button>
            </Card>
          </div>
        )}

        {gameState === 'GAME_OVER' && (
          <div
            style={{
              position: 'absolute',
              top: '46%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              zIndex: 10,
              maxWidth: '380px',
              width: '90%',
            }}
          >
            <Card
              cyberCorners
              style={{
                padding: '24px',
                textAlign: 'center',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '16px',
                background: 'rgba(8, 13, 26, 0.95)',
                backdropFilter: 'blur(20px)',
                border: '1px solid rgba(255, 51, 102, 0.4)',
                boxShadow: '0 20px 50px rgba(255, 51, 102, 0.25)',
              }}
            >
              <div
                style={{
                  width: '50px',
                  height: '50px',
                  borderRadius: '12px',
                  background: 'rgba(255, 51, 102, 0.15)',
                  border: '1px solid rgba(255, 51, 102, 0.4)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <AlertTriangle size={28} color="#ff3366" />
              </div>

              <div>
                <span
                  style={{
                    fontFamily: 'var(--font-mono)',
                    fontSize: '11px',
                    color: '#ff3366',
                    letterSpacing: '0.1em',
                    fontWeight: 700,
                  }}
                >
                  SYSTEM CRITICAL
                </span>
                <h2 style={{ margin: '4px 0', fontSize: '22px', color: '#fff', fontWeight: 800 }}>
                  RUN TERMINATED
                </h2>
              </div>

              <div
                style={{
                  width: '100%',
                  display: 'flex',
                  justifyContent: 'space-around',
                  padding: '12px',
                  background: 'rgba(0, 0, 0, 0.4)',
                  borderRadius: '8px',
                  fontFamily: 'var(--font-mono)',
                }}
              >
                <div>
                  <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>FINAL SCORE</span>
                  <div style={{ fontSize: '18px', fontWeight: 800, color: 'var(--electric-cyan)' }}>
                    {score.toLocaleString()}
                  </div>
                </div>
                <div>
                  <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>DISTANCE</span>
                  <div style={{ fontSize: '18px', fontWeight: 800, color: '#fff' }}>
                    {distance.toLocaleString()}m
                  </div>
                </div>
              </div>

              {isNewRecord && (
                <Badge
                  label="NEW RECORD ESTABLISHED!"
                  variant="live"
                  pulse
                  style={{ width: '100%', justifyContent: 'center' }}
                />
              )}

              <Button
                variant="primary"
                size="lg"
                glow
                icon={<RotateCcw size={16} />}
                onClick={handleRestart}
                style={{ width: '100%' }}
              >
                PLAY AGAIN (SPACE)
              </Button>
            </Card>
          </div>
        )}

        {gameState === 'PAUSED' && (
          <div
            style={{
              position: 'absolute',
              top: '46%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              zIndex: 10,
              maxWidth: '340px',
              width: '90%',
            }}
          >
            <Card
              cyberCorners
              style={{
                padding: '24px',
                textAlign: 'center',
                display: 'flex',
                flexDirection: 'column',
                gap: '16px',
                background: 'rgba(8, 13, 26, 0.95)',
                border: '1px solid var(--border-glass)',
              }}
            >
              <h2 style={{ margin: 0, fontSize: '20px', color: '#fff' }}>RUN PAUSED</h2>
              <div style={{ display: 'flex', gap: '8px' }}>
                <Button
                  variant="primary"
                  size="md"
                  icon={<Play size={14} />}
                  onClick={handlePauseToggle}
                  style={{ flex: 1 }}
                >
                  Resume
                </Button>
                <Button
                  variant="outline"
                  size="md"
                  icon={<RotateCcw size={14} />}
                  onClick={handleRestart}
                >
                  Restart
                </Button>
              </div>
            </Card>
          </div>
        )}

        {/* Bottom Controls Dock */}
        <div className="hud-controls-dock">
          {/* Bottom Left: Game Instructions and Touch Controls */}
          <section
            className="hud-panel-bottom-left hud-interactive"
            aria-label="Gesture Runner Controls & Telemetry"
          >
            <Card style={{ padding: '14px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span
                  style={{
                    fontFamily: 'var(--font-mono)',
                    fontSize: '11px',
                    color: 'var(--text-muted)',
                    letterSpacing: '0.05em',
                  }}
                >
                  INPUT CONTROLLER (ACTIVE)
                </span>
                <Badge
                  label={isRunning && gestureState.handDetected ? 'GESTURE LOCKED' : 'KEYBOARD / MOUSE'}
                  variant={isRunning && gestureState.handDetected ? 'live' : 'muted'}
                />
              </div>

              {/* Game Control Action Buttons */}
              <div style={{ display: 'flex', gap: '8px' }}>
                {gameState === 'PLAYING' ? (
                  <Button
                    variant="outline"
                    size="sm"
                    icon={<Pause size={14} />}
                    onClick={handlePauseToggle}
                    style={{ flex: 1 }}
                  >
                    Pause (P)
                  </Button>
                ) : (
                  <Button
                    variant="primary"
                    size="sm"
                    icon={<Play size={14} />}
                    onClick={handleStartGame}
                    style={{ flex: 1 }}
                  >
                    {gameState === 'PAUSED' ? 'Resume' : 'Start Run'}
                  </Button>
                )}
                <Button
                  variant="outline"
                  size="sm"
                  icon={<RotateCcw size={14} />}
                  onClick={handleRestart}
                  title="Restart Run"
                >
                  Reset
                </Button>
              </div>

              {/* Mobile / Screen Touch Arrows */}
              <div style={{ display: 'flex', gap: '6px', paddingTop: '4px' }}>
                <Button
                  variant="outline"
                  size="sm"
                  icon={<ArrowLeft size={14} />}
                  onClick={() => engineRef.current.moveLeft()}
                  style={{ flex: 1 }}
                  title="Lane Left (A)"
                >
                  Left
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  icon={<ArrowUp size={14} />}
                  onClick={() => engineRef.current.jump()}
                  style={{ flex: 1 }}
                  title="Jump (Space)"
                >
                  Jump
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  icon={<ArrowRight size={14} />}
                  onClick={() => engineRef.current.moveRight()}
                  style={{ flex: 1 }}
                  title="Lane Right (D)"
                >
                  Right
                </Button>
              </div>
            </Card>
          </section>

          {/* Bottom Right: Shared Control Center HUD */}
          <aside
            className="hud-panel-bottom-right"
            aria-label="Vision Engine Status and Diagnostics"
          >
            <ControlCenter
              activeExperienceTitle="Gesture Runner"
              onResetScene={handleRestart}
            />
          </aside>
        </div>
      </div>
    </div>
  );
};
