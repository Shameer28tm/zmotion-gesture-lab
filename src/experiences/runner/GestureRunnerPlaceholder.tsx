import React, { useState } from 'react';
import { Gamepad2, Play, RotateCcw, Keyboard, Hand } from 'lucide-react';
import { ControlCenter } from '../../components/hud/ControlCenter';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import '../../styles/hud.css';

export const GestureRunnerPlaceholder: React.FC = () => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [score, setScore] = useState(0);
  const [highScore] = useState(1420);
  const [controlMode, setControlMode] = useState<'gesture' | 'keyboard'>('gesture');

  const handleStartGame = () => {
    setIsPlaying(true);
    setScore(0);
  };

  const handleResetGame = () => {
    setIsPlaying(false);
    setScore(0);
  };

  return (
    <div className="experience-container">
      {/* 3D Viewport Track Canvas Area */}
      <div className="viewport-canvas-wrapper">
        <div className="scene-placeholder-canvas">
          <div
            style={{
              position: 'relative',
              width: '400px',
              height: '500px',
              perspective: '600px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            {/* Perspective Cyber Runway */}
            <div
              style={{
                position: 'absolute',
                width: '260px',
                height: '420px',
                background: 'linear-gradient(to top, rgba(0, 210, 255, 0.2) 0%, rgba(5, 7, 13, 0) 100%)',
                borderLeft: '2px solid rgba(0, 210, 255, 0.4)',
                borderRight: '2px solid rgba(0, 210, 255, 0.4)',
                transform: 'rotateX(55deg)',
                transformOrigin: 'bottom center',
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'flex-end',
                paddingBottom: '20px',
              }}
            >
              {/* Player Cube Avatar Preview */}
              <div
                style={{
                  width: '40px',
                  height: '40px',
                  borderRadius: '8px',
                  backgroundColor: '#ff3366',
                  boxShadow: '0 0 20px rgba(255, 51, 102, 0.6)',
                  border: '2px solid #fff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#fff',
                  fontFamily: 'var(--font-mono)',
                  fontSize: '10px',
                  fontWeight: 800,
                }}
              >
                P1
              </div>
            </div>

            {/* Inactive Overlay Overlay Banner */}
            {!isPlaying && (
              <div
                style={{
                  position: 'relative',
                  zIndex: 5,
                  padding: '24px',
                  borderRadius: '16px',
                  background: 'rgba(8, 13, 26, 0.9)',
                  backdropFilter: 'blur(16px)',
                  border: '1px solid var(--border-glass)',
                  textAlign: 'center',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '14px',
                  maxWidth: '300px',
                }}
              >
                <Gamepad2 size={36} color="var(--electric-blue)" />
                <h3 style={{ fontSize: '18px', color: '#fff' }}>Endless Cyber Runner</h3>
                <p style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                  Dodge incoming hazard blocks. Hand horizontal position steers; closed fist triggers jump.
                </p>
                <Button variant="primary" glow icon={<Play size={16} />} onClick={handleStartGame}>
                  Initialize Game
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Cyberpunk HUD Overlay */}
      <div className="hud-overlay">
        {/* Top Telemetry */}
        <div className="hud-top-bar hud-interactive">
          <div className="hud-title-card">
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: '#ffaa00' }}>
                EXPERIMENT C
              </span>
              <span style={{ color: 'var(--text-muted)' }}>/</span>
              <span style={{ fontWeight: 700, fontSize: '14px', color: '#fff' }}>
                GESTURE RUNNER
              </span>
            </div>
            <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
              Procedural Highway • AABB Collision Engine • Score Multipliers
            </span>
          </div>

          <div className="hud-telemetry-cluster">
            <div className="telemetry-card">
              <span className="telemetry-label">CURRENT SCORE</span>
              <span className="telemetry-value" style={{ color: 'var(--status-live)' }}>
                {score}
              </span>
            </div>
            <div className="telemetry-card">
              <span className="telemetry-label">HIGH SCORE</span>
              <span className="telemetry-value" style={{ color: '#ffaa00' }}>
                {highScore}
              </span>
            </div>
            <div className="telemetry-card">
              <span className="telemetry-label">INPUT MODE</span>
              <span className="telemetry-value" style={{ color: 'var(--electric-blue)' }}>
                {controlMode.toUpperCase()}
              </span>
            </div>
          </div>
        </div>

        {/* Bottom HUD Controls Dock */}
        <div className="hud-controls-dock">
          {/* Bottom Left: Game Controls & Input Toggle */}
          <div className="hud-panel-bottom-left hud-interactive">
            <Card style={{ padding: '14px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'var(--text-muted)' }}>
                  INPUT CONTROLLER
                </span>
                <Badge
                  label={isPlaying ? 'STAGE ACTIVE' : 'IDLE'}
                  variant={isPlaying ? 'live' : 'muted'}
                  pulse={isPlaying}
                />
              </div>

              {/* Mode Switcher */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                <Button
                  variant={controlMode === 'gesture' ? 'primary' : 'glass'}
                  size="sm"
                  icon={<Hand size={14} />}
                  onClick={() => setControlMode('gesture')}
                >
                  Gesture Mode
                </Button>
                <Button
                  variant={controlMode === 'keyboard' ? 'primary' : 'glass'}
                  size="sm"
                  icon={<Keyboard size={14} />}
                  onClick={() => setControlMode('keyboard')}
                >
                  Keyboard Mode
                </Button>
              </div>

              {/* Game Action Buttons */}
              <div style={{ display: 'flex', gap: '8px' }}>
                {isPlaying ? (
                  <Button
                    variant="outline"
                    size="sm"
                    icon={<RotateCcw size={14} />}
                    onClick={handleResetGame}
                    style={{ flex: 1 }}
                  >
                    Reset Run
                  </Button>
                ) : (
                  <Button
                    variant="primary"
                    size="sm"
                    icon={<Play size={14} />}
                    onClick={handleStartGame}
                    style={{ flex: 1 }}
                  >
                    Start Run
                  </Button>
                )}
              </div>

              {/* Control Key Legend */}
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  fontSize: '11px',
                  color: 'var(--text-muted)',
                  fontFamily: 'var(--font-mono)',
                  paddingTop: '4px',
                  borderTop: '1px solid var(--border-subtle)',
                }}
              >
                <span>Move: Hand X / A, D</span>
                <span>Jump: Closed Fist / Space</span>
              </div>
            </Card>
          </div>

          {/* Bottom Right: Shared Control Center */}
          <div className="hud-panel-bottom-right">
            <ControlCenter
              activeExperienceTitle="Gesture Runner"
              onResetScene={handleResetGame}
            />
          </div>
        </div>
      </div>
    </div>
  );
};
