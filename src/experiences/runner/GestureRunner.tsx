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
import { RunnerEngine, type RunnerGameState, type RunnerDifficulty } from './runnerEngine';
import { RunnerSceneController } from './RunnerSceneController';
import { CameraBackdrop } from '../../components/camera/CameraBackdrop';
import { CaptureControls } from '../../components/capture/CaptureControls';
import '../../styles/hud.css';

export const GestureRunner: React.FC = () => {
  const canvasContainerRef = useRef<HTMLDivElement | null>(null);
  const controllerRef = useRef<RunnerSceneController | null>(null);
  const engineRef = useRef<RunnerEngine>(new RunnerEngine('EASY'));

  const { engine: gestureEngine, gestureState, isRunning } = useGestureEngine();

  // Low-frequency UI reactive state
  const [gameState, setGameState] = useState<RunnerGameState>('IDLE');
  const [difficulty, setDifficulty] = useState<RunnerDifficulty>('EASY');
  const [playerLane, setPlayerLane] = useState<'LEFT' | 'CENTER' | 'RIGHT'>('CENTER');
  const [hasCollisionFlash, setHasCollisionFlash] = useState(false);
  const [score, setScore] = useState(0);
  const [distance, setDistance] = useState(0);
  const [highScore, setHighScore] = useState(0);
  const [speed, setSpeed] = useState(14);
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
        setHasCollisionFlash(true);
        setTimeout(() => setHasCollisionFlash(false), 450);
      }

      // Sync 3D scene visual representations
      controller.updateFromEngine(gameEngine, dt);

      // Throttled UI state sync (approx 8 times/sec) to avoid React render overhead
      if (now - lastUiSync >= 120) {
        lastUiSync = now;
        setGameState(gameEngine.getState());
        setScore(gameEngine.getScore());
        setDistance(gameEngine.getDistance());
        setSpeed(Math.round(gameEngine.getSpeed()));
        setMultiplier(gameEngine.getMultiplier());
        setHighScore(gameEngine.getHighScore());
        const laneVal = gameEngine.getPlayer().lane;
        setPlayerLane(laneVal === -1 ? 'LEFT' : laneVal === 1 ? 'RIGHT' : 'CENTER');
      }

      animId = requestAnimationFrame(gameLoop);
    };

    animId = requestAnimationFrame(gameLoop);

    let isFistCurrentlyLatched = false;

    // High-frequency gesture listener for horizontal steering and fist unlatching
    const unsubFrame = gestureEngine.onFrame((state) => {
      if (gameEngine.getState() === 'PLAYING') {
        if (state.handDetected) {
          gameEngine.setNormalizedHandX(state.metrics.handCenter.x);
          if (state.activeGesture !== 'CLOSED_FIST') {
            isFistCurrentlyLatched = false;
          }
        } else {
          isFistCurrentlyLatched = false;
        }
      }
    });

    // Discrete fist gesture listener with latching (1 jump per clench)
    const unsubFist = gestureEngine.onFistTrigger(() => {
      if (gameEngine.getState() === 'PLAYING' && !isFistCurrentlyLatched) {
        const jumped = gameEngine.jump();
        if (jumped) {
          isFistCurrentlyLatched = true;
        }
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

  const handleSelectDifficulty = useCallback((diff: RunnerDifficulty) => {
    setDifficulty(diff);
    engineRef.current.setDifficulty(diff);
  }, []);

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

          <div className="hud-telemetry-cluster" style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
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

            {/* Active Lane */}
            <div className="telemetry-card">
              <span className="telemetry-label">LANE</span>
              <span
                className="telemetry-value"
                style={{ color: playerLane === 'CENTER' ? 'var(--electric-cyan)' : '#00f5d4' }}
              >
                {playerLane}
              </span>
            </div>

            {/* Difficulty Badge */}
            <div className="telemetry-card">
              <span className="telemetry-label">DIFFICULTY</span>
              <span className="telemetry-value" style={{ fontSize: '12px' }}>
                {difficulty}
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

            {/* Privacy-First In-Memory Photo & Video Capture */}
            <CaptureControls canvasContainerRef={canvasContainerRef} />
          </div>
        </header>

        {/* Red Impact Collision Flash */}
        {hasCollisionFlash && (
          <div
            style={{
              position: 'absolute',
              inset: 0,
              pointerEvents: 'none',
              border: '4px solid rgba(255, 51, 102, 0.85)',
              backgroundColor: 'rgba(255, 51, 102, 0.18)',
              zIndex: 35,
              transition: 'opacity 0.2s ease',
            }}
          />
        )}

        {/* Center Game State Overlays */}
        {gameState === 'IDLE' && (
          <div
            style={{
              position: 'absolute',
              top: '46%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              zIndex: 10,
              maxWidth: '460px',
              width: '92%',
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
                gap: '14px',
                background: 'rgba(8, 13, 26, 0.95)',
                backdropFilter: 'blur(20px)',
                border: '1px solid var(--border-glass)',
                boxShadow: '0 20px 50px rgba(0, 0, 0, 0.8)',
              }}
            >
              <div
                style={{
                  width: '54px',
                  height: '54px',
                  borderRadius: '14px',
                  background: 'rgba(0, 210, 255, 0.1)',
                  border: '1px solid rgba(0, 210, 255, 0.3)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: '0 0 30px rgba(0, 210, 255, 0.25)',
                }}
              >
                <Gamepad2 size={30} color="var(--electric-blue)" />
              </div>

              <div>
                <h2 style={{ margin: '0 0 6px 0', fontSize: '20px', color: '#fff', fontWeight: 800 }}>
                  ENDLESS CYBER RUNNER
                </h2>
                <p style={{ margin: 0, fontSize: '13px', color: 'var(--text-secondary)' }}>
                  Vision-driven 3D obstacle runway. Dodge hazards, collect energy, and survive!
                </p>
              </div>

              {/* Difficulty Mode Selector */}
              <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '6px', textAlign: 'left' }}>
                <span style={{ fontSize: '11px', fontFamily: 'var(--font-mono)', color: 'var(--text-muted)' }}>
                  DIFFICULTY (EASY IS RECOMMENDED):
                </span>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '6px' }}>
                  {(['EASY', 'NORMAL', 'HARD'] as RunnerDifficulty[]).map((d) => (
                    <button
                      key={d}
                      type="button"
                      onClick={() => handleSelectDifficulty(d)}
                      style={{
                        padding: '8px 4px',
                        borderRadius: '6px',
                        border: difficulty === d ? '1px solid var(--electric-cyan)' : '1px solid var(--border-subtle)',
                        background: difficulty === d ? 'rgba(0, 210, 255, 0.18)' : 'rgba(0, 0, 0, 0.3)',
                        color: difficulty === d ? '#fff' : 'var(--text-muted)',
                        fontFamily: 'var(--font-mono)',
                        fontSize: '11px',
                        fontWeight: difficulty === d ? 700 : 500,
                        cursor: 'pointer',
                        transition: 'all 0.2s ease',
                      }}
                    >
                      {d} {d === 'EASY' && '★'}
                    </button>
                  ))}
                </div>
              </div>

              {/* Visual Onboarding Controls Mapping */}
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
                  <span style={{ color: 'var(--electric-cyan)', fontWeight: 700 }}>STEER:</span>
                  <div style={{ color: 'var(--text-secondary)' }}>Move Hand Left / Right</div>
                  <div style={{ color: 'var(--text-muted)', fontSize: '10px' }}>Keys: A / D or ← / →</div>
                </div>
                <div>
                  <span style={{ color: '#00f5d4', fontWeight: 700 }}>JUMP:</span>
                  <div style={{ color: 'var(--text-secondary)' }}>Clench Closed Fist</div>
                  <div style={{ color: 'var(--text-muted)', fontSize: '10px' }}>Key: Space or Up</div>
                </div>
                <div>
                  <span style={{ color: '#ffaa00', fontWeight: 700 }}>OBJECTIVE:</span>
                  <div style={{ color: 'var(--text-secondary)' }}>Dodge Red Barriers</div>
                </div>
                <div>
                  <span style={{ color: '#ff00aa', fontWeight: 700 }}>FALLBACK:</span>
                  <div style={{ color: 'var(--text-secondary)' }}>On-Screen Buttons & Keys</div>
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
              maxWidth: '400px',
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
                gap: '14px',
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

              {/* Quick Difficulty Switcher on Game Over */}
              <div style={{ width: '100%', display: 'flex', justifyContent: 'center', gap: '6px' }}>
                {(['EASY', 'NORMAL', 'HARD'] as RunnerDifficulty[]).map((d) => (
                  <button
                    key={d}
                    type="button"
                    onClick={() => handleSelectDifficulty(d)}
                    style={{
                      padding: '4px 8px',
                      borderRadius: '4px',
                      border: difficulty === d ? '1px solid var(--electric-cyan)' : '1px solid var(--border-subtle)',
                      background: difficulty === d ? 'rgba(0, 210, 255, 0.15)' : 'rgba(0, 0, 0, 0.3)',
                      color: difficulty === d ? '#fff' : 'var(--text-muted)',
                      fontFamily: 'var(--font-mono)',
                      fontSize: '10px',
                      cursor: 'pointer',
                    }}
                  >
                    {d}
                  </button>
                ))}
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
